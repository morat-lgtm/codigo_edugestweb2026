import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <h2>Buenos días, Jhilver</h2>
          <p>Resumen de gestión del Colegio Vancouver</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Alumnos</span>
          <strong>359</strong>
          <small>Alumnos registrados</small>
        </div>

        <div className="stat-card">
          <span>Familias</span>
          <strong>359</strong>
          <small>Familias registradas</small>
        </div>

        <div className="stat-card">
          <span>Personal</span>
          <strong>25</strong>
          <small>Personal activo</small>
        </div>

        <div className="stat-card">
          <span>Matrículas</span>
          <strong>359</strong>
          <small>Año escolar 2026</small>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Acciones rápidas</h3>

        <div className="quick-actions">
          <button>+ Registrar alumno</button>
          <button>+ Registrar familia</button>
          <button>+ Nueva matrícula</button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard