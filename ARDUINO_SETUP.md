# Arduino Setup Instructions

## Hardware Requirements

1. **Arduino Board** (Uno, Nano, etc.)
2. **MFRC522 RFID Reader Module**
3. **3x Light Sensors (Photoresistors)**
4. **3x 10kΩ Resistors** (for photoresistor voltage dividers)
5. **RFID Cards/Tags** (6 total for year ranges)
6. **Breadboard and Jumper Wires**

## Wiring Diagram

### RFID Reader (MFRC522)
- VCC → 3.3V
- RST → Pin 9
- GND → GND
- IRQ → Not connected
- MISO → Pin 12
- MOSI → Pin 11
- SCK → Pin 13
- SDA/SS → Pin 10

### Light Sensors (Photoresistors)
Each photoresistor should be wired in a voltage divider configuration:

**NAF Sensor (A0):**
- One leg of photoresistor → 5V
- Other leg → A0 and one leg of 10kΩ resistor
- Other leg of 10kΩ resistor → GND

**NAFSFA Sensor (A1):**
- Same configuration as above, connected to A1

**Evolution Sensor (A2):**
- Same configuration as above, connected to A2

## RFID Card Setup

You need to program 6 RFID cards/tags for different year ranges. Use the Arduino code to read the UID of each card, then update the `yearMappings` array in the Arduino code:

1. Upload the Arduino code
2. Open Serial Monitor
3. Place each RFID card near the reader
4. Note the UID displayed (format: "04 XX XX XX")
5. Update the `yearMappings` array in the code with actual UIDs:

```cpp
YearMapping yearMappings[] = {
  {"04 12 34 56", "1967-1977"},  // Replace with actual UID
  {"04 12 34 57", "1977-1987"},  // Replace with actual UID
  {"04 12 34 58", "1987-1997"},  // Replace with actual UID
  {"04 12 34 59", "1997-2007"},  // Replace with actual UID
  {"04 12 34 5A", "2007-2017"},  // Replace with actual UID
  {"04 12 34 5B", "2017-2027"}   // Replace with actual UID
};
```

## Software Setup

1. Install Arduino IDE
2. Install MFRC522 library: `Sketch > Include Library > Manage Libraries` → Search "MFRC522"
3. Upload the provided Arduino code
4. Configure the serial port in Python:
   - Copy `.env.example` to `.env`
   - Update `SERIAL_PORT` to match your Arduino port
   - Linux/Mac: Usually `/dev/ttyUSB0` or `/dev/ttyACM0`
   - Windows: Usually `COM3`, `COM4`, etc.

## Testing

1. **Light Sensors Test:**
   - Cover/uncover each photoresistor
   - Check serial output for object detection
   - Should show "OBJECT_PICKED:naf", "OBJECT_PICKED:nafsfa", or "OBJECT_PICKED:evol"

2. **RFID Test:**
   - Pick an object first (cover a light sensor)
   - Place RFID card near reader
   - Should show "YEAR_DETECTED:1967-1977:naf" (example)

3. **Integration Test:**
   - Run Python server: `python main.py`
   - Open test page: `http://localhost:5550/test-socket.html`
   - Check Arduino status in the test interface

## Troubleshooting

- **Arduino not detected:** Check serial port in `.env` file
- **RFID not working:** Check wiring and library installation
- **Light sensors not responsive:** Check voltage divider wiring
- **Serial communication errors:** Check baud rate (9600) and port permissions

## Physical Setup Tips

1. Mount light sensors where objects will be placed
2. Ensure good lighting conditions for photoresistor sensitivity
3. Position RFID reader for easy card access
4. Use stable power supply for Arduino
5. Shield RFID reader from interference
