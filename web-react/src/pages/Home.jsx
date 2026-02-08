import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReviewSlider from "../components/ReviewSlider";
import SubscribeButton from "../components/SubscribeButton";
import DowngradeButton from "../components/DowngradeButton";


export default function Home() {
  return (
    <div className="page">

      <Header />

      {/* ================= HERO ================= */}
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
            real time, so you can call and receive with confidence. Built for
            regulated industries, powered by on-device ML, and ready for
            market launch.
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

        {/* Phone Preview Card */}
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

            <div className="call-status">
              <div className="status-card">
                <h4>Identity check</h4>
                <div className="progress">
                  <span style={{ width: "76%" }} />
                </div>
                <p style={{ marginTop: 6, fontSize: 13 }} className="lead">
                  Speaker embedding drift detected
                </p>
              </div>

              <div className="status-card">
                <h4>Noise guard</h4>
                <div className="progress">
                  <span style={{ width: "92%" }} />
                </div>
                <p style={{ marginTop: 6, fontSize: 13 }} className="lead">
                  Live call audio protected
                </p>
              </div>
            </div>

            <div className="actions">
              <div className="pill">Answer</div>
              <div
                className="pill"
                style={{
                  background:
                    "linear-gradient(135deg,var(--accent),var(--accent-2))",
                  color: "#03101a"
                }}
              >
                Shield
              </div>
              <div className="pill">Decline</div>
            </div>
          </div>

          <div className="call-status" style={{ marginTop: 18 }}>
            <div className="status-card">
              <h4>Outbound calls</h4>
              <p className="lead" style={{ fontSize: 14 }}>
                Verified caller ID, fraud scoring, and anti-deepfake prompts
                before you connect.
              </p>
            </div>

            <div className="status-card">
              <h4>Inbound calls</h4>
              <p className="lead" style={{ fontSize: 14 }}>
                Instant classification and auto-warn the user in-call.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= VIDEO ================= */}
      <section className="section video-section" id="demo-video">
        <h2>See It In Action</h2>

        <div className="video-container">
          <video controls poster="/video-poster.jpg">
            <source src="/demo-video.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="section" id="features">
        <h2>Market-ready feature stack</h2>

        <p className="lead">
          Everything you need to launch a trustworthy calling experience:
          call + receive with deepfake detection, fraud intelligence, and
          user-first design.
        </p>

        <div className="grid">

          <div className="card">
            <h3>Call & receive protection</h3>
            <p>
              Shield every call. Outgoing calls run pre-call risk checks;
              incoming calls are screened with live audio scoring and verified
              caller ID.
            </p>
          </div>

          <div className="card">
            <h3>On-device ML scoring</h3>
            <p>
              Real-time acoustic fingerprinting and anti-spoofing models run
              locally to keep data private and latency low.
            </p>
          </div>

          <div className="card">
            <h3>Fraud radar</h3>
            <p>
              Detect voice cloning patterns, playback artifacts, and anomalous
              pitch contours.
            </p>
          </div>

          <div className="card">
            <h3>Admin & analytics</h3>
            <p>
              Dashboards for teams: incident timelines, per-call risk, and
              opt-in telemetry to refine models per region.
            </p>
          </div>

          <div className="card">
            <h3>Privacy-first</h3>
            <p>
              Data stays on-device by default. Opt-in cloud sync for
              enterprises, compliant with PDPA.
            </p>
          </div>

        </div>

        <div className="stat-row">
          <div className="stat">
            <strong>87.5%</strong>
            <span>Detection confidence on high-risk calls</span>
          </div>

          <div className="stat">
            <strong>↑ 46%</strong>
            <span>Reduction in impersonation attempts</span>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="section" id="how">
        <h2>Built to own the call experience</h2>

        <div className="split">

          <div className="call-flow">
            <h3>Outgoing call flow</h3>

            <div className="flow-step">
              <div className="dot"></div>
              <div>
                <strong>Pre-call verification</strong>
                <p className="lead" style={{ fontSize: 14 }}>
                  Authenticate caller ID and run device trust checks before dial.
                </p>
              </div>
            </div>

            <div className="flow-step">
              <div className="dot"></div>
              <div>
                <strong>Live audio scan</strong>
                <p className="lead" style={{ fontSize: 14 }}>
                  On-device model scores speaker for cloning artifacts.
                </p>
              </div>
            </div>

            <div className="flow-step">
              <div className="dot"></div>
              <div>
                <strong>User guardrails</strong>
                <p className="lead" style={{ fontSize: 14 }}>
                  Auto-warn when risk crosses your threshold.
                </p>
              </div>
            </div>
          </div>

          <div className="call-flow">
            <h3>Incoming call flow</h3>

            <div className="flow-step">
              <div className="dot"></div>
              <div>
                <strong>Caller screening</strong>
                <p className="lead" style={{ fontSize: 14 }}>
                  Screen spoofed IDs and spam before ringing.
                </p>
              </div>
            </div>

            <div className="flow-step">
              <div className="dot"></div>
              <div>
                <strong>Deepfake alert</strong>
                <p className="lead" style={{ fontSize: 14 }}>
                  Flag synthetic voices with confidence scores in-call.
                </p>
              </div>
            </div>

            <div className="flow-step">
              <div className="dot"></div>
              <div>
                <strong>Recovery & reporting</strong>
                <p className="lead" style={{ fontSize: 14 }}>
                  Users can block and report threats instantly.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="pill-row" style={{ marginTop: 22 }}>
          <span>PSTN</span>
          <span>VoIP / SIP</span>
          <span>WebRTC</span>
          <span>On-prem</span>
          <span>Cloud</span>
          <span>Mobile SDK</span>
        </div>
      </section>

      <section className="section" id="subscription">
        <h2>Pricing</h2>

        <p className="lead">
          Start free. Upgrade when you need advanced protection and analytics.
        </p>

        <div className="grid">

          {/* FREE */}
          <div className="card">
            <h3>Free</h3>
            <p className="lead" style={{ fontSize: 14 }}>
              Great for testing the experience and basic call protection.
            </p>

            <div className="pill-row" style={{ marginTop: 12 }}>
              <span>Live call warnings</span>
              <span>Basic call logs</span>
              <span>On-device detection</span>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>S$0</div>
              <div className="muted" style={{ fontSize: 13 }}>forever</div>
            </div>

            <div style={{ marginTop: 16 }}>
              <DowngradeButton />
            </div>
          </div>

          {/* PRO */}
          <div className="card">
            <h3>Pro</h3>
            <p className="lead" style={{ fontSize: 14 }}>
              For users who want stronger protection and detailed insights.
            </p>

            <div className="pill-row" style={{ marginTop: 12 }}>
              <span>Advanced scoring</span>
              <span>Threat analytics</span>
              <span>Priority updates</span>
              <span>Exportable reports</span>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>S$4.99</div>
              <div className="muted" style={{ fontSize: 13 }}>/ month</div>
            </div>

            <div style={{ marginTop: 16 }}>
              <SubscribeButton plan="pro" />
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="card">
            <h3>Enterprise</h3>
            <p className="lead" style={{ fontSize: 14 }}>
              For telcos & regulated orgs deploying at scale.
            </p>

            <div className="pill-row" style={{ marginTop: 12 }}>
              <span>Team dashboards</span>
              <span>Admin controls</span>
              <span>SLA support</span>
              <span>Regional model tuning</span>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Custom</div>
              <div className="muted" style={{ fontSize: 13 }}>pricing</div>
            </div>

            <div style={{ marginTop: 16 }}>
              <a className="btn secondary" href="#demo-video">
                Talk to us
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ================= STATS ================= */}
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
          <h3>1M+</h3>
          <p>Threats blocked daily</p>
        </div>

        <div className="stat-item">
          <h3>24/7</h3>
          <p>Monitoring and support</p>
        </div>
      </section>

      <ReviewSlider />

      {/* ================= FAQ ================= */}
      <section className="section" id="faq">
        <h2>Frequently asked questions</h2>

        <div className="faq">

          <div className="faq-item">
            <h4>How does the detection model work?</h4>
            <p>
              Hybrid acoustic fingerprinting, spectrogram analysis, and vocoder
              artifact detection identify synthetic voices.
            </p>
          </div>

          <div className="faq-item">
            <h4>What's the performance impact?</h4>
            <p>
              Optimized on-device inference keeps CPU under ~5% during calls.
            </p>
          </div>

          <div className="faq-item">
            <h4>Can it be integrated?</h4>
            <p>
              Yes — mobile SDK + APIs support carrier and enterprise deployments.
            </p>
          </div>

          <div className="faq-item">
            <h4>Is user data collected?</h4>
            <p>
              No — processing is on-device by default with optional enterprise sync.
            </p>
          </div>

        </div>
      </section>

      <Footer />

    </div>
  );
}
