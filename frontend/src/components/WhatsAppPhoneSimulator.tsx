import React, { useState, useEffect } from 'react';
import { X, CheckCheck, Shield, ArrowLeft } from 'lucide-react';

export interface WhatsAppNotificationPayload {
  incidentCode: string;
  incidentType: string;
  location: string;
  confidence: string | number;
  time: string;
  severity: string;
  messageBody?: string;
  isSimulated?: boolean;
}

interface WhatsAppPhoneSimulatorProps {
  notification: WhatsAppNotificationPayload | null;
  onClose: () => void;
}

export const WhatsAppPhoneSimulator: React.FC<WhatsAppPhoneSimulatorProps> = ({
  notification,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
    }
  }, [notification]);

  if (!notification || !isVisible) return null;

  const isCritical = notification.severity === 'CRITICAL';
  const icon = isCritical ? '🚨' : '⚠️';
  const label = notification.incidentType.includes('FALL') 
    ? 'Possible person fall detected'
    : notification.incidentType.includes('RESTRICTED') 
    ? 'Restricted area movement detected'
    : 'Crowd detected';

  const defaultBody = (
    `🚨 HOSTELGUARD AI\n` +
    `SAFETY ALERT\n\n` +
    `${icon} ${label}\n\n` +
    `📍 ${notification.location}\n\n` +
    `${notification.incidentType.includes('CROWD') ? '👥 People: 12\nThreshold: 8\n\n' : ''}` +
    `📊 Confidence: ${notification.confidence}\n\n` +
    `🕐 ${notification.time}\n\n` +
    `Severity: ${notification.severity.toUpperCase()}\n\n` +
    `Please verify the situation.\n\n` +
    `Incident ID: ${notification.incidentCode}`
  );

  const displayText = notification.messageBody || defaultBody;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-short shadow-2xl transition-all">
      {/* Smartphone Shell */}
      <div className="w-76 md:w-80 bg-gray-900 rounded-3xl border-4 border-gray-800 overflow-hidden shadow-modal font-sans flex flex-col">
        
        {/* Top Notch */}
        <div className="bg-gray-950 px-4 pt-2 pb-1 flex items-center justify-between text-[10px] text-gray-400">
          <span>{notification.time || '10:24 PM'}</span>
          <div className="w-12 h-2.5 bg-gray-800 rounded-full mx-auto" />
          <div className="flex items-center space-x-1">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* WhatsApp App Header */}
        <div className="bg-[#075E54] text-white px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="hover:bg-white/10 p-0.5 rounded-full text-white">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs text-white border border-white/20">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">HostelGuard AI</p>
              <p className="text-[9px] text-green-200">Official Safety Channel</p>
            </div>
          </div>

          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full text-white" title="Close Preview">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator Banner */}
        <div className={`px-3 py-1 text-center text-[10px] font-bold border-b ${
          notification.isSimulated !== false 
            ? 'bg-tangerine-100 text-tangerine-900 border-tangerine-200' 
            : 'bg-green-100 text-green-900 border-green-200'
        }`}>
          {notification.isSimulated !== false ? '✓ Demo notification generated' : '✓ WhatsApp Alert Sent'}
        </div>

        {/* Chat Area */}
        <div 
          className="p-3 bg-[#E5DDD5] min-h-[250px] max-h-[320px] overflow-y-auto space-y-2"
          style={{
            backgroundImage: `radial-gradient(#00000010 1px, transparent 1px)`,
            backgroundSize: '12px 12px'
          }}
        >
          {/* Message Bubble */}
          <div className="flex justify-start">
            <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[95%] shadow-sm border border-gray-200/60 relative">
              <pre className="text-xs text-gray-900 font-mono whitespace-pre-wrap leading-tight break-words">
                {displayText}
              </pre>
              <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-gray-400">
                <span>{notification.time || '10:24 PM'}</span>
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Dismiss Bar */}
        <div className="bg-[#F0F0F0] px-3 py-2 border-t border-gray-300 flex items-center justify-between text-xs text-gray-500">
          <span className="text-[10px] font-semibold text-gray-600">Warden Phone Delivery</span>
          <button 
            onClick={onClose}
            className="bg-purple-600 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
