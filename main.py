import os
import time
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import serial
import threading

import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Possible Picked Objects = ['naf', 'nafsfa', 'evol']
picked_object = None
# Valid Year Ranges based on RFID mapping (now handled in JavaScript) = ['1962-1971', '1972-1981', '1982-1991', '1992-2001', '2002-2011', '2012-2021', '2022-2031']
dropped_year = None
# Track current state for proper navigation
current_state = 'main'  # 'main', 'section', 'year-list', 'year-detail'

# Arduino serial connection
arduino_connected = False
ser = None

# Initialize serial connection
def init_arduino_connection():
    global ser, arduino_connected
    try:
        port = os.getenv("SERIAL_PORT", "/dev/cu.usbmodem101")  # Default for macOS Arduino
        ser = serial.Serial(port=port, baudrate=9600, timeout=1)
        time.sleep(2)  # Give Arduino time to initialize
        arduino_connected = True
        print(f"Arduino connected on {port}")
        return True
    except Exception as e:
        print(f"Could not connect to Arduino: {e}")
        print("Please check:")
        print("1. Arduino is connected via USB")
        print("2. Correct SERIAL_PORT in .env file")
        print("3. Arduino sketch is uploaded and running")
        arduino_connected = False
        return False

# Initialize serial connection
def init_arduino_connection():
    global ser, arduino_connected
    try:
        port = os.getenv("SERIAL_PORT", "/dev/cu.usbmodem101")  # Default for macOS Arduino
        ser = serial.Serial(port=port, baudrate=9600, timeout=1)
        time.sleep(2)  # Give Arduino time to initialize
        arduino_connected = True
        print(f"Arduino connected on {port}")
        return True
    except Exception as e:
        print(f"Could not connect to Arduino: {e}")
        print("Please check:")
        print("1. Arduino is connected via USB")
        print("2. Correct SERIAL_PORT in .env file")
        print("3. Arduino sketch is uploaded and running")
        arduino_connected = False
        return False


