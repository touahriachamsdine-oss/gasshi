// AERO SPRAY DASHBOARD CONTROLLER

// ----------------------------------------------------
// 1. LOCALIZATION DICTIONARY
// ----------------------------------------------------
const i18n = {
    en: {
        title: "AeroSpray // SPS30 Smart Controller",
        brand_title: "AeroSpray",
        brand_subtitle: "SPS30 Air Misting Controller",
        status_simulated: "Offline (Simulation)",
        status_connecting: "Connecting...",
        status_connected: "Connected to ESP32",
        air_quality_title: "Air Quality Index",
        aqi_excellent: "Excellent",
        aqi_moderate: "Moderate",
        aqi_poor: "Hazardous",
        relay_status: "Relay State",
        relay_active: "Active (Spraying)",
        relay_inactive: "Idle (Standby)",
        operation_mode: "Operation Mode",
        mode_auto: "Automatic",
        mode_manual: "Manual Mode",
        btn_manual_spray_on: "Start Spraying",
        btn_manual_spray_off: "Stop Spraying",
        sensor_readings: "SPS30 Particulate Matter",
        live_badge: "LIVE",
        pm_mass_title: "Mass Concentration (µg/m³)",
        ultrafine: "Ultrafine Dust",
        fine: "Fine Dust (Target)",
        environmental: "Environmental Dust",
        coarse: "Coarse Dust",
        pm_number_title: "Number Concentration (particles/cm³)",
        typical_particle_size: "Typical Particle Size",
        system_settings: "System Settings",
        label_pm25_threshold: "PM2.5 Trigger Threshold",
        pm25_threshold_hint: "Relay switches ON when PM2.5 exceeds this value.",
        label_spray_duration: "Misting Duration",
        spray_duration_hint: "Time the water spray runs per automated trigger.",
        device_network: "ESP32 Hardware Connection",
        esp32_ip: "WebSocket Target Address",
        btn_connect: "Connect",
        btn_toggle_sim: "Active Simulator",
        btn_toggle_sim_off: "Deactivate Simulator",
        firmware_title: "Physical Wiring & Code",
        firmware_desc: "Ready to program your ESP32? Get the fully loaded sketch containing libraries, Pin mappings, and WebSocket handlers.",
        btn_firmware: "View ESP32 Code",
        analytics_title: "Real-Time Air Quality History",
        spray_legend: "Water Spray",
        system_logs: "System Event Logs",
        btn_clear_logs: "Clear",
        dialog_firmware_title: "ESP32 + SPS30 Arduino Code",
        dialog_firmware_desc: "Flash this C++ sketch to your ESP32. Set your SSID and Password. It connects to the Sensirion SPS30 over I2C and publishes real-time data to your dashboard.",
        btn_copy_code: "Copy Code",
        btn_copied: "Copied!",
        log_init: "AeroSpray System Initialized. Simulator active.",
        log_sim_on: "Offline simulator activated. Fluctuations loaded.",
        log_sim_off: "Simulator suspended. Waiting for hardware connection.",
        log_connect_attempt: "Attempting connection to ESP32 at: ws://",
        log_connect_success: "WebSocket connection established with ESP32 successfully.",
        log_connect_fail: "WebSocket connection failed. Falling back to simulation.",
        log_ws_closed: "Connection closed by ESP32 host device.",
        log_auto_trigger: "PM2.5 limit exceeded (value: {val} µg/m³). Automated spraying initiated.",
        log_auto_stop: "Misting duration complete. Relay opened, returning to standby.",
        log_manual_start: "Manual relay override: Spray started.",
        log_manual_stop: "Manual relay override: Spray stopped.",
        log_db_history_loaded: "Database Connection OK: Loaded {count} historical data points from Neon.",
        login_title: "System Access Authentication",
        login_subtitle: "Enter credentials to unlock controller dashboard",
        login_username_label: "Username",
        login_password_label: "Password",
        login_btn_submit: "Authenticate",
        settings_locked_title: "Settings Locked",
        settings_locked_desc: "Insufficient permissions to modify configuration",
        badge_locked: "Locked",
        badge_unlocked: "Unlocked",
        audit_log_title: "Cryptographic System Audit Chain",
        btn_verify_chain: "Verify Chain Integrity",
        audit_th_seq: "Seq",
        audit_th_timestamp: "Timestamp",
        audit_th_user: "User (Role)",
        audit_th_action: "Action",
        audit_th_details: "Details",
        audit_th_hash: "Current Hash",
        audit_th_sig: "Signature Status",
        audit_empty: "No audit records loaded. Click Verify to load and check chain integrity.",
        audit_chain_valid: "Chain Verified (Secure)",
        audit_chain_invalid: "Chain Corrupted (Warning)",
        audit_chain_required: "Validation Required",
        audit_sig_verified: "Verified",
        audit_sig_failed: "Failed"
    },
    fr: {
        title: "AeroSpray // Contrôleur Intelligent SPS30",
        brand_title: "AeroSpray",
        brand_subtitle: "Contrôleur d'Atomisation SPS30",
        status_simulated: "Hors ligne (Simulation)",
        status_connecting: "Connexion...",
        status_connected: "Connecté à l'ESP32",
        air_quality_title: "Indice de Qualité de l'Air",
        aqi_excellent: "Excellent",
        aqi_moderate: "Modéré",
        aqi_poor: "Dangereux",
        relay_status: "État du Relais",
        relay_active: "Actif (Pulvérisation)",
        relay_inactive: "Inactif (Veille)",
        operation_mode: "Mode d'Opération",
        mode_auto: "Automatique",
        mode_manual: "Mode Manuel",
        btn_manual_spray_on: "Démarrer",
        btn_manual_spray_off: "Arrêter",
        sensor_readings: "Matières Particulaires SPS30",
        live_badge: "EN DIRECT",
        pm_mass_title: "Concentration de Masse (µg/m³)",
        ultrafine: "Poussière Ultrafine",
        fine: "Poussière Fine (Cible)",
        environmental: "Poussière Environnementale",
        coarse: "Poussière Grossière",
        pm_number_title: "Concentration en Nombre (particules/cm³)",
        typical_particle_size: "Taille Typique des Particules",
        system_settings: "Paramètres Système",
        label_pm25_threshold: "Seuil de Déclenchement PM2.5",
        pm25_threshold_hint: "Le relais s'active lorsque les PM2.5 dépassent ce seuil.",
        label_spray_duration: "Durée d'Atomisation",
        spray_duration_hint: "Temps pendant lequel le jet d'eau fonctionne par déclenchement automatique.",
        device_network: "Connexion Matérielle ESP32",
        esp32_ip: "Adresse WebSocket Cible",
        btn_connect: "Connecter",
        btn_toggle_sim: "Activer Simulation",
        btn_toggle_sim_off: "Désactiver Simulation",
        firmware_title: "Câblage Physique & Code",
        firmware_desc: "Prêt à programmer votre ESP32 ? Obtenez le code Arduino complet avec mappages de broches et gestionnaires WebSocket.",
        btn_firmware: "Afficher le Code ESP32",
        analytics_title: "Historique de la Qualité de l'Air",
        spray_legend: "Jet d'Eau",
        system_logs: "Journaux des Événements",
        btn_clear_logs: "Effacer",
        dialog_firmware_title: "Code Arduino ESP32 + SPS30",
        dialog_firmware_desc: "Téléversez ce sketch C++ sur votre ESP32. Configurez votre SSID et Mot de passe. Le capteur communique en I2C et envoie les données en direct.",
        btn_copy_code: "Copier le Code",
        btn_copied: "Copié !",
        log_init: "Système AeroSpray initialisé. Simulateur actif.",
        log_sim_on: "Simulateur hors ligne activé. Fluctuations chargées.",
        log_sim_off: "Simulateur suspendu. En attente de connexion matérielle.",
        log_connect_attempt: "Tentative de connexion à l'ESP32 sur : ws://",
        log_connect_success: "Connexion WebSocket établie avec succès.",
        log_connect_fail: "Échec de connexion WebSocket. Retour au simulateur.",
        log_ws_closed: "Connexion fermée par l'appareil ESP32.",
        log_auto_trigger: "Limite PM2.5 dépassée ({val} µg/m³). Pulvérisation automatique lancée.",
        log_auto_stop: "Durée d'atomisation terminée. Relais ouvert, retour en veille.",
        log_manual_start: "Contrôle manuel : Ravitaillement jet d'eau démarré.",
        log_manual_stop: "Contrôle manuel : Ravitaillement jet d'eau arrêté.",
        log_db_history_loaded: "Connexion DB OK : {count} points d'historique chargés depuis Neon.",
        login_title: "Authentification d'Accès Système",
        login_subtitle: "Entrez vos identifiants pour déverrouiller le tableau de bord",
        login_username_label: "Nom d'utilisateur",
        login_password_label: "Mot de passe",
        login_btn_submit: "S'authentifier",
        settings_locked_title: "Paramètres Verrouillés",
        settings_locked_desc: "Permissions insuffisantes pour modifier la configuration",
        badge_locked: "Verrouillé",
        badge_unlocked: "Déverrouillé",
        audit_log_title: "Chaîne d'Audit Cryptographique du Système",
        btn_verify_chain: "Vérifier l'Intégrité de la Chaîne",
        audit_th_seq: "Séquence",
        audit_th_timestamp: "Horodatage",
        audit_th_user: "Utilisateur (Rôle)",
        audit_th_action: "Action",
        audit_th_details: "Détails",
        audit_th_hash: "Hachage Actuel",
        audit_th_sig: "Statut de Signature",
        audit_empty: "Aucun enregistrement d'audit chargé. Cliquez sur Vérifier pour charger et vérifier l'intégrité de la chaîne.",
        audit_chain_valid: "Chaîne Vérifiée (Sécurisée)",
        audit_chain_invalid: "Chaîne Corrompue (Avertissement)",
        audit_chain_required: "Validation Requise",
        audit_sig_verified: "Vérifié",
        audit_sig_failed: "Échec"
    },
    ar: {
        title: "إيرو-سبراي // متحكم جودة الهواء الذكي SPS30",
        brand_title: "إيرو-سبراي",
        brand_subtitle: "متحكم رش المياه وجهاز SPS30",
        status_simulated: "غير متصل (محاكاة حية)",
        status_connecting: "جاري الاتصال...",
        status_connected: "متصل بجهاز ESP32",
        air_quality_title: "مؤشر جودة الهواء",
        aqi_excellent: "ممتاز",
        aqi_moderate: "معتدل",
        aqi_poor: "خطير للغاية",
        relay_status: "حالة الريليه (المفتاح)",
        relay_active: "نشط (رش المياه يعمل)",
        relay_inactive: "خامل (في الانتظار)",
        operation_mode: "وضع التشغيل الحالي",
        mode_auto: "تلقائي (أتوماتيكي)",
        mode_manual: "وضع يدوي",
        btn_manual_spray_on: "بدء رش المياه",
        btn_manual_spray_off: "إيقاف رش المياه",
        sensor_readings: "قراءات جزيئات الهواء SPS30",
        live_badge: "بث مباشر",
        pm_mass_title: "تراكيز الكتلة (ميكروغرام/متر مكعب)",
        ultrafine: "الغبار فائق الدقة (PM1.0)",
        fine: "الغبار الناعم (PM2.5 المستهدف)",
        environmental: "الغبار البيئي (PM4.0)",
        coarse: "الغبار الخشن (PM10)",
        pm_number_title: "تراكيز العدد (جزيء/سم مكعب)",
        typical_particle_size: "الحجم النموذجي للجزيئات",
        system_settings: "إعدادات النظام",
        label_pm25_threshold: "عتبة تشغيل الرشاش (PM2.5)",
        pm25_threshold_hint: "يتم تشغيل الريليه تلقائياً عندما يتجاوز تركيز PM2.5 هذه القيمة.",
        label_spray_duration: "مدة رش المياه",
        spray_duration_hint: "الوقت الذي يستمر فيه الرشاش بالعمل عند التشغيل التلقائي.",
        device_network: "الاتصال المادي بجهاز ESP32",
        esp32_ip: "عنوان خادم الويب (WebSocket)",
        btn_connect: "اتصال بالعتاد",
        btn_toggle_sim: "تفعيل المحاكي",
        btn_toggle_sim_off: "إيقاف المحاكي",
        firmware_title: "التوصيل المادي وبرمجية ESP32",
        firmware_desc: "جاهز لبرمجة لوحة ESP32 الخاصة بك؟ احصل على الكود البرمجي الكامل للـ Arduino مع واجهات التوصيل والمتحكمات.",
        btn_firmware: "عرض كود البرمجة",
        analytics_title: "سجل جودة الهواء في الوقت الحقيقي",
        spray_legend: "رشاش المياه",
        system_logs: "سجلات أحداث النظام",
        btn_clear_logs: "مسح السجلات",
        dialog_firmware_title: "برمجية Arduino لجهازي ESP32 + SPS30",
        dialog_firmware_desc: "قم بتنزيل كود C++ وتمريره للوحة ESP32 الخاصة بك. اضبط اسم الشبكة وكلمة المرور. سيتصل الحساس عن طريق I2C لإرسال القراءات الفورية.",
        btn_copy_code: "نسخ الكود",
        btn_copied: "تم النسخ!",
        log_init: "تم تشغيل نظام إيرو-سبراي. المحاكي نشط حالياً.",
        log_sim_on: "تم تفعيل محاكاة البيئة. تقلبات الهواء نشطة.",
        log_sim_off: "تم إيقاف المحاكي مؤقتاً. بانتظار اتصال الجهاز المادي.",
        log_connect_attempt: "جاري محاولة الاتصال بـ ESP32 على العنوان: ws://",
        log_connect_success: "تم إنشاء اتصال الـ WebSocket بنجاح مع ESP32.",
        log_connect_fail: "فشل الاتصال المادي. تم الرجوع إلى وضع المحاكاة التلقائي.",
        log_ws_closed: "تم إغلاق الاتصال من قبل جهاز ESP32.",
        log_auto_trigger: "تم تجاوز حد PM2.5 (القيمة: {val} ميكروغرام/م³). تم بدء رش المياه تلقائياً.",
        log_auto_stop: "انتهت فترة الرش المحددة. تم فتح الريليه والعودة لحالة الاستعداد.",
        log_manual_start: "تجاوز يدوي للمفتاح: بدء تشغيل رشاش المياه.",
        log_manual_stop: "تجاوز يدوي للمفتاح: إيقاف تشغيل رشاش المياه.",
        log_db_history_loaded: "اتصال قاعدة البيانات ناجح: تم تحميل {count} من نقاط البيانات السابقة من Neon.",
        login_title: "مصادقة الوصول إلى النظام",
        login_subtitle: "أدخل بيانات الاعتماد لفتح لوحة تحكم وحدة التحكم",
        login_username_label: "اسم المستخدم",
        login_password_label: "كلمة المرور",
        login_btn_submit: "مصادقة",
        settings_locked_title: "الإعدادات مقفلة",
        settings_locked_desc: "صلاحيات غير كافية لتعديل التكوين",
        badge_locked: "مغلق",
        badge_unlocked: "مفتوح",
        audit_log_title: "سلسلة تدقيق النظام التشفيرية",
        btn_verify_chain: "التحقق من سلامة السلسلة",
        audit_th_seq: "التسلسل",
        audit_th_timestamp: "الطابع الزمني",
        audit_th_user: "المستخدم (الدور)",
        audit_th_action: "الإجراء",
        audit_th_details: "التفاصيل",
        audit_th_hash: "التجزئة الحالية",
        audit_th_sig: "حالة التوقيع",
        audit_empty: "لم يتم تحميل أي سجلات تدقيق. انقر فوق تحقق لتحميل والتحقق من سلامة السلسلة.",
        audit_chain_valid: "تم التحقق من السلسلة (آمنة)",
        audit_chain_invalid: "السلسلة تالفة (تحذير)",
        audit_chain_required: "التحقق مطلوب",
        audit_sig_verified: "تم التحقق",
        audit_sig_failed: "فشل"
    }
};

