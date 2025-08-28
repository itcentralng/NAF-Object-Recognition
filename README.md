# NAF Object Recognition - Socket.IO Integration

This project now includes Socket.IO integration for real-time communication between hardware and web interface.

## Features

### Socket.IO Integration
- Real-time object picking and year dropping simulation
- Web-based testing interface
- Automatic section loading based on selected objects
- Connection status monitoring

### Hardware Simulation
The `main.py` file includes two simulation modes:

1. **Console Simulation** (run with `python main.py --console`)
   - Terminal-based input for testing
   - Interactive prompts for object picking and year dropping

2. **Socket.IO Simulation** (default mode)
   - Web-based simulation through Socket.IO events
   - Test interface at `/test-socket.html`

## Available Socket Events

### Client to Server
- `simulate_pick` - Simulate picking an object
- `simulate_drop` - Simulate dropping an object in a year
- `reset_simulation` - Reset the current state
- `get_status` - Get current simulation status

### Server to Client
- `object_picked` - Object has been picked
- `year_dropped` - Object dropped in specific year
- `object_reset` - Simulation has been reset
- `status` - Server status messages
- `error` - Error messages

## How to Use

### 1. Start the Server
```bash
python main.py
```
The server will start on `http://localhost:5550`

### 2. Test Socket.IO Connection
Open `http://localhost:5550/test-socket.html` to test the Socket.IO functionality

### 3. Use the Main Application
Open `http://localhost:5550` for the main museum interface

### 4. Console Mode (Optional)
```bash
python main.py --console
```
This enables terminal-based simulation input

## Object Flow

1. **Index Page** - Shows object selection interface only
2. **Object Selection** - User picks an object (naf, nafsfa, evol)
3. **Socket Event** - `object_picked` event is sent
4. **Section Page** - Automatically opens the section for the picked object
5. **Year Selection** - User drops object in a year range
6. **Socket Event** - `year_dropped` event is sent
7. **Year Detail** - Shows detailed information for the selected year

## Arduino Implementation (Future)

The Arduino/serial implementation is commented out in `main.py` and ready for hardware integration:

```python
# Commented lines for Arduino implementation:
# import serial
# ser = serial.Serial(port=os.getenv("SERIAL_PORT"), baudrate=9600)
# Arduino communication code in read_from_serial()
```

To enable Arduino mode later, uncomment the serial code and set the `SERIAL_PORT` environment variable.

## Available Objects
- `naf` - Nigerian Air Force
- `nafsfa` - Nigerian Air Force Special Forces Academy  
- `evol` - Evolution

## Available Year Ranges
- 1967-1977
- 1977-1987
- 1987-1997
- 1997-2007
- 2007-2017
- 2017-2027
