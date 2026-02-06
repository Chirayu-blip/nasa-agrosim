import { Droplets, Leaf, Scissors, Sprout, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

// Crop emoji mapping
const CROP_ICONS = {
  wheat: '🌾',
  corn: '🌽',
  rice: '🍚',
  soybean: '🫘',
  tomato: '🍅',
  potato: '🥔',
}

function FarmPlot({ plot, crops, onAction, disabled }) {
  const crop = crops?.find(c => c.id === plot.crop_id)
  
  // Determine plot appearance based on status
  const getPlotStyle = () => {
    switch (plot.status) {
      case 'empty':
        return 'bg-amber-100 border-amber-300'
      case 'planted':
        return 'bg-amber-50 border-green-300'
      case 'growing':
        return 'bg-green-100 border-green-400'
      case 'ready':
        return 'bg-green-200 border-green-500 animate-pulse'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getGrowthIcon = () => {
    if (!crop) return null
    
    const icon = CROP_ICONS[plot.crop_id] || '🌱'
    
    if (plot.status === 'planted') {
      return <span className="text-2xl opacity-50">🌱</span>
    } else if (plot.status === 'growing') {
      const size = plot.growth_progress > 50 ? 'text-4xl' : 'text-3xl'
      return <span className={clsx(size, 'crop-growing')}>{icon}</span>
    } else if (plot.status === 'ready') {
      return <span className="text-4xl animate-bounce">{icon}</span>
    }
    return null
  }

  return (
    <div
      className={clsx(
        'relative rounded-xl border-2 p-4 transition-all',
        getPlotStyle(),
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Plot Header */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase">
          {plot.id.replace('_', ' ')}
        </span>
        {plot.status !== 'empty' && (
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full',
            plot.status === 'ready' ? 'bg-green-500 text-white' : 'bg-white text-gray-600'
          )}>
            {plot.status}
          </span>
        )}
      </div>

      {/* Plot Content */}
      <div className="h-24 flex items-center justify-center">
        {plot.status === 'empty' ? (
          <button
            onClick={() => onAction('plant', plot.id)}
            disabled={disabled}
            className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors"
          >
            <Sprout className="h-8 w-8 mb-1" />
            <span className="text-xs">Click to Plant</span>
          </button>
        ) : (
          <div className="text-center">
            {getGrowthIcon()}
            {crop && (
              <p className="text-sm font-medium text-gray-700 mt-1">{crop.name}</p>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar (for growing crops) */}
      {plot.status !== 'empty' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Growth</span>
            <span>{Math.round(plot.growth_progress)}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all rounded-full',
                plot.growth_progress >= 100 ? 'bg-green-500' : 'bg-green-400'
              )}
              style={{ width: `${plot.growth_progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {plot.status !== 'empty' && (
        <div className="mt-3 flex space-x-2">
          {/* Water Level */}
          <div className={clsx(
            'flex-1 flex items-center justify-center py-1 rounded text-xs',
            plot.water_level < 30 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          )}>
            <Droplets className="h-3 w-3 mr-1" />
            {Math.round(plot.water_level)}%
          </div>
          
          {/* Health */}
          <div className={clsx(
            'flex-1 flex items-center justify-center py-1 rounded text-xs',
            plot.health < 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          )}>
            <Leaf className="h-3 w-3 mr-1" />
            {Math.round(plot.health)}%
          </div>
        </div>
      )}

      {/* Low Health Warning */}
      {plot.health < 50 && plot.status !== 'empty' && (
        <div className="absolute top-2 right-2">
          <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
        </div>
      )}

      {/* Action Buttons */}
      {plot.status !== 'empty' && (
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => onAction('water', plot.id)}
            disabled={disabled}
            className="flex-1 flex items-center justify-center py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs disabled:opacity-50"
          >
            <Droplets className="h-3 w-3 mr-1" />
            Water ($10)
          </button>
          
          {plot.status === 'ready' ? (
            <button
              onClick={() => onAction('harvest', plot.id)}
              disabled={disabled}
              className="flex-1 flex items-center justify-center py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs disabled:opacity-50"
            >
              <Scissors className="h-3 w-3 mr-1" />
              Harvest!
            </button>
          ) : (
            <button
              onClick={() => onAction('fertilize', plot.id)}
              disabled={disabled}
              className="flex-1 flex items-center justify-center py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-xs disabled:opacity-50"
            >
              <Leaf className="h-3 w-3 mr-1" />
              Fert ($50)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default FarmPlot
