<div align="center">

# 🌾 AgroSim

### *Where NASA Science Meets Sustainable Farming*

<br />

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Engine-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![NASA](https://img.shields.io/badge/NASA-POWER_API-E03C31?style=for-the-badge&logo=nasa&logoColor=white)](https://power.larc.nasa.gov/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

**🚀 An immersive 3D agricultural simulation game powered by NASA satellite data, machine learning yield predictions, and an intelligent early warning system to teach sustainable farming practices.**

<br />

[🎮 Play Now](#-quick-start) • [✨ Features](#-key-features) • [🏗️ Architecture](#️-architecture) • [📡 API Docs](#-api-documentation) • [🤝 Contributing](#-contributing)

<br />

---

<br />

<img src="https://raw.githubusercontent.com/nasa/NASA-Brand-Guidelines/master/NASA_logo.svg" alt="NASA Logo" width="120"/>

<br />

### *Developed for the NASA Space Apps Challenge*

<br />

</div>

---

## 🌟 Project Overview

**AgroSim** is a next-generation educational farming simulation that bridges the gap between space science and sustainable agriculture. By leveraging real-time climate data from NASA's POWER (Prediction Of Worldwide Energy Resources) API, players experience how actual weather patterns, temperature fluctuations, and environmental conditions affect crop growth across 20+ global locations.

### 🎯 Mission Statement

> *"Empowering the next generation of farmers with NASA science to build a sustainable, climate-resilient agricultural future."*

### 🔬 What Makes AgroSim Different?

| Traditional Farm Games | AgroSim |
|------------------------|---------|
| Static weather systems | **Real NASA satellite climate data** |
| Arbitrary crop growth | **Science-based growth algorithms** |
| No predictive insights | **ML-powered yield predictions** |
| Reactive gameplay | **7-14 day early warning forecasts** |
| Entertainment only | **Educational with real-world applications** |

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🛰️ NASA Data Integration
- **Real-Time Climate Data** from NASA POWER API
- Temperature, precipitation, humidity, solar radiation
- **20+ Global Locations** from Delhi to Dubai
- Historical weather pattern analysis
- Accurate atmospheric data synchronization

</td>
<td width="50%">

### 🎮 Immersive 3D Farm World
- **React Three Fiber** powered 3D environment
- **7 Unique Crops**: Wheat, Corn, Rice, Soybean, Potato, Tomato, Cotton
- Animated farm life: Farmer, chickens, cows, tractor
- Dynamic day/night cycle with realistic lighting
- Interactive weather effects (rain, storms, clouds)

</td>
</tr>
<tr>
<td width="50%">

### 🤖 Machine Learning Predictions
- **Ensemble ML Models** for yield prediction
- Confidence intervals & risk assessment
- Feature importance analysis
- Actionable recommendations
- Train on 5000+ data points from FAO statistics

</td>
<td width="50%">

### ⚠️ Early Warning System
- **7-14 Day Advance Forecasts**
- Drought, frost, heatwave, flood detection
- Severity classification (Low → Extreme)
- Crop-specific impact assessment
- Automated protective action recommendations

</td>
</tr>
<tr>
<td width="50%">

### 🏆 Competitive Gameplay
- **Global Leaderboard** system
- User authentication & profiles
- Score tracking & achievements
- Multiple difficulty levels
- Challenge friends worldwide

</td>
<td width="50%">

### 📚 Educational Insights
- Real-time crop recommendations
- Climate-smart farming practices
- Growth progress visualization
- Sustainable agriculture tips
- Scientific explanations for all mechanics

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🌐 AGROSIM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    🎨 FRONTEND (React + Vite)                 │  │
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │  │
│   │  │  3D World   │ │   Game UI   │ │    Dashboard & Charts   │ │  │
│   │  │React Three  │ │  Tailwind   │ │      Chart.js           │ │  │
│   │  │   Fiber     │ │    CSS      │ │   Framer Motion         │ │  │
│   │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                 │                                    │
│                                 ▼                                    │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                  ⚡ BACKEND (FastAPI + Python)                │  │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│   │  │   Auth   │ │  Game    │ │  Weather │ │  ML Prediction  │  │  │
│   │  │   API    │ │  Logic   │ │   Sync   │ │    Engine       │  │  │
│   │  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │  │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│   │  │ Leaderbd │ │  Crops   │ │  Alerts  │ │  Early Warning  │  │  │
│   │  │  System  │ │ Database │ │  Engine  │ │     System      │  │  │
│   │  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                 │                                    │
│                                 ▼                                    │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    🛰️ EXTERNAL SERVICES                       │  │
│   │        ┌─────────────────────────────────────────┐           │  │
│   │        │         NASA POWER API                  │           │  │
│   │        │   • Climate Data • Solar Radiation      │           │  │
│   │        │   • Historical Weather • Forecasts      │           │  │
│   │        └─────────────────────────────────────────┘           │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | 18.2 | UI Framework |
| ![Three.js](https://img.shields.io/badge/-Three.js-000000?logo=three.js) | 0.159 | 3D Graphics Engine |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) | 5.0 | Build Tool |
| ![TailwindCSS](https://img.shields.io/badge/-Tailwind-06B6D4?logo=tailwindcss&logoColor=white) | 3.4 | Styling |
| ![Chart.js](https://img.shields.io/badge/-Chart.js-FF6384?logo=chartdotjs&logoColor=white) | 4.4 | Data Visualization |
| ![Framer](https://img.shields.io/badge/-Framer_Motion-0055FF?logo=framer&logoColor=white) | 12.x | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | 3.10+ | Core Language |
| ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white) | 0.109 | REST API Framework |
| ![SQLAlchemy](https://img.shields.io/badge/-SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white) | 2.0 | ORM & Database |
| ![scikit-learn](https://img.shields.io/badge/-Scikit_Learn-F7931E?logo=scikitlearn&logoColor=white) | Latest | ML Models |
| ![Pandas](https://img.shields.io/badge/-Pandas-150458?logo=pandas&logoColor=white) | Latest | Data Processing |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js 18+    ✓
Python 3.10+   ✓
Git            ✓
```

### ⚡ One-Command Setup (Windows)

```powershell
# Clone & Enter
git clone https://github.com/YOUR_USERNAME/agrosim.git && cd agrosim

# Quick Start
./start.ps1
```

### 📦 Manual Installation

<details>
<summary><b>1️⃣ Backend Setup</b></summary>

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/Mac)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload --port 8000
```

✅ Backend running at: `http://localhost:8000`  
📖 API Docs at: `http://localhost:8000/docs`

</details>

<details>
<summary><b>2️⃣ Frontend Setup</b></summary>

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at: `http://localhost:5173`

</details>

---

## 🎮 How To Play

<table>
<tr>
<td align="center" width="25%">
<h3>1️⃣ Choose Location</h3>
<p>Select from 20+ global locations or enter custom coordinates</p>
</td>
<td align="center" width="25%">
<h3>2️⃣ Plant Crops</h3>
<p>Choose crops suited to your climate conditions</p>
</td>
<td align="center" width="25%">
<h3>3️⃣ Manage Farm</h3>
<p>Water, fertilize, and protect crops from weather</p>
</td>
<td align="center" width="25%">
<h3>4️⃣ Harvest & Profit</h3>
<p>Harvest at optimal time for maximum yield</p>
</td>
</tr>
</table>

### 🌍 Available Locations

| Region | Locations |
|--------|-----------|
| 🇮🇳 India | Delhi, Mumbai, Bangalore, Chennai, Kolkata, Punjab |
| 🇺🇸 USA | New York, California, Texas |
| 🇪🇺 Europe | London, Paris, Moscow |
| 🌏 Asia-Pacific | Tokyo, Beijing, Sydney |
| 🌍 Others | Cairo, Nairobi, São Paulo, Dubai |

### 🌾 Supported Crops

| Crop | Optimal Temp | Water Need | Growing Season |
|------|--------------|------------|----------------|
| 🌾 Wheat | 15-24°C | Medium | 100-130 days |
| 🌽 Corn | 21-30°C | High | 90-120 days |
| 🍚 Rice | 20-35°C | Very High | 120-150 days |
| 🫘 Soybean | 20-30°C | Medium | 80-120 days |
| 🥔 Potato | 15-20°C | Medium | 90-120 days |
| 🍅 Tomato | 20-27°C | Medium | 60-90 days |
| ☁️ Cotton | 21-30°C | Medium | 150-180 days |

---

## 📡 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/nasa/climate` | Fetch NASA climate data |
| `POST` | `/api/game/create` | Create new game session |
| `GET` | `/api/crops/recommendations` | Get crop suggestions |
| `POST` | `/api/ml/predict` | ML yield prediction |
| `GET` | `/api/early-warning/forecast` | Get weather alerts |
| `GET` | `/api/leaderboard` | Global rankings |

### Example: Yield Prediction

```bash
curl -X POST "http://localhost:8000/api/ml/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "crop": "wheat",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "temp_avg": 25,
    "precipitation": 80,
    "humidity": 65
  }'
```

📖 Full documentation: `http://localhost:8000/docs`

---

## 📂 Project Structure

```
agrosim/
├── 📁 backend/
│   ├── 📁 app/
│   │   ├── 📁 api/              # API route handlers
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── crops.py         # Crop management
│   │   │   ├── early_warning.py # Alert system (7-14 day forecasts)
│   │   │   ├── game.py          # Game logic
│   │   │   ├── leaderboard.py   # Rankings
│   │   │   ├── ml_prediction.py # ML yield predictions
│   │   │   ├── nasa_data.py     # NASA POWER API integration
│   │   │   └── weather.py       # Weather sync
│   │   ├── 📁 ml/               # Machine learning models
│   │   │   ├── yield_predictor.py
│   │   │   ├── feature_engineering.py
│   │   │   └── real_data_fetcher.py
│   │   ├── 📁 models/           # Database models
│   │   ├── database.py          # SQLAlchemy setup
│   │   └── main.py              # FastAPI application
│   └── requirements.txt
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 Farm3D/       # 3D world components
│   │   │   │   ├── Farm3DWorld.jsx
│   │   │   │   ├── CropModels.jsx
│   │   │   │   ├── FarmObjects.jsx
│   │   │   │   └── WeatherEffects.jsx
│   │   │   ├── 📁 EarlyWarning/ # Alert components
│   │   │   ├── 📁 Auth/         # Authentication UI
│   │   │   └── 📁 Leaderboard/  # Rankings UI
│   │   ├── 📁 pages/            # Route pages
│   │   ├── 📁 services/         # API client
│   │   └── 📁 context/          # React Context
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🔮 Roadmap

- [x] 🛰️ NASA POWER API Integration
- [x] 🎮 3D Farm World with React Three Fiber
- [x] 🌱 7 Crop Types with Growth Stages
- [x] 🤖 ML Yield Prediction Engine
- [x] ⚠️ Early Warning System (Drought/Frost/Heatwave)
- [x] 🏆 Leaderboard & Authentication
- [ ] 📱 Mobile Responsive Design
- [ ] 🌐 Multiplayer Farming
- [ ] 📊 Advanced Analytics Dashboard
- [ ] 🔔 Push Notifications for Alerts
- [ ] 🗺️ More Global Locations

---

## 🤝 Contributing

Contributions make the open-source community amazing! Any contributions are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [NASA POWER Project](https://power.larc.nasa.gov/) - Climate data API
- [NASA Space Apps Challenge](https://www.spaceappschallenge.org/) - Inspiration
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - 3D rendering
- [FAO Statistics](https://www.fao.org/faostat/) - Agricultural data for ML training

---

<div align="center">

### ⭐ Star this repo if you found it helpful!

<br />

**Made with ❤️ for the NASA Space Apps Challenge**

<br />

[![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/agrosim?style=social)](https://github.com/YOUR_USERNAME/agrosim)
[![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/agrosim?style=social)](https://github.com/YOUR_USERNAME/agrosim)

<br />

🌍 *Building a sustainable future, one virtual farm at a time* 🌱

</div>
