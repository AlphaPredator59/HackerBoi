import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  DatabaseZap,
  Play,
  Radio,
  RotateCcw,
  Send,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { useState } from "react";
import { Scene } from "./Scene";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

const knownAttackRow: Record<string, number> = {
  "Dst Port": 80,
  "Flow Duration": 601248,
  "Tot Fwd Pkts": 3,
  "Tot Bwd Pkts": 6,
  "TotLen Fwd Pkts": 26,
  "TotLen Bwd Pkts": 11601,
  "Fwd Pkt Len Max": 20,
  "Fwd Pkt Len Min": 0,
  "Fwd Pkt Len Mean": 8.666666667,
  "Bwd Pkt Len Max": 5840,
  "Bwd Pkt Len Min": 0,
  "Bwd Pkt Len Mean": 1933.5,
  "Flow Byts/s": 19338.11006,
  "Flow Pkts/s": 14.96886476,
  "Flow IAT Mean": 75156,
  "Flow IAT Std": 210467.3523,
  "Flow IAT Max": 596023,
  "Bwd IAT Tot": 601182,
  "Bwd IAT Mean": 120236.4,
  "Bwd IAT Std": 265979.4986,
  "Bwd IAT Min": 160,
  "Fwd PSH Flags": 0,
  "Bwd PSH Flags": 0,
  "Fwd URG Flags": 0,
  "Bwd URG Flags": 0,
  "Pkt Len Var": 3681776.011,
  "FIN Flag Cnt": 0,
  "RST Flag Cnt": 0,
  "PSH Flag Cnt": 1,
  "ACK Flag Cnt": 0,
  "URG Flag Cnt": 0,
  "CWE Flag Count": 0,
  "Down/Up Ratio": 2,
  "Fwd Byts/b Avg": 0,
  "Fwd Pkts/b Avg": 0,
  "Fwd Blk Rate Avg": 0,
  "Bwd Byts/b Avg": 0,
  "Bwd Pkts/b Avg": 0,
  "Bwd Blk Rate Avg": 0,
  "Init Fwd Win Byts": 8192,
  "Init Bwd Win Byts": 229,
  "Fwd Act Data Pkts": 2,
  "Fwd Seg Size Min": 20,
  "Active Mean": 0,
  "Active Std": 0,
  "Active Max": 0,
  "Idle Min": 0,
};

type TopContributor = {
  feature?: string;
  sq_error?: number;
};

