import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function DowngradeButton() {
  const [busy, setBusy] = useState(false);

  async function downgrade() {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm("Switch back to Free plan?")) return;

    setBusy(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        "subscription.plan": "free",
        "subscription.status": "inactive",
        "subscription.downgradedAt": new Date()
      });

      alert("Plan changed to FREE");
      window.location.reload(); // refresh plan state

    } catch (err) {
      console.error(err);
      alert("Failed to downgrade.");
    }

    setBusy(false);
  }

  return (
    <button
      className="btn secondary"
      onClick={downgrade}
      disabled={busy}
    >
      {busy ? "Updating..." : "Switch to Free"}
    </button>
  );
}
