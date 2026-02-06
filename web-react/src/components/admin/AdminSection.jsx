export default function AdminSection({
  title,
  icon = "⚙️",
  actions,
  children
}) {
  return (
    <section className="admin-section">

      <div className="section-header">
        <div className="section-title">
          <div className="section-icon">{icon}</div>
          <h2>{title}</h2>
        </div>

        <div className="section-actions">
          {actions}
        </div>
      </div>

      <div className="section-body">
        {children}
      </div>

    </section>
  );
}
