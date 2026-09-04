import React, { useState, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { spring, ease } from "../../motion/springs";
import { Button } from "../../components/ui/Button";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISSED_KEY = "fw-install-dismissed";

const InstallFloater: React.FC = () => {
  const reduced = useReducedMotion();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();

      /* Dismissing this used to last exactly one page load — the banner came
         straight back on the next navigation, which is how a helpful prompt
         turns into nagging. */
      try {
        if (localStorage.getItem(DISMISSED_KEY)) return;
      } catch {
        // Private mode or blocked storage: fall through and show it.
      }

      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (installed) setShowInstall(false);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShowInstall(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to do — the banner still closes for this session.
    }
    setShowInstall(false);
  };

  return (
    <AnimatePresence>
      {showInstall && (
        <motion.div
          data-motion="transform"
          /* Enters from the bottom and leaves the same way. A banner that
             slides up and then fades in place reads as two different objects. */
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
          transition={reduced ? ease.enter : spring.sheet}
          className="material-thick fixed inset-x-0 bottom-0 z-40 border-t border-hairline shadow-[var(--shadow-floating)]"
          role="region"
          aria-label="Install FleetWise"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm font-medium text-ink-vibrant">
              Install FleetWise for a faster, full-screen experience.
            </p>

            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" onClick={handleInstallClick}>
                Install
              </Button>
              <motion.button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-tertiary hover:bg-ink/6 hover:text-ink"
                whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
                transition={spring.snappy}
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallFloater;
