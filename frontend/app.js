const API_BASE = "http://localhost:8000";
const jsonInput = document.getElementById("jsonInput");
const resultBox = document.getElementById("resultBox");
const sendBtn = document.getElementById("sendBtn");
const sampleBtn = document.getElementById("sampleBtn");
const healthBtn = document.getElementById("healthBtn");

const sampleRow = {
  "Dst Port": 80,
  "Flow Duration": 1000,
  "Tot Fwd Pkts": 10,
  "Tot Bwd Pkts": 5,
  "TotLen Fwd Pkts": 800,
  "TotLen Bwd Pkts": 400,
  "Fwd Pkt Len Max": 150,
  "Fwd Pkt Len Min": 50,
  "Fwd Pkt Len Mean": 80,
  "Bwd Pkt Len Max": 120,
  "Bwd Pkt Len Min": 40,
  "Bwd Pkt Len Mean": 70,
  "Flow Byts/s": 5000,
  "Flow Pkts/s": 15,
  "Flow IAT Mean": 100,
  "Flow IAT Std": 20,
  "Flow IAT Max": 250,
  "Bwd IAT Tot": 500,
  "Bwd IAT Mean": 100,
  "Bwd IAT Std": 30,
  "Bwd IAT Min": 20,
  "Fwd PSH Flags": 0,
  "Bwd PSH Flags": 0,
  "Fwd URG Flags": 0,
  "Bwd URG Flags": 0,
  "Pkt Len Var": 2000,
  "FIN Flag Cnt": 1,
  "RST Flag Cnt": 0,
  "PSH Flag Cnt": 0,
  "ACK Flag Cnt": 1,
  "URG Flag Cnt": 0,
  "CWE Flag Count": 0,
  "Down/Up Ratio": 1,
  "Fwd Byts/b Avg": 120,
  "Fwd Pkts/b Avg": 2,
  "Fwd Blk Rate Avg": 0,
  "Bwd Byts/b Avg": 90,
  "Bwd Pkts/b Avg": 1,
  "Bwd Blk Rate Avg": 0,
  "Init Fwd Win Byts": 8192,
  "Init Bwd Win Byts": 8192,
  "Fwd Act Data Pkts": 3,
  "Fwd Seg Size Min": 20,
  "Active Mean": 0,
  "Active Std": 0,
  "Active Max": 0,
  "Idle Min": 0
};

function setResult(value) {
  resultBox.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function loadSample() {
  jsonInput.value = JSON.stringify({ row: sampleRow }, null, 2);
  setResult("Sample row loaded. Click Predict to send it.");
}

async function postPredict() {
  const raw = jsonInput.value.trim();

  if (!raw) {
    setResult("Please provide a row JSON before submitting.");
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    setResult("Invalid JSON. Please enter valid object syntax.");
    return;
  }

  if (!payload.row || typeof payload.row !== "object") {
    setResult("Payload must look like: { \"row\": { ...feature fields... } }");
    return;
  }

  setResult("Sending request...");

  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2));
    }

    setResult(data);
  } catch (error) {
    setResult(`Request failed: ${error.message}`);
  }
}

async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    setResult(JSON.stringify(data, null, 2));
  } catch (error) {
    setResult(`Unable to connect to API: ${error.message}`);
  }
}

sampleBtn.addEventListener("click", loadSample);
sendBtn.addEventListener("click", postPredict);
healthBtn.addEventListener("click", checkHealth);

loadSample();