// ----------------------------------------------------
// 2. GLOBAL STATE VARIABLES
// ----------------------------------------------------
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let lastDbLogTime = 0;
const DB_LOG_INTERVAL = 6000; // Throttled to log every 6 seconds

let currentLang = 'en';
let airHistoryChart = null;
let webSocket = null;
let isRelayOpen = false;
let isManualMode = false;
let isSimulatorActive = true;
let simulationInterval = null;
let sprayTimeout = null;
let pm25Threshold = 25.0; // Default trigger threshold
let pm1Threshold = 15.0;  // PM1.0 safety threshold (µg/m³)
let sprayDuration = 10;   // Default duration in seconds
let espAddress = '192.168.1.100'; // Default target IP

// Authentication state
let currentToken = null;
let currentUser = null;

const ROLE_CREDENTIALS = {
    admin:    { username: 'admin',    password: 'admin123' },
    engineer: { username: 'engineer', password: 'engineer123' },
    operator: { username: 'operator', password: 'operator123' }
};

// Data arrays for Chart.js (sliding window of 30 values)
const maxDataPoints = 30;
const chartLabels = Array(maxDataPoints).fill('');
const pm1Data = Array(maxDataPoints).fill(0);
const pm25Data = Array(maxDataPoints).fill(0);
const pm10Data = Array(maxDataPoints).fill(0);
const relayStateData = Array(maxDataPoints).fill(0);

