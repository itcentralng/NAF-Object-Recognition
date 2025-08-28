import re
import os
from flask import Flask, render_template
from flask_socketio import SocketIO
import serial
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

# Configure the serial port
# ser = serial.Serial(port=os.getenv("SERIAL_PORT"), baudrate=9600)


def read_from_serial():

    uid_pattern = re.compile(r"0x[0-9A-F]{2} 0x[0-9A-F]{2} 0x[0-9A-F]{2} 0x[0-9A-F]{2}")

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
            socketio.emit("object_picked", {"object": picked_object})
        if not dropped_year:
            dropped_year = input("Enter dropped year: ")
            socketio.emit("year_dropped", {"year": dropped_year})


@app.route("/")
def main():
    return render_template("index.html")


if __name__ == "__main__":
    # Run the serial reading in a separate thread
    serial_thread = threading.Thread(target=read_from_serial)
    serial_thread.daemon = True
    serial_thread.start()
    # Start the Flask app with WebSocket support
    socketio.run(app, host="0.0.0.0", port=5550)