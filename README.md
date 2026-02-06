# 🌾 AgroSim - NASA Space Apps Challenge Agricultural Simulation

<div align="center">

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-3D-black?style=for-the-badge&logo=three.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)
![NASA](https://img.shields.io/badge/NASA-POWER_API-E03C31?style=for-the-badge&logo=nasa)

**An immersive 3D agricultural simulation game that leverages NASA satellite data to teach sustainable farming practices through interactive gameplay.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-getting-started) • [How to Play](#-how-to-play)

</div>

---

## 🎮 About The Project

AgroSim is an educational farming simulation game developed for the **NASA Space Apps Challenge**. It combines real-world climate data from NASA's POWER API with engaging 3D gameplay to help users understand:

- How weather conditions affect crop growth
- Sustainable agricultural practices
- Climate-smart farming decisions
- Resource management in agriculture

Players manage a virtual farm using **real NASA satellite climate data** for their chosen location, making decisions about planting, irrigation, fertilization, and harvesting while responding to actual weather patterns.

## ✨ Features

### 🌍 NASA Data Integration
- **Real Climate Data**: Fetches actual temperature, precipitation, humidity, and solar radiation data from NASA POWER API
- **Location-Based Weather**: 20+ global locations with accurate climate conditions
- **Dynamic Weather Sync**: In-game weather reflects real atmospheric data

### 🎮 Immersive 3D Experience
- **React Three Fiber**: Fully 3D farm environment with interactive elements
- **6 Unique Crop Models**: Wheat, Corn, Rice, Soybean, Tomato, Potato - each with growth stages
- **Animated Farm Objects**: Farmer, chickens, cows, tractor, windmill, barn, and more
- **Dynamic Weather Effects**: Rain, storms, clouds, day/night cycle with realistic lighting

### 🌱 Farm Management
- **Plant & Grow**: Select crops suitable for your climate
- **Water & Fertilize**: Manage resources to optimize growth
- **Harvest & Sell**: Collect crops when ready for maximum profit
- **Weather Challenges**: Adapt to changing weather conditions

### 📊 Educational Insights
- Real-time crop recommendations based on climate
- Growth progress tracking
- Weather impact visualization
- Sustainable farming tips

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| React Three Fiber | 3D Rendering |
| Three.js | 3D Graphics Engine |
| @react-three/drei | 3D Helpers & Controls |
| Tailwind CSS | Styling |
| React Query | Server State Management |
| Vite | Build Tool |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.10+ | Backend Language |
| FastAPI | REST API Framework |
| NASA POWER API | Climate Data Source |
| Pydantic | Data Validation |
| Uvicorn | ASGI Server |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/nasa-agrosim.git
cd nasa-agrosim
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3. **Frontend Setup** (new terminal)
```bash
cd frontend
npm install
npm run dev
```

4. **Open in browser**
```
http://localhost:5173
```

## 🎯 How to Play

1. **Create a New Game**: Enter your name, select difficulty, and choose a location
2. **Plant Crops**: Click on empty plots to select and plant crops
3. **Manage Resources**: Water and fertilize your crops regularly
4. **Advance Time**: Click "Next Day" to progress and watch crops grow
5. **Harvest**: Collect crops when they reach 100% growth
6. **Profit**: Sell your harvest and expand your farm!

## 📡 NASA APIs Used

- **[NASA POWER API](https://power.larc.nasa.gov/)**: Prediction Of Worldwide Energy Resources
  - Daily temperature data
  - Precipitation and humidity
  - Solar radiation levels
  - Wind speed data

## 🎨 Game Features

### 3D Farm View
- Interactive 3D environment with OrbitControls
- Day/Night cycle with dynamic lighting
- Weather effects (rain, storms, clouds)

### Crop Management
- 6 unique 3D crop models with growth animations
- Visual growth progress indicators
- Harvest sparkle effects when ready

### Weather Integration
- Real-time weather sync with NASA data
- Dynamic sky and lighting changes
- Weather-appropriate visual effects

## 🏆 NASA Space Apps Challenge

This project was created for the NASA Space Apps Challenge, focusing on:
- **Challenge Theme**: Leveraging Earth Observation Data for Agriculture
- **Goal**: Make NASA climate data accessible and educational through gamification
- **Impact**: Teaching sustainable farming practices to a global audience

## 📁 Project Structure

```
nasa-agrosim/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes (game, crops, nasa_data, weather)
│   │   ├── main.py        # FastAPI application
│   │   └── ...
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Farm3D/    # 3D farm components
│   │   ├── pages/         # React pages
│   │   └── services/      # API services
│   └── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- NASA for providing the POWER API
- NASA Space Apps Challenge organizers
- Three.js and React Three Fiber communities

---

<div align="center">

**Built with ❤️ for NASA Space Apps Challenge**

⭐ Star this repo if you found it helpful!

</div>
