# 🚀 SmartArena – AI-Powered Event Experience Assistant

An intelligent, real-time assistant designed to enhance the physical experience at large-scale sporting venues by optimizing crowd movement, reducing waiting times, and enabling smart decision-making.

## 🌟 Key Highlights

* 🤖 AI-powered smart assistant (Groq + LLM support)
* 📊 Real-time decision-making using simulated stadium data
* 🎯 Best-first recommendation engine (not generic lists)
* 🚦 Crowd-aware navigation & optimization
* ⚡ Fast, responsive, and modern UI

## 🌐 Live Demo

- Backend (Cloud Run): https://smartarena-ai-assistant-712996940236.europe-west1.run.app  
- Frontend (Vercel): https://smart-arena-ai-assistant.vercel.app/

## 🚀 Enhanced AI Mode (Groq Integration)

SmartArena supports high-performance LLM responses via the **Groq API**.

### ⚙️ How to Configure:

1. Click the **Settings (⚙️)** icon in the top header
2. Enter your **Groq API Key**
3. Select your preferred model (e.g., Llama 3 70B)
4. Save settings

### 🧠 AI Logic:

When enabled, the assistant sends a structured **System Prompt** including:

* Live `STADIUM_DATA` (wait times, crowd levels)
* Instructions to select the **single best option**
* Rules for calculating **Confidence Level**

### 🔒 Privacy Note:

* API key is stored only in browser memory
* Never stored or shared externally
* Only sent to `api.groq.com`

## 🏗️ Vertical Approach & Logic

### 1. 🎯 Unified Recommendation Engine

SmartArena follows a **“Best-First” strategy**:

Instead of showing all options, it selects the **optimal choice** based on:

* 🍔 **Food (Gastronomy)** → Minimum wait time
* 🚻 **Washrooms (Sanitation)** → Lowest crowd density
* 🚪 **Exits (Egress)** → Clearest & safest path

### 2. 📊 Confidence Level System

Each recommendation includes a confidence score:

* **High** → Significant improvement (>40% better)
* **Medium** → Moderate improvement (10–40%)
* **Low** → Minimal difference (<10%)

👉 Helps users trust the decision-making process

### 3. 🧠 Intent Detection System

Uses keyword-based intent classification:

* Food 🍔
* Washrooms 🚻
* Exits 🚪
* Navigation 🧭
* Crowd Status 📊

Each query is routed to a specialized logic module.

## 🛠️ How It Works

### 1. 📡 Live Data Simulation

* Centralized `STADIUM_DATA` object
* Mimics real-world IoT systems (crowd sensors, queues)

### 2. 🗺️ Interactive Visualization

* SVG-based stadium map
* Reflects real-time conditions visually

### 3. 🚨 Emergency Routing

* Prioritizes **fastest & safest exits**
* Overrides normal logic in high-risk scenarios

### 4. 🎨 Premium UI

* Dark mode stadium theme
* Glassmorphism effects
* Smooth micro-interactions

## 🧠 Assumptions

* Data is simulated but easily replaceable with real APIs
* Gate proximity is assumed (no GPS tracking yet)
* Users interact in English
* Crowd levels are standardized (Low/Medium/High)

## ⚙️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript
* **AI Integration:** Groq API (LLM support)
* **Architecture:** Client-side intelligent assistant
* **Future Ready:** Easily integrable with real-time APIs

## 🚀 Getting Started

1. Clone the repository
2. Open `index.html` in any modern browser
3. Start interacting with the assistant

## 📌 Future Improvements

* 📍 Real-time GPS / BLE-based navigation
* ☁️ Firebase integration for live data
* 📊 Advanced AI-based crowd prediction
* 📱 Mobile app version

## 🎯 Problem Solved

SmartArena addresses:

* ❌ Long waiting queues
* ❌ Crowd congestion
* ❌ Poor navigation inside venues
* ❌ Lack of real-time guidance

## 💡 Solution Impact

* ⬇️ Reduced waiting time
* ⬆️ Better crowd flow
* ⬆️ Improved safety
* ⬆️ Enhanced user experience

## 👩💻 Author

**Tanya Garg**
