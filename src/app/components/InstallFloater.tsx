// src/components/InstallFloater.tsx (Tailwind Version)

import React, { useState, useEffect } from 'react';

// Type definitions (Keep the same as the previous response)
declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const InstallFloater: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener); 

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  // Check if already installed (also prevents the floater from showing)
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setShowInstall(false);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); 
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to the install prompt: ${outcome}`);

      setShowInstall(false); 
      setDeferredPrompt(null);
    }
  };

  if (!showInstall) {
    return null;
  }

  return (
    // Floater Container (Sticky/Fixed to the bottom)
    <div className="fixed bottom-0 left-0 w-full bg-cyan-900 text-white p-3 z-50 shadow-2xl">
      <div className="flex items-center justify-between max-w-xl mx-auto">
        
        {/* Text */}
        <p className="text-sm sm:text-base font-medium">
          Install the app for a faster, full-screen experience!
        </p>

        {/* Buttons Group */}
        <div className="flex items-center space-x-3">
          
          {/* Install Button */}
          <button 
            onClick={handleInstallClick} 
            className="bg-white text-cyan-900 font-semibold px-4 py-1 rounded-full text-sm hover:bg-gray-200 transition"
          >
            Install
          </button>
          
          {/* Close Button */}
          <button 
            onClick={() => setShowInstall(false)} 
            className="text-white hover:text-gray-300 transition text-2xl"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallFloater;