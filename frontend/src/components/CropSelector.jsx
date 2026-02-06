import { X, Clock, DollarSign, Droplets, Thermometer } from 'lucide-react'
import clsx from 'clsx'

function CropSelector({ crops, onSelect, onClose }) {
  if (!crops) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Select a Crop to Plant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid md:grid-cols-2 gap-4">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => onSelect(crop.id)}
                className="text-left p-4 border-2 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-4xl">{crop.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-green-700">
                      {crop.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {crop.description}
                    </p>
                    
                    {/* Crop Stats */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                        <Clock className="h-3 w-3 mr-1" />
                        {crop.requirements.growing_days} days
                      </span>
                      <span className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        <Droplets className="h-3 w-3 mr-1" />
                        {crop.requirements.water_needs}
                      </span>
                      <span className="flex items-center text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        <Thermometer className="h-3 w-3 mr-1" />
                        {crop.requirements.optimal_temp}°C
                      </span>
                    </div>

                    {/* Revenue Potential */}
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">
                        ${(crop.yield_per_hectare * crop.price_per_ton).toLocaleString()}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">potential/hectare</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-500 text-center">
            💡 Choose crops based on your location's climate for best results!
          </p>
        </div>
      </div>
    </div>
  )
}

export default CropSelector