// ----------------------------------------------------
// 3. PHYSICAL WIRING & ESP32 ARDUINO CODE
// ----------------------------------------------------
const arduinoCode = `/*
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

// WiFi Settings - Modify with your local network details
const char* ssid = "Chams";
const char* password = "YOUR_WIFI_PASSWORD";

// Direct HTTP Database Logging (Optional direct log bypassing frontend bridging)
bool enableDirectLogging = false; 
const char* dbServerEndpoint = "http://YOUR_SERVER_IP:3000/api/readings"; // Replace with your server's IP address
unsigned long lastDbPostTime = 0;
const unsigned long DB_POST_INTERVAL = 6000; // Log to DB every 6 seconds

// Hardware Mappings
const int RELAY_PIN = 6;
// I2C Pin Mappings for ESP32-S3 and SPS30 I2C interface
const int SDA_PIN = 8;  // Connects to SPS30 Pin 2 (SDA)
const int SCL_PIN = 9;  // Connects to SPS30 Pin 3 (SCL)

// Global Servers Initialization
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

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
float thresholdPM1 = 15.0; // Dangerous level for PM1.0
int sprayDurationSec = 10;
bool isManualMode = false;
bool isRelayActive = false;
unsigned long sprayStartTime = 0;
float latestPM25 = 0.0; // Cache for the automated spray trigger

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

// Package data and stream to all active WebSocket listeners
void notifyClients(String payload) {
  ws.textAll(payload);
}

// Packages all readings and variables into a single JSON payload
void sendSystemStatus() {
  StaticJsonDocument<512> doc;

  uint16_t dataReadyFlag = 0;
  error = sensor.readDataReadyFlag(dataReadyFlag);
  if (error == NO_ERROR && dataReadyFlag) {
    float mc1p0 = 0.0, mc2p5 = 0.0, mc4p0 = 0.0, mc10p0 = 0.0;
    float nc0p5 = 0.0, nc1p0 = 0.0, nc2p5 = 0.0, nc4p0 = 0.0, nc10p0 = 0.0;
    float typicalParticleSize = 0.0;

    error = sensor.readMeasurementValues(
      mc1p0, mc2p5, mc4p0, mc10p0,
      nc0p5, nc1p0, nc2p5, nc4p0,
      nc10p0, typicalParticleSize
    );
    if (error == NO_ERROR) {
      massPM1 = mc1p0;
      massPM25 = mc2p5;
      massPM4 = mc4p0;
      massPM10 = mc10p0;
      numPM05 = nc0p5;
      numPM1 = nc1p0;
      numPM25 = nc2p5;
      numPM4 = nc4p0;
      numPM10 = nc10p0;
      typSize = typicalParticleSize;
    } else {
      Serial.print("readMeasurementValues failed: ");
      errorToString(error, errorMessage, sizeof errorMessage);
      Serial.println(errorMessage);
    }
  } else if (error != NO_ERROR) {
    Serial.print("readDataReadyFlag failed: ");
    errorToString(error, errorMessage, sizeof errorMessage);
    Serial.println(errorMessage);
  }

  // Update latestPM25 cache so automatic spray triggers can check it, even when using simulated/cached values
  latestPM25 = massPM25;

  // Bind values to JSON object
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

// Processes JSON controls sent from the dashboard
void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String message = (char*)data;
    Serial.println("Received Control Packet: " + message);
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) return;

    // Relay commands
    if (doc.containsKey("command")) {
      String cmd = doc["command"].as<String>();
      if (cmd == "spray_on") {
        isRelayActive = true;
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("Pump motor switched ON via Manual Command.");
        sendSystemStatus();
      } else if (cmd == "spray_off") {
        isRelayActive = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Pump motor switched OFF via Manual Command.");
        sendSystemStatus();
      } else if (cmd == "set_mode_manual") {
        isManualMode = true;
        Serial.println("Mode changed: MANUAL");
      } else if (cmd == "set_mode_auto") {
        isManualMode = false;
        isRelayActive = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Mode changed: AUTOMATIC. Relay reset to standby.");
      }
    }
    
    // Config updates
    if (doc.containsKey("threshold")) {
      thresholdPM25 = doc["threshold"].as<float>();
      Serial.printf("PM2.5 Threshold updated: %.1f µg/m3\\n", thresholdPM25);
    }
    
    if (doc.containsKey("duration")) {
      sprayDurationSec = doc["duration"].as<int>();
      Serial.printf("Spray duration updated: %d seconds\\n", sprayDurationSec);
    }
  }
}

// Websocket Events Router
void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("Dashboard client connected (ID: %u)\\n", client->id());
      sendSystemStatus();
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("Dashboard client disconnected (ID: %u)\\n", client->id());
      break;
    case WS_EVT_DATA:
      handleWebSocketMessage(arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  
  // Relay control setup
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

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

  error = sensor.startMeasurement(SPS30_OUTPUT_FORMAT_OUTPUT_FORMAT_FLOAT);
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

  // Attach WebSocket handlers
  ws.onEvent(onEvent);
  server.addHandler(&ws);
  
  // Startup web server
  server.begin();
  Serial.println("[OK] Server listening on HTTP port 80.");
}

void loop() {
  ws.cleanupClients();
  
  // Sensor readout interval (Every 2 seconds)
  static unsigned long lastReading = 0;
  if (millis() - lastReading > 2000) {
    lastReading = millis();
    sendSystemStatus();
    
    // Automating air purification mist loops
    if (!isManualMode) {
      // Auto Start Trigger
      if ((latestPM25 > thresholdPM25 || massPM1 > thresholdPM1) && !isRelayActive) {
        isRelayActive = true;
        digitalWrite(RELAY_PIN, HIGH);
        sprayStartTime = millis();
        Serial.printf("Automated spray initiated: PM2.5 (%.1f) or PM1.0 (%.1f) exceeded\\n", latestPM25, massPM1);
        sendSystemStatus();
      }
      
      // Auto Stop Duration check
      if (isRelayActive && (millis() - sprayStartTime > (sprayDurationSec * 1000))) {
        isRelayActive = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Automated spray cycle completed. Standby.");
        sendSystemStatus();
      }
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
        Serial.printf("Direct DB Log SUCCESS: HTTP %d\\n", httpResponseCode);
      } else {
        Serial.printf("Direct DB Log FAILED: Error code %d\\n", httpResponseCode);
      }
      http.end();
    }
  }

  delay(10);
}
`;

