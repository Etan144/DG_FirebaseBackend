import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="page">

      <Header />

      <section className="section" style={{ textAlign: "center", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Payment Successful 🎉</h2>

        <p className="lead" style={{ marginTop: 12 }}>
          Your Pro access is now active.
        </p>

        <div className="card" style={{ marginTop: 24, maxWidth: '400px', width: '100%' }}>
          <h3>What happens next?</h3>
          <p>
            You now have lifetime access to the Deepfake Guard application. 
            Download the app below to get started with advanced detection and real-time protection.
          </p>
        </div>

        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", width: '100%', maxWidth: '400px' }}>
          <button
            className="btn primary"
            style={{ flex: 1 }}
            onClick={() => navigate("/download")}
          >
            Go to Download
          </button>

          <button
            className="btn"
            style={{ flex: 1 }}
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>

      </section>

      <Footer />

    </div>
  );
}
