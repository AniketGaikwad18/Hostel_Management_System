import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  MessageSquare,
  Users
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { audioAlert } from '../utils/audioAlert';

interface PresentationModeModalProps {
  onClose: () => void;
  onOpenWhatsAppPreview: (payload: any) => void;
  whatsappDemoMode?: boolean;
}

export const PresentationModeModal: React.FC<PresentationModeModalProps> = ({
  onClose,
  onOpenWhatsAppPreview,
  whatsappDemoMode = true,
}) => {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedDemo, setSelectedDemo] = useState<'crowd' | 'fall' | 'restricted'>('crowd');

  const demoData = {
    crowd: {
      name: 'CROWD DETECTED',
      camera: 'CAM-A-02',
      location: 'Block A • Floor 2 • East Corridor',
      snapshot: `${API_BASE_URL}/uploads/snapshots/demo_crowd.jpg`,
      people: 12,
      threshold: 8,
      severity: 'HIGH',
      confidence: '94%',
      code: 'INC-1041',
      obs: '12 people clustered in corridor, exceeding safe limit of 8.'
    },
    fall: {
      name: 'POSSIBLE FALL',
      camera: 'CAM-B-03',
      location: 'Block B • Floor 3 • South Corridor',
      snapshot: `${API_BASE_URL}/uploads/snapshots/demo_fall.jpg`,
      people: 1,
      threshold: 1,
      severity: 'CRITICAL',
      confidence: '91%',
      code: 'INC-1042',
      obs: 'Person detected in horizontal position for 7.2 seconds.'
    },
    restricted: {
      name: 'RESTRICTED AREA',
      camera: 'CAM-B-01',
      location: 'Block B • Ground Floor • Maintenance',
      snapshot: `${API_BASE_URL}/uploads/snapshots/demo_restricted.jpg`,
      people: 1,
      threshold: 0,
      severity: 'HIGH',
      confidence: '94%',
      code: 'INC-1040',
      obs: 'Unauthorized movement in maintenance corridor polygon zone.'
    }
  };

  const active = demoData[selectedDemo];

  const stages = [
    { num: 1, label: 'MONITORING' },
    { num: 2, label: 'DETECTED' },
    { num: 3, label: 'ALERTED' },
    { num: 4, label: 'ACKNOWLEDGED' },
    { num: 5, label: 'RESOLVED' }
  ];

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStage((prev) => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 5;
          }
          const next = prev + 1;
          if (next === 2) audioAlert.playSafetyChime();
          if (next === 3) {
            onOpenWhatsAppPreview({
              incidentCode: active.code,
              incidentType: active.name,
              location: active.location,
              confidence: active.confidence,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              severity: active.severity,
              isSimulated: whatsappDemoMode
            });
          }
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedDemo, active, onOpenWhatsAppPreview, whatsappDemoMode]);

  const handleNext = () => {
    if (currentStage < 5) {
      const next = currentStage + 1;
      setCurrentStage(next);
      if (next === 2) audioAlert.playSafetyChime();
      if (next === 3) {
        onOpenWhatsAppPreview({
          incidentCode: active.code,
          incidentType: active.name,
          location: active.location,
          confidence: active.confidence,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: active.severity,
          isSimulated: whatsappDemoMode
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentStage > 1) setCurrentStage(currentStage - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col justify-between p-6 md:p-8 font-sans animate-fade-in">
      
      {/* TOP BAR: Title, Scenario Tabs, Close */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">
              HOSTELGUARD AI
            </h1>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              "See the Risk. Prevent the Incident."
            </p>
          </div>
        </div>

        {/* Demo Selectors */}
        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => { setSelectedDemo('crowd'); setCurrentStage(1); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedDemo === 'crowd' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Crowd Demo
          </button>
          <button
            onClick={() => { setSelectedDemo('fall'); setCurrentStage(1); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedDemo === 'fall' ? 'bg-emergency-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Fall Demo
          </button>
          <button
            onClick={() => { setSelectedDemo('restricted'); setCurrentStage(1); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedDemo === 'restricted' ? 'bg-tangerine-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Restricted Demo
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* LARGE WORKFLOW INDICATOR ACROSS THE TOP */}
      <div className="py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {stages.map((st, i) => {
            const isPassed = st.num < currentStage;
            const isCurrent = st.num === currentStage;

            return (
              <React.Fragment key={st.num}>
                <div
                  onClick={() => setCurrentStage(st.num)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/30 scale-105 ring-2 ring-purple-400'
                      : isPassed
                      ? 'bg-gray-800 text-safety-400 font-bold'
                      : 'bg-gray-900/60 text-gray-500 font-semibold'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-mono font-bold ${
                    isCurrent ? 'bg-white text-purple-800' : isPassed ? 'bg-safety-500 text-gray-950' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isPassed ? '✓' : st.num}
                  </span>
                  <span className="text-xs tracking-wider uppercase">{st.label}</span>
                </div>

                {i < stages.length - 1 && (
                  <ChevronRight className={`w-4 h-4 ${st.num < currentStage ? 'text-purple-400' : 'text-gray-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* CENTER PROJECTOR STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2 flex-1 items-center max-w-6xl mx-auto w-full">
        
        {/* Big Video View (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="relative rounded-3xl overflow-hidden bg-gray-900 border-2 border-gray-800 aspect-video shadow-2xl flex items-center justify-center">
            <img
              src={currentStage >= 2 ? active.snapshot : `${API_BASE_URL}/uploads/snapshots/corridor_normal.jpg`}
              alt="Projector Feed"
              className="w-full h-full object-cover"
            />

            {/* Top HUD */}
            <div className="absolute top-3 left-3 bg-black/80 px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-safety-500 animate-pulse" />
              <span className="font-bold">{active.camera}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">{active.location}</span>
            </div>

            {/* Stage Status Tag */}
            <div className={`absolute top-3 right-3 px-3 py-1 rounded-xl text-xs font-bold ${
              currentStage >= 2 
                ? active.severity === 'CRITICAL' ? 'bg-emergency-600 text-white' : 'bg-tangerine-500 text-white'
                : 'bg-black/80 text-gray-300'
            }`}>
              {currentStage === 1 ? 'MONITORING NORMAL' : active.name}
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-3 left-3 right-3 bg-black/80 p-3 rounded-2xl border border-white/10 flex items-center justify-between text-xs font-mono">
              <span>People: <strong className="text-yellow-300">{currentStage >= 2 ? active.people : 3}</strong></span>
              <span>Confidence: <strong className="text-purple-400">{active.confidence}</strong></span>
              <span className="text-gray-300 text-[11px]">scan: live</span>
            </div>
          </div>
        </div>

        {/* Stage Story Card (5 cols) */}
        <div className="lg:col-span-5 bg-gray-900 p-6 rounded-3xl border border-gray-800 space-y-4">
          <div className="pb-2 border-b border-gray-800">
            <span className="text-xs uppercase font-bold text-purple-400 font-mono">
              Stage {currentStage} of 5
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              {stages[currentStage - 1].label}
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            {currentStage === 1 && (
              <p className="text-gray-300 leading-relaxed">
                HostelGuard AI is continuously ingesting camera feeds across hostel corridors. No anomalies detected.
              </p>
            )}

            {currentStage === 2 && (
              <div className="space-y-2">
                <p className="text-yellow-300 font-bold">
                  {selectedDemo === 'crowd' ? '⚠️ 12 people clustered (Limit: 8)' : selectedDemo === 'fall' ? '🚨 Horizontal posture persisting for 7.2s' : '⚠️ Movement in restricted maintenance corridor'}
                </p>
                <p className="text-xs text-gray-400 italic bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                  "{active.obs}"
                </p>
              </div>
            )}

            {currentStage === 3 && (
              <div className="space-y-2">
                <p className="text-purple-300 font-bold">
                  ✓ Real-time alert dispatched to Warden's mobile.
                </p>
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-xs font-mono text-gray-300 space-y-1">
                  <p className="text-green-400 font-bold">✓ WhatsApp Alert Delivered</p>
                  <p>Incident: {active.code}</p>
                  <p>Location: {active.location}</p>
                </div>
              </div>
            )}

            {currentStage === 4 && (
              <div className="space-y-2">
                <p className="text-purple-300 font-bold">
                  ✓ Chief Warden acknowledged incident on dashboard.
                </p>
                <p className="text-xs text-gray-400">
                  Warden is on floor conducting on-site verification. Response time logged: 1m 00s.
                </p>
              </div>
            )}

            {currentStage === 5 && (
              <div className="space-y-2">
                <p className="text-safety-400 font-bold">
                  ✓ Incident resolved. Closed-loop safety cycle complete.
                </p>
                <p className="text-xs text-gray-400">
                  Corridor verified safe. Active alert counter decremented. Audit log updated.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM CONTROLS */}
      <div className="border-t border-gray-800 pt-3 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>

          <button
            onClick={() => { setCurrentStage(1); setIsPlaying(false); }}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrev}
            disabled={currentStage === 1}
            className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-xl text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-mono font-bold text-gray-400">
            {currentStage} / 5
          </span>

          <button
            onClick={handleNext}
            disabled={currentStage === 5}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-30 rounded-xl text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
};