// ----------------------------------------------------
// 4. ELEMENT DOM REFERENCES
// ----------------------------------------------------
const selectElements = {
    html: document.querySelector('html'),
    title: document.querySelector('title'),
    brandTitle: document.querySelector('[data-i18n="brand_title"]'),
    brandSubtitle: document.querySelector('[data-i18n="brand_subtitle"]'),
    statusLabel: document.getElementById('status-label'),
    connectionIndicator: document.getElementById('connection-indicator'),
    toggleConfigBtn: document.getElementById('toggle-config-btn'),
    langBtns: document.querySelectorAll('.lang-btn'),
    
    airQualityTitle: document.querySelector('[data-i18n="air_quality_title"]'),
    aqiStatusText: document.getElementById('aqi-status-text'),
    aqiValue: document.getElementById('aqi-value'),
    aqiProgress: document.getElementById('aqi-progress'),
    aqiPulse: document.getElementById('aqi-pulse'),
    
    relayStatus: document.querySelector('[data-i18n="relay_status"]'),
    motorStatusContainer: document.getElementById('motor-status-container'),
    motorFanVisual: document.getElementById('motor-fan-visual'),
    mistParticles: document.getElementById('mist-particles'),
    relayStateLabel: document.getElementById('relay-state-label'),
    
    operationMode: document.querySelector('[data-i18n="operation_mode"]'),
    modeAuto: document.getElementById('mode-auto'),
    modeManual: document.getElementById('mode-manual'),
    manualSprayBtn: document.getElementById('manual-spray-btn'),
    
    sensorReadingsHeader: document.querySelector('[data-i18n="sensor_readings"]'),
    liveBadge: document.querySelector('[data-i18n="live_badge"]'),
    pmMassTitle: document.querySelector('[data-i18n="pm_mass_title"]'),
    pmNumberTitle: document.querySelector('[data-i18n="pm_number_title"]'),
    typicalParticleSize: document.querySelector('[data-i18n="typical_particle_size"]'),
    
    ultrafine: document.querySelector('[data-i18n="ultrafine"]'),
    fine: document.querySelector('[data-i18n="fine"]'),
    environmental: document.querySelector('[data-i18n="environmental"]'),
    coarse: document.querySelector('[data-i18n="coarse"]'),
    
    pm1Mass: document.getElementById('pm1-mass'),
    pm25Mass: document.getElementById('pm25-mass'),
    pm4Mass: document.getElementById('pm4-mass'),
    pm10Mass: document.getElementById('pm10-mass'),
    
    pm05Num: document.getElementById('pm05-num'),
    pm1Num: document.getElementById('pm1-num'),
    pm25Num: document.getElementById('pm25-num'),
    pm4Num: document.getElementById('pm4-num'),
    pm10Num: document.getElementById('pm10-num'),
    typicalSize: document.getElementById('typical-size'),
    
    // AI Diagnostics Elements
    aiClassificationText: document.getElementById('ai-classification-text'),
    aiConfidenceVal: document.getElementById('ai-confidence-val'),
    aiAnomalyVal: document.getElementById('ai-anomaly-val'),
    
    // PM1.0 Threshold Elements
    pm1ThresholdInput: document.getElementById('pm1-threshold'),
    thresholdPm1Val: document.getElementById('threshold-pm1-val'),
    
    systemSettings: document.querySelector('[data-i18n="system_settings"]'),
    labelPm25Threshold: document.querySelector('[data-i18n="label_pm25_threshold"]'),
    pm25ThresholdHint: document.querySelector('[data-i18n="pm25_threshold_hint"]'),
    labelSprayDuration: document.querySelector('[data-i18n="label_spray_duration"]'),
    sprayDurationHint: document.querySelector('[data-i18n="spray_duration_hint"]'),
    
    deviceNetwork: document.querySelector('[data-i18n="device_network"]'),
    esp32IpLabel: document.querySelector('[data-i18n="esp32_ip"]'),
    connectHardwareBtn: document.getElementById('connect-hardware-btn'),
    toggleSimulatorBtn: document.getElementById('toggle-simulator-btn'),
    
    firmwareTitle: document.querySelector('[data-i18n="firmware_title"]'),
    firmwareDesc: document.querySelector('[data-i18n="firmware_desc"]'),
    btnFirmware: document.getElementById('show-firmware-btn'),
    
    analyticsTitle: document.querySelector('[data-i18n="analytics_title"]'),
    sprayLegend: document.querySelector('[data-i18n="spray_legend"]'),
    systemLogs: document.querySelector('[data-i18n="system_logs"]'),
    btnClearLogs: document.getElementById('clear-logs-btn'),
    systemLogsList: document.getElementById('system-logs-list'),
    
    pm25ThresholdInput: document.getElementById('pm25-threshold'),
    thresholdVal: document.getElementById('threshold-val'),
    sprayDurationInput: document.getElementById('spray-duration'),
    durationVal: document.getElementById('duration-val'),
    esp32IpInput: document.getElementById('esp32-ip'),
    
    firmwareDialog: document.getElementById('firmware-dialog'),
    cppCodeBlock: document.getElementById('cpp-code-block'),
    closeDialogBtn: document.getElementById('close-dialog-btn'),
    copyCodeBtn: document.getElementById('copy-code-btn'),
    
    // Authentication Elements
    loginOverlay: document.getElementById('login-overlay'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    loginAsAdmin: document.getElementById('login-as-admin'),
    loginAsEngineer: document.getElementById('login-as-engineer'),
    loginAsOperator: document.getElementById('login-as-operator'),
    userProfileBadge: document.getElementById('user-profile-badge'),
    userDisplayName: document.getElementById('user-display-name'),
    userDisplayRole: document.getElementById('user-display-role'),
    logoutBtn: document.getElementById('logout-btn'),
    settingsLockOverlay: document.getElementById('settings-lock-overlay'),
    settingsLockBadge: document.getElementById('settings-lock-badge'),
    settingsLockBadgeText: document.getElementById('settings-lock-badge-text'),
    
    // Audit Panel Elements
    auditLogPanel: document.getElementById('audit-log-panel'),
    auditLogTbody: document.getElementById('audit-log-tbody'),
    auditChainStatusBadge: document.getElementById('audit-chain-status-badge'),
    auditChainStatusText: document.getElementById('audit-chain-status-text'),
    verifyChainBtn: document.getElementById('verify-chain-btn')
};

// ----------------------------------------------------
// 5. TRANSLATION ENGINE & HELPER
// ----------------------------------------------------
function translateUI(lang) {
    currentLang = lang;
    selectElements.html.setAttribute('lang', lang);
    
    if (lang === 'ar') {
        selectElements.html.setAttribute('dir', 'rtl');
    } else {
        selectElements.html.setAttribute('dir', 'ltr');
    }

    // Loop through elements that have a translation map
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            el.innerText = i18n[lang][key];
        }
    });

    // Update placeholders or dynamic details
    updateThresholdDisplay();
    updateDurationDisplay();
    updateDynamicStatusLabels();
    
    // Update chart text direction configuration if instantiated
    if (airHistoryChart) {
        airHistoryChart.options.plugins.legend.rtl = (lang === 'ar');
        airHistoryChart.options.scales.x.reverse = (lang === 'ar');
        airHistoryChart.update();
    }
}

