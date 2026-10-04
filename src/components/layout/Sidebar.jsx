import { useEffect, useState } from 'react'



import { NavLink, useLocation } from 'react-router-dom'



import { supabase } from '../../lib/supabaseClient'







import './Sidebar.css'















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















function Sidebar({ isOpen, onClose }) {







  const location = useLocation()















    const [openMenus, setOpenMenus] = useState({

    mantenimiento: true,

    asignacion: false,

    registro: false,

    pendientes: false,

    procesos: false,

    formatos: false,

    seguridad: false,

    utilitarios: false,

    matricula: false,

    psicologia: false,

  })



  const [canManagePublications, setCanManagePublications] = useState(false)

  const [canManageSocialLinks, setCanManageSocialLinks] = useState(false)



  useEffect(() => {
    verificarPermisosComunicacion()
  }, [])

  const verificarPermisosComunicacion = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCanManagePublications(false)
        setCanManageSocialLinks(false)
        return
      }

      const { data: membership, error: membershipError } = await supabase
        .from('school_memberships')
        .select('school_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (membershipError || !membership) {
        console.error('No se encontró la membresía activa:', membershipError)
        setCanManagePublications(false)
        setCanManageSocialLinks(false)
        return
      }

      const [publicacionesResult, redesSocialesResult] = await Promise.all([
        supabase.rpc('has_my_school_permission', {
          target_school_id: membership.school_id,
          required_permission_code: 'PUBLICACIONES_CREAR',
        }),
        supabase.rpc('has_my_school_permission', {
          target_school_id: membership.school_id,
          required_permission_code: 'SOCIAL_LINKS_CREAR',
        }),
      ])

      if (publicacionesResult.error) {
        console.error(
          'Error verificando permiso de publicaciones:',
          publicacionesResult.error
        )
        setCanManagePublications(false)
      } else {
        setCanManagePublications(Boolean(publicacionesResult.data))
      }

      if (redesSocialesResult.error) {
        console.error(
          'Error verificando permiso de redes sociales:',
          redesSocialesResult.error
        )
        setCanManageSocialLinks(false)
      } else {
        setCanManageSocialLinks(Boolean(redesSocialesResult.data))
      }
    } catch (error) {
      console.error('Error verificando permisos de comunicación:', error)
      setCanManagePublications(false)
      setCanManageSocialLinks(false)
    }
  }

  const handleNavigation = () => {







    onClose()







  }















  const toggleMenu = (menu) => {







    setOpenMenus((current) => ({







      ...current,







      [menu]: !current[menu],







    }))







  }















  /*







    * Determina a qué módulo pertenece la ruta actual.







    *







    * Ejemplo:







    * /familias  → Académico







    * /alumnos   → Académico







    * /personal  → Académico







    * /matricula → Académico







   */







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















  const renderSubmenu = (items) => {







    return (







      <div className="nav-submenu">







        {items.map((item) => {







          if (item.path) {







            return (







              <NavLink







                key={item.label}







                to={item.path}







                className={({ isActive }) =>







                  `nav-subitem ${isActive ? 'active' : ''}`







                }







                onClick={handleNavigation}







              >







                <span className="nav-subitem-dot" />







                <span>{item.label}</span>







              </NavLink>







            )







          }















          return (







            <button







              key={item.label}







              type="button"







              className="nav-subitem nav-subitem-disabled"







              disabled







              title="Pantalla pendiente de implementar"







            >







              <span className="nav-subitem-dot" />







              <span>{item.label}</span>







            </button>







          )







        })}







      </div>







    )







  }















  const renderMenuGroup = ({







    id,







    label,







    icon,







    items,







  }) => {







    const isOpenMenu = openMenus[id]















    return (







      <div className="nav-group" key={id}>







        <button







          type="button"







          className={`nav-group-header ${







            isOpenMenu ? 'open' : ''







          }`}







          onClick={() => toggleMenu(id)}







        >







          <span className="nav-group-left">







            <span className="nav-icon">{icon}</span>







            <span>{label}</span>







          </span>















          <span className="nav-chevron">







            {isOpenMenu ? '⌃' : '⌄'}







          </span>







        </button>















        {isOpenMenu && renderSubmenu(items)}







      </div>







    )







  }















  const renderAcademico = () => (







    <>







      <div className="nav-section">







        <span className="nav-title">PRINCIPAL</span>















        <NavLink







          to="/academico"







          end







          className={({ isActive }) =>







            `nav-item ${isActive ? 'active' : ''}`







          }







          onClick={handleNavigation}







        >







          <span className="nav-icon">⌂</span>







          <span>Inicio</span>







        </NavLink>







      </div>















            {(canManagePublications || canManageSocialLinks) && (
        <div className="nav-section">
          <span className="nav-title">COMUNICACIÓN</span>

          {canManagePublications && (
            <NavLink
              to="/academico/publicaciones"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={handleNavigation}
            >
              <span className="nav-icon">▣</span>
              <span>Publicaciones</span>
            </NavLink>
          )}

          {canManageSocialLinks && (
            <NavLink
              to="/academico/redes-sociales"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={handleNavigation}
            >
              <span className="nav-icon">◎</span>
              <span>Redes sociales</span>
            </NavLink>
          )}
        </div>
      )}

<div className="nav-section">







        <span className="nav-title">ACADÉMICO</span>















        {renderMenuGroup({







          id: 'mantenimiento',







          label: 'Mantenimiento',







          icon: '▣',







          items: [







            {







              label: 'Familias',







              path: '/familias',







            },







            {







              label: 'Alumnos',







              path: '/alumnos',







            },







            {







              label: 'Personal',







              path: '/personal',







            },







            {







              label: 'Tablas',







            },







            {







              label: 'Colegio',







            },







            {







              label: 'Año',







            },







            {







              label: 'Cursos',







            },







            {







              label: 'Reconocimientos',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'asignacion',







          label: 'Asignación',







          icon: '☑',







          items: [







            {







              label: 'Plan Curricular',







            },







            {







              label: 'Salones',







            },







            {







              label: 'Precedencias',







            },







            {







              label: 'Profesores responsables',







            },







            {







              label: 'Movilidad',







            },







            {







              label: 'Planificación Académica',







            },







            {







              label: 'Cierre de registros de notas',







            },







            {







              label: 'Asignación de Secciones en Bloque',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'registro',







          label: 'Registro',







          icon: '▤',







          items: [







            {







              label: 'Situación del Alumno',







            },







            {







              label: 'Nota Anual',







            },







            {







              label: 'Anecdotario',







            },







            {







              label: 'Incidencias Conductuales',







            },







            {







              label: 'Parte Académico',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'pendientes',







          label: 'Pendientes',







          icon: '☷',







          items: [







            {







              label: 'Cursos de Recuperación / Subsana',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'procesos',







          label: 'Procesos',







          icon: '⚙',







          items: [







            {







              label: 'Inicio Año Escolar',







            },







            {







              label: 'Cálculo de Notas Anuales',







            },







            {







              label: 'Cierre Año Escolar',







            },







            {







              label: 'Generación de Número de Orden',







            },







            {







              label: 'Copiar Información del Año Anterior',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'formatos',







          label: 'Formatos',







          icon: '▤',







          items: [







            {







              label: 'Generación de Formatos',







            },







            {







              label: 'Información Gerencial',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'seguridad',







          label: 'Seguridad',







          icon: '⬟',







          items: [







            {







              label: 'Configuración de Usuarios',







            },







            {







              label: 'Configuración de Perfiles',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'utilitarios',







          label: 'Utilitarios',







          icon: '⚙',







          items: [







            {







              label: 'Pendiente de verificar',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'matricula',







          label: 'Matrícula',







          icon: '▣',







          items: [







            {







              label: 'Pendiente de verificar',







            },







          ],







        })}















        {renderMenuGroup({







          id: 'psicologia',







          label: 'Psicología',







          icon: '♙',







          items: [







            {







              label: 'Pendiente de verificar',







            },







          ],







        })}







      </div>







    </>







  )















  const renderPlaceholderModule = () => (







    <div className="nav-section">







      <span className="nav-title">MÓDULO</span>















      <div className="module-placeholder">







        <span className="module-placeholder-icon">







          ○







        </span>















        <div>







          <strong>{currentModule.name}</strong>







          <span>Menú en construcción</span>







        </div>







      </div>







    </div>







  )















  return (







    <>







      <div







        className={`sidebar-overlay ${







          isOpen ? 'active' : ''







        }`}







        onClick={onClose}







      />















      <aside







        className={`sidebar ${







          isOpen ? 'open' : ''







        }`}







      >







        <div className="sidebar-brand">







          <div className="brand-logo">







            E







          </div>















          <div>







            <h1>EduGestWeb</h1>







            <span>Gestión Educativa</span>







          </div>







        </div>















        <div className="sidebar-school-header">







          <strong>Colegio Vancouver</strong>







          <span>







            QUISPE BARRAZA, JHILVER ELOY







          </span>







        </div>















        <nav className="sidebar-nav">







          {currentModule.code === 'ACADEMICO'







            ? renderAcademico()







            : renderPlaceholderModule()}







        </nav>















        <div className="sidebar-footer">







          <div className="school-mini">







            <div className="school-icon">







              V







            </div>















            <div>







              <strong>







                Colegio Vancouver







              </strong>















              <span>







                Administración







              </span>







            </div>







          </div>







        </div>







      </aside>







    </>







  )







}















export default Sidebar
