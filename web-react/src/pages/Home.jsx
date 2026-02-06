import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReviewSlider from "../components/ReviewSlider";

export default function Home() {
  return (
    <div className="page">

      <Header />

      {/* HERO */}
      <section className="hero" id="product">
        <div>
          <div className="eyebrow">
            Telecom-ready | Privacy-first | On-device ML
          </div>

          <h1>
            Stop deepfake voice calls before they reach your customers.
          </h1>

          <p className="lead">
            Deepfake Guard detects synthetic voices and spoofed caller IDs in
            real time, so you can call and receive with confidence.
          </p>

          <div className="hero-actions">

            <Link className="btn primary" to="/download">
              Try the Deepfake Guard app
            </Link>

            <a className="btn" href="#demo-video">
              Talk to us
            </a>

          </div>

          <div className="hero-meta">
            <span className="chip">Live for outgoing + incoming calls</span>
            <span className="chip">Carrier & enterprise integrations</span>
            <span className="chip">Battery safe foreground service</span>
          </div>
        </div>

        {/* Right hero card */}
        <div className="phone-card">
          <div className="phone-header">
            <span>Incoming call</span>
            <span>00:14</span>
          </div>

          <div className="call-banner">
            <strong>Flagged: Possible deepfake</strong>
            <div className="badge">
              Confidence: 84% | Real-time acoustic scan
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section className="section video-section" id="demo-video">
        <h2>See It In Action</h2>

        <div className="video-container">
          <video controls>
            <source src="/demo-video.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <h2>Market-ready feature stack</h2>

        <p className="lead">
          Everything you need to launch a trustworthy calling experience.
        </p>

        <div className="grid">

          <div className="card">
            <h3>Call & receive protection</h3>
            <p>
              Shield every call with live scoring and caller verification.
            </p>
          </div>

          <div className="card">
            <h3>On-device ML scoring</h3>
            <p>
              Real-time acoustic fingerprinting runs locally for privacy.
            </p>
          </div>

          <div className="card">
            <h3>Fraud radar</h3>
            <p>
              Detect cloning artifacts and playback anomalies.
            </p>
          </div>

          <div className="card">
            <h3>Admin & analytics</h3>
            <p>
              Dashboards and timelines for enterprise monitoring.
            </p>
          </div>

        </div>
      </section>

      {/* STATS */}
      <section className="section stats-banner">

        <div className="stat-item">
          <h3>99.8%</h3>
          <p>Real-time detection accuracy</p>
        </div>

        <div className="stat-item">
          <h3>&lt;100ms</h3>
          <p>Average response time</p>
        </div>

        <div className="stat-item">
          <h3>24/7</h3>
          <p>Monitoring and support</p>
        </div>

      </section>

      {/* REVIEWS SLIDER (React component) */}
      <ReviewSlider />

      {/* FAQ */}
      <section className="section" id="faq">

        <h2>Frequently asked questions</h2>

        <div className="faq">

          <div className="faq-item">
            <h4>How does the detection model work?</h4>
            <p>
              We use acoustic fingerprinting and spectrogram analysis to
              detect synthetic voices.
            </p>
          </div>

          <div className="faq-item">
            <h4>What's the performance impact?</h4>
            <p>
              Optimized on-device inference keeps CPU and battery usage low.
            </p>
          </div>

          <div className="faq-item">
            <h4>Is user data collected?</h4>
            <p>
              No — processing is on-device by default.
            </p>
          </div>

        </div>

      </section>

      <Footer />

    </div>
  );
}