function updateDynamicStatusLabels() {
    // Connection Label
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        selectElements.statusLabel.innerText = i18n[currentLang].status_connected;
    } else if (webSocket && webSocket.readyState === WebSocket.CONNECTING) {
        selectElements.statusLabel.innerText = i18n[currentLang].status_connecting;
    } else {
        selectElements.statusLabel.innerText = i18n[currentLang].status_simulated;
    }

    // Relay state label
    if (isRelayOpen) {
        selectElements.relayStateLabel.innerText = i18n[currentLang].relay_active;
    } else {
        selectElements.relayStateLabel.innerText = i18n[currentLang].relay_inactive;
    }
}

// ----------------------------------------------------
// 6. EVENT LOGGING SYSTEM
// ----------------------------------------------------
function logEvent(messageKey, values = {}, type = 'info') {
    const time = new Date().toLocaleTimeString();
    let text = i18n[currentLang][messageKey] || messageKey;
    
    // Replace placeholder keys
    Object.keys(values).forEach(key => {
        text = text.replace(`{${key}}`, values[key]);
    });

    const row = document.createElement('div');
    row.className = `log-row ${type}`;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.innerText = time;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-message';
    msgSpan.innerText = text;

    row.appendChild(timeSpan);
    row.appendChild(msgSpan);

    selectElements.systemLogsList.prepend(row);

    // Keep log count under 100
    while (selectElements.systemLogsList.children.length > 100) {
        selectElements.systemLogsList.removeChild(selectElements.systemLogsList.lastChild);
    }
}

// ----------------------------------------------------
// 7. REAL-TIME CHARTING SETUP
// ----------------------------------------------------
function initHistoryChart() {
    const ctx = document.getElementById('air-history-chart').getContext('2d');
    
    // Gradients for line strokes
    const gradientPM1 = ctx.createLinearGradient(0, 0, 0, 200);
    gradientPM1.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    gradientPM1.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

    airHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'PM1.0',
                    data: pm1Data,
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'PM2.5',
                    data: pm25Data,
                    borderColor: '#4f46e5',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'PM10',
                    data: pm10Data,
                    borderColor: '#ff2a5f',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Relay (Spraying)',
                    data: relayStateData,
                    borderColor: 'rgba(255, 42, 95, 0.0)',
                    backgroundColor: 'rgba(255, 42, 95, 0.08)',
                    fill: 'origin',
                    pointRadius: 0,
                    tension: 0,
                    stepped: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false, // Custom legend is built in HTML header
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)',
                    },
                    ticks: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)',
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            family: 'Outfit'
                        }
                    },
                    min: 0,
                    max: 80
                }
            }
        }
    });
}

async function loadHistoricalData() {
    try {
        const response = await fetch(`${API_BASE}/api/readings`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const readings = result.data.slice(-maxDataPoints);
            const fillCount = maxDataPoints - readings.length;
            
            pm1Data.length = 0;
            pm25Data.length = 0;
            pm10Data.length = 0;
            relayStateData.length = 0;
            
            for (let i = 0; i < fillCount; i++) {
                pm1Data.push(0);
                pm25Data.push(0);
                pm10Data.push(0);
                relayStateData.push(0);
            }
            
            readings.forEach(reading => {
                pm1Data.push(Number(reading.pm1));
                pm25Data.push(Number(reading.pm25));
                pm10Data.push(Number(reading.pm10));
                relayStateData.push(reading.relay ? 1 : 0);
            });
            
            updateChart();
            
            logEvent('log_db_history_loaded', { count: readings.length }, 'active');
        }
    } catch (err) {
        console.error('Failed to load historical data from Neon database:', err);
    }
}

function updateChart() {
    if (!airHistoryChart) return;
    airHistoryChart.data.datasets[0].data = pm1Data;
    airHistoryChart.data.datasets[1].data = pm25Data;
    airHistoryChart.data.datasets[2].data = pm10Data;
    airHistoryChart.data.datasets[3].data = relayStateData.map(val => val ? 70 : 0); // Scale up for shading
    airHistoryChart.update('none'); // Update without full layout animation
}

