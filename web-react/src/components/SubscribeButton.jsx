import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SubscribeButton({ plan = "pro" }) {
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState("free");
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setCurrentPlan("free");
        return;
      }

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      const p = snap.data()?.subscription?.plan || "free";
      setCurrentPlan(p);
    });
  }, []);

  function handleSubscribe() {
    if (currentPlan === plan) return;

    if (!user) {
      navigate("/login", {
        state: {
          returnTo: "/checkout",
          plan
        }
      });
      return;
    }

    navigate("/checkout", {
      state: { plan }
    });
  }

  const isCurrent = currentPlan === plan;

  return (
    <button
      className={`btn ${isCurrent ? "" : "primary"}`}
      onClick={handleSubscribe}
      disabled={isCurrent}
      type="button"
    >
      {isCurrent ? "Subscribed" : "Subscribe"}
    </button>
  );
}
