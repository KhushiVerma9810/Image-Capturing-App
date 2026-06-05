import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth/AuthContext";
import { EyeIcon, ShieldIcon } from "../components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("Unable to sign in");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <section className="auth-card">
        <div className="auth-mark">
          <ShieldIcon className="ui-icon auth-mark-icon" />
        </div>

        <div className="auth-heading">
          <h1>Welcome Back</h1>
          <p>Enterprise User Management System</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">USERNAME</span>
            <Input
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="text-input h-auto"
            />
          </label>

          <label className="field">
            <span className="field-label">PASSWORD</span>
            <div className="input-affix">
              <Input
                autoComplete="current-password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="text-input border-0 h-auto"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
              >
                <EyeIcon className="ui-icon" />
              </Button>
            </div>
          </label>

          {error && <div className="status-banner error">{error}</div>}

          <Button
            className="auth-submit w-full"
            disabled={isSubmitting}
            type="submit"
          >
            <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
            <span className="button-arrow">→</span>
          </Button>
        </form>
      </section>
    </div>
  );
}