// ----------------------------------------------------
// 8. SENSOR READOUT UPDATE & AQI GRAPHIC CALCULATIONS
// ----------------------------------------------------
function updateSPS30Readouts(data) {
    // Mass values
    selectElements.pm1Mass.innerText = data.pm1.toFixed(1);
    selectElements.pm25Mass.innerText = data.pm25.toFixed(1);
    selectElements.pm4Mass.innerText = data.pm4.toFixed(1);
    selectElements.pm10Mass.innerText = data.pm10.toFixed(1);

    // Number concentrations
    selectElements.pm05Num.innerText = Math.round(data.nc05);
    selectElements.pm1Num.innerText = Math.round(data.nc1);
    selectElements.pm25Num.innerText = Math.round(data.nc25);
    selectElements.pm4Num.innerText = Math.round(data.nc4);
    selectElements.pm10Num.innerText = Math.round(data.nc10);

    // Typical particle size
    selectElements.typicalSize.innerText = data.tps.toFixed(2);

    // Update real-time arrays
    pm1Data.shift(); pm1Data.push(data.pm1);
    pm25Data.shift(); pm25Data.push(data.pm25);
    pm10Data.shift(); pm10Data.push(data.pm10);
    relayStateData.shift(); relayStateData.push(isRelayOpen ? 1 : 0);
    updateChart();

    // 1. Calculate AQI (Simplified PM2.5 mapping for industrial aesthetics)
    // 0-12 Excellent (Green), 12-35 Moderate (Yellow), 35+ Poor (Red)
    const pm25 = data.pm25;
    let aqiNum = Math.round(pm25 * 3); // Dynamic scaling
    if (aqiNum > 200) aqiNum = 200;
    
    selectElements.aqiValue.innerText = aqiNum;

    // Adjust ring dashoffset (0 to 264)
    // 264 is empty, 0 is full ring
    const percent = Math.min(aqiNum / 150, 1);
    const strokeOffset = 264 - (264 * percent);
    selectElements.aqiProgress.style.strokeDashoffset = strokeOffset;

    // Update AQI categories
    let aqiStatus = 'good';
    let aqiTextKey = 'aqi_excellent';

    if (pm25 > pm25Threshold) {
        aqiStatus = 'poor';
        aqiTextKey = 'aqi_poor';
    } else if (pm25 > (pm25Threshold * 0.5)) {
        aqiStatus = 'moderate';
        aqiTextKey = 'aqi_moderate';
    }

    // Set AQI colors
    selectElements.aqiStatusText.className = `aqi-label ${aqiStatus}`;
    selectElements.aqiStatusText.innerText = i18n[currentLang][aqiTextKey];
    selectElements.aqiPulse.className = `pulse-indicator ${aqiStatus}`;

    // Dynamic AQI Ring color gradient definition
    const gradients = {
        good: ['#00ff87', '#60efff'],
        moderate: ['#ffb300', '#ff2a5f'],
        poor: ['#ff2a5f', '#7e22ce']
    };

    const gradient = document.getElementById('aqiGradient');
    if (gradient) {
        gradient.children[0].setAttribute('stop-color', gradients[aqiStatus][0]);
        gradient.children[1].setAttribute('stop-color', gradients[aqiStatus][1]);
    }

    // 2. Throttle database logging to Neon (every 6 seconds / 6000ms)
    const now = Date.now();
    if (now - lastDbLogTime >= DB_LOG_INTERVAL) {
        lastDbLogTime = now;
        
        const dbPayload = {
            pm1: data.pm1,
            pm25: data.pm25,
            pm4: data.pm4,
            pm10: data.pm10,
            nc05: data.nc05,
            nc1: data.nc1,
            nc25: data.nc25,
            nc4: data.nc4,
            nc10: data.nc10,
            tps: data.tps,
            relay: isRelayOpen,
            mode: isManualMode ? 'manual' : 'auto',
            source: isSimulatorActive ? 'simulator' : 'esp32'
        };

        fetch(`${API_BASE}/api/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dbPayload)
        })
        .then(response => {
            if (!response.ok) {
                console.warn('Failed to post throttled reading to Neon:', response.statusText);
                return null;
            }
            return response.json();
        })
        .then(result => {
            if (result && result.success && result.data) {
                const ai = result.data;
                // Inject AI analytics from server RETURNING clause into dashboard
                if (ai.ai_classification && selectElements.aiClassificationText) {
                    selectElements.aiClassificationText.innerText = ai.ai_classification;
                    // Color-code classification
                    const classColors = {
                        'Excellent': '#00ff87', 'Good': '#60efff', 'Moderate': '#ffb300',
                        'Poor': '#ff6b35', 'Hazardous': '#ff2a5f', 'Severe': '#7e22ce'
                    };
                    selectElements.aiClassificationText.style.color = classColors[ai.ai_classification] || '#00e5ff';
                }
                if (ai.ai_confidence !== undefined && ai.ai_confidence !== null && selectElements.aiConfidenceVal) {
                    selectElements.aiConfidenceVal.innerText = parseFloat(ai.ai_confidence).toFixed(1);
                }
                if (ai.ai_anomaly_score !== undefined && ai.ai_anomaly_score !== null && selectElements.aiAnomalyVal) {
                    const anomaly = parseFloat(ai.ai_anomaly_score).toFixed(2);
                    selectElements.aiAnomalyVal.innerText = anomaly;
                    // Dynamic anomaly color: green < 0.3, yellow < 0.6, red >= 0.6
                    if (anomaly < 0.3) selectElements.aiAnomalyVal.style.color = '#00ff87';
                    else if (anomaly < 0.6) selectElements.aiAnomalyVal.style.color = '#ffb300';
                    else selectElements.aiAnomalyVal.style.color = '#ff3d00';
                }
            }
        })
        .catch(err => {
            console.error('Error posting to Neon database:', err);
        });
    }
}

// ----------------------------------------------------
// 9. RELAY & MOTOR SWITCH OPERATIONS
// ----------------------------------------------------
function setRelayState(active) {
    if (isRelayOpen === active) return;
    isRelayOpen = active;

    if (active) {
        selectElements.motorStatusContainer.classList.add('active');
        logEvent('log_manual_start', {}, 'active');
    } else {
        selectElements.motorStatusContainer.classList.remove('active');
        logEvent('log_manual_stop', {}, 'inactive');
    }

    updateDynamicStatusLabels();

    // Send payload if real websocket connection is active
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({
            command: active ? "spray_on" : "spray_off"
        });
        webSocket.send(payload);
    }
}

function triggerAutomatedSpray() {
    if (isRelayOpen) return; // Already spraying
    
    isRelayOpen = true;
    selectElements.motorStatusContainer.classList.add('active');
    updateDynamicStatusLabels();
    logEvent('log_auto_trigger', { val: pm25Threshold }, 'trigger');

    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ command: "spray_on" }));
    }

    // Timer fallback or automatic timer
    if (sprayTimeout) clearTimeout(sprayTimeout);
    sprayTimeout = setTimeout(() => {
        isRelayOpen = false;
        selectElements.motorStatusContainer.classList.remove('active');
        updateDynamicStatusLabels();
        logEvent('log_auto_stop', {}, 'inactive');

        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify({ command: "spray_off" }));
        }
    }, sprayDuration * 1000);
}

// ----------------------------------------------------
// 10. SIMULATED SENSOR GENERATION LOOP
// ----------------------------------------------------
let basePM25 = 18.0;

function runSensorSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);
    
    simulationInterval = setInterval(() => {
        if (!isSimulatorActive) return;

        // Fluctuations
        let noise = (Math.random() - 0.45) * 2.5; // Drift upwards slightly
        
        // If spray is active, PM2.5 and coarse levels drop drastically!
        if (isRelayOpen) {
            basePM25 -= 3.8; // Fast purification
            if (basePM25 < 4.0) basePM25 = 4.0;
        } else {
            basePM25 += noise + 0.15; // Slow accumulation of dust
            if (basePM25 > 65.0) basePM25 = 65.0;
            if (basePM25 < 4.0) basePM25 = 4.0;
        }

        const pm25 = basePM25;
        const pm1 = pm25 * 0.42;
        const pm4 = pm25 * 1.25;
        const pm10 = pm25 * 1.75;

        const nc05 = pm1 * 26;
        const nc1 = pm1 * 44;
        const nc25 = pm25 * 3.8;
        const nc4 = pm4 * 0.8;
        const nc10 = pm10 * 0.18;

        const tps = 0.38 + (pm25 * 0.003);

        const readoutData = {
            pm1, pm25, pm4, pm10,
            nc05, nc1, nc25, nc4, nc10,
            tps
        };

        updateSPS30Readouts(readoutData);

        // Auto trigger validation (PM2.5 OR PM1.0 safety threshold)
        if (!isManualMode && !isRelayOpen) {
            if (pm25 > pm25Threshold || pm1 > pm1Threshold) {
                triggerAutomatedSpray();
            }
        }
    }, 2000);
}

// ----------------------------------------------------
// 11. WEBSOCKET DRIVER FOR REAL ESP32 HARDWARE
// ----------------------------------------------------
function connectToESP32() {
    if (webSocket) {
        webSocket.close();
    }

    selectElements.connectionIndicator.className = 'status-indicator connecting';
    updateDynamicStatusLabels();
    logEvent('log_connect_attempt', {}, 'info');

    const wsUrl = `ws://${espAddress}/ws`;
    
    try {
        webSocket = new WebSocket(wsUrl);
        
        webSocket.onopen = function() {
            isSimulatorActive = false;
            selectElements.connectionIndicator.className = 'status-indicator connected';
            updateDynamicStatusLabels();
            logEvent('log_connect_success', {}, 'inactive');
            
            // Sync current configurations to hardware
            webSocket.send(JSON.stringify({
                threshold: pm25Threshold,
                threshold_pm1: pm1Threshold,
                duration: sprayDuration,
                command: isManualMode ? "set_mode_manual" : "set_mode_auto",
                token: currentToken || ''
            }));
        };

        webSocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                
                // Parse standard sensor stream
                // {"pm1": 5.4, "pm25": 12.8, ... "relay": 0, "mode": "auto"}
                if (data.hasOwnProperty('pm25')) {
                    isRelayOpen = (data.relay === 1);
                    if (isRelayOpen) {
                        selectElements.motorStatusContainer.classList.add('active');
                    } else {
                        selectElements.motorStatusContainer.classList.remove('active');
                    }
                    updateDynamicStatusLabels();
                    updateSPS30Readouts(data);
                }
            } catch (err) {
                console.error("Error parsing ESP32 WebSocket payload", err);
            }
        };

        webSocket.onclose = function() {
            selectElements.connectionIndicator.className = 'status-indicator disconnected';
            updateDynamicStatusLabels();
            logEvent('log_ws_closed', {}, 'info');
            
            // Fallback to simulation
            isSimulatorActive = true;
            runSensorSimulation();
        };

        webSocket.onerror = function(error) {
            console.error("WebSocket Error", error);
            selectElements.connectionIndicator.className = 'status-indicator disconnected';
            updateDynamicStatusLabels();
            logEvent('log_connect_fail', {}, 'trigger');
            
            // Fallback to simulation
            isSimulatorActive = true;
            runSensorSimulation();
        };
    } catch (e) {
        console.error("Connection exception", e);
        selectElements.connectionIndicator.className = 'status-indicator disconnected';
        logEvent('log_connect_fail', {}, 'trigger');
    }
}

