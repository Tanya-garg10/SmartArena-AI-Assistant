import os
import time
import random
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.')

# --- SIMULATED LIVE DATA ---
stadium_data = {
    "food": [
        {"id": "gate1", "name": "Gate 1 Stall", "wait": 15, "crowd": "High"},
        {"id": "gate3", "name": "Gate 3 Stall", "wait": 5, "crowd": "Low"},
        {"id": "gate5", "name": "Gate 5 Stall", "wait": 10, "crowd": "Medium"}
    ],
    "washrooms": [
        {"id": "wash2", "name": "Near Gate 2", "crowd": "High"},
        {"id": "wash4", "name": "Near Gate 4", "crowd": "Low"}
    ],
    "exits": [
        {"id": "exitA", "name": "Exit A", "status": "Congested", "level": "High"},
        {"id": "exitB", "name": "Exit B", "status": "Moderate", "level": "Medium"},
        {"id": "exitC", "name": "Exit C", "status": "Clear", "level": "Low"}
    ],
    "capacity": 65,
    "weather": "Clear, 28°C",
    "event": "IPL Match - MI vs CSK",
    "last_updated": time.time()
}

# Feedback storage (in-memory for demo)
feedback_log = []
alert_history = []


def fluctuate_data():
    """Simulate real-time crowd changes"""
    for stall in stadium_data["food"]:
        change = random.randint(-2, 3)
        stall["wait"] = max(1, stall["wait"] + change)
        if stall["wait"] > 12:
            stall["crowd"] = "High"
        elif stall["wait"] > 7:
            stall["crowd"] = "Medium"
        else:
            stall["crowd"] = "Low"

    if random.random() > 0.7:
        stadium_data["washrooms"][0]["crowd"], stadium_data["washrooms"][1]["crowd"] = \
            stadium_data["washrooms"][1]["crowd"], stadium_data["washrooms"][0]["crowd"]

    stadium_data["capacity"] = min(95, max(40, stadium_data["capacity"] + random.randint(-3, 3)))
    stadium_data["last_updated"] = time.time()


# --- STATIC FILE ROUTES ---

@app.route("/")
def home():
    return send_from_directory('.', 'index.html')


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory('.', filename)


# --- API ENDPOINTS ---

@app.route("/api/status", methods=["GET"])
def get_status():
    """Live stadium status - crowd, capacity, weather"""
    fluctuate_data()
    return jsonify({
        "success": True,
        "data": stadium_data,
        "timestamp": time.time()
    })


@app.route("/api/recommend", methods=["POST"])
def recommend():
    """AI-powered recommendation engine"""
    data = request.get_json()
    intent = data.get("intent", "").lower()
    lang = data.get("lang", "en")

    fluctuate_data()

    if intent == "food":
        best = min(stadium_data["food"], key=lambda x: x["wait"])
        msg = f"{best['name']} is your best bet — only {best['wait']} min wait!" if lang == "en" \
            else f"{best['name']} sabse achha hai — sirf {best['wait']} min wait!"
        confidence = "High" if best["wait"] < 7 else "Medium"
    elif intent == "washroom":
        best = next((w for w in stadium_data["washrooms"] if w["crowd"] == "Low"), stadium_data["washrooms"][0])
        msg = f"Use {best['name']} — least crowded right now." if lang == "en" \
            else f"{best['name']} use karein — abhi sabse kam bheed."
        confidence = "High"
    elif intent == "exit":
        best = next((e for e in stadium_data["exits"] if e["level"] == "Low"), stadium_data["exits"][-1])
        msg = f"{best['name']} is clear and fastest for departure." if lang == "en" \
            else f"{best['name']} clear hai aur sabse fast exit hai."
        confidence = "High"
    else:
        msg = "I can help with food, washrooms, or exits!" if lang == "en" \
            else "Main food, washroom, ya exit mein help kar sakta hoon!"
        confidence = "Low"
        best = None

    return jsonify({
        "success": True,
        "recommendation": best,
        "message": msg,
        "confidence": confidence
    })


