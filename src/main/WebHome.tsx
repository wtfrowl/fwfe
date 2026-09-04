import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { FaArrowRight } from "react-icons/fa";
import truckIcon from "../assets/truck.svg";
import driverIcon from "../assets/drivericon.svg";
import ownerIcon from "../assets/ownerIcon.svg";
import InstallFloater from "../app/components/InstallFloater";
import { AuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { spring, ease } from "../motion/springs";

function WebHome() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { user, role } = useContext(AuthContext);

  const handleContinue = () => {
    navigate(role === "owner" ? "/owner-home" : "/driver-home");
  };

  /* Both of these were `<button>` elements — one wrapping a `<Link>`, one
     with an onClick — so the two identical-looking choices were built two
     different ways, and the nested anchor-in-button was invalid markup. */
  const roleChoices = [
    { icon: ownerIcon, label: "Continue as fleet owner", to: "/owner-login" },
    { icon: driverIcon, label: "Continue as driver", to: "/driver-login" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <motion.div
          data-motion="transform"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
          className="w-full max-w-md rounded-sheet border border-hairline bg-surface p-6 shadow-[var(--shadow-floating)] sm:p-10"
        >
          <img src={truckIcon} loading="lazy" className="h-14 w-14" alt="" />

          <h1 className="mt-5 text-3xl font-semibold text-ink">
            Manage your fleet with ease
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Track trucks, trips, documents and running costs in one place.
          </p>

          {user && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={ease.enter}
              className="mt-6 rounded-card border border-positive/25 bg-positive-soft p-4"
            >
              <p className="text-sm text-positive-ink">
                You're already signed in as a {role}.
              </p>
              <Button size="sm" className="mt-3" onClick={handleContinue}>
                Continue to dashboard
                <FaArrowRight className="h-3 w-3" />
              </Button>
            </motion.div>
          )}

          <div className="mt-8 space-y-3">
            {roleChoices.map((choice) => (
              <motion.button
                key={choice.to}
                type="button"
                onClick={() => navigate(choice.to)}
                className="flex w-full items-center gap-3 rounded-control border border-hairline bg-surface px-4 py-3.5 text-left transition-colors duration-150 hover:border-accent hover:bg-accent-soft"
                whileTap={reduced ? { opacity: 0.7 } : { scale: 0.98 }}
                transition={spring.snappy}
              >
                <img src={choice.icon} className="h-5 w-5 shrink-0" alt="" />
                <span className="flex-1 text-sm font-semibold text-ink">{choice.label}</span>
                <FaArrowRight className="h-3 w-3 shrink-0 text-ink-quaternary" />
              </motion.button>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-ink-tertiary">Built by humans.</p>
        </motion.div>
      </main>

      <InstallFloater />
    </div>
  );
}

export default WebHome;
