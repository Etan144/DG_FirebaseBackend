import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { auth, functions } from "../firebase";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  PhoneAuthProvider,
  linkWithCredential
} from "firebase/auth";

import { httpsCallable } from "firebase/functions";

function isPasswordStrong(pw) {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

function isValidSingaporePhone(phone) {
  return /^[689]\d{7}$/.test(phone);
}

function fullPhone(phone) {
  return "+65" + phone;
}

export default function Register() {
  const navigate = useNavigate();

  const checkUsername = httpsCallable(functions, "checkUsernameAvailable");
  const claimUsername = httpsCallable(functions, "claimUsername");

  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const verificationIdRef = useRef(null);

  // State

  const [username, setUsername] = useState("");
  const [usernameHint, setUsernameHint] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneHint, setPhoneHint] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  // Username Check

  useEffect(() => {
    if (username.length < 3) {
      setUsernameHint("At least 3 characters");
      setUsernameAvailable(false);
      return;
    }

    const t = setTimeout(async () => {
      setUsernameHint("Checking...");
      try {
        const res = await checkUsername({ username });
        if (res.data.available) {
          setUsernameHint("Username available");
          setUsernameAvailable(true);
        } else {
          setUsernameHint("Username taken");
          setUsernameAvailable(false);
        }
      } catch {
        setUsernameHint("Unable to check");
        setUsernameAvailable(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [username]);

  // Password rules

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const score = Object.values(rules).filter(Boolean).length;

  const strengthWidth =
    score <= 2 ? "25%" :
    score <= 4 ? "60%" : "100%";

  const strengthClass =
    score <= 2 ? "weak" :
    score <= 4 ? "medium" : "strong";

  // Phone Verification

  async function sendCode() {
    if (!isValidSingaporePhone(phone)) {
      setPhoneHint("Invalid SG phone");
      return;
    }

    if (!isPasswordStrong(password)) {
      setPhoneHint("Fix password first");
      return;
    }

    try {
      setSendingCode(true);

      await createUserWithEmailAndPassword(auth, email, password);

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          recaptchaRef.current,
          { size: "invisible" }
        );
      }

      const provider = new PhoneAuthProvider(auth);
      const vid = await provider.verifyPhoneNumber(
        fullPhone(phone),
        recaptchaVerifierRef.current
      );

      verificationIdRef.current = vid;
      setCodeSent(true);
      setPhoneHint("Code sent ✓");

    } catch (e) {
      console.error(e);
      setPhoneHint(e.message || "SMS failed");
    }

    setSendingCode(false);
  }

  async function verifyCode(v) {
    if (v.length !== 6 || !verificationIdRef.current) return;

    try {
      const cred = PhoneAuthProvider.credential(
        verificationIdRef.current,
        v
      );

      await linkWithCredential(auth.currentUser, cred);
      setPhoneVerified(true);
    } catch {
      setPhoneVerified(false);
    }
  }

  // Confirm

  async function handleSubmit(e) {
    e.preventDefault();

    if (!usernameAvailable) return setFeedback("Choose available username");
    if (!phoneVerified) return setFeedback("Verify phone first");
    if (password !== confirm) return setFeedback("Passwords mismatch");

    try {
      await claimUsername({ username });
      await sendEmailVerification(auth.currentUser);
      setFeedback("Account created! Verify email.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setFeedback(e.message);
    }
  }

  //Render

  return (
    <div className="page">
      <Header />

      <section className="hero">
        <div className="form-container">
          <h1>Create Account</h1>

          <form onSubmit={handleSubmit}>

            {/* USERNAME */}
            <div className="form-group">
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} />
              <div className="hint">{usernameHint}</div>
            </div>

            {/* EMAIL */}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            {/* PHONE */}
            <div className="form-group">
              <label>Phone (+65)</label>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={8}/>
              <button type="button" className="btn secondary" onClick={sendCode} disabled={sendingCode}>
                Send Code
              </button>
              <div className="hint">{phoneHint}</div>
            </div>

            {/* CODE */}
            {codeSent && (
              <div className="form-group">
                <label>Verification Code</label>
                <input value={code} onChange={e => { setCode(e.target.value); verifyCode(e.target.value); }} />
              </div>
            )}

            {/* PASSWORD + METER */}
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} />

              <div className="strength-bar">
                <div
                  className={`strength-bar-fill ${strengthClass}`}
                  style={{ width: strengthWidth }}
                />
              </div>

              <ul id="password-rules">
                <li className={rules.length ? "ok" : ""}>At least 8 characters</li>
                <li className={rules.upper ? "ok" : ""}>One uppercase letter</li>
                <li className={rules.lower ? "ok" : ""}>One lowercase letter</li>
                <li className={rules.number ? "ok" : ""}>One number</li>
                <li className={rules.special ? "ok" : ""}>One special character</li>
              </ul>
            </div>

            {/* CONFIRM */}
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>

            <button className="btn primary" style={{ width: "100%" }}>Register</button>

          </form>

          <div className="feedback">{feedback}</div>
          <div ref={recaptchaRef} />

        </div>
      </section>

      <Footer />
    </div>
  );
}
