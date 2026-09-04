import { useContext, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { motion, useReducedMotion } from "motion/react";
import truckIcon from "../assets/truck.svg";
import { AuthContext } from "../context/AuthContext";
import { getHomePath } from "../utils/auth";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { inputClasses } from "../components/ui/inputStyles";
import { InlineMessage } from "../components/ui/InlineMessage";
import { spring } from "../motion/springs";
import { cn } from "../utils/cn";

interface ErrorMessage {
  [key: string]: string;
}
interface ErrorResponse {
  errors: { path: string; msg: string }[];
}

interface Field {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  full?: boolean;
}

export default function Signup() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const isDriver = location.pathname === "/driver-signup";
  const { isAuthenticated, role } = useContext(AuthContext);

  const [errMsg, setErrMsg] = useState<ErrorMessage>({});
  const [formError, setFormError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [signupData, setSignupData] = useState<Record<string, string>>({
    firstName: "",
    lastName: "",
    age: "",
    contactNumber: "",
    password: "",
    street: "",
    city: "",
    state: "",
    ...(isDriver ? { aadharNumber: "", license: "", rating: "None" } : {}),
  });

  useEffect(() => {
    document.title = isDriver ? "Driver sign up · FleetWise" : "Owner sign up · FleetWise";
    if (isAuthenticated && role) {
      navigate(getHomePath(role), { replace: true });
    }
  }, [isAuthenticated, isDriver, navigate, role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setErrMsg({});

    const endpoint = isDriver ? "driver" : "owner";

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/${endpoint}`,
        signupData
      );
      if (res.status === 201) {
        navigate(isDriver ? "/driver-login" : "/owner-login", { replace: true });
      }
    } catch (err) {
      const axiosErr = err as AxiosError;
      const data = axiosErr.response?.data as ErrorResponse | undefined;

      if (data?.errors) {
        const errObj: ErrorMessage = {};
        data.errors.forEach((error) => {
          errObj[error.path] = error.msg;
        });
        setErrMsg(errObj);
        setFormError("Please fix the highlighted fields.");
      } else {
        /* Any non-validation failure — a 500, a network drop — used to be
           swallowed entirely: the catch only handled `errors`, so the button
           simply did nothing and the user had no idea why. */
        setFormError("We couldn't create your account. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fields: Field[] = [
    { label: "First name", name: "firstName", autoComplete: "given-name" },
    { label: "Last name", name: "lastName", autoComplete: "family-name" },
    { label: "Mobile number", name: "contactNumber", type: "tel", autoComplete: "tel" },
    {
      label: "Password",
      name: "password",
      type: "password",
      autoComplete: "new-password",
      hint: "6 characters",
    },
    ...(isDriver
      ? [
          { label: "Aadhaar number", name: "aadharNumber" },
          { label: "Licence number", name: "license" },
        ]
      : []),
    { label: "Age", name: "age", type: "number" },
    { label: "Street", name: "street", autoComplete: "address-line1", full: true },
    { label: "City", name: "city", autoComplete: "address-level2" },
    { label: "State", name: "state", autoComplete: "address-level1" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="material-regular sticky top-0 z-30 border-b border-hairline/70">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 md:px-6">
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
            Already registered?{" "}
            <Link
              className="font-semibold text-accent hover:underline"
              to={isDriver ? "/driver-login" : "/owner-login"}
            >
              Sign in
            </Link>
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center p-4 sm:p-6">
        <motion.div
          data-motion="transform"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
          className="w-full max-w-2xl rounded-sheet border border-hairline bg-surface p-6 shadow-[var(--shadow-floating)] sm:p-8"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-ink">
              Create your {isDriver ? "driver" : "owner"} account
            </h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {isDriver
                ? "So your owner can assign you trips and see your progress."
                : "So you can track trucks, trips and running costs in one place."}
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* The fields used to live in a 480px-tall inner scroll area, so
                the form scrolled inside a page that also scrolled and the
                submit button sat outside the fields it belonged to. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map(({ label, name, type = "text", autoComplete, hint, full }) => (
                <FormField
                  key={name}
                  label={label}
                  htmlFor={name}
                  error={errMsg[name]}
                  hint={hint}
                  required
                  className={full ? "sm:col-span-2" : undefined}
                >
                  <input
                    id={name}
                    className={cn(inputClasses, errMsg[name] && "border-critical")}
                    type={type}
                    name={name}
                    inputMode={type === "tel" || type === "number" ? "numeric" : undefined}
                    autoComplete={autoComplete}
                    value={signupData[name] ?? ""}
                    onChange={handleChange}
                    required
                  />
                </FormField>
              ))}
            </div>

            <InlineMessage tone="error">{formError}</InlineMessage>

            <Button type="submit" fullWidth loading={submitting}>
              Create account
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
