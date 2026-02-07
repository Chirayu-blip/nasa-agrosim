import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const severityConfig = {
  critical: {
    bg: 'bg-red-600',
    border: 'border-red-500',
    icon: '🚨',
    pulse: true
  },
  high: {
    bg: 'bg-orange-500',
    border: 'border-orange-400',
    icon: '⚠️',
    pulse: true
  },
  moderate: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-400',
    icon: '⚡',
    pulse: false
  },
  low: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    icon: 'ℹ️',
    pulse: false
  }
}

const alertTypeIcons = {
  drought: '🏜️',
  frost: '❄️',
  heatwave: '🔥',
  flood: '🌊',
  storm: '⛈️'
}

export default function AlertBanner({ alerts, onDismiss, compact = false }) {
  if (!alerts || alerts.length === 0) return null

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high')
  const displayAlerts = compact ? criticalAlerts.slice(0, 2) : alerts

  if (displayAlerts.length === 0) return null

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {displayAlerts.map((alert, index) => {
          const config = severityConfig[alert.severity] || severityConfig.moderate
          const typeIcon = alertTypeIcons[alert.alert_type] || '⚠️'
          
          return (
            <motion.div
              key={`${alert.alert_type}-${index}`}
              initial={{ opacity: 0, x: -50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`
                relative overflow-hidden rounded-lg border-l-4 ${config.border}
                ${config.bg} bg-opacity-20 backdrop-blur-sm
                p-3 shadow-lg
                ${config.pulse ? 'animate-pulse-slow' : ''}
              `}
            >
              {/* Severity indicator bar */}
              <div className={`absolute top-0 left-0 w-full h-1 ${config.bg}`} />
              
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-label={alert.alert_type}>
                  {typeIcon}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
                      ${config.bg} text-white uppercase tracking-wide
                    `}>
                      {config.icon} {alert.severity}
                    </span>
                    <span className="text-sm text-gray-300">
                      {alert.days_until === 0 ? 'Today' : 
                       alert.days_until === 1 ? 'Tomorrow' : 
                       `In ${alert.days_until} days`}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-white text-sm truncate">
                    {alert.title}
                  </h4>
                  
                  {!compact && (
                    <>
                      <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                      
                      {alert.affected_crops && alert.affected_crops.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-gray-400">Affected:</span>
                          {alert.affected_crops.map(crop => (
                            <span key={crop} className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-white">
                              {crop}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {alert.recommendations && alert.recommendations.length > 0 && (
                        <div className="mt-2 p-2 bg-black/20 rounded">
                          <p className="text-xs text-green-400 font-medium mb-1">Recommended Actions:</p>
                          <ul className="list-disc list-inside text-xs text-gray-300 space-y-0.5">
                            {alert.recommendations.slice(0, 2).map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert)}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Dismiss alert"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
      
      {compact && alerts.length > displayAlerts.length && (
        <p className="text-xs text-gray-400 text-center">
          +{alerts.length - displayAlerts.length} more alerts
        </p>
      )}
    </div>
  )
}
