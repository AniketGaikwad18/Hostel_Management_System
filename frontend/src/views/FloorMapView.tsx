import React, { useState } from 'react';
import { 
  Map, 
  Video, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Layers, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Camera, Incident } from '../types';

interface FloorMapViewProps {
  cameras: Camera[];
  incidents: Incident[];
  onSelectCamera: (cam: Camera) => void;
  onSelectIncident: (inc: Incident) => void;
}

export const FloorMapView: React.FC<FloorMapViewProps> = ({
  cameras,
  incidents,
  onSelectCamera,
  onSelectIncident,
}) => {
  const [activeFloor, setActiveFloor] = useState<'A2' | 'B3' | 'B0'>('A2');

  const getCameraStatus = (code: string) => {
    const cam = cameras.find(c => c.code === code);
    if (!cam) return 'NORMAL';
    return cam.current_status;
  };

  const getIncidentForCam = (code: string) => {
    const cam = cameras.find(c => c.code === code);
    if (!cam) return null;
    return incidents.find(i => i.camera_id === cam.id && i.status !== 'RESOLVED');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header & Floor Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-950 font-sans">
              HOSTEL ARCHITECTURAL MAP
            </h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
              2D INTERACTIVE
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Spatial monitoring map with live optical sensor positioning
          </p>
        </div>

        {/* Floor Selection Tabs */}
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-oat-300 shadow-sm">
          <button
            onClick={() => setActiveFloor('A2')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFloor === 'A2' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:bg-oat-100'
            }`}
          >
            Block A — Floor 2
          </button>
          <button
            onClick={() => setActiveFloor('B3')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFloor === 'B3' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:bg-oat-100'
            }`}
          >
            Block B — Floor 3
          </button>
          <button
            onClick={() => setActiveFloor('B0')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFloor === 'B0' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:bg-oat-100'
            }`}
          >
            Block B — Ground Floor
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="bg-white border border-oat-300 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-gray-700">Map Legend:</span>
          
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-safety-500 ring-2 ring-safety-200" />
            <span className="text-gray-600">Normal (Healthy)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-tangerine-500 ring-2 ring-tangerine-200 animate-pulse" />
            <span className="text-gray-600 font-semibold text-tangerine-800">Warning (Crowd / Restricted)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emergency-600 ring-2 ring-emergency-200 animate-ping" />
            <span className="text-gray-600 font-bold text-emergency-600">Critical (Fall Hazard)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600" />
            <span className="text-gray-600">AI Camera Pin</span>
          </div>
        </div>

        <span className="text-gray-400 text-[11px] italic">
          Click any camera node to view live feed
        </span>
      </div>

      {/* 2D ARCHITECTURAL BLUEPRINT CANVAS */}
      <div className="bg-oat-50 border-2 border-oat-300 rounded-3xl p-8 shadow-card relative min-h-[460px] flex items-center justify-center overflow-hidden">
        
        {/* Background Grid Lines */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#6C4AB6 1px, transparent 1px), linear-gradient(90deg, #6C4AB6 1px, transparent 1px)`,
            backgroundSize: '36px 36px'
          }}
        />

        {/* ------------------------------------------------------------- */}
        {/* FLOOR 1: BLOCK A - FLOOR 2 */}
        {/* ------------------------------------------------------------- */}
        {activeFloor === 'A2' && (
          <div className="w-full max-w-4xl bg-white border-2 border-purple-300 rounded-3xl p-8 shadow-lg relative space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-oat-200">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800 font-mono">
                BLOCK A — FLOOR 2 CORRIDOR LAYOUT
              </span>
              <span className="text-xs bg-tangerine-100 text-tangerine-800 font-bold px-2 py-0.5 rounded">
                ⚠️ Active Crowd Event in East Wing
              </span>
            </div>

            {/* Architectural Corridor Diagram */}
            <div className="relative py-12 px-6 flex items-center justify-between">
              
              {/* Entrance */}
              <div className="p-4 bg-oat-200 rounded-2xl border border-oat-300 text-center text-xs font-bold text-gray-700">
                Main Staircase & Entrance
              </div>

              {/* Connecting Hallway */}
              <div className="flex-1 h-3 bg-purple-100 mx-4 rounded-full relative flex items-center justify-around border border-purple-200">
                <span className="text-[10px] text-purple-700 font-bold -top-5 absolute uppercase">
                  Central Transit Corridor (West to East)
                </span>
              </div>

              {/* Camera CAM-A-03 Node */}
              <div
                onClick={() => {
                  const cam = cameras.find(c => c.code === 'CAM-A-03');
                  if (cam) onSelectCamera(cam);
                }}
                className="p-3 bg-safety-50 border-2 border-safety-400 rounded-2xl cursor-pointer hover:scale-105 transition-all text-center shadow-sm"
              >
                <div className="flex items-center space-x-1 justify-center">
                  <Video className="w-4 h-4 text-safety-600" />
                  <span className="text-xs font-mono font-bold text-safety-800">CAM-A-03</span>
                </div>
                <span className="text-[10px] text-safety-700 block mt-0.5">West Wing • Normal</span>
              </div>

              {/* Connecting Hallway */}
              <div className="flex-1 h-3 bg-tangerine-200 mx-4 rounded-full relative flex items-center justify-around border border-tangerine-300">
                <span className="text-[10px] text-tangerine-800 font-bold -top-5 absolute uppercase animate-pulse">
                  High Crowd Zone
                </span>
              </div>

              {/* Camera CAM-A-02 Node (Active Crowd Warning) */}
              <div
                onClick={() => {
                  const inc = getIncidentForCam('CAM-A-02');
                  if (inc) onSelectIncident(inc);
                  else {
                    const cam = cameras.find(c => c.code === 'CAM-A-02');
                    if (cam) onSelectCamera(cam);
                  }
                }}
                className="p-4 bg-tangerine-50 border-2 border-tangerine-500 ring-4 ring-tangerine-200 rounded-2xl cursor-pointer hover:scale-105 transition-all text-center shadow-md animate-bounce-short"
              >
                <div className="flex items-center space-x-1.5 justify-center text-tangerine-800">
                  <AlertTriangle className="w-4 h-4 text-tangerine-600" />
                  <span className="text-xs font-mono font-black">CAM-A-02</span>
                </div>
                <span className="text-[11px] font-bold text-tangerine-900 block mt-1">
                  ⚠️ CROWD (12/8)
                </span>
                <span className="text-[10px] bg-tangerine-500 text-white px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                  View Alert
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FLOOR 2: BLOCK B - FLOOR 3 */}
        {/* ------------------------------------------------------------- */}
        {activeFloor === 'B3' && (
          <div className="w-full max-w-4xl bg-white border-2 border-emergency-300 rounded-3xl p-8 shadow-lg relative space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-oat-200">
              <span className="text-xs font-bold uppercase tracking-wider text-emergency-700 font-mono">
                BLOCK B — FLOOR 3 RESIDENTIAL WING
              </span>
              <span className="text-xs bg-emergency-100 text-emergency-700 font-bold px-2 py-0.5 rounded">
                🚨 Critical Fall Alert in Corridor 2
              </span>
            </div>

            <div className="relative py-12 px-6 flex items-center justify-between">
              <div className="p-4 bg-oat-200 rounded-2xl border border-oat-300 text-center text-xs font-bold text-gray-700">
                Stairway 3B
              </div>

              <div className="flex-1 h-3 bg-purple-100 mx-4 rounded-full relative flex items-center justify-around border border-purple-200">
                <span className="text-[10px] text-purple-700 font-bold -top-5 absolute uppercase">
                  Corridor 1 (Clear)
                </span>
              </div>

              {/* Node CAM-B-05 */}
              <div
                onClick={() => {
                  const cam = cameras.find(c => c.code === 'CAM-B-05');
                  if (cam) onSelectCamera(cam);
                }}
                className="p-3 bg-safety-50 border-2 border-safety-400 rounded-2xl cursor-pointer hover:scale-105 transition-all text-center shadow-sm"
              >
                <div className="flex items-center space-x-1 justify-center">
                  <Video className="w-4 h-4 text-safety-600" />
                  <span className="text-xs font-mono font-bold text-safety-800">CAM-B-05</span>
                </div>
                <span className="text-[10px] text-safety-700 block mt-0.5">West Wing • Normal</span>
              </div>

              <div className="flex-1 h-3 bg-emergency-200 mx-4 rounded-full relative flex items-center justify-around border border-emergency-300">
                <span className="text-[10px] text-emergency-700 font-bold -top-5 absolute uppercase">
                  Corridor 2 (Hazard Detected)
                </span>
              </div>

              {/* Node CAM-B-03 (Critical Fall) */}
              <div
                onClick={() => {
                  const inc = getIncidentForCam('CAM-B-03');
                  if (inc) onSelectIncident(inc);
                }}
                className="p-4 bg-emergency-50 border-2 border-emergency-600 ring-4 ring-emergency-200 rounded-2xl cursor-pointer hover:scale-105 transition-all text-center shadow-md animate-bounce-short"
              >
                <div className="flex items-center space-x-1.5 justify-center text-emergency-700">
                  <Flame className="w-4 h-4 text-emergency-600" />
                  <span className="text-xs font-mono font-black">CAM-B-03</span>
                </div>
                <span className="text-[11px] font-bold text-emergency-900 block mt-1">
                  🚨 POSSIBLE FALL (91%)
                </span>
                <span className="text-[10px] bg-emergency-600 text-white px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                  Immediate Verification
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FLOOR 3: BLOCK B - GROUND FLOOR */}
        {/* ------------------------------------------------------------- */}
        {activeFloor === 'B0' && (
          <div className="w-full max-w-4xl bg-white border-2 border-tangerine-300 rounded-3xl p-8 shadow-lg relative space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-oat-200">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 font-mono">
                BLOCK B — GROUND FLOOR & MAINTENANCE AREA
              </span>
              <span className="text-xs bg-tangerine-100 text-tangerine-800 font-bold px-2 py-0.5 rounded">
                ⚠️ Restricted Zone Perimeter Monitored
              </span>
            </div>

            <div className="relative py-12 px-6 flex items-center justify-between">
              <div className="p-4 bg-oat-200 rounded-2xl border border-oat-300 text-center text-xs font-bold text-gray-700">
                Ground Entry Lobby
              </div>

              <div className="flex-1 h-3 bg-purple-100 mx-4 rounded-full" />

              {/* Node CAM-B-06 */}
              <div
                onClick={() => {
                  const cam = cameras.find(c => c.code === 'CAM-B-06');
                  if (cam) onSelectCamera(cam);
                }}
                className="p-3 bg-safety-50 border-2 border-safety-400 rounded-2xl cursor-pointer hover:scale-105 transition-all text-center shadow-sm"
              >
                <div className="flex items-center space-x-1 justify-center">
                  <Video className="w-4 h-4 text-safety-600" />
                  <span className="text-xs font-mono font-bold text-safety-800">CAM-B-06</span>
                </div>
                <span className="text-[10px] text-safety-700 block mt-0.5">Bicycle Stand • Normal</span>
              </div>

              <div className="flex-1 h-3 bg-tangerine-200 mx-4 rounded-full" />

              {/* Node CAM-B-01 */}
              <div
                onClick={() => {
                  const inc = getIncidentForCam('CAM-B-01');
                  if (inc) onSelectIncident(inc);
                  else {
                    const cam = cameras.find(c => c.code === 'CAM-B-01');
                    if (cam) onSelectCamera(cam);
                  }
                }}
                className="p-4 bg-tangerine-50 border-2 border-tangerine-500 ring-4 ring-tangerine-200 rounded-2xl cursor-pointer hover:scale-105 transition-all text-center shadow-md"
              >
                <div className="flex items-center space-x-1.5 justify-center text-tangerine-800">
                  <AlertTriangle className="w-4 h-4 text-tangerine-600" />
                  <span className="text-xs font-mono font-black">CAM-B-01</span>
                </div>
                <span className="text-[11px] font-bold text-tangerine-900 block mt-1">
                  ⚠️ RESTRICTED ZONE
                </span>
                <span className="text-[10px] bg-tangerine-500 text-white px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                  Inspect
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
