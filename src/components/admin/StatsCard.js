export default function StatsCard({ icon, label, value, hint }) {
  return (
    <div className="card admin-stat-card">
      <div className="admin-stat-card-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="admin-stat-card-body">
        <span className="admin-stat-card-label">{label}</span>
        <span className="admin-stat-card-value">{value}</span>
        {hint ? <span className="admin-stat-card-hint">{hint}</span> : null}
      </div>
    </div>
  );
}
