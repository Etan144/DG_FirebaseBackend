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
    degree: "BSc Computer Science(Cybersecurity)",
    photo: zavierPhoto,
    email: "zavierng1712@gmail.com",
    bio: ""
  },
  {
    name: "Tan Yi Heng Eugene",
    role: "Full-Stack Developer",
    degree: "BSc Computer Science(Big Data)",
    photo: eugenePhoto,
    email: "eugenetan310101@gmail.com",
    bio: ""
  },
  {
    name: "Lawrence Cheo Chee Wei",
    role: "Full-Stack Developer",
    degree: "BSc Business Information Systems",
    photo: lawrencePhoto,
    email: "lawrencecheo2908@gmail.com",
    bio: ""
  },
  {
    name: "Lee Donghyun",
    role: "Full-Stack Developer",
    degree: "BSc Computer Science(Big Data)",
    photo: dongHyunPhoto,
    email: "wm07247@gmail.com",
    bio: ""
  },
  {
    name: "See Yu",
    role: "Full-Stack Developer",
    degree: "BSc Computer Science(Big Data)",
    photo: seeyuPhoto,
    email: "seeyu44@gmail.com",
    bio: ""
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
            <h3>General Enquiries & Support</h3>
            <p><a href="mailto:dfguardmail@gmail.com">dfguardmail@gmail.com</a></p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
