
import React from 'react';
import { MapPin } from 'lucide-react';

const MedievalMap = () => {
  const locations = [
    { name: "Kingdom of Valdris", x: 25, y: 30, type: "kingdom" },
    { name: "Shadowmere Forest", x: 45, y: 20, type: "forest" },
    { name: "Dragon's Peak", x: 70, y: 15, type: "mountain" },
    { name: "Port Marigold", x: 15, y: 60, type: "port" },
    { name: "Ruins of Theron", x: 55, y: 45, type: "ruins" },
    { name: "Whispering Woods", x: 35, y: 70, type: "forest" },
    { name: "Iron Fortress", x: 80, y: 40, type: "fortress" },
    { name: "Crystal Lake", x: 60, y: 65, type: "lake" },
    { name: "Barren Wastes", x: 85, y: 75, type: "desert" },
    { name: "Moonhaven Village", x: 20, y: 45, type: "village" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-amber-900 font-serif">
          Realm of Aethermoor
        </h1>
        
        <div className="relative bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 rounded-lg shadow-2xl overflow-hidden border-8 border-amber-800" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               minHeight: '700px'
             }}>
          
          {/* Decorative Border */}
          <div className="absolute inset-2 border-4 border-amber-700 rounded-lg" 
               style={{
                 borderImage: 'linear-gradient(45deg, #92400e, #d97706, #92400e) 1'
               }}>
            
            {/* Compass Rose */}
            <div className="absolute top-8 right-8 w-24 h-24 bg-amber-900 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-700">
              <div className="text-amber-100 font-bold text-xs">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">N</div>
                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">E</div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">S</div>
                <div className="absolute -left-6 top-1/2 transform -translate-y-1/2">W</div>
                <div className="w-8 h-8 bg-amber-700 rounded-full"></div>
              </div>
            </div>

            {/* Mountain Ranges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
              <defs>
                <pattern id="mountains" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <polygon points="5,2 8,8 2,8" fill="#8b7355" stroke="#6b5b47" strokeWidth="0.5"/>
                </pattern>
              </defs>
              
              {/* Mountain ranges */}
              <path d="M65,10 L75,5 L85,12 L95,8 L98,15 L90,20 L80,18 L70,25 L65,20 Z" 
                    fill="#a0937d" stroke="#8b7355" strokeWidth="1"/>
              <path d="M10,20 L20,15 L30,22 L25,28 L15,25 Z" 
                    fill="#a0937d" stroke="#8b7355" strokeWidth="1"/>
              
              {/* Forests */}
              <circle cx="45" cy="22" r="8" fill="#4a5d3a" opacity="0.7"/>
              <circle cx="42" cy="18" r="6" fill="#4a5d3a" opacity="0.7"/>
              <circle cx="48" cy="18" r="5" fill="#4a5d3a" opacity="0.7"/>
              
              <circle cx="35" cy="72" r="10" fill="#4a5d3a" opacity="0.7"/>
              <circle cx="30" cy="68" r="7" fill="#4a5d3a" opacity="0.7"/>
              <circle cx="40" cy="68" r="6" fill="#4a5d3a" opacity="0.7"/>
              
              {/* Water bodies */}
              <ellipse cx="60" cy="67" rx="8" ry="5" fill="#4682b4" opacity="0.6"/>
              <path d="M5,55 Q15,50 25,55 Q35,60 25,65 Q15,70 5,65 Z" 
                    fill="#4682b4" opacity="0.6"/>
              
              {/* Rivers */}
              <path d="M25,55 Q40,50 55,55 Q70,60 85,55" 
                    stroke="#4682b4" strokeWidth="2" fill="none" opacity="0.6"/>
            </svg>

            {/* Location Markers */}
            {locations.map((location, index) => (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
              >
                <div className={`w-3 h-3 rounded-full border-2 shadow-lg transition-all duration-300 group-hover:scale-150 ${
                  location.type === 'kingdom' ? 'bg-purple-600 border-purple-800' :
                  location.type === 'forest' ? 'bg-green-600 border-green-800' :
                  location.type === 'mountain' ? 'bg-gray-600 border-gray-800' :
                  location.type === 'port' ? 'bg-blue-600 border-blue-800' :
                  location.type === 'ruins' ? 'bg-red-600 border-red-800' :
                  location.type === 'fortress' ? 'bg-amber-600 border-amber-800' :
                  location.type === 'lake' ? 'bg-cyan-600 border-cyan-800' :
                  location.type === 'desert' ? 'bg-yellow-600 border-yellow-800' :
                  'bg-amber-600 border-amber-800'
                }`}></div>
                
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-amber-900 text-amber-100 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-serif">
                  {location.name}
                </div>
              </div>
            ))}

            {/* Title Cartouche */}
            <div className="absolute bottom-8 left-8 bg-amber-900 bg-opacity-90 p-4 rounded-lg border-2 border-amber-700 shadow-lg">
              <h2 className="text-xl font-bold text-amber-100 font-serif mb-2">Legend</h2>
              <div className="grid grid-cols-2 gap-2 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full border border-purple-800"></div>
                  <span>Kingdoms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full border border-green-800"></div>
                  <span>Forests</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full border border-gray-800"></div>
                  <span>Mountains</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full border border-blue-800"></div>
                  <span>Ports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full border border-red-800"></div>
                  <span>Ruins</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-600 rounded-full border border-amber-800"></div>
                  <span>Villages</span>
                </div>
              </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute top-4 left-4 text-6xl text-amber-800 opacity-50 font-serif">❦</div>
            <div className="absolute top-4 right-32 text-6xl text-amber-800 opacity-50 font-serif">❦</div>
            <div className="absolute bottom-4 right-4 text-6xl text-amber-800 opacity-50 font-serif">❦</div>
            <div className="absolute bottom-4 left-32 text-6xl text-amber-800 opacity-50 font-serif">❦</div>
          </div>
        </div>
        
        <div className="text-center mt-6 text-amber-800 font-serif italic">
          "Here be Dragons and Ancient Mysteries"
        </div>
      </div>
    </div>
  );
};

export default MedievalMap;
