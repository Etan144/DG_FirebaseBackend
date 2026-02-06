import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, storage } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, getDownloadURL } from "firebase/storage";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Download() {
  const navigate = useNavigate();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [downloading, setDownloading] = useState(false);

  /* =========================
     AUTH GUARD
     ========================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      if (!user.emailVerified) {
        alert("Please verify your email before downloading the app.");
        await signOut(auth);
        navigate("/login");
        return;
      }

      setCheckingAuth(false);
    });

    return () => unsub();
  }, [navigate]);

  /* =========================
     DOWNLOAD HANDLER
     ========================= */
  async function handleDownload() {
    if (downloading) return;

    setDownloading(true);

    try {
      const apkRef = ref(storage, "apks/deepfakeguard-v1.0.apk");
      const url = await getDownloadURL(apkRef);

      // trigger browser download
      window.location.href = url;

    } catch (err) {
      console.error(err);
      alert("You are not authorized to download this file.");
    }

    setDownloading(false);
  }

  /* =========================
     LOGOUT
     ========================= */
  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  /* =========================
     LOADING SCREEN
     ========================= */
  if (checkingAuth) {
    return (
      <div className="page">
        <Header />
        <section className="section">
          Checking authentication...
        </section>
        <Footer />
      </div>
    );
  }

  /* =========================
     PAGE
     ========================= */
  return (
    <div className="page">

      <Header />

      <div className="download-container">

        <h1>Welcome!</h1>

        <p>
          You are logged in. Download the Deepfake Guard Android application
          to protect your device from deepfake voice attacks.
        </p>

        <button
          className="btn primary"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? "Preparing download..." : "Download Application"}
        </button>

        {/* INSTALL INSTRUCTIONS */}
        <div className="install-instructions">

          <h2>How to Install</h2>

          <ol>
            <li>Tap <strong>Download Application</strong> to download the APK file.</li>
            <li>Allow your browser to <strong>Install unknown apps</strong>.</li>
            <li>Open the downloaded file and tap <strong>Install</strong>.</li>
            <li>Open <strong>Deepfake Guard</strong> and log in.</li>
          </ol>

          <p className="note">
            Android requires permission for apps installed outside the Play Store.
            This is normal and safe for this application.
          </p>

        </div>

        {/* Logout button */}
        <div style={{ marginTop: 30 }}>
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

      </div>

      <Footer />

    </div>
  );
}
