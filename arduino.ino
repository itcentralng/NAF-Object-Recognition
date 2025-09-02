#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN 9          // Configurable, see typical pin layout above
#define SS_PIN 10          // Configurable, see typical pin layout above

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

// Light sensor thresholds for object detection
const int LIGHT_THRESHOLD_BRIGHT = 100;  // Threshold for bright light (no object) - values around 50
const int LIGHT_THRESHOLD_DARK = 1023;    // Threshold for dark (object present) - values around 1023

// Light sensor pins
const int NAF_SENSOR_PIN = A0;      // NAF History sensor
const int NAFSFA_SENSOR_PIN = A1;   // NAFSFA sensor  
const int EVOL_SENSOR_PIN = A2;     // Finance Evolution sensor

// State tracking
String currentPickedObject = "";
String currentYearRange = "";
bool objectPicked = false;
unsigned long lastSensorRead = 0;
unsigned long lastRFIDRead = 0;
const unsigned long SENSOR_INTERVAL = 300;  // Read sensors every 300ms
const unsigned long RFID_INTERVAL = 500;    // Read RFID every 500ms

// RFID to year range mapping
struct YearMapping {
  String uid;
  String yearRange;
};

// Define RFID UIDs for each year range
YearMapping yearMappings[] = {
  {"93 09 04 2D", "1962-1971"},
  {"33 18 E3 13", "1972-1981"},
  {"B3 4E E6 00", "1982-1991"},
  {"CA D3 42 00", "1992-2001"},
  {"D3 4F E6 0C", "2002-2011"},
  {"53 AA DB 13", "2012-2021"},
  {"13 35 A7 14", "2022-2031"}
};

const int NUM_YEAR_MAPPINGS = sizeof(yearMappings) / sizeof(yearMappings[0]);

void setup() {
    Serial.begin(9600);
    while (!Serial);    // Do nothing if no serial port is opened
    SPI.begin();        // Init SPI bus
    mfrc522.PCD_Init(); // Init MFRC522
    
    Serial.println(F("NAF Object Recognition System Ready"));
    Serial.println(F("Monitoring light sensors and RFID..."));
}

void loop() {
    unsigned long currentTime = millis();
    
    // Read light sensors for object picking
    if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
        checkLightSensors();
        lastSensorRead = currentTime;
    }
    
    // Read RFID for year range detection (only if object is picked)
    if (currentTime - lastRFIDRead >= RFID_INTERVAL) {
        if (objectPicked) {
            checkRFID();
        }
        lastRFIDRead = currentTime;
    }
    
    delay(50);  // Small delay to prevent excessive CPU usage
}

void checkLightSensors() {
    int nafValue = analogRead(NAF_SENSOR_PIN);
    int nafsfaValue = analogRead(NAFSFA_SENSOR_PIN);
    int evolValue = analogRead(EVOL_SENSOR_PIN);

    // Uncomment to debug brightnes and darkness
    // Serial.println("Light Sensor Readings - NAF: " + String(nafValue) + ", NAFSFA: " + String(nafsfaValue) + ", EVOL: " + String(evolValue));

    // Check if any object is picked (light sensor shows high values when blocked)
    // When bright light hits sensor: ~31-32 (no object)
    // When object blocks light: ~1023 (object present)
    bool nafPicked = nafValue <= LIGHT_THRESHOLD_BRIGHT;
    bool nafsfaPicked = nafsfaValue <= LIGHT_THRESHOLD_BRIGHT;
    bool evolPicked = evolValue <= LIGHT_THRESHOLD_BRIGHT;

    String detectedObject = "";
    
    // Determine which object is picked (prioritize if multiple detected)
    if (nafPicked && !nafsfaPicked && !evolPicked) {
        detectedObject = "naf";
    } else if (nafsfaPicked && !nafPicked && !evolPicked) {
        detectedObject = "nafsfa";
    } else if (evolPicked && !nafPicked && !nafsfaPicked) {
        detectedObject = "evol";
    }
    
    // Handle object picking
    if (detectedObject.length() > 0 && !objectPicked) {
        currentPickedObject = detectedObject;
        objectPicked = true;
        Serial.println("OBJECT_PICKED:" + currentPickedObject);
        Serial.println("Light sensor detection - " + currentPickedObject + " object picked");
    }
    // Handle object removal (all sensors show bright light values)
    else if (!nafPicked && !nafsfaPicked && !evolPicked && objectPicked) {
        Serial.println("OBJECT_REMOVED:" + currentPickedObject);
        Serial.println("LIGHT_BRIGHT_DETECTED:" + currentPickedObject);
        Serial.println("Light sensor detection - " + currentPickedObject + " object removed, bright light detected");
        currentPickedObject = "";
        currentYearRange = "";
        objectPicked = false;
        Serial.println("All objects removed - system reset");
    }
    
    // Debug output (optional, comment out in production)
    /*
    Serial.print("Sensors - NAF:");
    Serial.print(nafValue);
    Serial.print(" NAFSFA:");
    Serial.print(nafsfaValue);
    Serial.print(" EVOL:");
    Serial.print(evolValue);
    Serial.print(" | Object:");
    Serial.println(objectPicked ? currentPickedObject : "none");
    */
}

void checkRFID() {
    // Look for new cards
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return;
    }

    // Select one of the cards
    if (!mfrc522.PICC_ReadCardSerial()) {
        return;
    }

    // Get UID as string
    String uidString = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (i > 0) uidString += " ";
        if (mfrc522.uid.uidByte[i] < 0x10) uidString += "0";
        uidString += String(mfrc522.uid.uidByte[i], HEX);
    }
    uidString.toUpperCase();
    
    // Check if this UID matches any year range
    String detectedYear = getYearRangeFromUID(uidString);
    
    if (detectedYear.length() > 0) {
        if (currentYearRange != detectedYear) {
            currentYearRange = detectedYear;
            Serial.println("YEAR_DETECTED:" + currentYearRange + ":" + currentPickedObject);
            Serial.println("RFID card detected - Year range: " + currentYearRange);
        }
    } else {
        Serial.println("UNKNOWN_RFID:" + uidString);
        Serial.println("Unknown RFID card: " + uidString);
    }

    // Halt PICC
    mfrc522.PICC_HaltA();
    // Stop encryption on PCD
    mfrc522.PCD_StopCrypto1();
}

String getYearRangeFromUID(String uid) {
    for (int i = 0; i < NUM_YEAR_MAPPINGS; i++) {
        if (uid.equals(yearMappings[i].uid)) {
            return yearMappings[i].yearRange;
        }
    }
    return "";  // Return empty string if UID not found
}

void printCardInfo() {
    Serial.print("Card UID: ");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (i > 0) Serial.print(" ");
        if (mfrc522.uid.uidByte[i] < 0x10) Serial.print("0");
        Serial.print(mfrc522.uid.uidByte[i], HEX);
    }
    Serial.println();
}