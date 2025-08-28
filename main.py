import re
import os
import time
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
# import serial  # Commented out for later Arduino implementation
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

# Configure the serial port (commented out for later Arduino implementation)
# ser = serial.Serial(port=os.getenv("SERIAL_PORT"), baudrate=9600)

# Simulation state
simulation_running = False


def read_from_serial():
    """
    This function will be used for Arduino serial communication later.
    Currently commented out and replaced with simulation.
    """
    # uid_pattern = re.compile(r"0x[0-9A-F]{2} 0x[0-9A-F]{2} 0x[0-9A-F]{2} 0x[0-9A-F]{2}")
    # global picked_object, dropped_year

    # while True:
    #     if ser.in_waiting > 0:
    #         serialValue = ser.readline().decode("utf-8").strip()
    #         print(serialValue)
    #         # Check if the serialValue matches the UID pattern
    #         if uid_pattern.match(serialValue):
    #             socketio.emit("rfid_status", {"status": f"{serialValue}"})
    #         elif "Card removed" in serialValue:
    #             socketio.emit("rfid_status", {"status": "removed"})
    pass


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


def read_from_serial():

    # uid_pattern = re.compile(r"0x[0-9A-F]{2} 0x[0-9A-F]{2} 0x[0-9A-F]{2} 0x[0-9A-F]{2}")
    global picked_object, dropped_year, current_state

    while True:
        # if ser.in_waiting > 0:
        #     serialValue = ser.readline().decode("utf-8").strip()
        #     print(serialValue)
        #     # Check if the serialValue matches the UID pattern
        #     if uid_pattern.match(serialValue):
        #         socketio.emit("rfid_status", {"status": f"{serialValue}"})
        #     elif "Card removed" in serialValue:
        #         socketio.emit("rfid_status", {"status": "removed"})
        if not picked_object or picked_object=='dropped':
            picked_object = input("Enter picked object: ")
            current_state = 'section'
            socketio.emit("object_picked", {"object": picked_object})
        if not dropped_year and picked_object and picked_object != 'dropped':
            dropped_year = input("Enter dropped year: ")
            current_state = 'year-list'
            socketio.emit("year_dropped", {"year": dropped_year, "object": picked_object})


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
    print("Available simulation commands:")
    print("- Terminal input for console-based simulation")
    print("- Socket.IO events for web-based simulation")
    print("- Server running on http://localhost:5550")
    
    # Choose simulation method
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--console':
        # Run the console simulation in a separate thread
        simulation_thread = threading.Thread(target=simulate_object_detection)
        simulation_thread.daemon = True
        simulation_thread.start()
    else:
        # Comment out the old serial reading thread for later Arduino implementation
        # serial_thread = threading.Thread(target=read_from_serial)
        # serial_thread.daemon = True
        # serial_thread.start()
        print("Console simulation disabled. Use Socket.IO events or run with --console flag.")
    
    # Start the Flask app with WebSocket support
    socketio.run(app, host="0.0.0.0", port=5550, debug=True)