from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return "SmartArena AI Assistant is Live 🚀"

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    user_input = data.get("message", "").lower()

    # Simple smart logic
    if "food" in user_input:
        return jsonify({
            "response": "Gate 3 food stall is best — only 5 min wait and low crowd 👍"
        })

    elif "washroom" in user_input:
        return jsonify({
            "response": "Use washroom near Gate 4 — less crowd 🚻"
        })

    elif "exit" in user_input:
        return jsonify({
            "response": "Exit C is the fastest and least crowded right now 🚪"
        })

    else:
        return jsonify({
            "response": "I can help with food, washrooms, or exits 😊"
        })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
