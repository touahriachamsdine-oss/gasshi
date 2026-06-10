/*
  ========================================================================
  AERO SPRAY SYSTEM - ESP32 & SENSIRION SPS30 ARDUINO FIRMWARE (I2C)
  ========================================================================
  Hardware Wiring Guide for ESP32-S3 & SPS30:
  1. Sensirion SPS30 Sensor (Standard 5-Pin Connector):
     - Connector Pinout (looking at the JST-ZH connector on the sensor):
       * Pin 1: VDD (Power)      -> Connect to ESP32-S3 5V / VBUS (Must be 5V for internal fan/laser!)
       * Pin 2: SDA              -> Connect to ESP32-S3 SDA Pin (GPIO 8)
       * Pin 3: SCL              -> Connect to ESP32-S3 SCL Pin (GPIO 9)
       * Pin 4: SEL (Select)     -> Connect to ESP32-S3 GND (CRITICAL: MUST BE GND TO CHOOSE I2C MODE!)
       * Pin 5: GND (Ground)     -> Connect to ESP32-S3 GND Common Ground
     - Note: Pull-up resistors (4.7k Ohm) are recommended on the SDA and SCL lines to 3.3V.

  2. 5V/12V Water Pump Relay Module:
     - Connect control signal to ESP32-S3:
       * ESP32-S3 GPIO 35        -> Relay Trigger Input Pin
       * VCC                     -> 5V (or 3.3V depending on your module)
       * GND                     -> GND Common Ground
     - The pump motor wiring is in series with the Relay Common (COM) and Normally Open (NO) terminals.
  ========================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ESPAsyncWebServer.h>
#include <Wire.h>
#include <SensirionI2cSps30.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <LittleFS.h>
#include <mbedtls/md.h>
#include <mbedtls/base64.h>
#include "types.h"

// WiFi Settings - Modify with your local network details
const char* ssid = "OnePlus 7T-5acc";
const char* password = "TESTnode13";

// Direct HTTP Database Logging
bool enableDirectLogging = false; 
const char* dbServerEndpoint = "http://192.168.1.100:3000/api/readings"; // Replace with your server's IP address
unsigned long lastDbPostTime = 0;
const unsigned long DB_POST_INTERVAL = 6000; // Log to DB every 6 seconds

// Hardware Mappings
const int RELAY_PIN = 35;
const int SDA_PIN = 8;  // Connects to SPS30 Pin 2 (SDA)
const int SCL_PIN = 9;  // Connects to SPS30 Pin 3 (SCL)
const int OVERRIDE_PIN = 0; // BOOT button (active LOW)

// Global Servers Initialization
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// Preferences and config settings
Preferences preferences;

// Sensor Handler & Error Definitions
#ifdef NO_ERROR
#undef NO_ERROR
#endif
#define NO_ERROR 0

SensirionI2cSps30 sensor;
static char errorMessage[64];
static int16_t error;

// Threshold states (Shared between WebSocket requests and automated runs)
float thresholdPM25 = 35.0;
int sprayDurationSec = 10;
bool isManualMode = false;
bool isRelayActive = false;
bool isOverrideActive = false; // Track physical override status
unsigned long sprayStartTime = 0;
float latestPM25 = 0.0; // Cache for the automated spray trigger
unsigned long timeOffsetSeconds = 0; // Epoch offset for offline timestamp calculation

// Sensor readings cache (Global variables / Defaults for initial dry tests)
float massPM1 = 4.8;
float massPM25 = 11.2;
float massPM4 = 15.6;
float massPM10 = 20.8;
float numPM05 = 120.0;
float numPM1 = 210.0;
float numPM25 = 45.0;
float numPM4 = 10.0;
float numPM10 = 3.0;
float typSize = 0.41;

// -------------------------------------------------------------------------
// JWT and Base64 Utilities using native ESP32 mbedtls
// -------------------------------------------------------------------------

void hmac_sha256(const uint8_t *key, size_t key_len, const uint8_t *data, size_t data_len, uint8_t *output) {
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
    mbedtls_md_hmac_starts(&ctx, key, key_len);
    mbedtls_md_hmac_update(&ctx, data, data_len);
    mbedtls_md_hmac_finish(&ctx, output);
    mbedtls_md_free(&ctx);
}

String base64UrlEncode(const uint8_t* input, size_t inputLen) {
    size_t outLen = 0;
    mbedtls_base64_encode(NULL, 0, &outLen, input, inputLen);
    uint8_t* buf = (uint8_t*)malloc(outLen + 1);
    if (!buf) return "";
    mbedtls_base64_encode(buf, outLen, &outLen, input, inputLen);
    buf[outLen] = '\0';
    String s = (char*)buf;
    free(buf);
    
    s.replace("+", "-");
    s.replace("/", "_");
    s.replace("=", "");
    s.trim();
    return s;
}

int base64UrlDecode(const String& input, uint8_t* output, size_t maxLen, size_t* outLen) {
    String s = input;
    s.replace("-", "+");
    s.replace("_", "/");
    while (s.length() % 4 != 0) {
        s += "=";
    }
    return mbedtls_base64_decode(output, maxLen, outLen, (const uint8_t*)s.c_str(), s.length());
}

UserJWT verifyJWT(const String& token, const String& secret) {
    UserJWT result = {"", "", false};
    
    int dot1 = token.indexOf('.');
    if (dot1 == -1) return result;
    int dot2 = token.indexOf('.', dot1 + 1);
    if (dot2 == -1) return result;
    
    String headerB64 = token.substring(0, dot1);
    String payloadB64 = token.substring(dot1 + 1, dot2);
    String signatureB64 = token.substring(dot2 + 1);
    
    String msg = headerB64 + "." + payloadB64;
    uint8_t hmacRes[32];
    hmac_sha256((const uint8_t*)secret.c_str(), secret.length(), (const uint8_t*)msg.c_str(), msg.length(), hmacRes);
    
    String expectedSig = base64UrlEncode(hmacRes, 32);
    if (expectedSig != signatureB64) {
        Serial.println("JWT signature verification failed!");
        return result;
    }
    
    uint8_t payloadBytes[512];
    size_t payloadLen = 0;
    int decRes = base64UrlDecode(payloadB64, payloadBytes, sizeof(payloadBytes) - 1, &payloadLen);
    if (decRes != 0) {
        Serial.println("JWT payload base64url decode failed!");
        return result;
    }
    payloadBytes[payloadLen] = '\0';
    
    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, payloadBytes);
    if (err) {
        Serial.println("JWT payload JSON parse failed!");
        return result;
    }
    
    result.username = doc["username"].as<String>();
    result.role = doc["role"].as<String>();
    result.isValid = true;
    return result;
}

// -------------------------------------------------------------------------
// Offline Settings and Cache Utilities
// -------------------------------------------------------------------------

unsigned long getSystemTime() {
    return timeOffsetSeconds + (millis() / 1000);
}

String getSystemTimeISO() {
    time_t rawtime = getSystemTime();
    struct tm * timeinfo = gmtime(&rawtime);
    char buffer[25];
    if (rawtime < 1000000000) {
        // Fallback default format if time not set/synced
        sprintf(buffer, "2026-06-07T12:00:00Z");
    } else {
        strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
    }
    return String(buffer);
}

void loadConfig() {
    preferences.begin("mine-config", false);
    thresholdPM25 = preferences.getFloat("threshold", 35.0);
    sprayDurationSec = preferences.getInt("duration", 10);
    isManualMode = preferences.getBool("manual_mode", false);
    preferences.end();
    Serial.printf("Config loaded from Preferences: Threshold=%.1f, Duration=%d, Manual=%d\n", 
                  thresholdPM25, sprayDurationSec, isManualMode);
}

void saveConfig() {
    preferences.begin("mine-config", false);
    preferences.putFloat("threshold", thresholdPM25);
    preferences.putInt("duration", sprayDurationSec);
    preferences.putBool("manual_mode", isManualMode);
    preferences.end();
    Serial.println("Config saved to Preferences.");
}

void logEvent(const String& username, const String& action, const String& details) {
    Serial.printf("Audit Log: [%s] performed %s (%s)\n", username.c_str(), action.c_str(), details.c_str());

    StaticJsonDocument<256> doc;
    doc["username"] = username;
    doc["action"] = action;
    doc["created_at"] = getSystemTimeISO();
    
    JsonObject det = doc.createNestedObject("details");
    det["message"] = details;
    det["source"] = "esp32";

    File file = LittleFS.open("/offline_logs.json", "a");
    if (file) {
        serializeJson(doc, file);
        file.println();
        file.close();
    } else {
        Serial.println("Failed to write to offline_logs.json!");
    }
}

void syncUsersFromServer() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    HTTPClient http;
    String baseServer = String(dbServerEndpoint);
    int apiIndex = baseServer.indexOf("/api/");
    if (apiIndex != -1) {
        baseServer = baseServer.substring(0, apiIndex);
    } else {
        baseServer = "http://192.168.1.100:3000";
    }
    
    String syncUrl = baseServer + "/api/auth/device-sync-users";
    http.begin(syncUrl);
    http.addHeader("X-Device-Token", "super_secret_mine_key");
    
    int httpResponseCode = http.GET();
    if (httpResponseCode == 200) {
        String payload = http.getString();
        preferences.begin("users-cache", false);
        preferences.putString("users_json", payload);
        preferences.end();
        Serial.println("[OK] Synced users list from surface server to Preferences.");
    } else {
        Serial.printf("User sync failed, HTTP code: %d\n", httpResponseCode);
    }
    http.end();
}

void syncOfflineLogsToServer() {
    if (WiFi.status() != WL_CONNECTED) return;
    if (!LittleFS.exists("/offline_logs.json")) return;
    
    File file = LittleFS.open("/offline_logs.json", "r");
    if (!file) return;
    
    DynamicJsonDocument doc(8192);
    JsonArray logs = doc.createNestedArray("logs");
    
    while (file.available()) {
        String line = file.readStringUntil('\n');
        line.trim();
        if (line.length() == 0) continue;
        
        StaticJsonDocument<512> logDoc;
        DeserializationError err = deserializeJson(logDoc, line);
        if (!err) {
            logs.add(logDoc.as<JsonObject>());
        }
    }
    file.close();
    
    if (logs.size() == 0) {
        LittleFS.remove("/offline_logs.json");
        return;
    }
    
    HTTPClient http;
    String baseServer = String(dbServerEndpoint);
    int apiIndex = baseServer.indexOf("/api/");
    if (apiIndex != -1) {
        baseServer = baseServer.substring(0, apiIndex);
    } else {
        baseServer = "http://192.168.1.100:3000";
    }
    
    String syncUrl = baseServer + "/api/auth/sync-audit-logs";
    http.begin(syncUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Token", "super_secret_mine_key");
    
    String requestBody;
    serializeJson(doc, requestBody);
    
    int httpResponseCode = http.POST(requestBody);
    if (httpResponseCode == 200 || httpResponseCode == 201) {
        Serial.printf("[OK] Successfully synced %d offline audit logs to server.\n", logs.size());
        LittleFS.remove("/offline_logs.json");
    } else {
        Serial.printf("Failed to sync offline logs, HTTP code: %d\n", httpResponseCode);
    }
    http.end();
}

// -------------------------------------------------------------------------
// WebSocket and Web Server Handlers
// -------------------------------------------------------------------------

void notifyClients(String payload) {
  ws.textAll(payload);
}

void sendSystemStatus() {
  StaticJsonDocument<512> doc;

  uint16_t dataReadyFlag = 0;
  error = sensor.readDataReadyFlag(dataReadyFlag);
  if (error == NO_ERROR && dataReadyFlag) {
    uint16_t mc1p0 = 0, mc2p5 = 0, mc4p0 = 0, mc10p0 = 0;
    uint16_t nc0p5 = 0, nc1p0 = 0, nc2p5 = 0, nc4p0 = 0, nc10p0 = 0;
    uint16_t typicalParticleSize = 0;

    error = sensor.readMeasurementValuesUint16(
      mc1p0, mc2p5, mc4p0, mc10p0,
      nc0p5, nc1p0, nc2p5, nc4p0,
      nc10p0, typicalParticleSize
    );
    if (error == NO_ERROR) {
      massPM1 = mc1p0 / 10.0;
      massPM25 = mc2p5 / 10.0;
      massPM4 = mc4p0 / 10.0;
      massPM10 = mc10p0 / 10.0;
      numPM05 = nc0p5 / 10.0;
      numPM1 = nc1p0 / 10.0;
      numPM25 = nc2p5 / 10.0;
      numPM4 = nc4p0 / 10.0;
      numPM10 = nc10p0 / 10.0;
      typSize = typicalParticleSize / 10.0;
    } else {
      Serial.print("readMeasurementValuesUint16 failed: ");
      errorToString(error, errorMessage, sizeof errorMessage);
      Serial.println(errorMessage);
    }
  } else if (error != NO_ERROR) {
    Serial.print("readDataReadyFlag failed: ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  }

  latestPM25 = massPM25;

  doc["pm1"] = massPM1;
  doc["pm25"] = massPM25;
  doc["pm4"] = massPM4;
  doc["pm10"] = massPM10;
  
  doc["nc05"] = numPM05;
  doc["nc1"] = numPM1;
  doc["nc25"] = numPM25;
  doc["nc4"] = numPM4;
  doc["nc10"] = numPM10;
  
  doc["tps"] = typSize;
  doc["relay"] = isRelayActive ? 1 : 0;
  doc["mode"] = isManualMode ? "manual" : "auto";
  
  String output;
  serializeJson(doc, output);
  notifyClients(output);
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String message = (char*)data;
    Serial.println("Received Control Packet: " + message);
    
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) return;

    if (doc.containsKey("timestamp")) {
        unsigned long clientTime = doc["timestamp"].as<unsigned long>();
        if (clientTime > 1000000000) {
            timeOffsetSeconds = clientTime - (millis() / 1000);
            Serial.printf("Time synchronized with client: %s\n", getSystemTimeISO().c_str());
        }
    }

    if (!doc.containsKey("token")) {
        Serial.println("Rejected packet: Missing token.");
        return;
    }
    
    String token = doc["token"].as<String>();
    UserJWT user = verifyJWT(token, "super_secret_mine_key");
    if (!user.isValid) {
        Serial.println("Rejected packet: Invalid token signature.");
        return;
    }

    String role = user.role;
    String username = user.username;
    
    if (doc.containsKey("command")) {
      String cmd = doc["command"].as<String>();
      
      if (cmd == "spray_on" || cmd == "spray_off" || cmd == "set_mode_manual" || cmd == "set_mode_auto") {
          if (role == "operator" || role == "engineer" || role == "admin") {
              if (cmd == "spray_on") {
                isRelayActive = true;
                isOverrideActive = false; // Disable override mode if manual override is commanded
                digitalWrite(RELAY_PIN, HIGH);
                Serial.println("Pump motor switched ON via Manual Command.");
                logEvent(username, "spray_on", "Pump motor switched ON via Manual Command.");
                sendSystemStatus();
              } else if (cmd == "spray_off") {
                isRelayActive = false;
                digitalWrite(RELAY_PIN, LOW);
                Serial.println("Pump motor switched OFF via Manual Command.");
                logEvent(username, "spray_off", "Pump motor switched OFF via Manual Command.");
                sendSystemStatus();
              } else if (cmd == "set_mode_manual") {
                isManualMode = true;
                saveConfig();
                logEvent(username, "set_mode_manual", "Mode changed to MANUAL.");
              } else if (cmd == "set_mode_auto") {
                isManualMode = false;
                isRelayActive = false;
                digitalWrite(RELAY_PIN, LOW);
                saveConfig();
                logEvent(username, "set_mode_auto", "Mode changed to AUTOMATIC. Relay reset to standby.");
              }
          } else {
              Serial.printf("Forbidden command: User %s with role %s tried to execute %s\n", username.c_str(), role.c_str(), cmd.c_str());
          }
      }
    }
    
    if (doc.containsKey("threshold")) {
      if (role == "engineer" || role == "admin") {
          float oldThresh = thresholdPM25;
          thresholdPM25 = doc["threshold"].as<float>();
          saveConfig();
          logEvent(username, "config_threshold_updated", "PM2.5 Threshold updated from " + String(oldThresh) + " to " + String(thresholdPM25) + " ug/m3");
          Serial.printf("PM2.5 Threshold updated: %.1f µg/m3\n", thresholdPM25);
      } else {
          Serial.println("Rejected config threshold change: Insufficient privileges.");
      }
    }
    
    if (doc.containsKey("duration")) {
      if (role == "engineer" || role == "admin") {
          int oldDur = sprayDurationSec;
          sprayDurationSec = doc["duration"].as<int>();
          saveConfig();
          logEvent(username, "config_duration_updated", "Spray duration updated from " + String(oldDur) + " to " + String(sprayDurationSec) + " seconds");
          Serial.printf("Spray duration updated: %d seconds\n", sprayDurationSec);
      } else {
          Serial.println("Rejected config duration change: Insufficient privileges.");
      }
    }
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("Dashboard client connected (ID: %u)\n", client->id());
      sendSystemStatus();
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("Dashboard client disconnected (ID: %u)\n", client->id());
      break;
    case WS_EVT_DATA:
      handleWebSocketMessage(arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void setupWebServer() {
  server.on("/api/local-login", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL, 
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<256> doc;
      DeserializationError err = deserializeJson(doc, data, len);
      
      AsyncWebServerResponse *response;
      if (err) {
          response = request->beginResponse(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          response->addHeader("Access-Control-Allow-Origin", "*");
          request->send(response);
          return;
      }
      
      String username = doc["username"].as<String>();
      String password = doc["password"].as<String>();
      
      preferences.begin("users-cache", false);
      String usersJson = preferences.getString("users_json", "");
      if (usersJson.length() == 0) {
          usersJson = "{\"success\":true,\"users\":["
                      "{\"username\":\"admin\",\"role\":\"admin\",\"password_sha256\":\"240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9\"},"
                      "{\"username\":\"engineer\",\"role\":\"engineer\",\"password_sha256\":\"80ca306ac6e68366dd0a26125c9647e0c61fac6668cec6016f5fe30fb12e99bd\"},"
                      "{\"username\":\"operator\",\"role\":\"operator\",\"password_sha256\":\"ec6e1c25258002eb1c67d15c7f45da7945fa4c58778fd7d88faa5e53e3b4698d\"}"
                      "]}";
          preferences.putString("users_json", usersJson);
      }
      preferences.end();
      
      DynamicJsonDocument usersDoc(4096);
      DeserializationError readErr = deserializeJson(usersDoc, usersJson);
      if (readErr) {
          response = request->beginResponse(500, "application/json", "{\"error\":\"Local users database corrupted\"}");
          response->addHeader("Access-Control-Allow-Origin", "*");
          request->send(response);
          return;
      }
      
      JsonArray users = usersDoc["users"].as<JsonArray>();
      bool authenticated = false;
      String matchedRole = "";
      
      uint8_t sha256Res[32];
      mbedtls_md_context_t sha_ctx;
      mbedtls_md_init(&sha_ctx);
      mbedtls_md_setup(&sha_ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0);
      mbedtls_md_starts(&sha_ctx);
      mbedtls_md_update(&sha_ctx, (const uint8_t*)password.c_str(), password.length());
      mbedtls_md_finish(&sha_ctx, sha256Res);
      mbedtls_md_free(&sha_ctx);
      
      char sha256Hex[65];
      for (int i = 0; i < 32; i++) {
          sprintf(&sha256Hex[i * 2], "%02x", sha256Res[i]);
      }
      sha256Hex[64] = '\0';
      
      for (JsonObject u : users) {
          if (u["username"].as<String>() == username) {
              if (u["password_sha256"].as<String>() == String(sha256Hex)) {
                  authenticated = true;
                  matchedRole = u["role"].as<String>();
                  break;
              }
          }
      }
      
      if (!authenticated) {
          logEvent(username, "local_login_failed", "Incorrect local password.");
          response = request->beginResponse(401, "application/json", "{\"error\":\"Invalid username or password\"}");
          response->addHeader("Access-Control-Allow-Origin", "*");
          request->send(response);
          return;
      }
      
      logEvent(username, "local_login_success", "User authenticated locally offline.");
      
      StaticJsonDocument<256> payloadDoc;
      payloadDoc["id"] = 0;
      payloadDoc["username"] = username;
      payloadDoc["role"] = matchedRole;
      payloadDoc["exp"] = getSystemTime() + 43200; // 12h
      
      String payloadString;
      serializeJson(payloadDoc, payloadString);
      
      String headerB64 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      String payloadB64 = base64UrlEncode((const uint8_t*)payloadString.c_str(), payloadString.length());
      
      String msg = headerB64 + "." + payloadB64;
      uint8_t hmacRes[32];
      hmac_sha256((const uint8_t*)"super_secret_mine_key", 21, (const uint8_t*)msg.c_str(), msg.length(), hmacRes);
      String sigB64 = base64UrlEncode(hmacRes, 32);
      
      String token = msg + "." + sigB64;
      
      StaticJsonDocument<512> resDoc;
      resDoc["success"] = true;
      resDoc["token"] = token;
      JsonObject resUser = resDoc.createNestedObject("user");
      resUser["id"] = 0;
      resUser["username"] = username;
      resUser["role"] = matchedRole;
      
      String resString;
      serializeJson(resDoc, resString);
      
      response = request->beginResponse(200, "application/json", resString);
      response->addHeader("Access-Control-Allow-Origin", "*");
      request->send(response);
  });

  server.on("/api/local-login", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
      AsyncWebServerResponse *response = request->beginResponse(204);
      response->addHeader("Access-Control-Allow-Origin", "*");
      response->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Device-Token");
      request->send(response);
  });
}

// -------------------------------------------------------------------------
// Setup and Loop Cycles
// -------------------------------------------------------------------------

void setup() {
  Serial.begin(115200);
  
  // Relay control setup
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  // Physical override input setup
  pinMode(OVERRIDE_PIN, INPUT_PULLUP);

  // Initialize LittleFS
  if (!LittleFS.begin(true)) {
      Serial.println("LittleFS Mount Failed");
  }

  // Load preferences configuration
  loadConfig();

  // Initialize I2C interface with custom SDA and SCL pins
  Wire.begin(SDA_PIN, SCL_PIN);
  sensor.begin(Wire, SPS30_I2C_ADDR_69);

  sensor.stopMeasurement();
  delay(500);

  int8_t serialNumber[32] = {0};
  int8_t productType[8] = {0};
  
  error = sensor.readSerialNumber(serialNumber, 32);
  if (error != NO_ERROR) {
    Serial.print("Error trying to execute readSerialNumber(): ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  } else {
    Serial.print("Serial Number : ");
    Serial.println((const char*)serialNumber);
  }

  error = sensor.readProductType(productType, 8);
  if (error != NO_ERROR) {
    Serial.print("Error trying to execute readProductType(): ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  } else {
    Serial.print("Product Type  : ");
    Serial.println((const char*)productType);
  }

  error = sensor.startMeasurement(SPS30_OUTPUT_FORMAT_OUTPUT_FORMAT_UINT16);
  if (error != NO_ERROR) {
    Serial.print("Error trying to execute startMeasurement(): ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  } else {
    Serial.println("[OK] SPS30 started measurements successfully.");
  }

  // Connect to Local WiFi network
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi Network");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("[OK] Connected to WiFi network successfully.");
  Serial.print("ESP32 Station IP Address: ");
  Serial.println(WiFi.localIP());

  // Set up HTTP Endpoints and WS handlers
  setupWebServer();
  ws.onEvent(onEvent);
  server.addHandler(&ws);
  
  // Startup web server
  server.begin();
  Serial.println("[OK] Server listening on HTTP port 80.");

  // Sync users list immediately on boot if online
  syncUsersFromServer();
  syncOfflineLogsToServer();
}

void loop() {
  ws.cleanupClients();
  
  // Physical Override Button Check
  static bool lastOverrideState = HIGH;
  bool currentOverrideState = digitalRead(OVERRIDE_PIN);
  if (currentOverrideState == LOW && lastOverrideState == HIGH) {
      Serial.println("Physical override button pressed!");
      isRelayActive = true;
      isOverrideActive = true; // Set override active
      digitalWrite(RELAY_PIN, HIGH);
      sprayStartTime = millis();
      logEvent("physical_override", "spray_on", "Physical override button activated.");
      sendSystemStatus();
  }
  lastOverrideState = currentOverrideState;

  // Relay timing auto-stop check (runs every iteration for precision)
  if (isRelayActive) {
      if (isOverrideActive) {
          if (millis() - sprayStartTime > (sprayDurationSec * 1000)) {
              isRelayActive = false;
              isOverrideActive = false;
              digitalWrite(RELAY_PIN, LOW);
              logEvent("physical_override", "spray_off", "Physical override spray cycle completed.");
              Serial.println("Physical override spray cycle completed. Standby.");
              sendSystemStatus();
          }
      } else if (!isManualMode) {
          if (millis() - sprayStartTime > (sprayDurationSec * 1000)) {
              isRelayActive = false;
              digitalWrite(RELAY_PIN, LOW);
              logEvent("system_auto", "spray_off", "Automated spray cycle completed.");
              Serial.println("Automated spray cycle completed. Standby.");
              sendSystemStatus();
          }
      }
  }

  // Sensor readout interval (Every 2 seconds)
  static unsigned long lastReading = 0;
  if (millis() - lastReading > 2000) {
    lastReading = millis();
    sendSystemStatus();
    
    // Automating air purification mist loops
    if (!isManualMode) {
      // Auto Start Trigger
      if (latestPM25 > thresholdPM25 && !isRelayActive) {
        isRelayActive = true;
        digitalWrite(RELAY_PIN, HIGH);
        sprayStartTime = millis();
        logEvent("system_auto", "spray_on", "Automated spray initiated: PM2.5 (" + String(latestPM25) + ") > Threshold (" + String(thresholdPM25) + ")");
        Serial.printf("Automated spray initiated: PM2.5 (%.1f) > Threshold (%.1f)\n", latestPM25, thresholdPM25);
        sendSystemStatus();
      }
    }
  }

  // Periodic User / Sync offline log checks (every 10 seconds)
  static unsigned long lastSyncCheck = 0;
  if (millis() - lastSyncCheck > 10000) {
      lastSyncCheck = millis();
      syncOfflineLogsToServer();
      static int syncUserCounter = 0;
      if (syncUserCounter++ % 30 == 0) { // Sync users list every 5 minutes
          syncUsersFromServer();
      }
  }

  // Direct database HTTP POST if enabled (Throttled to DB_POST_INTERVAL)
  if (enableDirectLogging && (millis() - lastDbPostTime > DB_POST_INTERVAL)) {
    lastDbPostTime = millis();
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      if (String(dbServerEndpoint).startsWith("https")) {
        WiFiClientSecure client;
        client.setInsecure();
        http.begin(client, dbServerEndpoint);
      } else {
        http.begin(dbServerEndpoint);
      }
      http.addHeader("Content-Type", "application/json");

      StaticJsonDocument<512> postDoc;
      postDoc["pm1"] = massPM1;
      postDoc["pm25"] = massPM25;
      postDoc["pm4"] = massPM4;
      postDoc["pm10"] = massPM10;
      postDoc["nc05"] = numPM05;
      postDoc["nc1"] = numPM1;
      postDoc["nc25"] = numPM25;
      postDoc["nc4"] = numPM4;
      postDoc["nc10"] = numPM10;
      postDoc["tps"] = typSize;
      postDoc["relay"] = isRelayActive ? 1 : 0;
      postDoc["mode"] = isManualMode ? "manual" : "auto";
      postDoc["source"] = "esp32";

      String jsonPayload;
      serializeJson(postDoc, jsonPayload);

      int httpResponseCode = http.POST(jsonPayload);
      if (httpResponseCode > 0) {
        Serial.printf("Direct DB Log SUCCESS: HTTP %d\n", httpResponseCode);
      } else {
        Serial.printf("Direct DB Log FAILED: Error code %d\n", httpResponseCode);
      }
      http.end();
    }
  }

  delay(10);
}