def read_from_serial():
    """
    Read data from Arduino serial connection and process commands.
    Handles both light sensor object detection and RFID year detection.
    """
    global picked_object, dropped_year, current_state, arduino_connected, ser

    if not arduino_connected or ser is None:
        print("Arduino not connected, serial reading disabled")
        return

    print("Starting Arduino serial communication...")
    
    try:
        while arduino_connected:
            if ser.in_waiting > 0:
                try:
                    serial_line = ser.readline().decode("utf-8").strip()
                    if serial_line:  # Only process non-empty lines
                        print(f"Arduino: {serial_line}")
                    
                    # Parse Arduino commands based on arduino.ino protocol
                    if serial_line.startswith("OBJECT_PICKED:"):
                        object_name = serial_line.split(":")[1].lower()
                        if object_name in ['naf', 'nafsfa', 'evol']:
                            picked_object = object_name
                            current_state = 'section'
                            dropped_year = None  # Reset year when new object is picked
                            print(f"✓ Object '{picked_object}' picked via light sensor - navigating to section")
                            socketio.emit("object_picked", {"object": picked_object})
                    
                    elif serial_line.startswith("OBJECT_REMOVED:"):
                        object_name = serial_line.split(":")[1].lower()
                        print(f"✓ Object '{object_name}' removed - returning to main page")
                        picked_object = None
                        dropped_year = None
                        current_state = 'main'
                        socketio.emit("object_dropped", {"message": "Object removed, returning to main page"})
                    
                    elif serial_line.startswith("LIGHT_BRIGHT_DETECTED:"):
                        # Additional confirmation that object was removed
                        print("✓ Light sensor confirms object removal")
                    
                    elif serial_line.startswith("RFID_DETECTED:"):
                        parts = serial_line.split(":")
                        if len(parts) >= 3:
                            rfid_uid = parts[1]
                            object_name = parts[2].lower()

                            print(f"RFID UID detected: {rfid_uid}, object: {object_name}, picked_object: {picked_object}")

                            if object_name == picked_object:
                                print(f"✓ RFID UID '{rfid_uid}' detected for object '{picked_object}' - sending to frontend for year mapping")
                                socketio.emit("rfid_detected", {"uid": rfid_uid, "object": picked_object})
                            else:
                                print(f"⚠ RFID object mismatch: expected '{picked_object}', got '{object_name}'")
                    
                    elif serial_line.startswith("YEAR_DETECTED:"):
                        # Legacy support - this should not be used anymore since year mapping moved to JS
                        parts = serial_line.split(":")
                        if len(parts) >= 3:
                            year_range = parts[1]
                            object_name = parts[2].lower()
                            
                            print(f"⚠ Legacy YEAR_DETECTED message received: {year_range} for {object_name}")
                            print("⚠ Year mapping should now be handled in JavaScript, not Arduino")
                            
                            # For backward compatibility, still emit the event
                            if object_name == picked_object:
                                dropped_year = year_range
                                current_state = 'year-list'
                                print(f"✓ Legacy year range '{dropped_year}' processed for object '{picked_object}'")
                                socketio.emit("year_dropped", {"year": dropped_year, "object": picked_object})
                    
                    elif serial_line.startswith("UNKNOWN_RFID:"):
                        uid = serial_line.split(":")[1]
                        print(f"⚠ Unknown RFID card detected: {uid}")
                        socketio.emit("unknown_rfid", {"uid": uid, "message": "Unknown RFID card detected"})
                    
                    elif serial_line == "NAF Object Recognition System Ready":
                        print("✓ Arduino system initialized and ready")
                        socketio.emit("arduino_ready", {"message": "Arduino system ready"})
                    
                    elif serial_line == "Monitoring light sensors and RFID...":
                        print("✓ Arduino monitoring started")
                    
                    elif serial_line.startswith("All objects removed - system reset"):
                        print("✓ Arduino system reset complete")
                        socketio.emit("system_reset", {"message": "System reset complete"})
                    
                    # Filter out verbose debug messages but pass important ones
                    elif not serial_line.startswith("Sensors -") and not serial_line.startswith("Card UID:") and serial_line.strip():
                        # Emit general Arduino messages for debugging (only non-empty important messages)
                        if any(keyword in serial_line.lower() for keyword in ['error', 'warning', 'failed', 'success']):
                            socketio.emit("arduino_message", {"message": serial_line})
                        
                except UnicodeDecodeError as e:
                    print(f"Serial decode error: {e}")
                except Exception as e:
                    print(f"Error processing serial data: {e}")
                    
            time.sleep(0.05)  # Small delay to prevent excessive CPU usage
            
    except Exception as e:
        print(f"Serial communication error: {e}")
        arduino_connected = False
        socketio.emit("arduino_disconnected", {"message": "Arduino connection lost"})

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('status', {'msg': 'Connected to NAF Object Recognition Server'})
    emit('arduino_status', {'connected': arduino_connected})


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('get_status')
def handle_get_status():
    """Get current system status"""
    emit('system_status', {
        'picked_object': picked_object,
        'dropped_year': dropped_year,
        'current_state': current_state,
        'arduino_connected': arduino_connected,
        'available_objects': ['naf', 'nafsfa', 'evol'],
        'available_years': ['1962-1971', '1972-1981', '1982-1991', '1992-2001', 
                           '2002-2011', '2012-2021', '2022-2031']
    })


@socketio.on('resolve_year_from_rfid')
def handle_resolve_year_from_rfid(data):
    """Process RFID UID and return resolved year range"""
    global dropped_year, current_state, picked_object
    
    rfid_uid = data.get('uid', '').strip()
    year_range = data.get('year_range', '').strip()
    object_name = data.get('object', '').lower()
    
    print(f"🔄 Processing year resolution: UID={rfid_uid}, Year={year_range}, Object={object_name}")
    
    # Valid years (same as before, but now validated on both ends)
    valid_years = ['1962-1971', '1972-1981', '1982-1991', '1992-2001', '2002-2011', '2012-2021', '2022-2031']
    
    if not picked_object:
        emit('year_resolution_result', {'success': False, 'message': 'No object picked'})
        return
    
    if object_name != picked_object:
        emit('year_resolution_result', {'success': False, 'message': f'Object mismatch: expected {picked_object}, got {object_name}'})
        return
    
    if year_range not in valid_years:
        emit('year_resolution_result', {'success': False, 'message': f'Invalid year range: {year_range}'})
        return
    
    # Update server state
    dropped_year = year_range
    current_state = 'year-list'
    
    print(f"✅ Year range '{dropped_year}' resolved from RFID UID '{rfid_uid}' for object '{picked_object}' - navigating to year list")
    
    # Emit the year_dropped event to trigger navigation
    socketio.emit("year_dropped", {"year": dropped_year, "object": picked_object})
    
    # Confirm resolution success
    emit('year_resolution_result', {'success': True, 'year': year_range, 'object': object_name})


