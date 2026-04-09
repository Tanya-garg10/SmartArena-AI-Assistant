## 🚀 Enhanced AI Mode (Groq Integration)

SmartArena now supports high-performance LLM responses via the **Groq API**.

### How to Configure:
1. Click the **Settings (⚙️)** icon in the top header.
2. Enter your **Groq API Key**.
3. Select your preferred model (e.g., Llama 3 70B).
4. Save settings.

### AI Logic:
When active, the assistant sends a rich **System Prompt** to Groq containing:
- The exact current `STADIUM_DATA` (Wait times, crowd levels).
- Instructions to prioritize the *one best option*.
- Confidence Level calculation requirements.

### Privacy Note:
Your API key is stored only in the browser's active memory and is never sent to any server other than `api.groq.com`.

---

## 🏗️ Vertical Approach & Logic

### 1. Unified Recommendation Engine
Instead of providing a list of all options, SmartArena follows a **"Best-First"** approach. It continuously evaluates simulated data across three core verticals:
- **Gastronomy (Food)**: Prioritizes minimum wait time.
- **Sanitation (Washrooms)**: Prioritizes lowest crowd density.
- **Egress (Exits)**: Prioritizes "Clear" status for safety and speed.

### 2. Confidence Level Logic
To provide transparency, every recommendation includes a **Confidence Level (High/Medium/Low)**:
- **High Confidence**: The recommended option is significantly better (>40% wait reduction or Low vs High crowd) than alternatives.
- **Medium Confidence**: The recommended option is notably better (10-40% improvement).
- **Low Confidence**: The difference is marginal (<10%), or data suggests a near-tie.

### 3. Intent Detection
The assistant uses a weighted keyword-matching intent system to categorize queries (Food, Washrooms, Exits, Navigation, Crowd Status) and routes them to the specific optimization logic.

---

## 🛠️ How it Works

1. **Live Data Simulation**: A centralized state object (`STADIUM_DATA`) mimics real-time IoT sensors and queue management systems.
2. **Interactive Visualization**: An SVG-based stadium map dynamically reflects the state of the venue, providing a visual mental model along with the text-based chat.
3. **Emergency Routing**: A dedicated priority path for exit queries during high congestion, shifting the logic to "Safety-First" over "Convenience-First."
4. **Premium Interface**: Built with modern web technologies (HTML5, Vanilla CSS, JS) using a dark-mode stadium aesthetic, glassmorphism, and micro-animations for an "Elite" feel.

---

## 🧠 Assumptions Made

- **Static vs. Live Data**: While the data is currently simulated, the logic is built to be easily swapped with a `fetch()` call to a real-world telemetry API.
- **Proximity**: It is assumed that the recommended "Gate X" locations are reasonably accessible to the user based on their stadium entry point. In a production version, GPS/Beacon data would be used to weight distance more heavily.
- **Natural Language**: It assumes the user interacts via standard English queries or the provided Quick Action buttons.
- **Crowd Levels**: "Low", "Medium", and "High" are treated as standardized labels across the venue for consistency in recommendation scoring.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser to launch the assistant.
