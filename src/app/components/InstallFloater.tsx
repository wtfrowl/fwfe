// src/components/InstallFloater.tsx

import React, { useState, useEffect } from 'react';

// 1. Define a type for the deferred prompt event
// The BeforeInstallPromptEvent is not standard, so we augment the Window interface.
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
  // State to hold the deferred prompt event, typed as the custom interface or null
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // State to control the visibility of the floater
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // 2. Use the custom type in the event listener
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    // We cast window to 'any' here if TypeScript complains about adding a custom event type 
    // without a full global augmentation setup, but using WindowEventMap often works.
    window.addEventListener('beforeinstallprompt', handler as EventListener); 

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  // Check if already installed
  useEffect(() => {
    // Note: window.navigator.standalone is specific to iOS Safari
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setShowInstall(false);
    }
  }, []);

  // 3. Handle the install button click
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the browser's native installation prompt
      deferredPrompt.prompt(); 

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to the install prompt: ${outcome}`);

      // Hide the floater
      setShowInstall(false); 
      setDeferredPrompt(null);
    }
  };

  if (!showInstall) {
    return null;
  }

  return (
    <div className="install-floater">
      <div className="install-content">
        <p>Install the app for a full-screen experience!</p>
        <button 
          onClick={handleInstallClick} 
          className="install-button"
        >
          Install App
        </button>
        <button 
          onClick={() => setShowInstall(false)} 
          className="close-button"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default InstallFloater;