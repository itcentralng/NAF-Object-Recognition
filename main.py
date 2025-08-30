import re
import os
import time
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import serial  # Uncommented for Arduino implementation
import threading

import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Possible Picked Objects = ['naf', 'nafsfa', 'evol']
picked_object = None
# Possible Dropped Years = ['1967-1977', '1977-1987', '1987-1997', '1997-2007', '2007-2017', '2017-2027']
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
        port = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")  # Default for Linux, update for your system
        ser = serial.Serial(port=port, baudrate=9600, timeout=1)
        arduino_connected = True
        print(f"Arduino connected on {port}")
        return True
    except Exception as e:
        print(f"Could not connect to Arduino: {e}")
        print("Running in simulation mode - use test-socket.html for testing")
        arduino_connected = False
        return False

# Simulation state for testing without Arduino
simulation_running = False


def read_from_serial():
    """
    Read data from Arduino serial connection and process commands.
    Handles both light sensor object detection and RFID year detection.
    """
    global picked_object, dropped_year, current_state, arduino_connected, ser

    if not arduino_connected or ser is None:
        print("Arduino not connected, skipping serial reading")
        return

    try:
        while arduino_connected:
            if ser.in_waiting > 0:
                try:
                    serial_line = ser.readline().decode("utf-8").strip()
                    print(f"Arduino: {serial_line}")
                    
                    # Parse Arduino commands
                    if serial_line.startswith("OBJECT_PICKED:"):
                        object_name = serial_line.split(":")[1].lower()
                        if object_name in ['naf', 'nafsfa', 'evol']:
                            picked_object = object_name
                            current_state = 'section'
                            print(f"Object '{picked_object}' picked via light sensor - navigating to section")
                            socketio.emit("object_picked", {"object": picked_object})
                    
                    elif serial_line.startswith("OBJECT_REMOVED:"):
                        object_name = serial_line.split(":")[1].lower()
                        print(f"Object '{object_name}' removed - returning to main page")
                        picked_object = None
                        dropped_year = None
                        current_state = 'main'
                        socketio.emit("object_dropped", {"message": "Object removed, returning to main page"})
                    
                    elif serial_line.startswith("YEAR_DETECTED:"):
                        parts = serial_line.split(":")
                        if len(parts) >= 3:
                            year_range = parts[1]
                            object_name = parts[2].lower()
                            
                            valid_years = ['1967-1977', '1977-1987', '1987-1997', '1997-2007', '2007-2017', '2017-2027']
                            
                            if year_range in valid_years and object_name == picked_object:
                                dropped_year = year_range
                                current_state = 'year-list'
                                print(f"Year range '{dropped_year}' detected via RFID for object '{picked_object}' - navigating to year list")
                                socketio.emit("year_dropped", {"year": dropped_year, "object": picked_object})
                    
                    elif serial_line.startswith("UNKNOWN_RFID:"):
                        uid = serial_line.split(":")[1]
                        print(f"Unknown RFID card detected: {uid}")
                        socketio.emit("unknown_rfid", {"uid": uid, "message": "Unknown RFID card detected"})
                    
                    # Handle other Arduino messages (debugging info, etc.)
                    elif not serial_line.startswith("Sensors -") and not serial_line.startswith("Card UID:"):
                        # Emit general Arduino messages for debugging
                        socketio.emit("arduino_message", {"message": serial_line})
                        
                except UnicodeDecodeError as e:
                    print(f"Serial decode error: {e}")
                except Exception as e:
                    print(f"Error processing serial data: {e}")
                    
            time.sleep(0.1)  # Small delay to prevent excessive CPU usage
            
    except Exception as e:
        print(f"Serial communication error: {e}")
        arduino_connected = False


def simulate_object_detection():
    """
    Simulate object picking and dropping for testing purposes.
    This will be replaced with actual Arduino serial communication later.
    """
    global picked_object, dropped_year, simulation_running
    
    simulation_running = True
    print("Simulation started. Available objects: naf, nafsfa, evol")
    print("Available years: 1967-1977, 1977-1987, 1987-1997, 1997-2007, 2007-2017, 2017-2027")
    
    while simulation_running:
        try:
            if not picked_object or picked_object == 'dropped':
                print("\n--- Object Selection ---")
                print("Available objects: naf, nafsfa, evol")
                user_input = input("Enter object to pick (or 'quit' to stop): ").strip().lower()
                
                if user_input == 'quit':
                    simulation_running = False
                    break
                
                if user_input in ['naf', 'nafsfa', 'evol']:
                    picked_object = user_input
                    print(f"Object '{picked_object}' picked!")
                    socketio.emit("object_picked", {"object": picked_object})
                else:
                    print("Invalid object. Please choose: naf, nafsfa, or evol")
                    continue
            
            if picked_object and picked_object != 'dropped' and not dropped_year:
                print(f"\n--- Year Selection (Object: {picked_object}) ---")
                print("Available years: 1967-1977, 1977-1987, 1987-1997, 1997-2007, 2007-2017, 2017-2027")
                user_input = input("Enter year range to drop object (or 'reset' to pick new object): ").strip()
                
                if user_input == 'reset':
                    picked_object = None
                    dropped_year = None
                    socketio.emit("object_reset", {"message": "Object reset"})
                    continue
                
                valid_years = ['1967-1977', '1977-1987', '1987-1997', '1997-2007', '2007-2017', '2017-2027']
                if user_input in valid_years:
                    dropped_year = user_input
                    print(f"Object '{picked_object}' dropped in year '{dropped_year}'!")
                    socketio.emit("year_dropped", {"year": dropped_year, "object": picked_object})
                    
                    # Reset for next cycle
                    time.sleep(2)  # Brief pause
                    picked_object = 'dropped'
                    dropped_year = None
                else:
                    print("Invalid year range. Please choose from the available options.")
            
            time.sleep(1)  # Small delay to prevent excessive CPU usage
            
        except KeyboardInterrupt:
            simulation_running = False
            break
        except Exception as e:
            print(f"Simulation error: {e}")
            time.sleep(1)


@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('status', {'msg': 'Connected to server'})


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('simulate_pick')
def handle_simulate_pick(data):
    """Handle manual object picking from client"""
    global picked_object, current_state
    object_name = data.get('object', '').lower()
    
    if object_name in ['naf', 'nafsfa', 'evol']:
        picked_object = object_name
        current_state = 'section'
        print(f"Object '{picked_object}' picked - navigating to section")
        emit('object_picked', {'object': picked_object}, broadcast=True)
        emit('status', {'msg': f'Object {picked_object} picked - navigate to section'})
    else:
        emit('error', {'msg': 'Invalid object. Choose: naf, nafsfa, or evol'})


@socketio.on('simulate_drop')
def handle_simulate_drop(data):
    """Handle manual year dropping from client"""
    global dropped_year, picked_object, current_state
    year_range = data.get('year', '')
    
    valid_years = ['1967-1977', '1977-1987', '1987-1997', '1997-2007', '2007-2017', '2017-2027']
    
    # Year range detection only works when a section object is picked
    if not picked_object or picked_object == 'dropped':
        emit('error', {'msg': 'No object picked. Pick an object first before dropping a year range.'})
        return
    
    if year_range in valid_years:
        dropped_year = year_range
        current_state = 'year-list'
        print(f"Year range '{dropped_year}' detected for object '{picked_object}' - navigating to year list")
        emit('year_dropped', {'year': dropped_year, 'object': picked_object}, broadcast=True)
        emit('status', {'msg': f'Year range {dropped_year} detected for {picked_object} - navigate to year list'})
    else:
        emit('error', {'msg': 'Invalid year range or no object picked'})


@socketio.on('reset_simulation')
def handle_reset():
    """Reset the simulation state"""
    global picked_object, dropped_year, current_state
    picked_object = None
    dropped_year = None
    current_state = 'main'
    print("Simulation reset via socket")
    emit('object_reset', {'message': 'Simulation reset'}, broadcast=True)
    emit('status', {'msg': 'Simulation reset'})


@socketio.on('get_status')
def handle_get_status():
    """Get current simulation status"""
    emit('simulation_status', {
        'picked_object': picked_object,
        'dropped_year': dropped_year,
        'current_state': current_state,
        'available_objects': ['naf', 'nafsfa', 'evol'],
        'available_years': ['1967-1977', '1977-1987', '1987-1997', '1997-2007', '2007-2017', '2017-2027']
    })


@socketio.on('simulate_object_drop')
def handle_object_drop():
    """Handle object being dropped/removed - goes back to main page"""
    global picked_object, dropped_year, current_state
    
    print("Object dropped/removed - returning to main page")
    picked_object = None
    dropped_year = None
    current_state = 'main'
    
    # Emit event to all clients to return to main page
    emit('object_dropped', {'message': 'Object removed, returning to main page'}, broadcast=True)


@socketio.on('year_range_not_detected')
def handle_year_range_not_detected():
    """Handle when year range is not detected - goes back to section page"""
    global dropped_year, current_state
    
    if picked_object and current_state in ['year-list', 'year-detail']:
        dropped_year = None
        current_state = 'section'
        print("Year range not detected - returning to section page")
        emit('return_to_section', {'object': picked_object, 'message': 'Year range not detected, returning to section page'}, broadcast=True)
    else:
        emit('error', {'msg': 'No valid section to return to'})


@socketio.on('no_object_detected')
def handle_no_object_detected():
    """Handle when no object is detected - stays on main page with gentle feedback"""
    global picked_object, current_state
    
    print("No object detected - staying on main page")
    current_state = 'main'
    picked_object = None
    emit('no_object_detected', {'message': 'No object detected, ready for next attempt'}, broadcast=True)


@socketio.on('get_arduino_status')
def handle_get_arduino_status():
    """Get Arduino connection status"""
    emit('arduino_status', {
        'connected': arduino_connected,
        'port': os.getenv("SERIAL_PORT", "/dev/ttyUSB0") if arduino_connected else None
    })


@socketio.on('test_arduino_connection')
def handle_test_arduino_connection():
    """Test Arduino connection"""
    global ser, arduino_connected
    
    if arduino_connected and ser:
        try:
            # Send a test command or check if serial is still open
            emit('arduino_test_result', {'success': True, 'message': 'Arduino connection active'})
        except Exception as e:
            arduino_connected = False
            emit('arduino_test_result', {'success': False, 'message': f'Arduino connection lost: {e}'})
    else:
        # Try to reconnect
        if init_arduino_connection():
            emit('arduino_test_result', {'success': True, 'message': 'Arduino reconnected successfully'})
        else:
            emit('arduino_test_result', {'success': False, 'message': 'Could not connect to Arduino'})


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
    print("Starting NAF Object Recognition Server...")
    print("Available modes:")
    print("- Arduino mode: Connect to Arduino for real hardware interaction")
    print("- Simulation mode: Use Socket.IO events for web-based testing")
    print("- Console simulation: Run with --console flag for console-based testing")
    print("- Server running on http://localhost:5550")
    print("- Test interface available at test-socket.html")
    
    # Initialize Arduino connection
    arduino_ready = init_arduino_connection()
    
    # Choose simulation method
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--console':
        # Run the console simulation in a separate thread (for testing without Arduino)
        print("Starting console simulation mode...")
        simulation_thread = threading.Thread(target=simulate_object_detection)
        simulation_thread.daemon = True
        simulation_thread.start()
    elif arduino_ready:
        # Start Arduino serial reading thread
        print("Starting Arduino communication thread...")
        serial_thread = threading.Thread(target=read_from_serial)
        serial_thread.daemon = True
        serial_thread.start()
    else:
        print("Arduino not connected. Use Socket.IO events for testing or run with --console flag.")
        print("Check your SERIAL_PORT environment variable and Arduino connection.")
    
    # Start the Flask app with WebSocket support
    try:
        socketio.run(app, host="0.0.0.0", port=5550, debug=True)
    finally:
        # Clean up serial connection on exit
        if ser and arduino_connected:
            try:
                ser.close()
            except:
                pass