@socketio.on('get_arduino_status')
def handle_get_arduino_status():
    """Get Arduino connection status"""
    emit('arduino_status', {
        'connected': arduino_connected,
        'port': os.getenv("SERIAL_PORT", "/dev/cu.usbmodem101") if arduino_connected else None
    })


@socketio.on('test_arduino_connection')
def handle_test_arduino_connection():
    """Test and attempt to reconnect to Arduino"""
    global ser, arduino_connected
    
    if arduino_connected and ser:
        try:
            # Test if serial connection is still active
            if ser.is_open:
                emit('arduino_test_result', {'success': True, 'message': 'Arduino connection active'})
            else:
                arduino_connected = False
                emit('arduino_test_result', {'success': False, 'message': 'Arduino connection lost'})
        except Exception as e:
            arduino_connected = False
            emit('arduino_test_result', {'success': False, 'message': f'Arduino connection error: {e}'})
    else:
        # Try to reconnect
        if init_arduino_connection():
            # Start serial reading thread if connection successful
            serial_thread = threading.Thread(target=read_from_serial)
            serial_thread.daemon = True
            serial_thread.start()
            emit('arduino_test_result', {'success': True, 'message': 'Arduino reconnected successfully'})
        else:
            emit('arduino_test_result', {'success': False, 'message': 'Could not connect to Arduino'})


# Testing/Simulation Socket Event Handlers
# These handlers simulate Arduino input for testing purposes when Arduino is not connected
@socketio.on('simulate_object_picked')
def handle_simulate_object_picked(data):
    """Simulate Arduino object picking for testing"""
    global picked_object, current_state, dropped_year
    
    object_name = data.get('object', '').lower()
    if object_name in ['naf', 'nafsfa', 'evol']:
        picked_object = object_name
        current_state = 'section'
        dropped_year = None  # Reset year when new object is picked
        print(f"🧪 SIMULATION: Object '{picked_object}' picked - navigating to section")
        socketio.emit("object_picked", {"object": picked_object})
        emit('simulation_result', {'success': True, 'message': f'Simulated object pick: {object_name}'})
    else:
        emit('simulation_result', {'success': False, 'message': f'Invalid object: {object_name}'})


@socketio.on('simulate_object_removed')
def handle_simulate_object_removed(data):
    """Simulate Arduino object removal for testing"""
    global picked_object, current_state, dropped_year
    
    if picked_object:
        removed_object = picked_object
        print(f"🧪 SIMULATION: Object '{removed_object}' removed - returning to main page")
        picked_object = None
        dropped_year = None
        current_state = 'main'
        socketio.emit("object_dropped", {"message": "Object removed, returning to main page"})
        emit('simulation_result', {'success': True, 'message': f'Simulated object removal: {removed_object}'})
    else:
        emit('simulation_result', {'success': False, 'message': 'No object to remove'})


@socketio.on('simulate_year_detected')
def handle_simulate_year_detected(data):
    """Simulate Arduino RFID detection for testing (new system)"""
    global picked_object
    
    year_range = data.get('year', '')
    uid = data.get('uid', '')
    
    # Valid years from mapping
    valid_years = ['1962-1971', '1972-1981', '1982-1991', '1992-2001', '2002-2011', '2012-2021', '2022-2031']
    
    if not picked_object:
        emit('simulation_result', {'success': False, 'message': 'No object picked - pick an object first'})
        return
    
    # If UID provided, simulate RFID detection (new system)
    if uid:
        print(f"🧪 SIMULATION: RFID UID '{uid}' detected for object '{picked_object}'")
        socketio.emit("rfid_detected", {"uid": uid, "object": picked_object})
        emit('simulation_result', {'success': True, 'message': f'Simulated RFID detection: {uid} for {picked_object}'})
    # If year range provided, simulate legacy system for backward compatibility
    elif year_range in valid_years:
        print(f"🧪 SIMULATION: Direct year range '{year_range}' for object '{picked_object}' (legacy mode)")
        socketio.emit("rfid_detected", {"uid": "SIMULATED", "object": picked_object})
        # Also emit legacy format for compatibility
        socketio.emit("year_dropped", {"year": year_range, "object": picked_object})
        emit('simulation_result', {'success': True, 'message': f'Simulated year detection: {year_range} for {picked_object} (legacy)'})
    else:
        emit('simulation_result', {'success': False, 'message': f'Invalid parameters: uid={uid}, year={year_range}'})


