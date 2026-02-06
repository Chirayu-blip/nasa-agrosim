import { Lightbulb, Target, Leaf, TrendingUp, BookOpen } from 'lucide-react'
import { useState } from 'react'

function EducationalPanel({ gameState, nasaData }) {
  const [expanded, setExpanded] = useState(true)

  const getLearningPoints = () => {
    const points = []
    const temp = nasaData?.summary?.avg_temperature || 22
    const precip = nasaData?.summary?.avg_daily_precipitation || 5

    // Temperature-based learning
    if (temp > 30) {
      points.push({
        icon: "🌡️",
        title: "High Temperature Impact",
        lesson: "Temperatures above 30°C increase evapotranspiration. Crops lose water faster, requiring 20-40% more irrigation. NASA satellites detect heat stress in crops using thermal imaging.",
        action: "Water your crops more frequently in hot conditions!"
      })
    } else if (temp < 15) {
      points.push({
        icon: "❄️",
        title: "Cool Weather Farming",
        lesson: "Cool temperatures slow plant growth but reduce water needs. Cold-hardy crops like wheat and potatoes can handle temperatures down to 5°C.",
        action: "Choose cold-tolerant crops for this region."
      })
    }

    // Precipitation-based learning
    if (precip < 2) {
      points.push({
        icon: "🏜️",
        title: "Low Rainfall Region",
        lesson: "With less than 2mm daily rainfall, this region is semi-arid. Real farmers here rely heavily on irrigation. NASA's GRACE satellite monitors groundwater levels for sustainable water use.",
        action: "Irrigation is essential! Budget for water costs."
      })
    } else if (precip > 8) {
      points.push({
        icon: "🌧️",
        title: "High Rainfall Region", 
        lesson: "Heavy rainfall (>8mm/day) can cause waterlogging and root disease. Farmers need good drainage. Rice thrives in these conditions, while tomatoes may struggle.",
        action: "Choose water-loving crops or ensure drainage."
      })
    }

    // General sustainable practices
    points.push({
      icon: "♻️",
      title: "Sustainable Tip",
      lesson: "Over-fertilization doesn't increase yields beyond a point—it just pollutes groundwater. NASA satellites can detect excess nitrogen runoff in rivers!",
      action: "Use fertilizer strategically, not excessively."
    })

    return points
  }

  const objectives = [
    { text: "Grow and harvest 3 crops", done: (gameState?.total_revenue || 0) > 0 },
    { text: "Earn $1,000 in revenue", done: (gameState?.total_revenue || 0) >= 1000 },
    { text: "Survive 30 days", done: (gameState?.current_day || 0) >= 30 },
    { text: "Keep all crops above 50% health", done: true }, // Simplified
  ]

  const learningPoints = getLearningPoints()

  return (
    <div className="space-y-4">
      {/* Game Objectives */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Target className="h-5 w-5 text-purple-600 mr-2" />
          Game Objectives
        </h3>
        <div className="space-y-2">
          {objectives.map((obj, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className={obj.done ? "text-green-500" : "text-gray-300"}>
                {obj.done ? "✅" : "⬜"}
              </span>
              <span className={`text-sm ${obj.done ? "text-gray-500 line-through" : "text-gray-700"}`}>
                {obj.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Why This Matters - Educational Content */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm p-4">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-semibold text-amber-800 flex items-center">
            <Lightbulb className="h-5 w-5 text-amber-600 mr-2" />
            What You're Learning
          </h3>
          <span className="text-amber-600">{expanded ? "▼" : "▶"}</span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {learningPoints.slice(0, 2).map((point, index) => (
              <div key={index} className="bg-white/70 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-xl">{point.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{point.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{point.lesson}</p>
                    <p className="text-xs text-amber-700 font-medium mt-2">
                      👉 {point.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NASA Data Explanation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
          <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
          How NASA Helps Farmers
        </h3>
        <div className="text-xs text-blue-700 space-y-2">
          <p>
            <strong>🛰️ Real Data:</strong> The weather shown comes from NASA's POWER API, 
            which provides solar and meteorological data used by farmers worldwide.
          </p>
          <p>
            <strong>🌍 Global Coverage:</strong> Change your farm location to see how 
            climate varies—try farming in different countries!
          </p>
          <p>
            <strong>📊 Decision Support:</strong> Real farmers use this data to decide 
            when to plant, irrigate, and harvest. You're learning the same skills!
          </p>
        </div>
      </div>
    </div>
  )
}

export default EducationalPanel
