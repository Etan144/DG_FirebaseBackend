import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const price = "S$6.70";

  // Formatting & Validation Handlers
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, ""); // Only numbers
    if (val.length <= 16) {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, ""); // Only numbers
    if (val.length > 4) return;

    if (val.length >= 2) {
      const month = parseInt(val.substring(0, 2));
      if (month < 1 || month > 12) {
        // Reset or fix invalid month
        val = val.substring(0, 1);
      } else {
        val = val.substring(0, 2) + "/" + val.substring(2);
      }
    }
    setExpiry(val);
  };

  const handleCvcChange = (e) => {
    const val = e.target.value.replace(/\D/g, ""); // Only numbers
    if (val.length <= 3) {
      setCvc(val);
    }
  };

  async function handlePay(e) {
    e.preventDefault();

    // Final Validation
    if (cardNumber.length !== 16) return alert("Card number must be 16 digits");
    if (expiry.length !== 5) return alert("Expiry date must be in MM/YY format");
    if (cvc.length !== 3) return alert("CVC must be 3 digits");

    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    setProcessing(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        "subscription.plan": "pro",
        "subscription.status": "active",
        "subscription.paidAt": new Date(),
        "paidAccess": true
      });

      navigate("/payment-success");

    } catch (err) {
      console.error(err);
      alert("Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="page">
      <Header />

      <section className="section form-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center' }}>Checkout</h2>

        <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
          <h3>Pro Plan Access</h3>
          <p>One-time payment: <strong>{price}</strong></p>
          <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
            Unlock lifetime access to the Deepfake Guard application.
          </p>
        </div>

        <form onSubmit={handlePay}>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input 
              required 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input 
              required 
              type="email" 
              placeholder="john@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Card Number</label>
            <input 
              required 
              placeholder="1234567812345678" 
              value={cardNumber}
              onChange={handleCardNumberChange}
              inputMode="numeric"
            />
            <div className="hint">{cardNumber.length}/16 digits</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Expiry Date</label>
              <input 
                required 
                placeholder="MM/YY" 
                value={expiry}
                onChange={handleExpiryChange}
                inputMode="numeric"
              />
            </div>
            <div className="form-group">
              <label>CVC</label>
              <input 
                required 
                type="password" 
                placeholder="123" 
                value={cvc}
                onChange={handleCvcChange}
                inputMode="numeric"
              />
            </div>
          </div>

          <button className="btn primary" type="submit" disabled={processing} style={{ width: '100%', marginTop: '10px' }}>
            {processing ? "Processing..." : `Pay ${price}`}
          </button>

          <button
            type="button"
            className="btn secondary"
            style={{ marginTop: 12, width: '100%' }}
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
