import { Satellite, Leaf, CloudSun, Database, ExternalLink } from 'lucide-react'

function LearnPage() {
  const nasaResources = [
    {
      title: 'NASA POWER Project',
      description: 'Prediction of Worldwide Energy Resources - provides solar and meteorological data for agriculture',
      url: 'https://power.larc.nasa.gov/',
    },
    {
      title: 'NASA Earthdata',
      description: 'Access to NASA\'s Earth observation data including satellite imagery',
      url: 'https://earthdata.nasa.gov/',
    },
    {
      title: 'MODIS Vegetation Indices',
      description: 'Satellite data for monitoring vegetation health and crop conditions',
      url: 'https://modis.gsfc.nasa.gov/data/dataprod/mod13.php',
    },
  ]

  const farmingConcepts = [
    {
      title: 'Sustainable Irrigation',
      icon: '💧',
      content: `
        Water is the most critical resource in farming. Sustainable irrigation practices help conserve water while maintaining crop health.
        
        Key concepts:
        • Drip irrigation reduces water waste by up to 50%
        • Soil moisture monitoring helps optimize watering schedules
        • Rainwater harvesting can supplement irrigation needs
        • Different crops have vastly different water requirements
      `
    },
    {
      title: 'Climate Impact on Crops',
      icon: '🌡️',
      content: `
        Temperature and weather patterns directly affect crop growth, development, and yield.
        
        Key factors:
        • Growing Degree Days (GDD) determine crop development rate
        • Frost events can damage or kill sensitive crops
        • Heat stress reduces photosynthesis and yield
        • Seasonal patterns determine optimal planting windows
      `
    },
    {
      title: 'Soil Health & Fertilization',
      icon: '🌱',
      content: `
        Healthy soil is the foundation of sustainable agriculture. Proper fertilization maintains soil fertility.
        
        Key practices:
        • Crop rotation prevents nutrient depletion
        • Organic matter improves soil structure
        • Over-fertilization causes environmental damage
        • Soil testing guides fertilizer application
      `
    },
    {
      title: 'Satellite Data in Agriculture',
      icon: '🛰️',
      content: `
        NASA satellites provide valuable data for precision agriculture and crop monitoring.
        
        Applications:
        • NDVI (Normalized Difference Vegetation Index) measures crop health
        • Thermal imagery detects water stress
        • Precipitation data helps plan irrigation
        • Long-term climate data informs crop selection
      `
    }
  ]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Satellite className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Learn About Sustainable Farming
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover how NASA satellite data and climate science help farmers make better decisions
            for sustainable agriculture.
          </p>
        </div>

        {/* Farming Concepts */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Leaf className="h-6 w-6 text-green-600 mr-2" />
            Key Farming Concepts
          </h2>
          
          <div className="space-y-6">
            {farmingConcepts.map((concept, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-2xl mr-3">{concept.icon}</span>
                  {concept.title}
                </h3>
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {concept.content}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How the Game Uses Data */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Database className="h-6 w-6 text-purple-600 mr-2" />
            How AgroSim Uses NASA Data
          </h2>
          
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Real Climate Data</h3>
                <p className="text-gray-600 text-sm">
                  When you select a location for your farm, we fetch actual historical and current
                  climate data from NASA's POWER API. This includes temperature, precipitation,
                  humidity, and solar radiation data.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Weather Simulation</h3>
                <p className="text-gray-600 text-sm">
                  The game simulates realistic weather events based on your location's typical
                  patterns. Droughts are more likely in arid regions, while tropical areas
                  may experience more rainfall.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Crop Recommendations</h3>
                <p className="text-gray-600 text-sm">
                  Based on NASA climate data for your location, the game recommends suitable crops.
                  Growing conditions are calculated using real agricultural science.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Yield Prediction</h3>
                <p className="text-gray-600 text-sm">
                  Machine learning models trained on agricultural data predict crop yields
                  based on weather conditions, helping you understand the impact of
                  climate on farming.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NASA Resources */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <CloudSun className="h-6 w-6 text-sky-600 mr-2" />
            NASA Data Resources
          </h2>
          
          <div className="space-y-4">
            {nasaResources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{resource.description}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Fun Facts */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🌍 Did You Know?</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-800">
                <strong>70%</strong> of freshwater globally is used for agriculture.
                Efficient irrigation can reduce this significantly.
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-blue-800">
                NASA satellites orbit Earth <strong>14-16 times daily</strong>,
                collecting data that helps farmers worldwide.
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-amber-800">
                Climate change could reduce crop yields by <strong>25%</strong> by 2050
                without adaptation strategies.
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-purple-800">
                <strong>1 inch of topsoil</strong> takes about 500 years to form naturally.
                Soil conservation is critical!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LearnPage
