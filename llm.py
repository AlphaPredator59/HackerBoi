import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import json

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

LLM = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.2, api_key=api_key)
SYSTEM_PROMPT = """You are a cybersecurity SOC analyst assistant. You will receive JSON with keys: "llm_payload" 
    and "model_output". Use "llm_payload" as the primary source.
    Use "model_output" only if it adds helpful detail. Do not invent information. describing one
    network flow analyzed by an anomaly detector (VAE) and, if anomalous, an attack classifier (MoE).
    Your job:
    1) Explain clearly what is suspicious and why, using only the fields provided.
    2) If is_anomaly=false, explain why it looks normal and suggest minimal monitoring steps.
    3) If is_anomaly=true, interpret attack_type and top_contributors to describe likely behavior.
    4) Provide practical countermeasures and next investigative steps.
    Rules:
    - Output MUST be valid JSON only (no markdown, no extra text).
    - Do NOT invent IPs, ports, protocols, or events not present.
    - If confidence is low or data is incomplete, say so explicitly.
    - Keep it concise and dashboard-friendly.
    """

USER_TEMPLATE = """Analyze this alert payload and produce the required JSON response.

ALERT_PAYLOAD:
{payload}

Return JSON with this exact schema:
{schema}
"""

SCHEMA = {
    "severity": "low|medium|high|critical",
    "summary": "string",
    "what_is_wrong": ["string"],
    "evidence": [{"feature": "string", "signal": "high_recon_error", "note": "string"}],
    "attack_assessment": {"predicted_type": "string", "confidence": 0.0, "interpretation": "string"},
    "recommended_actions": {"immediate": ["string"], "short_term": ["string"], "long_term": ["string"]},
    "questions_to_ask": ["string"],
    "limitations": ["string"]
}


def _extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        s = text.find("{")
        e = text.rfind("}")
        if s != -1 and e != -1 and e > s:
            return json.loads(text[s:e + 1])
        raise


def summarize_alert(llm_payload: dict, model_output: dict) -> dict:
    context = {"llm_payload": llm_payload, "model_output": model_output}

    messages = [
        ("system", SYSTEM_PROMPT),
        ("user", USER_TEMPLATE.format(
            payload=json.dumps(context, indent=2),
            schema=json.dumps(SCHEMA, indent=2)
        ))
    ]

    resp = LLM.invoke(messages)
    return _extract_json(resp.content)
