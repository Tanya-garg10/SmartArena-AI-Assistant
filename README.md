# 🏟️ SmartArena — AI-Powered Stadium Assistant

> Real-time AI assistant for large-scale sporting venues. Navigate faster, eat smarter, exit safely.

## 🚀 Live Demo
**Deployed on Google Cloud Run**

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Chat | Natural language assistant with Groq LLM integration |
| 📊 Live Crowd Data | Real-time crowd density monitoring across zones |
| 🗺️ Interactive Map | SVG-based stadium map with live status pins |
| 🍔 Smart Recommendations | AI-powered food/washroom/exit suggestions with confidence scores |
| 🧠 Smart Visit Planner | Personalized itinerary based on live conditions |
| 🌡️ Crowd Heatmap | Zone-wise density visualization |
| 🚨 Emergency Mode | Instant safest-exit guidance with visual alerts |
| 🗣️ Voice Input/Output | Speech recognition + TTS with Groq Whisper fallback |
| 🌐 Multi-language | English & Hindi support |
| 📈 Analytics Dashboard | Feedback collection & usage metrics |
| 🔄 Live Updates | Auto-refreshing data every 15 seconds |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (HTML/CSS/JS)          │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Chat UI │  │ Live Map │  │ Sidebar   │  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  │
│       │             │              │         │
├───────┼─────────────┼──────────────┼─────────┤
│       ▼             ▼              ▼         │
│         Flask Backend (app.py)               │
│  ┌──────────────────────────────────────┐    │
│  │ /api/ask      - AI Chat Engine       │    │
│  │ /api/status   - Live Stadium Data    │    │
│  │ /api/recommend - Smart Suggestions   │    │
│  │ /api/smart-plan - Visit Planner      │    │
│  │ /api/heatmap  - Crowd Density Map    │    │
│  │ /api/emergency - Safety Alerts       │    │
│  │ /api/feedback - User Ratings         │    │
│  │ /api/analytics - Usage Metrics       │    │
│  └──────────────────────────────────────┘    │
│                                              │
│         Google Cloud Run (Serverless)        │
└─────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Glassmorphism UI), Vanilla JS
- **Backend:** Python Flask, Gunicorn
- **AI/ML:** Groq API (Llama 3.3 70B), Whisper (Voice)
- **Cloud:** Google Cloud Run (auto-scaling, serverless)
- **Design:** Responsive, Mobile-first, Dark theme

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Live stadium data |
| POST | `/api/ask` | AI chat response |
| POST | `/api/recommend` | Smart recommendation |
| POST | `/api/smart-plan` | Personalized visit plan |
| GET | `/api/heatmap` | Crowd density zones |
| POST | `/api/emergency` | Emergency exit guidance |
| POST | `/api/feedback` | Submit user feedback |
| GET | `/api/analytics` | Usage analytics |
| GET | `/health` | Service health check |

## 🏃 Run Locally

```bash
pip install -r requirements.txt
python app.py
```
Open http://localhost:8080

## 📦 Deploy to Cloud Run

```bash
gcloud run deploy smartarena-ai-assistant --source . --region asia-south1 --allow-unauthenticated --port 8080
```


