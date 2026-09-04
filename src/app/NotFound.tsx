import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import truckIcon from "../assets/truck.svg";
import { Button } from "../components/ui/Button";
import { spring } from "../motion/springs";

/**
 * The catch-all route.
 *
 * It was previously `<div>404 Page Not Found</div>` — unstyled, outside any
 * layout, with no way back. A wrong URL is the one moment a user is already
 * unsure where they are, so this page answers the two wayfinding questions
 * that matter: what happened, and how do I get out.
 */
export default function NotFound() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <motion.div
        data-motion="transform"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
        className="w-full max-w-md rounded-sheet border border-hairline bg-surface p-8 text-center shadow-[var(--shadow-floating)]"
      >
        <img src={truckIcon} className="mx-auto h-14 w-14" alt="" />

        <p className="text-caption mt-5 text-sm font-semibold uppercase text-ink-tertiary">
          Error 404
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">This page took a wrong turn</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          The page you're looking for doesn't exist, or it may have moved.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate(-1)}>Go back</Button>
          <Button variant="secondary" onClick={() => navigate("/")}>
            Start over
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
