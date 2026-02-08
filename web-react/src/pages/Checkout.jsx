import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const plan = location.state?.plan; // expects "pro"

  const allowedPlans = {
    pro: "S$4.99 / month"
  };

  const price = allowedPlans[plan];

  useEffect(() => {
    if (!price) {
      navigate("/#subscription"); // back to your pricing section
    }
  }, [price, navigate]);

  if (!price) return null;

  async function handlePay(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        navigate("/login");
        return;
    }

    try {
        // simulated payment success
        await updateDoc(doc(db, "users", user.uid), {
        "subscription.plan": plan,
        "subscription.status": "active",
        "subscription.startedAt": new Date()
        });

        navigate("/payment-success");

        } catch (err) {
            console.error(err);
            alert("Failed to activate subscription");
        }
    }

  return (
    <div className="page">
      <Header />

      <section className="section form-container">
        <h2>Checkout</h2>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Pro Plan</h3>
          <p>{price}</p>
        </div>

        <form onSubmit={handlePay}>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input required type="email" />
          </div>

          <button className="btn primary" type="submit">
            Pay {price}
          </button>

          <button
            type="button"
            className="btn secondary"
            style={{ marginTop: 12 }}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