type ModelResult = {
  is_anomaly?: boolean;
  score?: number;
  threshold?: number;
  attack_type?: string | null;
  attack_confidence?: number | null;
  top_contributors?: TopContributor[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatNumber(value: unknown, digits = 3) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "--";
}

function getModelResult(value: unknown): ModelResult | null {
  if (!isRecord(value)) return null;
  const nested = value.model_output;
  return isRecord(nested) ? (nested as ModelResult) : (value as ModelResult);
}

function confidencePercent(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [screen, setScreen] = useState<"landing" | "detection">("landing");
  const [jsonInput, setJsonInput] = useState(() => JSON.stringify({ row: knownAttackRow }, null, 2));
  const [response, setResponse] = useState<unknown>("Known DDoS attack sample loaded from the local test split.");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const modelResult = getModelResult(response);
  const rawResponse = typeof response === "string" ? response : JSON.stringify(response, null, 2);
  const score = modelResult?.score ?? null;
  const threshold = modelResult?.threshold ?? null;
  const scoreRatio =
    typeof score === "number" && typeof threshold === "number" && threshold > 0
      ? Math.min((score / threshold) * 100, 160)
      : 0;
  const isBusy = status === "loading";

  function loadSample() {
    setJsonInput(JSON.stringify({ row: knownAttackRow }, null, 2));
    setResponse("Known DDoS attack sample loaded from the local test split.");
    setStatus("idle");
  }

  async function requestJson(path: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${path}`, options);
    const text = await res.text();
    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      throw new Error(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    }

    return data;
  }

  async function postPredict() {
    const raw = jsonInput.trim();
    if (!raw) {
      setResponse("Please provide a row payload.");
      setStatus("error");
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      setResponse("Invalid JSON.");
      setStatus("error");
      return;
    }

    if (!isRecord(payload) || !isRecord(payload.row)) {
      setResponse('Payload must include a "row" object.');
      setStatus("error");
      return;
    }

    setStatus("loading");
    setResponse("Sending request...");

    try {
      const data = await requestJson("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResponse(data);
      setStatus("ok");
    } catch (error) {
      setResponse(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
      setStatus("error");
    }
  }

  async function checkHealth() {
    setStatus("loading");
    try {
      const data = await requestJson("/health");
      setResponse(data);
      setStatus("ok");
    } catch (error) {
      setResponse(`Unable to connect to API: ${error instanceof Error ? error.message : String(error)}`);
      setStatus("error");
    }
  }

  async function randomAnalyze() {
    setStatus("loading");
    try {
      const data = await requestJson("/random-analyze");
      setResponse(data);
      setStatus("ok");
    } catch (error) {
      setResponse(`Random analyze failed: ${error instanceof Error ? error.message : String(error)}`);
      setStatus("error");
    }
  }

  return (
    <>
      <Scene />
      {screen === "landing" ? (
        <main className="landing-shell">
          <section className="landing-hero">
            <p className="eyebrow">Network Threat Detection</p>
            <h1>Cypher IDS</h1>
            <p className="landing-copy">
              Real-time anomaly scoring and attack classification for suspicious flow telemetry.
            </p>
            <button className="launch-btn" type="button" onClick={() => setScreen("detection")}>
              Start Detection
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </section>
        </main>
      ) : (
        <main className="app-shell">
          <header className="topbar">
            <div>
              <p className="eyebrow">Network Threat Detection</p>
              <h1>Cypher IDS</h1>
            </div>
            <div className="topbar-actions">
              <button className="secondary-btn compact-btn" type="button" onClick={() => setScreen("landing")}>
                <ArrowLeft size={17} aria-hidden="true" />
                Home
              </button>
              <div className={`connection ${status}`}>
                <Radio size={16} aria-hidden="true" />
                <span>
                  {status === "loading" ? "Polling" : status === "ok" ? "Linked" : status === "error" ? "Offline" : "Standby"}
                </span>
              </div>
            </div>
          </header>

          <section className="layout">
            <form className="panel input-panel" onSubmit={(event) => event.preventDefault()}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">Known Attack Payload</p>
                  <h2>Inspection Queue</h2>
                </div>
                <button className="icon-btn" type="button" title="Load DDoS sample" onClick={loadSample}>
                  <RotateCcw size={18} aria-hidden="true" />
                </button>
              </div>

              <textarea
                aria-label="Flow JSON payload"
                spellCheck={false}
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
              />

              <div className="actions">
                <button className="secondary-btn" type="button" onClick={checkHealth} disabled={isBusy}>
                  <Radio size={18} aria-hidden="true" />
                  Check API
                </button>
                <button className="secondary-btn" type="button" onClick={randomAnalyze} disabled={isBusy}>
                  <DatabaseZap size={18} aria-hidden="true" />
                  Random
                </button>
                <button className="primary-btn" type="button" onClick={postPredict} disabled={isBusy}>
                  <Send size={18} aria-hidden="true" />
                  Predict
                </button>
              </div>
            </form>

            <section className="panel result-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">Threat Readout</p>
                  <h2>Detection Result</h2>
                </div>
              </div>

              <div className="score-track" aria-label="Score compared with threshold">
                <span style={{ width: `${scoreRatio}%` }} />
              </div>

              <div className="metric-grid">
                <article className="metric-tile">
                  <ShieldCheck size={22} aria-hidden="true" />
                  <span>Anomaly</span>
                  <strong>{modelResult?.is_anomaly === undefined ? "--" : modelResult.is_anomaly ? "Detected" : "Clear"}</strong>
                </article>
                <article className="metric-tile">
                  <Activity size={22} aria-hidden="true" />
                  <span>Score</span>
                  <strong>{formatNumber(modelResult?.score)}</strong>
                </article>
                <article className="metric-tile">
                  <Siren size={22} aria-hidden="true" />
                  <span>Attack</span>
                  <strong>{modelResult?.attack_type ?? "--"}</strong>
                </article>
                <article className="metric-tile">
                  <Play size={22} aria-hidden="true" />
                  <span>Confidence</span>
                  <strong>{confidencePercent(modelResult?.attack_confidence)}</strong>
                </article>
              </div>

              <div className="contributors" aria-label="Top contributors">
                {(modelResult?.top_contributors ?? []).slice(0, 5).map((item, index) => (
                  <div className="contributor" key={`${item.feature ?? "feature"}-${index}`}>
                    <span>{item.feature ?? "Unknown feature"}</span>
                    <strong>{formatNumber(item.sq_error)}</strong>
                  </div>
                ))}
              </div>

              <details className="response-dropdown">
                <summary>
                  <span>Model Response</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <pre>{rawResponse}</pre>
              </details>
            </section>
          </section>
        </main>
      )}
    </>
  );
}
