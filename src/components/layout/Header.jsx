import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Header.css'

const modules = [
  {
    code: 'INTRANET',
    name: 'Intranet',
    path: '/',
    routes: ['/'],
  },
  {
    code: 'ACADEMICO',
    name: 'Académico',
    path: '/academico',
    routes: [
      '/academico',
      '/alumnos',
      '/familias',
      '/personal',
      '/matricula',
    ],
  },
  {
    code: 'TESORERIA',
    name: 'Tesorería',
    path: '/tesoreria',
    routes: ['/tesoreria'],
  },
  {
    code: 'ADMISION',
    name: 'Admisión',
    path: '/admision',
    routes: ['/admision'],
  },
  {
    code: 'MEDICO',
    name: 'Médico',
    path: '/medico',
    routes: ['/medico'],
  },
  {
    code: 'HISTORICO',
    name: 'Histórico',
    path: '/historico',
    routes: ['/historico'],
  },
  {
    code: 'BIBLIOTECA',
    name: 'Biblioteca',
    path: '/biblioteca',
    routes: ['/biblioteca'],
  },
  {
    code: 'TALLERES',
    name: 'Talleres',
    path: '/talleres',
    routes: ['/talleres'],
  },
  {
    code: 'RESERVAS',
    name: 'Reservas',
    path: '/reservas',
    routes: ['/reservas'],
  },
  {
    code: 'ADICIONALES',
    name: 'Adicionales',
    path: '/adicionales',
    routes: ['/adicionales'],
  },
]

function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()

  const [moduleOpen, setModuleOpen] = useState(false)
  const moduleRef = useRef(null)

  const currentModule =
    modules.find((module) =>
      module.routes.some((route) => {
        if (route === '/') {
          return location.pathname === '/'
        }

        return (
          location.pathname === route ||
          location.pathname.startsWith(`${route}/`)
        )
      })
    ) || modules[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        moduleRef.current &&
        !moduleRef.current.contains(event.target)
      ) {
        setModuleOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function cambiarModulo(module) {
    setModuleOpen(false)
    navigate(module.path)
  }

  return (
    <header className="header">
      <div className="header-left">

        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <div
          className="module-switcher"
          ref={moduleRef}
        >
          <button
            className="module-button"
            onClick={() => setModuleOpen((actual) => !actual)}
            aria-expanded={moduleOpen}
            aria-haspopup="menu"
          >
            <span className="module-name">
              {currentModule.name}
            </span>

            <span
              className={`module-arrow ${
                moduleOpen ? 'open' : ''
              }`}
            >
              ▾
            </span>
          </button>

          {moduleOpen && (
            <div className="module-dropdown">
              <div className="module-dropdown-title">
                Sistemas
              </div>

              <div className="module-list">
                {modules.map((module) => (
                  <button
                    key={module.code}
                    className={`module-option ${
                      currentModule.code === module.code
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => cambiarModulo(module)}
                  >
                    <span className="module-option-dot" />

                    <span>
                      {module.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="header-right">

        <button
          className="notification-button"
          aria-label="Notificaciones"
        >
          ♢
          <span className="notification-dot" />
        </button>

        <div className="user-menu">

          <div className="user-avatar">
            J
          </div>

          <div className="user-info">
            <strong>Jhilver</strong>
            <span>Administrador</span>
          </div>

          <span className="user-arrow">
            ⌄
          </span>

        </div>

      </div>
    </header>
  )
}

export default Header