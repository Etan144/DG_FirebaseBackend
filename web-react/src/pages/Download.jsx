import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { auth, storage, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Download() {
  const navigate = useNavigate();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  /* =========================
     AUTH & ACCESS GUARD
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

      // Check for paid access in Firestore
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          // We check for 'paidAccess' flag OR if the plan is 'pro'
          if (data.paidAccess === true || data.subscription?.plan === "pro") {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        }
      } catch (err) {
        console.error("Error checking access:", err);
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

    if (!hasAccess) {
      alert("Please complete the payment to download the application.");
      return;
    }

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
        <section className="section" style={{ textAlign: "center" }}>
          Verifying account access...
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

      <div className="download-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        {!hasAccess ? (
          <div style={{ textAlign: "center", padding: "40px 0", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>Access Required</h1>
            <p className="lead" style={{ maxWidth: '600px', margin: '0 auto' }}>
              To download and use the Deepfake Guard application, a one-time payment of <strong>S$6.70</strong> is required.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link to="/checkout" className="btn primary">
                Pay to Access Download
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>Welcome!</h1>

            <p style={{ maxWidth: '600px' }}>
              Your account has full access. Download the Deepfake Guard Android application 
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
            <div className="install-instructions" style={{ textAlign: 'left', maxWidth: '500px', width: '100%' }}>

              <h2 style={{ textAlign: 'center' }}>How to Install</h2>

              <ol>
                <li>Tap <strong>Download Application</strong> to download the APK file.</li>
                <li>Allow your browser to <strong>Install unknown apps</strong>.</li>
                <li>Open the downloaded file and tap <strong>Install</strong>.</li>
                <li>Open <strong>Deepfake Guard</strong> and log in.</li>
              </ol>

              <p className="note" style={{ textAlign: 'center' }}>
                Android requires permission for apps installed outside the Play Store.
                This is normal and safe for this application.
              </p>

            </div>
          </div>
        )}

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
