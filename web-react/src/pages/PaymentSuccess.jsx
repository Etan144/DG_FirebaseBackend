import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="page">

      <Header />

      <section className="section" style={{ textAlign: "center" }}>
        <h2>Payment Successful 🎉</h2>

        <p className="lead" style={{ marginTop: 12 }}>
          Your Pro subscription is now active.
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <h3>What happens next?</h3>
          <p>
            You now have access to advanced detection scoring,
            analytics, and priority model updates.
          </p>
        </div>

        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            className="btn primary"
            onClick={() => navigate("/download")}
          >
            Go to Download
          </button>

          <button
            className="btn"
            onClick={() => navigate("/#subscription")}
          >
            Back to Pricing
          </button>
        </div>

      </section>

      <Footer />

    </div>
  );
}
