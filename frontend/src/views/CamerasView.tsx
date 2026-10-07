import React from 'react';
import { Camera } from '../types';

interface CamerasViewProps {
  cameras: Camera[];
  onSelectCamera: (cam: Camera) => void;
}

export const CamerasView: React.FC<CamerasViewProps> = ({
  cameras,
  onSelectCamera,
}) => {
  const getDetectionLabel = (cam: Camera) => {
    if (cam.current_status === 'CRITICAL') return '🚨 POSSIBLE FALL';
    if (cam.current_status === 'WARNING') return '⚠ CROWD DETECTED';
    return null;
  };

  const getSnapshot = (code: string) => {
    if (code === 'CAM-A-01') return '/snapshots/corridor_normal.jpg';
    if (code === 'CAM-A-02') return '/snapshots/cam-a-02_incident.jpg';
    if (code === 'CAM-B-01') return '/snapshots/cam-b-01_incident.jpg';
    if (code === 'CAM-B-03') return '/snapshots/cam-b-03_incident.jpg';
    return '/snapshots/corridor_normal.jpg';
  };

  const fallbackCameras: Camera[] = [
    {
      id: 1,
      code: 'CAM-A-01',
      name: 'Main Corridor',
      block: 'Block A',
      floor: 'Floor 1',
      corridor: 'Main Corridor',
      is_online: true,
      current_status: 'NORMAL',
      people_count: 3,
      crowd_threshold: 8,
      stream_type: 'SIMULATED'
    },
    {
      id: 2,
      code: 'CAM-A-02',
      name: 'East Corridor',
      block: 'Block A',
      floor: 'Floor 2',
      corridor: 'East Corridor',
      is_online: true,
      current_status: 'WARNING',
      people_count: 12,
      crowd_threshold: 8,
      stream_type: 'SIMULATED'
    },
    {
      id: 3,
      code: 'CAM-B-01',
      name: 'Maintenance Corridor',
      block: 'Block B',
      floor: 'Ground Floor',
      corridor: 'Maintenance Corridor',
      is_online: true,
      current_status: 'NORMAL',
      people_count: 0,
      crowd_threshold: 0,
      stream_type: 'SIMULATED'
    },
    {
      id: 4,
      code: 'CAM-B-03',
      name: 'South Corridor',
      block: 'Block B',
      floor: 'Floor 3',
      corridor: 'South Corridor',
      is_online: true,
      current_status: 'CRITICAL',
      people_count: 1,
      crowd_threshold: 1,
      stream_type: 'SIMULATED'
    }
  ];

  const displayCameras = cameras.length > 0 ? cameras : fallbackCameras;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* ─── HEADER ─── */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono font-bold text-purple-600">06</span>
          <span className="text-[10px] font-bold text-navy-900/30">—</span>
          <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">CAMERAS</span>
        </div>

        <p className="text-sm text-navy-900/50 font-medium">
          Hostel CCTV network and real-time AI states.
        </p>
      </section>

      <div className="editorial-line" />

      {/* ─── CAMERA GRID ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayCameras.map((cam, idx) => {
          const isCrit = cam.current_status === 'CRITICAL';
          const isWarn = cam.current_status === 'WARNING';
          const detectionLabel = getDetectionLabel(cam);
          const snapshotUrl = getSnapshot(cam.code);

          return (
            <div
              key={cam.id}
              className="space-y-3 animate-fade-in"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              {/* Camera metadata */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{cam.code}</span>
                  <span className="font-bold text-navy-900/40 uppercase tracking-wider">
                    {cam.block} • {cam.floor} • {cam.corridor}
                  </span>
                </div>
                <span className="flex items-center space-x-1 font-bold text-safety-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-safety-500 animate-pulse-dot" />
                  <span>ONLINE</span>
                </span>
              </div>

              {/* Large 16:9 CCTV Thumbnail */}
              <div className={`relative aspect-video rounded-md overflow-hidden bg-navy-900 shadow-editorial cursor-pointer group transition-shadow hover:shadow-editorial-hover ${
                isCrit ? 'ring-1 ring-emergency-500/40' : isWarn ? 'ring-1 ring-tangerine-500/40' : ''
              }`}
              onClick={() => onSelectCamera(cam)}
              >
                <img
                  src={snapshotUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />

                {/* CCTV Timestamp */}
                <div className="cctv-timestamp absolute top-3 right-3">
                  REC • {new Date().toLocaleDateString('en-GB').replace(/\//g, '/')}
                </div>

                {/* Detection badge */}
                {detectionLabel && (
                  <div className="absolute top-3 left-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded text-white ${
                      isCrit ? 'bg-emergency-500' : 'bg-tangerine-500'
                    }`}>
                      {detectionLabel}
                    </span>
                  </div>
                )}

                {/* Bottom HUD */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                  <span className={`text-[10px] font-bold ${
                    isCrit ? 'text-red-300' : isWarn ? 'text-yellow-300' : 'text-green-300'
                  }`}>
                    AI: {detectionLabel || 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Detection info below */}
              {detectionLabel && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${isCrit ? 'text-emergency-500' : 'text-tangerine-500'}`}>
                    {detectionLabel}
                  </span>
                  <button
                    onClick={() => onSelectCamera(cam)}
                    className="font-bold text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider"
                  >
                    Open Camera →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>

    </div>
  );
};
