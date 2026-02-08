import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

function getInitials(email) {
  if (!email) return "U";
  return email[0].toUpperCase();
}

export default function Header() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  /* =========================
     AUTH STATE
  ========================= */

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const token = await u.getIdTokenResult();
        setIsAdmin(!!token.claims.admin);
      } else {
        setIsAdmin(false);
      }
    });
  }, []);

  /* =========================
     CLICK OUTSIDE CLOSE
  ========================= */

  useEffect(() => {
    function handleClick(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  /* =========================
     NAV SCROLL
  ========================= */

  function goToSection(id) {
    navigate("/");
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth"
      });
    }, 80);
  }

  /* =========================
     LOGOUT
  ========================= */

  async function handleLogout() {
    await signOut(auth);
    setOpen(false);
    navigate("/");
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <header>

      {/* BRAND */}
      <Link to="/" className="brand">
        <div className="logo">DG</div>
        <div>
          <div style={{ fontWeight: 700 }}>
            Deepfake Guard
          </div>
          <div className="muted">
            Deepfake call protection
          </div>
        </div>
      </Link>

      {/* NAV */}
      <nav>
        <button onClick={() => goToSection("product")}>
          Product
        </button>
        <button onClick={() => goToSection("features")}>
          Features
        </button>
        <button onClick={() => goToSection("faq")}>
          FAQ
        </button>
        <button onClick={() => goToSection("subscription")}>
          Pricing
        </button>
        <button onClick={() => navigate("/About")}>
          About Us
        </button>
      </nav>

      {/* RIGHT SIDE */}
      <div className="cta">

        {/* ---------- NOT LOGGED IN ---------- */}
        {!user && (
          <>
            <Link to="/register" className="btn primary">
              Register
            </Link>
            <Link to="/login" className="btn">
              Login
            </Link>
          </>
        )}

        {/* ---------- LOGGED IN ---------- */}
        {user && (
          <div
            className={`user-menu ${open ? "open" : ""}`}
            ref={dropdownRef}
          >

            {/* AVATAR + EMAIL */}
            <button
              type = "button"
              className="user-trigger"
              onClick={() => setOpen(v => !v)}
            >
              <div className="avatar-circle">
                {getInitials(user.email)}
              </div>

              <span className="user-email">
                {user.email}
              </span>

              <span className="caret">
                ▾
              </span>
            </button>

            {/* DROPDOWN */}
            {open && (
              <div className="user-dropdown">

                {!isAdmin && (
                  <button
                    onClick={() => {
                      navigate("/download");
                      setOpen(false);
                    }}
                  >
                    App / Download
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setOpen(false);
                    }}
                  >
                    Admin Dashboard
                  </button>
                )}

                <button onClick={handleLogout}>
                  Logout
                </button>

              </div>
            )}

          </div>
        )}

      </div>

    </header>
  );
}
