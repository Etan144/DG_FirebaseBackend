export default function TeamCard({ member }) {
  return (
    <div className="team-card">

      <div className={`team-photo ${!member.photo ? "placeholder" : ""}`}>
        {member.photo && (
          <img
            src={member.photo}
            alt={member.name}
            loading="lazy"
          />
        )}
      </div>

      <h3>{member.name}</h3>


      <div className="team-role">
        {member.role}
      </div>

      {member.degree && (
        <div className="team-degree">
          {member.degree}
        </div>
      )}

      <p>{member.bio}</p>

      <div className="team-links">
        {member.email && (
          <a href={`mailto:${member.email}`}>
            Email
          </a>
        )}
      </div>

    </div>
  );
}
