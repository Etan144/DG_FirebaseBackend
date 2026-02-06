export default function Header() {
  return (
    <header>
      <div className="brand">
        <div className="logo">DG</div>
        <div>
          <div style={{ fontWeight: 700 }}>Deepfake Guard</div>
          <div className="muted">Deepfake call protection</div>
        </div>
      </div>

      <nav>
        <a href="#product">Product</a>
        <a href="#features">Features</a>
        <a href="#faq">FAQ</a>
      </nav>

      <div className="cta">
        <a className="btn primary">Register</a>
        <a className="btn">Login</a>
      </div>
    </header>
  );
}
