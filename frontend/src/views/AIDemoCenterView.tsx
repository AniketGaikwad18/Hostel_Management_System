import React, { useState } from 'react';
import { triggerDemoScenario, acknowledgeIncident, resolveIncident, uploadCustomVideo } from '../services/api';
import { audioAlert } from '../utils/audioAlert';

interface AIDemoCenterViewProps {
  onRefreshIncidents: () => void;
  onSelectIncidentDetail?: (incidentId: number) => void;
}

export const AIDemoCenterView: React.FC<AIDemoCenterViewProps> = ({
  onRefreshIncidents,
}) => {
  const [activeScenario, setActiveScenario] = useState<'crowd' | 'fall' | 'restricted'>('crowd');
  const [isRunning, setIsRunning] = useState(false);
  const [demoState, setDemoState] = useState<'IDLE' | 'ANALYZING' | 'DETECTED' | 'ACKNOWLEDGED' | 'RESOLVED'>('IDLE');
  const [personCount, setPersonCount] = useState(5);
  const [videoProgress, setVideoProgress] = useState(0);
  const [activeIncidentId, setActiveIncidentId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const scenarioCards = {
    crowd: {
      name: 'CROWD',
      title: 'Crowd Detection',
      badge: 'CROWD DETECTED',
      camera: 'CAM-A-02',
      location: 'Block A • Floor 2 • East Corridor',
      thumbnail: '/snapshots/demo_crowd.jpg',
      threshold: 8,
      finalCount: 12,
      confidence: '94%',
      severity: 'HIGH'
    },
    fall: {
      name: 'PERSON FALL',
      title: 'Possible Person Fall',
      badge: 'POSSIBLE FALL',
      camera: 'CAM-B-03',
      location: 'Block B • Floor 3 • South Corridor',
      thumbnail: '/snapshots/demo_fall.jpg',
      threshold: 1,
      finalCount: 1,
      confidence: '91%',
      severity: 'CRITICAL'
    },
    restricted: {
      name: 'RESTRICTED AREA',
      title: 'Restricted Area Entry',
      badge: 'RESTRICTED AREA',
      camera: 'CAM-B-01',
      location: 'Block B • Ground Floor • Utility Access',
      thumbnail: '/snapshots/demo_restricted.jpg',
      threshold: 0,
      finalCount: 1,
      confidence: '94%',
      severity: 'HIGH'
    }
  };

  const current = scenarioCards[activeScenario];

  const handleSelectScenario = (sc: 'crowd' | 'fall' | 'restricted') => {
    setActiveScenario(sc);
    setDemoState('IDLE');
    setIsRunning(false);
    setPersonCount(sc === 'crowd' ? 5 : 1);
    setVideoProgress(0);
    setActiveIncidentId(null);
  };

  const handleStartDemo = () => {
    setIsRunning(true);
    setDemoState('ANALYZING');
    setPersonCount(activeScenario === 'crowd' ? 5 : 1);
    setVideoProgress(10);

    if (activeScenario === 'crowd') {
      const counts = [5, 6, 7, 8, 9, 10, 11, 12];
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < counts.length) {
          setPersonCount(counts[step]);
          setVideoProgress(Math.round((step / counts.length) * 85));
        } else {
          clearInterval(interval);
          setVideoProgress(100);
          triggerDetection();
        }
      }, 350);
    } else {
      setTimeout(() => {
        setVideoProgress(100);
        triggerDetection();
      }, 2000);
    }
  };

  const triggerDetection = async () => {
    setDemoState('DETECTED');
    if (activeScenario === 'fall') {
      audioAlert.playCriticalAlert();
    } else {
      audioAlert.playSafetyChime();
    }

    try {
      const res = await triggerDemoScenario(activeScenario);
      if (res.incident) {
        setActiveIncidentId(res.incident.id);
      }
      onRefreshIncidents();
    } catch (err) {
      console.error('Trigger demo error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAcknowledge = async () => {
    if (activeIncidentId) {
      try {
        await acknowledgeIncident(activeIncidentId, 'Warden');
      } catch (e) {}
    }
    setDemoState('ACKNOWLEDGED');
    onRefreshIncidents();
  };

  const handleResolve = async () => {
    if (activeIncidentId) {
      try {
        await resolveIncident(activeIncidentId, 'Warden', 'Corridor verified safe.');
      } catch (e) {}
    }
    setDemoState('RESOLVED');
    onRefreshIncidents();
  };

  const handleReset = () => {
    setDemoState('IDLE');
    setIsRunning(false);
    setPersonCount(activeScenario === 'crowd' ? 5 : 1);
    setVideoProgress(0);
    setActiveIncidentId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      await uploadCustomVideo(file, activeScenario, current.camera);
      alert(`CCTV Video "${file.name}" loaded successfully.`);
      onRefreshIncidents();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Timeline steps
  const timelineSteps = [
    { label: 'Video Analyzed', active: demoState !== 'IDLE', time: '10:24:08' },
    { label: activeScenario === 'crowd' ? 'Crowd Detected' : activeScenario === 'fall' ? 'Fall Detected' : 'Area Breach', active: demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED', time: '10:24:11', warn: true },
    { label: 'Incident Created', active: demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED', time: '10:24:12' },
    { label: 'WhatsApp Dispatched', active: demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED', time: '10:24:13', purple: true },
    { label: 'Android SMS Dispatched', active: demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED', time: '10:24:14', purple: true },
    { label: 'Warden Acknowledged', active: demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED', time: '10:24:45' },
    { label: 'Incident Resolved', active: demoState === 'RESOLVED', time: '10:25:02', green: true },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      
      {/* ─── HEADER ─── */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono font-bold text-purple-600">04</span>
          <span className="text-[10px] font-bold text-navy-900/30">—</span>
          <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">AI SAFETY LAB</span>
        </div>

        <h1 className="text-editorial-md text-navy-900">
          WATCH THE SYSTEM RESPOND.
        </h1>
        <p className="text-sm text-navy-900/50 font-medium max-w-lg">
          Run a real CCTV scenario and observe how HostelGuard detects and responds to an incident.
        </p>
      </section>

      <div className="editorial-line" />

      {/* ─── SCENARIO SELECTION: 3 PHOTOGRAPHIC CARDS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {(['crowd', 'fall', 'restricted'] as const).map((scKey) => {
          const sc = scenarioCards[scKey];
          const isSelected = activeScenario === scKey;

          return (
            <div
              key={scKey}
              onClick={() => handleSelectScenario(scKey)}
              className={`cursor-pointer group transition-all ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-90'}`}
            >
              {/* Photographic thumbnail */}
              <div className={`relative aspect-video rounded-md overflow-hidden bg-navy-900 mb-3 ${
                isSelected ? 'ring-2 ring-purple-600 ring-offset-2 ring-offset-oat-100' : ''
              }`}>
                <img
                  src={sc.thumbnail}
                  alt={sc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded text-white ${
                    scKey === 'fall' ? 'bg-emergency-500' : scKey === 'crowd' ? 'bg-tangerine-500' : 'bg-purple-600'
                  }`}>
                    {sc.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="text-xs font-bold text-navy-900">{sc.title}</h3>
              <p className="text-[10px] text-navy-900/40 font-medium font-mono">{sc.camera} • {sc.location.split('•')[0]}</p>
            </div>
          );
        })}
      </section>

      <div className="editorial-line" />

      {/* ─── MAIN DEMO: VIDEO + DETECTION + TIMELINE ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: LARGE CCTV VIDEO (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Camera info */}
          <div className="flex items-center justify-between text-[10px] font-bold text-navy-900/40 uppercase tracking-wider">
            <span>{current.camera} • {current.location}</span>
            <span className="text-safety-600">● 1080p CCTV Feed</span>
          </div>

          {/* 16:9 CCTV Video */}
          <div className="relative aspect-video rounded-md overflow-hidden bg-navy-900 shadow-editorial-lg">
            <img
              src={demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED' ? current.thumbnail : '/snapshots/corridor_normal.jpg'}
              alt="CCTV Demo Stream"
              className="w-full h-full object-cover"
            />

            {/* People count HUD */}
            <div className="cctv-timestamp absolute top-3 left-3">
              People: <span className="text-yellow-300 font-black">{personCount}</span>
            </div>

            {/* Timestamp */}
            <div className="cctv-timestamp absolute top-3 right-3">
              REC • 2024/10/28 22:15:34
            </div>

            {/* Detection overlay */}
            {(demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED') && (
              <div className={`absolute inset-x-[10%] inset-y-[8%] border-2 rounded-sm pointer-events-none flex items-start justify-between p-2 ${
                current.severity === 'CRITICAL' ? 'border-emergency-500 bg-emergency-500/10' : 'border-tangerine-500 bg-tangerine-500/10'
              }`}>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${
                  current.severity === 'CRITICAL' ? 'bg-emergency-500' : 'bg-tangerine-600'
                }`}>
                  {current.badge}
                </span>
                <span className="cctv-timestamp text-[9px]">
                  Confidence: {current.confidence}
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="absolute bottom-0 inset-x-0 bg-black/70 px-4 py-2 flex items-center space-x-3">
              <div className="flex-1 bg-white/20 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED' ? 100 : videoProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-white/60">
                {demoState !== 'IDLE' ? '0:20 / 0:20' : '0:00 / 0:20'}
              </span>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-navy-900/40 hover:text-purple-600 cursor-pointer flex items-center space-x-1.5 transition-colors">
              <span>↑</span>
              <span>{uploading ? 'Uploading...' : 'Upload CCTV Video'}</span>
              <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="text-[11px] font-bold text-navy-900/40 hover:text-navy-900 px-3 py-2 rounded-md border border-oat-300 transition-colors uppercase tracking-wider"
              >
                Reset
              </button>
              <button
                onClick={handleStartDemo}
                disabled={isRunning}
                className="bg-purple-600 hover:bg-purple-800 disabled:opacity-50 text-white text-[11px] font-bold px-5 py-2 rounded-md transition-all uppercase tracking-[0.15em]"
              >
                {isRunning ? 'Analyzing...' : '▶ Start Demo'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: DETECTION + ALERT + TIMELINE (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ─── DETECTION STATUS ─── */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-navy-900/30 uppercase tracking-wider block">AI Detection</span>

            {demoState === 'IDLE' && (
              <p className="text-xs text-navy-900/30 font-medium py-4 text-center border border-dashed border-oat-300 rounded-md">
                Click "Start Demo" to run AI detection.
              </p>
            )}

            {demoState === 'ANALYZING' && (
              <div className="py-3 px-4 bg-purple-50 border border-purple-200 rounded-md text-xs font-bold text-purple-600 animate-pulse flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                <span>ANALYZING FRAMES...</span>
              </div>
            )}

            {(demoState === 'DETECTED' || demoState === 'ACKNOWLEDGED' || demoState === 'RESOLVED') && (
              <div className="space-y-3 animate-fade-in">
                <div className={`text-xs font-black text-white text-center py-2.5 rounded-md uppercase tracking-wider ${
                  current.severity === 'CRITICAL' ? 'bg-emergency-500' : 'bg-tangerine-500'
                }`}>
                  {current.severity === 'CRITICAL' ? '🚨' : '⚠'} {current.badge}
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-oat-200">
                    <span className="text-navy-900/40 font-medium">People</span>
                    <span className="font-black text-navy-900">{current.finalCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-oat-200">
                    <span className="text-navy-900/40 font-medium">Confidence</span>
                    <span className="font-bold text-purple-600">{current.confidence}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-navy-900/40 font-medium">Severity</span>
                    <span className={`font-black uppercase ${current.severity === 'CRITICAL' ? 'text-emergency-500' : 'text-tangerine-500'}`}>
                      {current.severity}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="editorial-line" />

          {/* ─── WARDEN ALERT STATUS ─── */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-navy-900/30 uppercase tracking-wider block">Warden Alert</span>

            {demoState === 'IDLE' || demoState === 'ANALYZING' ? (
              <p className="text-xs text-navy-900/30 font-medium py-3 text-center">
                Awaiting detection trigger...
              </p>
            ) : (
              <div className="space-y-2.5 animate-fade-in">
                <div className="flex items-center space-x-2 text-xs font-bold text-safety-600">
                  <span>✓</span>
                  <span>Incident created</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-safety-600">
                  <span>✓</span>
                  <span>WhatsApp sent to warden</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-safety-600">
                  <span>✓</span>
                  <span>SMS sent via Android SIM</span>
                </div>

                <div className="space-y-2 pt-2">
                  {demoState !== 'ACKNOWLEDGED' && demoState !== 'RESOLVED' && (
                    <button
                      onClick={handleAcknowledge}
                      className="w-full bg-navy-900 text-white text-[11px] font-bold py-2.5 rounded-md hover:bg-navy-50 transition-colors uppercase tracking-wider"
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                  {demoState !== 'RESOLVED' && (
                    <button
                      onClick={handleResolve}
                      className="w-full bg-safety-600 text-white text-[11px] font-bold py-2.5 rounded-md hover:bg-safety-700 transition-colors uppercase tracking-wider"
                    >
                      ✓ Mark as Resolved
                    </button>
                  )}
                  {demoState === 'RESOLVED' && (
                    <div className="py-2.5 bg-safety-50 border border-safety-200 text-safety-600 text-xs font-bold rounded-md text-center">
                      ✓ Incident Resolved
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="editorial-line" />

          {/* ─── 05 — RESPONSE TIMELINE ─── */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-[11px] font-mono font-bold text-purple-600">05</span>
              <span className="text-[10px] font-bold text-navy-900/30">—</span>
              <span className="text-[10px] font-bold text-navy-900 uppercase tracking-wider">RESPONSE</span>
            </div>

            <div className="space-y-0">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 relative">
                  {/* Line */}
                  {idx < timelineSteps.length - 1 && (
                    <div className={`absolute left-[5px] top-4 w-px h-6 ${step.active ? 'bg-purple-300' : 'bg-oat-300'}`} />
                  )}
                  {/* Dot */}
                  <div className={`w-[11px] h-[11px] rounded-full mt-0.5 flex-shrink-0 border-2 ${
                    step.active
                      ? step.green ? 'bg-safety-500 border-safety-500' 
                        : step.warn ? 'bg-tangerine-500 border-tangerine-500'
                        : step.purple ? 'bg-purple-600 border-purple-600'
                        : 'bg-navy-900 border-navy-900'
                      : 'bg-oat-200 border-oat-300'
                  }`} />
                  {/* Label */}
                  <div className="flex items-center justify-between flex-1 pb-4">
                    <span className={`text-[11px] font-bold ${step.active ? 'text-navy-900' : 'text-navy-900/25'}`}>
                      {step.label}
                    </span>
                    <span className={`text-[10px] font-mono ${step.active ? 'text-navy-900/40' : 'text-navy-900/15'}`}>
                      {step.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
