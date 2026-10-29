import { useState } from "react";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./auth.css";

function PasswordInput({ name, autoComplete, placeholder, minLength }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="password-input-wrap">
      <input
        type={isVisible ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required
      />
      <button
        className="password-toggle"
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        title={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </span>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const [formMessage, setFormMessage] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (isRegister) {
      const formData = new FormData(form);
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");
      const confirmPasswordInput = form.elements.namedItem("confirmPassword");

      if (password !== confirmPassword) {
        confirmPasswordInput.setCustomValidity("Passwords do not match.");
        confirmPasswordInput.reportValidity();
        setFormMessage({ type: "error", text: "The passwords don’t match. Please check them and try again." });
        return;
      }
    }

    setFormMessage({
      type: "info",
      text: isRegister
        ? "Your details are ready. Account creation will be available when the backend is connected."
        : "Your details are ready. Sign-in will be available when the backend is connected.",
    });
  }

  function handleFormInput(event) {
    if (isRegister && (event.target.name === "password" || event.target.name === "confirmPassword")) {
      event.currentTarget.elements.namedItem("confirmPassword")?.setCustomValidity("");
    }
    if (formMessage) setFormMessage(null);
  }

  return (
    <section className="auth-page">
      <Link className="auth-home-link" to="/">
        <FaArrowLeft aria-hidden="true" />
        <span>Back to home</span>
      </Link>
      <div className="auth-card">
        <p className="auth-eyebrow">Welcome to Kemra</p>
        <h2>{isRegister ? "Create your account" : "Welcome back to Kemra"}</h2>
        <p className="auth-intro">
          {isRegister
            ? "Join us to discover the Kemra collection."
            : "Sign in to continue to your account."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} onInput={handleFormInput}>
          {isRegister && (
            <label>
              Full name
              <input type="text" name="name" autoComplete="name" placeholder="Your name" required />
            </label>
          )}
          <label>
            Email
            <input type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <PasswordInput
              name="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              minLength={8}
            />
          </label>
          {isRegister && (
            <label>
              Confirm password
              <PasswordInput name="confirmPassword" autoComplete="new-password" placeholder="Enter your password again" minLength={8} />
            </label>
          )}
          {!isRegister && (
            <div className="auth-options">
              <label className="remember-option">
                <input type="checkbox" name="remember" /> Remember me
              </label>
              <a href="mailto:support@kemra.com?subject=Password%20reset">Forgot password?</a>
            </div>
          )}
          <button className="auth-submit" type="submit">
            {isRegister ? "Create account" : "Sign in"}
          </button>
          {formMessage && (
            <p className={`auth-form-message is-${formMessage.type}`} role={formMessage.type === "error" ? "alert" : "status"}>
              {formMessage.text}
            </p>
          )}
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to Kemra?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </section>
  );
}

export default AuthPage;