@app.route("/api/smart-plan", methods=["POST"])
def smart_plan():
    """Generate personalized visit plan based on preferences"""
    data = request.get_json()
    lang = data.get("lang", "en")
    preferences = data.get("preferences", [])  # e.g. ["food", "washroom", "exit"]

    fluctuate_data()

    best_food = min(stadium_data["food"], key=lambda x: x["wait"])
    best_washroom = next((w for w in stadium_data["washrooms"] if w["crowd"] == "Low"), stadium_data["washrooms"][0])
    best_exit = next((e for e in stadium_data["exits"] if e["level"] == "Low"), stadium_data["exits"][-1])

    avg_wait = sum(s["wait"] for s in stadium_data["food"]) / len(stadium_data["food"])
    time_saved = max(0, round(avg_wait - best_food["wait"]))

    plan = {
        "steps": [
            {"order": 1, "type": "food", "location": best_food["name"], "wait": best_food["wait"], "tip": "Go now for shortest queue"},
            {"order": 2, "type": "washroom", "location": best_washroom["name"], "crowd": best_washroom["crowd"], "tip": "Minimal queue expected"},
            {"order": 3, "type": "exit", "location": best_exit["name"], "status": best_exit["status"], "tip": "Clear route, fastest departure"}
        ],
        "time_saved_minutes": time_saved,
        "stadium_capacity": stadium_data["capacity"],
        "weather": stadium_data["weather"],
        "event": stadium_data["event"]
    }

    return jsonify({"success": True, "plan": plan})


@app.route("/api/heatmap", methods=["GET"])
def heatmap():
    """Crowd density heatmap data for visualization"""
    fluctuate_data()
    zones = [
        {"zone": "North Stand", "density": random.randint(40, 90), "gate": "Gate 1"},
        {"zone": "South Stand", "density": random.randint(30, 70), "gate": "Gate 3"},
        {"zone": "East Wing", "density": random.randint(50, 85), "gate": "Gate 5"},
        {"zone": "West Wing", "density": random.randint(35, 75), "gate": "Gate 2"},
        {"zone": "VIP Section", "density": random.randint(20, 50), "gate": "Gate 4"},
        {"zone": "Main Concourse", "density": random.randint(55, 95), "gate": "Central"}
    ]
    return jsonify({"success": True, "zones": zones, "overall_capacity": stadium_data["capacity"]})


@app.route("/api/emergency", methods=["POST"])
def emergency():
    """Emergency exit guidance"""
    data = request.get_json()
    zone = data.get("zone", "unknown")
    lang = data.get("lang", "en")

    best_exit = next((e for e in stadium_data["exits"] if e["level"] == "Low"), stadium_data["exits"][-1])

    alert = {
        "type": "EMERGENCY",
        "exit": best_exit["name"],
        "status": best_exit["status"],
        "instruction_en": f"PROCEED TO {best_exit['name'].upper()} IMMEDIATELY. Follow green illuminated signs. Stay calm.",
        "instruction_hi": f"TURANT {best_exit['name'].upper()} KI TARAF JAYEIN. Green signs follow karein. Shaant rahein.",
        "timestamp": time.time()
    }
    alert_history.append(alert)

    return jsonify({"success": True, "alert": alert})


@app.route("/api/feedback", methods=["POST"])
def feedback():
    """Collect user feedback for AI improvement"""
    data = request.get_json()
    fb = {
        "rating": data.get("rating", 0),
        "comment": data.get("comment", ""),
        "feature": data.get("feature", "general"),
        "timestamp": time.time()
    }
    feedback_log.append(fb)
    return jsonify({"success": True, "message": "Thank you for your feedback!"})


@app.route("/api/analytics", methods=["GET"])
def analytics():
    """Basic analytics dashboard data"""
    total_feedback = len(feedback_log)
    avg_rating = sum(f["rating"] for f in feedback_log) / total_feedback if total_feedback > 0 else 0

    return jsonify({
        "success": True,
        "total_queries": total_feedback,
        "avg_rating": round(avg_rating, 1),
        "alerts_triggered": len(alert_history),
        "current_capacity": stadium_data["capacity"],
        "event": stadium_data["event"]
    })


