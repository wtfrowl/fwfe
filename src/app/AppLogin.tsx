import { useState, useContext, useEffect, useId, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import truckIcon from "../assets/truck.svg";
import { login } from "../api/auth.api";
import { AuthContext } from "../context/AuthContext";
import { getHomePath } from "../utils/auth";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { inputClasses } from "../components/ui/inputStyles";
import { InlineMessage } from "../components/ui/InlineMessage";
import { spring } from "../motion/springs";
import { cn } from "../utils/cn";

interface LoginData {
  contactNumber: string;
  password: string;
}

interface ErrorMessages {
  contactNumber?: string;
  password?: string;
  [key: string]: string | undefined;
}

type Role = "owner" | "driver";

/**
 * Owner / driver switch.
 *
 * The old control was a checkbox styled as an iOS toggle with the two roles
 * labelled either side of it — which never says which state means what. Two
 * named segments and a knob that slides between them answer that at a glance,
 * and the knob is a shared element so the movement is continuous.
 */
function RoleSwitch({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  const reduced = useReducedMotion();
  const layoutId = `role-${useId()}`;

  return (
    <div className="flex rounded-control bg-ink/10 p-0.5" role="radiogroup" aria-label="Account type">
      {(["driver", "owner"] as Role[]).map((option) => {
        const active = role === option;
        return (
          <motion.button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              "relative flex-1 rounded-[0.625rem] px-3 py-1.5 text-sm font-semibold capitalize",
              "transition-colors duration-150",
              active ? "text-ink" : "text-ink-tertiary hover:text-ink-secondary"
            )}
            whileTap={reduced ? { opacity: 0.7 } : { scale: 0.97 }}
            transition={spring.snappy}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-[0.625rem] bg-surface shadow-[var(--shadow-key)] ring-1 ring-hairline-strong"
                transition={spring.move}
              />
            )}
            {option}
          </motion.button>
        );
      })}
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();

  const [role, setRole] = useState<Role>(() =>
    location.pathname.includes("owner") ? "owner" : "driver"
  );
  const isOwner = role === "owner";

  const [errMsg, setErrMsg] = useState<ErrorMessages>({});
  const [loginErr, setLoginErr] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({ contactNumber: "", password: "" });

  const {
    ownerLogin,
    driverLogin,
    isAuthenticated,
    role: authRole,
    isReady,
  } = useContext(AuthContext);

  useEffect(() => {
    document.title = isOwner ? "Owner login · FleetWise" : "Driver login · FleetWise";
    if (isReady && isAuthenticated && authRole) {
      navigate(getHomePath(authRole), { replace: true });
    }
  }, [authRole, isAuthenticated, isOwner, isReady, navigate]);

  useEffect(() => {
    const newPath = isOwner ? "/owner-login" : "/driver-login";
    if (location.pathname !== newPath) {
      /* Replace, not push — flipping the switch three times should not mean
         three presses of the back button to leave the page. */
      navigate(newPath, { replace: true });
    }
  }, [isOwner, location.pathname, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    setIsLoading(true);
    setErrMsg({});

    try {
      const res = await login(loginData, isOwner);
      if (isOwner) ownerLogin(res);
      else driverLogin(res);
      navigate(isOwner ? "/owner-home" : "/driver-home", { replace: true });
    } catch (error: unknown) {
      const authError = error as {
        statusCode?: number;
        message?: string;
        details?: Array<{ path: string; msg: string }>;
      };
      if (authError.statusCode === 401) {
        setLoginErr(authError.message ?? "That number and password don't match.");
      } else if (authError.details) {
        const errObj: ErrorMessages = {};
        authError.details.forEach((err) => {
          errObj[err.path] = err.msg;
        });
        setErrMsg(errObj);
      } else {
        setLoginErr(authError.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="material-regular sticky top-0 z-30 border-b border-hairline/70">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-control"
            aria-label="FleetWise home"
          >
            <img src={truckIcon} alt="" className="h-9 w-9" />
            <span className="text-base font-semibold text-ink-vibrant">FleetWise</span>
          </button>
          <p className="text-sm text-ink-vibrant-secondary">
            Need an account?{" "}
            <Link
              className="font-semibold text-accent hover:underline"
              to={isOwner ? "/owner-signup" : "/driver-signup"}
            >
              Register
            </Link>
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <motion.div
          data-motion="transform"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
          className="w-full max-w-md rounded-sheet border border-hairline bg-surface p-6 shadow-[var(--shadow-floating)] sm:p-8"
        >
          <div className="mb-6 space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
              <p className="mt-1 text-sm text-ink-secondary">
                Sign in to manage your {isOwner ? "fleet" : "trips"}.
              </p>
            </div>
            <RoleSwitch role={role} onChange={setRole} />
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <FormField
              label="Mobile number"
              htmlFor="contactNumber"
              error={errMsg.contactNumber}
              required
            >
              <input
                id="contactNumber"
                type="tel"
                name="contactNumber"
                inputMode="numeric"
                autoComplete="tel"
                pattern="\d*"
                maxLength={10}
                required
                value={loginData.contactNumber}
                onChange={handleChange}
                className={cn(inputClasses, errMsg.contactNumber && "border-critical")}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              error={errMsg.password}
              hint="6 characters"
              required
            >
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                maxLength={6}
                value={loginData.password}
                onChange={handleChange}
                className={cn(inputClasses, errMsg.password && "border-critical")}
              />
            </FormField>

            <InlineMessage tone="error">{loginErr}</InlineMessage>

            <Button type="submit" fullWidth loading={isLoading}>
              Sign in
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

export default Login;
