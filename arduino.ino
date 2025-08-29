void setup() {
    // Initialize serial communication
    Serial.begin(9600);
}

int dropped = 1023;

void loop() {
    // Read the analog value from the photoresistor
    int nafHistory = analogRead(A0);
    int nafsfaHistory = analogRead(A1);
    int financeEvolution = analogRead(A2);

    // Print the value to the serial monitor
    Serial.print("Light sensor value: ");
    Serial.println(nafHistory);
    Serial.print("NAFSFA sensor value: ");
    Serial.println(nafsfaHistory);
    Serial.print("Finance Evolution sensor value: ");
    Serial.println(financeEvolution);

    // Wait for a short period before next reading
    delay(500);
}