// ----------------------------------------------------
// 12. EVENT BINDINGS & COMPONENT INITIALIZATION
// ----------------------------------------------------
function updateThresholdDisplay() {
    selectElements.thresholdVal.innerText = pm25Threshold;
}

function updatePm1ThresholdDisplay() {
    if (selectElements.thresholdPm1Val) {
        selectElements.thresholdPm1Val.innerText = pm1Threshold;
    }
}

function updateDurationDisplay() {
    selectElements.durationVal.innerText = sprayDuration;
}

function setupEventListeners() {
    // 1. Language toggling
    selectElements.langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectElements.langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            translateUI(btn.getAttribute('data-lang'));
        });
    });

    // 2. Operation Mode Toggles (Auto vs Manual)
    selectElements.modeAuto.addEventListener('click', () => {
        isManualMode = false;
        selectElements.modeAuto.classList.add('active');
        selectElements.modeManual.classList.remove('active');
        selectElements.manualSprayBtn.classList.add('disabled');
        
        // Open relay if switching back to auto to clear manual holds
        setRelayState(false);

        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify({ command: "set_mode_auto" }));
        }
    });

    selectElements.modeManual.addEventListener('click', () => {
        isManualMode = true;
        selectElements.modeAuto.classList.remove('active');
        selectElements.modeManual.classList.add('active');
        selectElements.manualSprayBtn.classList.remove('disabled');

        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify({ command: "set_mode_manual" }));
        }
    });

    // 3. Manual Spray toggle button
    selectElements.manualSprayBtn.addEventListener('click', () => {
        if (!isManualMode) return;
        const newRelay = !isRelayOpen;
        setRelayState(newRelay);
        
        // Update manual button text dynamically
        if (newRelay) {
            selectElements.manualSprayBtn.innerText = i18n[currentLang].btn_manual_spray_off;
            selectElements.manualSprayBtn.style.background = 'linear-gradient(135deg, var(--color-danger) 0%, #b91c1c 100%)';
            selectElements.manualSprayBtn.style.boxShadow = '0 4px 15px rgba(255, 42, 95, 0.25)';
        } else {
            selectElements.manualSprayBtn.innerText = i18n[currentLang].btn_manual_spray_on;
            selectElements.manualSprayBtn.style.background = 'linear-gradient(135deg, var(--color-primary) 0%, #0083ff 100%)';
            selectElements.manualSprayBtn.style.boxShadow = '0 4px 15px rgba(var(--color-primary-rgb), 0.25)';
        }
    });

    // 4. Slide thresholds
    selectElements.pm25ThresholdInput.addEventListener('input', (e) => {
        pm25Threshold = parseFloat(e.target.value);
        updateThresholdDisplay();
        logEvent('log_param_update', { t: pm25Threshold, d: sprayDuration });

        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify({ threshold: pm25Threshold }));
        }
    });

    // 4b. PM1.0 Safety Threshold slider
    if (selectElements.pm1ThresholdInput) {
        selectElements.pm1ThresholdInput.addEventListener('input', (e) => {
            pm1Threshold = parseFloat(e.target.value);
            updatePm1ThresholdDisplay();
            logEvent('log_param_update', { pm1_threshold: pm1Threshold });

            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(JSON.stringify({ threshold_pm1: pm1Threshold }));
            }
        });
    }

    selectElements.sprayDurationInput.addEventListener('input', (e) => {
        sprayDuration = parseInt(e.target.value);
        updateDurationDisplay();
        logEvent('log_param_update', { t: pm25Threshold, d: sprayDuration });

        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify({ duration: sprayDuration }));
        }
    });

    // 5. Connect and Simulator Toggles
    selectElements.connectHardwareBtn.addEventListener('click', () => {
        espAddress = selectElements.esp32IpInput.value.trim() || '192.168.1.100';
        connectToESP32();
    });

    selectElements.toggleSimulatorBtn.addEventListener('click', () => {
        isSimulatorActive = !isSimulatorActive;
        if (isSimulatorActive) {
            selectElements.toggleSimulatorBtn.innerText = i18n[currentLang].btn_toggle_sim_off;
            selectElements.toggleSimulatorBtn.classList.remove('secondary-btn');
            selectElements.toggleSimulatorBtn.style.background = 'rgba(0, 255, 135, 0.1)';
            selectElements.toggleSimulatorBtn.style.color = 'var(--color-success)';
            logEvent('log_sim_on', {}, 'inactive');
            runSensorSimulation();
        } else {
            selectElements.toggleSimulatorBtn.innerText = i18n[currentLang].btn_toggle_sim;
            selectElements.toggleSimulatorBtn.className = 'action-btn secondary-btn';
            selectElements.toggleSimulatorBtn.style.background = 'rgba(255, 255, 255, 0.03)';
            selectElements.toggleSimulatorBtn.style.color = 'var(--text-main)';
            logEvent('log_sim_off', {}, 'info');
            if (simulationInterval) clearInterval(simulationInterval);
        }
    });

    // 6. Clear Logs
    selectElements.btnClearLogs.addEventListener('click', () => {
        selectElements.systemLogsList.innerHTML = '';
    });

    // 7. Dialog overlays
    selectElements.btnFirmware.addEventListener('click', () => {
        selectElements.cppCodeBlock.innerText = arduinoCode;
        selectElements.firmwareDialog.showModal();
    });

    selectElements.closeDialogBtn.addEventListener('click', () => {
        selectElements.firmwareDialog.close();
    });

    // Hide overlay when clicking on background backdrop
    selectElements.firmwareDialog.addEventListener('click', (e) => {
        const rect = selectElements.firmwareDialog.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            selectElements.firmwareDialog.close();
        }
    });

    // 8. Copy code block
    selectElements.copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(arduinoCode).then(() => {
            selectElements.copyCodeBtn.innerText = i18n[currentLang].btn_copied;
            setTimeout(() => {
                selectElements.copyCodeBtn.innerText = i18n[currentLang].btn_copy_code;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy firmware content', err);
        });
    });
}

