import Header from "../components/Header";
import Footer from "../components/Footer";
import TeamCard from "../components/TeamCard";
import zavierPhoto from "../assets/team/zavier.jpg"
import eugenePhoto from "../assets/team/eugene.jpg"
import dongHyunPhoto from "../assets/team/donghyun.jpg"
import lawrencePhoto from "../assets/team/lawrence.jpg"
import seeyuPhoto from "../assets/team/seeyu.jpg"

const teamMembers = [
  {
    name: "Ng Jing Xiang, Zavier",
    role: "Project Leader",
    photo: zavierPhoto,
    email: "jxzhn985@uowmail.edu.au",
    bio: "Short bio here"
  },
  {
    name: "Tan Yi Heng Eugene",
    role: "Full-Stack Developer",
    photo: eugenePhoto,
    email: "eugene@email.com",
    bio: "Short bio here"
  },
  {
    name: "Lawrence Cheo Chee Wei",
    role: "Full-Stack Developer",
    photo: lawrencePhoto,
    email: "lcwc907@uowmail.edu.au",
    bio: "Short bio here"
  },
  {
    name: "Lee Donghyun",
    role: "Full-Stack Developer",
    photo: dongHyunPhoto,
    email: "dl668@uowmail.edu.au",
    bio: "Short bio here"
  },
  {
    name: "See Yu",
    role: "Full-Stack Developer",
    photo: seeyuPhoto,
    email: "ys549@uowmal.edu.au",
    bio: "Short bio here"
  }
];


export default function About() {
  return (
    <div className="page">

      <Header />
      {/* ================= TEAM ================= */}
      <section className="section">
        <h2>Our Team</h2>

        <div className="team-grid">

        {/* ===== MEMBER CARD ===== */}
            <div className="team-grid">
                {teamMembers.map(member => (
                    <TeamCard key={member.name} member={member} />
                ))}
            </div>

        </div>

      </section>

      {/* ================= CONTACT ================= */}
      <section className="section">
        <h2>Contact Us</h2>

        <div className="grid">
          <div className="card">
            <h3>General Enquiries</h3>
            <p>contact@deepfakeguard.example</p>
          </div>

          <div className="card">
            <h3>Partnerships</h3>
            <p>partners@deepfakeguard.example</p>
          </div>

          <div className="card">
            <h3>Support</h3>
            <p>support@deepfakeguard.example</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