@socketio.on('simulate_rfid_uid')
def handle_simulate_rfid_uid(data):
    """Simulate specific RFID UID detection for testing"""
    global picked_object
    
    uid = data.get('uid', '').strip()
    
    if not picked_object:
        emit('simulation_result', {'success': False, 'message': 'No object picked - pick an object first'})
        return
    
    if uid:
        print(f"🧪 SIMULATION: RFID UID '{uid}' detected for object '{picked_object}'")
        socketio.emit("rfid_detected", {"uid": uid, "object": picked_object})
        emit('simulation_result', {'success': True, 'message': f'Simulated RFID UID: {uid} for {picked_object}'})
    else:
        emit('simulation_result', {'success': False, 'message': 'No UID provided'})


@socketio.on('simulate_unknown_rfid')
def handle_simulate_unknown_rfid(data):
    """Simulate Arduino unknown RFID detection for testing"""
    uid = data.get('uid', 'TEST-UID-123')
    print(f"🧪 SIMULATION: Unknown RFID card detected: {uid}")
    socketio.emit("unknown_rfid", {"uid": uid, "message": "Unknown RFID card detected"})
    emit('simulation_result', {'success': True, 'message': f'Simulated unknown RFID: {uid}'})


@socketio.on('simulate_system_reset')
def handle_simulate_system_reset():
    """Simulate Arduino system reset for testing"""
    global picked_object, dropped_year, current_state
    
    picked_object = None
    dropped_year = None
    current_state = 'main'
    print("🧪 SIMULATION: Arduino system reset complete")
    socketio.emit("system_reset", {"message": "System reset complete"})
    emit('simulation_result', {'success': True, 'message': 'Simulated system reset'})


@app.route("/")
def main():
    return render_template("index.html")


@app.route("/section")
def section():
    return render_template("section.html")


@app.route("/year-list")
def year_list():
    return render_template("year-list.html")


@app.route("/year-detail")
def year_detail():
    return render_template("year-detail.html")


if __name__ == "__main__":
    print("=" * 60)
    print("Starting NAF Object Recognition Server")
    print("=" * 60)
    print("Hardware Requirements:")
    print("- Arduino Uno/Nano with MFRC522 RFID module")
    print("- 3x Light sensors (LDR) for object detection")
    print("- RFID cards programmed with year ranges")
    print("- USB connection to Arduino")
    print("-" * 60)
    print("System Configuration:")
    print(f"- Server running on http://localhost:5550")
    print(f"- Available objects: naf, nafsfa, evol")
    print(f"- Year ranges: 1962-1971, 1972-1981, 1982-1991, 1992-2001,")
    print(f"                2002-2011, 2012-2021, 2022-2031")
    print("=" * 60)
    
    # Initialize Arduino connection
    arduino_ready = init_arduino_connection()
    
    if arduino_ready:
        # Start Arduino serial reading thread
        print("✓ Starting Arduino communication thread...")
        serial_thread = threading.Thread(target=read_from_serial)
        serial_thread.daemon = True
        serial_thread.start()
        print("✓ Arduino integration active")
    else:
        print("✗ Arduino not connected!")
        print("Please check Arduino connection and try again.")
        print("The server will start but hardware features will be unavailable.")
    
    print("=" * 60)
    print("Server starting...")
    
    # Start the Flask app with WebSocket support
    try:
        socketio.run(app, host="0.0.0.0", port=5550, debug=False, allow_unsafe_werkzeug=True)
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        # Clean up serial connection on exit
        if ser and arduino_connected:
            try:
                ser.close()
                print("✓ Arduino connection closed")
            except Exception as e:
                print(f"Error closing Arduino connection: {e}")