@app.route("/api/ask", methods=["POST"])
def ask():
    """Main AI chat endpoint with smart responses"""
    data = request.get_json()
    user_input = data.get("message", "").lower()
    lang = data.get("lang", "en")

    fluctuate_data()

    if any(w in user_input for w in ["food", "eat", "hungry", "khana"]):
        best = min(stadium_data["food"], key=lambda x: x["wait"])
        response = f"🍔 {best['name']} — only {best['wait']} min wait, {best['crowd'].lower()} crowd!" if lang == "en" \
            else f"🍔 {best['name']} — sirf {best['wait']} min wait, {best['crowd'].lower()} bheed!"
    elif any(w in user_input for w in ["washroom", "toilet", "restroom", "bathroom"]):
        best = next((w for w in stadium_data["washrooms"] if w["crowd"] == "Low"), stadium_data["washrooms"][0])
        response = f"🚻 {best['name']} has the least crowd right now." if lang == "en" \
            else f"🚻 {best['name']} mein abhi sabse kam bheed hai."
    elif any(w in user_input for w in ["exit", "leave", "out", "bahar"]):
        best = next((e for e in stadium_data["exits"] if e["level"] == "Low"), stadium_data["exits"][-1])
        response = f"🚪 {best['name']} is clear — fastest way out!" if lang == "en" \
            else f"🚪 {best['name']} clear hai — sabse fast exit!"
    elif any(w in user_input for w in ["crowd", "status", "capacity", "kitne"]):
        response = f"📊 Stadium at {stadium_data['capacity']}% capacity. Gate 3 area is least crowded." if lang == "en" \
            else f"📊 Stadium {stadium_data['capacity']}% capacity par hai. Gate 3 area sabse kam crowded hai."
    elif any(w in user_input for w in ["emergency", "help", "danger", "fire"]):
        best = next((e for e in stadium_data["exits"] if e["level"] == "Low"), stadium_data["exits"][-1])
        response = f"🚨 EMERGENCY: Head to {best['name']} immediately! Follow green signs. Stay calm." if lang == "en" \
            else f"🚨 EMERGENCY: Turant {best['name']} ki taraf jayein! Green signs follow karein."
    elif any(w in user_input for w in ["weather", "mausam"]):
        response = f"🌤️ Current weather: {stadium_data['weather']}" if lang == "en" \
            else f"🌤️ Mausam: {stadium_data['weather']}"
    elif any(w in user_input for w in ["event", "match", "game"]):
        response = f"🏏 Current event: {stadium_data['event']}" if lang == "en" \
            else f"🏏 Aaj ka event: {stadium_data['event']}"
    elif any(w in user_input for w in ["plan", "itinerary", "guide"]):
        best_food = min(stadium_data["food"], key=lambda x: x["wait"])
        best_wash = next((w for w in stadium_data["washrooms"] if w["crowd"] == "Low"), stadium_data["washrooms"][0])
        best_exit = next((e for e in stadium_data["exits"] if e["level"] == "Low"), stadium_data["exits"][-1])
        response = f"🧠 Smart Plan:\n1) 🍔 {best_food['name']} ({best_food['wait']} min)\n2) 🚻 {best_wash['name']}\n3) 🚪 {best_exit['name']}" if lang == "en" \
            else f"🧠 Smart Plan:\n1) 🍔 {best_food['name']} ({best_food['wait']} min)\n2) 🚻 {best_wash['name']}\n3) 🚪 {best_exit['name']}"
    else:
        response = "I can help with food, washrooms, exits, crowd status, weather, emergency guidance, and smart planning! 😊" if lang == "en" \
            else "Main food, washroom, exit, crowd status, weather, emergency, aur smart planning mein help kar sakta hoon! 😊"

    return jsonify({"success": True, "response": response})


# --- HEALTH CHECK ---
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "SmartArena AI Assistant", "version": "2.0"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
