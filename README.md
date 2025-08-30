# NAF Object Recognition System

An interactive museum display system that uses Arduino-based hardware to detect physical objects and RFID cards, providing real-time web interface updates through Socket.IO.

## System Overview

This system combines physical hardware interaction with web-based display:
- **Light sensors** detect when visitors pick up museum objects
- **RFID readers** identify specific year range cards
- **Web interface** updates automatically based on hardware interactions
- **Socket.IO** provides real-time communication between Arduino and web clients

## Hardware Requirements

### Arduino Components
- Arduino Uno or Nano
- MFRC522 RFID module (SPI connection)
- 3x Light sensors (LDR/Photoresistor) for object detection
- RFID cards programmed with specific year ranges
- USB cable for Arduino connection

### Wiring Configuration
Based on `arduino.ino`:
- **RFID Module**: RST_PIN = 9, SS_PIN = 10 (SPI connection)
- **Light Sensors**: 
  - NAF sensor: Pin A0
  - NAFSFA sensor: Pin A1  
  - EVOL sensor: Pin A2

## Software Installation

### 1. Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Arduino Setup
1. Upload `arduino.ino` to your Arduino
2. Verify serial communication at 9600 baud
3. Test light sensors and RFID reader functionality

### 3. Environment Configuration
Update `.env` file with your Arduino's serial port:
```env
SERIAL_PORT=/dev/cu.usbmodem1101  # macOS
# SERIAL_PORT=/dev/ttyUSB0        # Linux
# SERIAL_PORT=COM3                # Windows
```

## How the System Works

### Object Detection
1. Visitor picks up a physical object (naf, nafsfa, or evol)
2. Light sensor detects the object removal (light level changes)
3. Arduino sends `OBJECT_PICKED:objectname` via serial
4. Web interface automatically navigates to section page

### Year Range Selection
1. With object picked, visitor places RFID card on reader
2. Arduino identifies the card and maps it to a year range
3. Arduino sends `YEAR_DETECTED:yearrange:objectname` via serial
4. Web interface navigates to the year-specific content

### Object Replacement
1. Visitor returns object to its original position
2. Light sensors detect bright light (object replaced)
3. Arduino sends `OBJECT_REMOVED:objectname` via serial
4. Web interface returns to main page

## Available Objects
- `naf` - Nigerian Air Force History
- `nafsfa` - Nigerian Air Force Special Forces Academy
- `evol` - Financial Evolution

## Year Ranges (RFID Mapping)
Based on Arduino RFID configuration:
- 1962-1972
- 1973-1982  
- 1983-1992
- 1993-2002
- 2003-2012
- 2013-2022
- 2023-2032

## Running the System

### Start the Server
```bash
python main.py
```

The system will:
1. Attempt to connect to Arduino via serial port
2. Start background thread for Arduino communication
3. Launch web server on http://localhost:5550
4. Display connection status and system information

### Web Interface
- **Main Interface**: http://localhost:5550
- **Section Pages**: Automatically loaded based on object detection
- **Year Details**: Automatically loaded based on RFID detection

## Socket.IO Events

### Server to Client Events
- `object_picked` - Physical object was picked up
- `year_dropped` - RFID card detected for specific year
- `object_dropped` - Physical object was returned
- `unknown_rfid` - Unrecognized RFID card detected
- `arduino_ready` - Arduino system initialized
- `arduino_disconnected` - Arduino connection lost

### Client to Server Events
- `get_status` - Request current system status
- `get_arduino_status` - Check Arduino connection
- `test_arduino_connection` - Test/reconnect Arduino

## Troubleshooting

### Arduino Connection Issues
1. Check USB cable connection
2. Verify serial port in `.env` file
3. Test Arduino IDE serial monitor at 9600 baud
4. Check Arduino sketch upload was successful

### Light Sensor Issues
- Verify sensor wiring to analog pins A0, A1, A2
- Check light thresholds in Arduino code
- Test sensor values via serial monitor

### RFID Issues  
- Verify SPI wiring (RST=9, SS=10)
- Check RFID card UIDs match Arduino mapping
- Test RFID detection via serial monitor

## Development Notes

The system is designed for production use with real Arduino hardware. All simulation code has been removed in favor of proper hardware integration. For testing without hardware, you would need to modify the Arduino communication code or use a hardware simulator.
