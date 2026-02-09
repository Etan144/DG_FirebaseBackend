import { useState } from "react";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // return routing support (for subscribe -> checkout flow)
  const returnTo = location.state?.returnTo;
  const returnPlan = location.state?.plan;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const claimUsername = httpsCallable(functions, "claimUsername");
  const checkSendVerificationOnFirstLogin = httpsCallable(
    functions,
    "checkSendVerificationOnFirstLogin"
  );

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setFeedback("Logging in...");

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // ===== First-login verification rule =====
      try {
        const verificationCheck =
          await checkSendVerificationOnFirstLogin();

        if (verificationCheck.data.shouldSend) {
          await sendEmailVerification(cred.user);

          setFeedback(verificationCheck.data.message);
          await auth.signOut();
          setLoading(false);
          return;
        }
      } catch (verificationErr) {
        console.error("Verification check failed:", verificationErr);
      }

      // ===== Require verified email =====
      if (!cred.user.emailVerified) {
        setFeedback("Please verify your email before logging in.");
        setLoading(false);
        return;
      }

      // ===== Claim pending username if exists =====
      const pendingUsername =
        localStorage.getItem("pendingUsername");

      if (pendingUsername) {
        await claimUsername({ username: pendingUsername });
        localStorage.removeItem("pendingUsername");
      }

      setFeedback("Login successful!");

      // ===== Role + return routing =====
      const token = await cred.user.getIdTokenResult();

      setTimeout(() => {

        // Admin override always wins
        if (token.claims.admin) {
          navigate("/admin");
          return;
        }

        // If user came from Subscribe → go checkout
        if (returnTo) {
          navigate(returnTo, {
            state: { plan: returnPlan }
          });
          return;
        }

        // Normal user login landing
        navigate("/download");

      }, 800);

    } catch (err) {
      console.error(err);
      setFeedback("Invalid email or password.");
    }

    setLoading(false);
  }

  return (
    <div className="page">

      <Header />

      <div className="form-container">
        <h2>Login to Your Account</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <div className="feedback">
          {feedback}
        </div>

        <div className="form-links">
          <p>
            Don't have an account?{" "}
            <Link to="/register">Register here</Link>
          </p>
        </div>

      </div>

      <Footer />

    </div>
  );
}
