import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// SVG Body silhouette component
export const BodyMap = ({ markers = [], onAddMarker, onRemoveMarker }) => {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const feetRef = useRef(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);

  const handleSvgClick = (e, view) => {
    let svgElement;
    if (view === 'front') svgElement = frontRef.current;
    else if (view === 'back') svgElement = backRef.current;
    else if (view === 'feet') svgElement = feetRef.current;
    
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    // Get click position relative to SVG
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert to SVG coordinates
    const svgWidth = rect.width;
    const svgHeight = rect.height;
    
    // ViewBox dimensions
    const viewBoxWidth = view === 'feet' ? 200 : 200;
    const viewBoxHeight = view === 'feet' ? 150 : 400;
    
    // Calculate SVG coordinates
    const svgX = (clickX / svgWidth) * viewBoxWidth;
    const svgY = (clickY / svgHeight) * viewBoxHeight;

    // Check if clicking on existing marker
    const clickedMarkerIndex = markers.findIndex((m) => {
      if (m.view !== view) return false;
      const dx = m.svgX - svgX;
      const dy = m.svgY - svgY;
      return Math.sqrt(dx * dx + dy * dy) < 15;
    });

    if (clickedMarkerIndex >= 0) {
      return;
    }

    onAddMarker({ 
      svgX, 
      svgY, 
      view,
      id: Date.now() 
    });
  };

  const getViewLabel = (view) => {
    switch(view) {
      case 'front': return 'Anteriore';
      case 'back': return 'Posteriore';
      case 'feet': return 'Piedi';
      default: return view;
    }
  };

  const renderMarkers = (view) => {
    return markers
      .filter(m => m.view === view)
      .map((marker, index) => {
        const globalIndex = markers.findIndex(m => m.id === marker.id);
        return (
          <g
            key={marker.id || index}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredMarker(marker.id)}
            onMouseLeave={() => setHoveredMarker(null)}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveMarker(globalIndex);
            }}
          >
            <circle
              cx={marker.svgX}
              cy={marker.svgY}
              r="8"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="2"
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                transition: 'transform 0.15s ease'
              }}
            />
            <text
              x={marker.svgX}
              y={marker.svgY + 4}
              fontSize="10"
              fill="#fff"
              textAnchor="middle"
              fontWeight="bold"
            >
              {globalIndex + 1}
            </text>
            {hoveredMarker === marker.id && (
              <text
                x={marker.svgX + 15}
                y={marker.svgY + 4}
                fontSize="10"
                fill="#ef4444"
                fontWeight="500"
              >
                × Rimuovi
              </text>
            )}
          </g>
        );
      });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Front View */}
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium text-center mb-2">Vista Anteriore</p>
        <div className="relative border rounded-lg p-4 bg-slate-50">
          <svg
            ref={frontRef}
            viewBox="0 0 200 400"
            className="w-full max-w-[200px] mx-auto cursor-crosshair"
            style={{ minHeight: '300px' }}
            onClick={(e) => handleSvgClick(e, 'front')}
            data-testid="body-map-front"
          >
            {/* Human body silhouette - Front view */}
            <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
              {/* Head */}
              <ellipse cx="100" cy="30" rx="25" ry="28" />
              {/* Neck */}
              <line x1="90" y1="58" x2="90" y2="70" />
              <line x1="110" y1="58" x2="110" y2="70" />
              {/* Shoulders */}
              <line x1="90" y1="70" x2="50" y2="85" />
              <line x1="110" y1="70" x2="150" y2="85" />
              {/* Torso */}
              <path d="M 50 85 L 50 180 Q 60 200 100 200 Q 140 200 150 180 L 150 85" />
              {/* Arms */}
              <path d="M 50 85 Q 35 100 30 140 Q 28 160 25 180 Q 22 195 20 210" />
              <path d="M 150 85 Q 165 100 170 140 Q 172 160 175 180 Q 178 195 180 210" />
              {/* Hands */}
              <ellipse cx="20" cy="215" rx="8" ry="12" />
              <ellipse cx="180" cy="215" rx="8" ry="12" />
              {/* Legs */}
              <path d="M 70 200 L 65 280 L 60 340 L 55 380" />
              <path d="M 130 200 L 135 280 L 140 340 L 145 380" />
              {/* Inner legs */}
              <path d="M 90 200 L 85 280 L 80 340 L 75 380" />
              <path d="M 110 200 L 115 280 L 120 340 L 125 380" />
              {/* Feet */}
              <path d="M 55 380 Q 50 395 65 395 Q 80 395 75 380" />
              <path d="M 145 380 Q 150 395 135 395 Q 120 395 125 380" />
            </g>
            {/* Markers */}
            {renderMarkers('front')}
          </svg>
        </div>
      </div>

      {/* Back View */}
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium text-center mb-2">Vista Posteriore</p>
        <div className="relative border rounded-lg p-4 bg-slate-50">
          <svg
            ref={backRef}
            viewBox="0 0 200 400"
            className="w-full max-w-[200px] mx-auto cursor-crosshair"
            style={{ minHeight: '300px' }}
            onClick={(e) => handleSvgClick(e, 'back')}
            data-testid="body-map-back"
          >
            {/* Human body silhouette - Back view */}
            <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
              {/* Head */}
              <ellipse cx="100" cy="30" rx="25" ry="28" />
              {/* Neck */}
              <line x1="90" y1="58" x2="90" y2="70" />
              <line x1="110" y1="58" x2="110" y2="70" />
              {/* Shoulders */}
              <line x1="90" y1="70" x2="50" y2="85" />
              <line x1="110" y1="70" x2="150" y2="85" />
              {/* Torso */}
              <path d="M 50 85 L 50 180 Q 60 200 100 200 Q 140 200 150 180 L 150 85" />
              {/* Arms */}
              <path d="M 50 85 Q 35 100 30 140 Q 28 160 25 180 Q 22 195 20 210" />
              <path d="M 150 85 Q 165 100 170 140 Q 172 160 175 180 Q 178 195 180 210" />
              {/* Hands */}
              <ellipse cx="20" cy="215" rx="8" ry="12" />
              <ellipse cx="180" cy="215" rx="8" ry="12" />
              {/* Legs */}
              <path d="M 70 200 L 65 280 L 60 340 L 55 380" />
              <path d="M 130 200 L 135 280 L 140 340 L 145 380" />
              {/* Inner legs */}
              <path d="M 90 200 L 85 280 L 80 340 L 75 380" />
              <path d="M 110 200 L 115 280 L 120 340 L 125 380" />
              {/* Feet */}
              <path d="M 55 380 Q 50 395 65 395 Q 80 395 75 380" />
              <path d="M 145 380 Q 150 395 135 395 Q 120 395 125 380" />
            </g>
            {/* Markers */}
            {renderMarkers('back')}
          </svg>
        </div>
      </div>

      {/* Feet View */}
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium text-center mb-2">Piedi</p>
        <div className="relative border rounded-lg p-4 bg-slate-50">
          <svg
            ref={feetRef}
            viewBox="0 0 200 150"
            className="w-full max-w-[200px] mx-auto cursor-crosshair"
            style={{ minHeight: '120px' }}
            onClick={(e) => handleSvgClick(e, 'feet')}
            data-testid="body-map-feet"
          >
            {/* Feet - Top view */}
            <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
              {/* Labels */}
              <text x="30" y="15" fontSize="10" fill="#64748b">DX</text>
              <text x="150" y="15" fontSize="10" fill="#64748b">SX</text>
              {/* Right foot outline */}
              <path d="M 20 30 Q 10 50 15 90 Q 20 120 50 130 Q 70 125 70 90 Q 70 50 60 30 Q 40 20 20 30" />
              {/* Right foot toes */}
              <ellipse cx="25" cy="30" rx="5" ry="8" />
              <ellipse cx="35" cy="25" rx="4" ry="7" />
              <ellipse cx="45" cy="23" rx="4" ry="7" />
              <ellipse cx="53" cy="25" rx="3" ry="6" />
              <ellipse cx="60" cy="30" rx="3" ry="5" />
              {/* Left foot outline */}
              <path d="M 180 30 Q 190 50 185 90 Q 180 120 150 130 Q 130 125 130 90 Q 130 50 140 30 Q 160 20 180 30" />
              {/* Left foot toes */}
              <ellipse cx="175" cy="30" rx="5" ry="8" />
              <ellipse cx="165" cy="25" rx="4" ry="7" />
              <ellipse cx="155" cy="23" rx="4" ry="7" />
              <ellipse cx="147" cy="25" rx="3" ry="6" />
              <ellipse cx="140" cy="30" rx="3" ry="5" />
            </g>
            {/* Markers */}
            {renderMarkers('feet')}
          </svg>
        </div>
      </div>

      {/* Markers List */}
      {markers.length > 0 && (
        <div className="w-full lg:w-auto lg:min-w-[200px]">
          <p className="text-sm font-medium mb-2">Lesioni segnate ({markers.length})</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {markers.map((marker, index) => (
              <div
                key={marker.id || index}
                className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm"
              >
                <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm">
                  Lesione {index + 1} - {getViewLabel(marker.view)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                  onClick={() => onRemoveMarker(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyMap;
