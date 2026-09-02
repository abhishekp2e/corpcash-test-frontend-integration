import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const REDIRECT_SECONDS = 3;

/**
 * Generic "no access" screen.
 * Shows a countdown and redirects to /dashboard after REDIRECT_SECONDS.
 */
export default function AccessDeniedPage({ requiredRole, currentRole }) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    const redirect = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, REDIRECT_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="access-denied">
      <div className="access-denied-card">
        <p className="eyebrow">Access denied</p>
        <h1>You do not have access to this page</h1>
        <p className="muted">
          This area is reserved for the <strong>{requiredRole}</strong> role
          {currentRole ? (
            <>
              . Your current role is <strong>{currentRole}</strong>
            </>
          ) : null}
          .
        </p>
        <p className="muted small">
          Redirecting to the dashboard in <strong>{secondsLeft}</strong>…
        </p>
        <Link className="inline-link" to="/dashboard">
          Go to dashboard now
        </Link>
      </div>
    </div>
  );
}