// ----------------------------------------------------
// 13. BOOTSTRAP INITIALIZATION
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    translateUI('en');
    initHistoryChart();
    loadHistoricalData();
    setupEventListeners();
    setupAuthListeners();
    logEvent('log_init');
    
    // Style Simulator button initially
    selectElements.toggleSimulatorBtn.innerText = i18n[currentLang].btn_toggle_sim_off;
    selectElements.toggleSimulatorBtn.classList.remove('secondary-btn');
    selectElements.toggleSimulatorBtn.style.background = 'rgba(0, 255, 135, 0.1)';
    selectElements.toggleSimulatorBtn.style.color = 'var(--color-success)';

    runSensorSimulation();
    checkAuth();
});

// ----------------------------------------------------
// 14. AUTHENTICATION SYSTEM
// ----------------------------------------------------
function decodeJwt(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
        return null;
    }
}

function isTokenExpired(token) {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
}

function checkAuth() {
    const savedToken = localStorage.getItem('aero_token');
    const savedUser = localStorage.getItem('aero_user');
    if (savedToken && !isTokenExpired(savedToken) && savedUser) {
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        localStorage.removeItem('aero_token');
        localStorage.removeItem('aero_user');
        currentToken = null;
        currentUser = null;
        showLoginOverlay();
    }
}

function showLoginOverlay() {
    if (selectElements.loginOverlay) selectElements.loginOverlay.classList.remove('hidden');
    if (selectElements.userProfileBadge) selectElements.userProfileBadge.classList.add('hidden');
}

function showDashboard() {
    if (selectElements.loginOverlay) selectElements.loginOverlay.classList.add('hidden');
    applyRolePermissions();
}

function applyRolePermissions() {
    if (!currentUser) return;
    const role = currentUser.role;

    // Update profile badge
    if (selectElements.userProfileBadge) {
        selectElements.userProfileBadge.classList.remove('hidden');
    }
    if (selectElements.userDisplayName) {
        selectElements.userDisplayName.textContent = currentUser.username;
    }
    if (selectElements.userDisplayRole) {
        selectElements.userDisplayRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        selectElements.userDisplayRole.className = 'role-dot ' + role;
    }

    // Settings access: admin and engineer can edit, operator is locked
    const canEditSettings = (role === 'admin' || role === 'engineer');
    if (selectElements.settingsLockOverlay) {
        if (canEditSettings) {
            selectElements.settingsLockOverlay.classList.add('hidden');
        } else {
            selectElements.settingsLockOverlay.classList.remove('hidden');
        }
    }
    if (selectElements.settingsLockBadge) {
        selectElements.settingsLockBadge.className = canEditSettings ? 'config-badge unlocked' : 'config-badge locked';
    }
    if (selectElements.settingsLockBadgeText) {
        selectElements.settingsLockBadgeText.textContent = canEditSettings ? i18n[currentLang].badge_unlocked : i18n[currentLang].badge_locked;
    }

    // Disable sliders for operators
    if (selectElements.pm25ThresholdInput) selectElements.pm25ThresholdInput.disabled = !canEditSettings;
    if (selectElements.pm1ThresholdInput) selectElements.pm1ThresholdInput.disabled = !canEditSettings;
    if (selectElements.sprayDurationInput) selectElements.sprayDurationInput.disabled = !canEditSettings;

    // Audit log panel: admin only
    if (selectElements.auditLogPanel) {
        selectElements.auditLogPanel.style.display = (role === 'admin') ? '' : 'none';
    }
}

async function roleLogin(role) {
    const creds = ROLE_CREDENTIALS[role];
    if (!creds) return;

    // Show loading state on button
    const btnId = 'login-as-' + role;
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.style.opacity = '0.6';
        btn.style.pointerEvents = 'none';
    }

    // Hide previous errors
    if (selectElements.loginError) selectElements.loginError.classList.add('hidden');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: creds.username, password: creds.password }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();
            currentToken = data.token;
            currentUser = data.user || decodeJwt(data.token);
            localStorage.setItem('aero_token', currentToken);
            localStorage.setItem('aero_user', JSON.stringify(currentUser));
            showDashboard();
            return;
        }
    } catch (e) {
        console.warn('Server login failed, trying local ESP32 fallback...', e.message);
    }

    // Fallback: try ESP32 local login
    try {
        const localRes = await fetch(`http://${espAddress}/api/local-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: creds.username, password: creds.password })
        });
        if (localRes.ok) {
            const data = await localRes.json();
            currentToken = data.token;
            currentUser = decodeJwt(data.token) || { username: creds.username, role: role };
            localStorage.setItem('aero_token', currentToken);
            localStorage.setItem('aero_user', JSON.stringify(currentUser));
            showDashboard();
            return;
        }
    } catch (e2) {
        console.warn('ESP32 local login also failed', e2.message);
    }

    // Both failed: just sign in locally with role data (offline mode)
    currentUser = { username: creds.username, role: role };
    currentToken = 'offline_' + role + '_' + Date.now();
    localStorage.setItem('aero_token', currentToken);
    localStorage.setItem('aero_user', JSON.stringify(currentUser));
    showDashboard();

    if (btn) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
}

function logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('aero_token');
    localStorage.removeItem('aero_user');
    showLoginOverlay();
}

function setupAuthListeners() {
    // Role buttons
    if (selectElements.loginAsAdmin) {
        selectElements.loginAsAdmin.addEventListener('click', () => roleLogin('admin'));
    }
    if (selectElements.loginAsEngineer) {
        selectElements.loginAsEngineer.addEventListener('click', () => roleLogin('engineer'));
    }
    if (selectElements.loginAsOperator) {
        selectElements.loginAsOperator.addEventListener('click', () => roleLogin('operator'));
    }

    // Logout
    if (selectElements.logoutBtn) {
        selectElements.logoutBtn.addEventListener('click', logout);
    }

    // Verify chain button (admin only)
    if (selectElements.verifyChainBtn) {
        selectElements.verifyChainBtn.addEventListener('click', async () => {
            if (!currentToken) return;
            try {
                const res = await fetch(`${API_BASE}/api/auth/audit-logs`, {
                    headers: { 'Authorization': 'Bearer ' + currentToken }
                });
                if (res.ok) {
                    const logs = await res.json();
                    renderAuditLogs(logs);
                }
            } catch (e) {
                console.error('Failed to fetch audit logs', e);
            }
        });
    }
}

function renderAuditLogs(logs) {
    if (!selectElements.auditLogTbody) return;
    selectElements.auditLogTbody.innerHTML = '';
    if (!logs || logs.length === 0) {
        selectElements.auditLogTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;opacity:0.5">${i18n[currentLang].audit_empty}</td></tr>`;
        return;
    }
    let chainValid = true;
    logs.forEach((log, i) => {
        const row = document.createElement('tr');
        const sigOk = log.hash_valid !== false;
        if (!sigOk) chainValid = false;
        row.innerHTML = `
            <td>${log.seq || i + 1}</td>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.username} (${log.role})</td>
            <td>${log.action}</td>
            <td>${log.details || '-'}</td>
            <td style="font-family:monospace;font-size:0.7rem;word-break:break-all">${(log.hash || '').substring(0, 16)}...</td>
            <td><span class="audit-sig ${sigOk ? 'verified' : 'failed'}">${sigOk ? i18n[currentLang].audit_sig_verified : i18n[currentLang].audit_sig_failed}</span></td>
        `;
        selectElements.auditLogTbody.appendChild(row);
    });
    if (selectElements.auditChainStatusBadge) {
        selectElements.auditChainStatusBadge.className = chainValid ? 'config-badge unlocked' : 'config-badge locked';
    }
    if (selectElements.auditChainStatusText) {
        selectElements.auditChainStatusText.textContent = chainValid ? i18n[currentLang].audit_chain_valid : i18n[currentLang].audit_chain_invalid;
    }
}
