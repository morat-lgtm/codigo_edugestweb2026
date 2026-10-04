import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { validateStaffUser } from '../../services/staffUserService'
import './Personal.css'

const PAGE_SIZE = 50

function Personal() {
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [situacion, setSituacion] = useState('active')
  const [page, setPage] = useState(1)

  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [testing, setTesting] = useState(false)

  useEffect(() => {
    cargarPersonal()
  }, [])

  async function cargarPersonal() {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error('No hay una sesión activa.')
      }

      const {
        data: membership,
        error: membershipError,
      } = await supabase
        .from('school_memberships')
        .select('school_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (membershipError) {
        throw membershipError
      }

      if (!membership) {
        throw new Error(
          'El usuario no tiene una membresía activa en ningún colegio.'
        )
      }

      const {
        data: staffData,
        error: staffError,
      } = await supabase
        .from('staff')
        .select(`
          id,
          school_id,
          person_id,
          staff_code,
          situation,
          is_teacher,
          entry_date,
          exit_date
        `)
        .eq('school_id', membership.school_id)
        .order('staff_code', { ascending: true })

      if (staffError) {
        throw staffError
      }

      if (!staffData || staffData.length === 0) {
        setPersonal([])
        return
      }

      const personIds = staffData.map((item) => item.person_id)

      const {
        data: peopleData,
        error: peopleError,
      } = await supabase
        .from('people')
        .select(`
          id,
          first_name,
          paternal_last_name,
          maternal_last_name,
          document_type,
          document_number,
          birth_date,
          sex,
          nationality,
          email
        `)
        .in('id', personIds)

      if (peopleError) {
        throw peopleError
      }

      const peopleMap = new Map(
        (peopleData || []).map((person) => [
          person.id,
          person,
        ])
      )

      /*
       * Obtenemos las memberships existentes para conocer
       * qué trabajadores ya tienen cuenta.
       */
      const {
        data: membershipData,
        error: membershipsError,
      } = await supabase
        .from('school_memberships')
        .select(`
          id,
          user_id,
          person_id,
          is_active
        `)
        .eq('school_id', membership.school_id)

      if (membershipsError) {
        throw membershipsError
      }

      const membershipMap = new Map(
        (membershipData || []).map((item) => [
          item.person_id,
          item,
        ])
      )

      const resultado = staffData.map((staff) => {
        const person = peopleMap.get(staff.person_id)
        const account = membershipMap.get(staff.person_id)

        return {
          ...staff,
          person,
          account,
        }
      })

      setPersonal(resultado)
    } catch (err) {
      console.error('Error cargando personal:', err)
      setError(
        err?.message ||
          'No se pudo cargar la información del personal.'
      )
    } finally {
      setLoading(false)
    }
  }

  const personalFiltrado = useMemo(() => {
    const texto = search.trim().toLowerCase()

    return personal.filter((item) => {
      const person = item.person || {}

      const nombre = [
        person.paternal_last_name,
        person.maternal_last_name,
        person.first_name,
      ]
        .filter(Boolean)
        .join(' ')

      const coincideBusqueda =
        !texto ||
        nombre.toLowerCase().includes(texto) ||
        String(item.staff_code || '')
          .toLowerCase()
          .includes(texto) ||
        String(person.document_number || '')
          .toLowerCase()
          .includes(texto) ||
        String(person.email || '')
          .toLowerCase()
          .includes(texto)

      const situacionActual = String(
        item.situation || ''
      ).toLowerCase()

      let coincideSituacion = true

      if (situacion === 'active') {
        coincideSituacion = situacionActual === 'active'
      }

      if (situacion === 'retired') {
        coincideSituacion =
          situacionActual === 'retired'
      }

      if (situacion === 'inactive') {
        coincideSituacion =
          situacionActual === 'inactive'
      }

      return coincideBusqueda && coincideSituacion
    })
  }, [personal, search, situacion])

  useEffect(() => {
    setPage(1)
  }, [search, situacion])

  const totalPaginas = Math.max(
    1,
    Math.ceil(personalFiltrado.length / PAGE_SIZE)
  )

  const personalPagina = personalFiltrado.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  function nombreCompleto(person) {
    return [
      person?.paternal_last_name,
      person?.maternal_last_name,
      person?.first_name,
    ]
      .filter(Boolean)
      .join(' ')
  }

  function abrirDetalle(staff) {
    setSelectedStaff(staff)
    setShowModal(true)
  }

  function cerrarModal() {
    if (testing) return

    setShowModal(false)
    setSelectedStaff(null)
  }

  /*
   * PRUEBA TEMPORAL
   *
   * Esta función solamente llama a la Edge Function.
   * La Edge Function actualmente está en modo VALIDACIÓN
   * y NO crea todavía ninguna cuenta.
   */
  async function probarCrearCuenta() {
    if (!selectedStaff) return

    try {
      setTesting(true)

      const person = selectedStaff.person || {}

      const nombre = nombreCompleto(person)

      const resultado = await validateStaffUser(
        selectedStaff.id,
        person.email || 'prueba@vancouver.edu.pe'
      )

      console.log(
        'RESPUESTA EDGE FUNCTION:',
        resultado
      )

      alert(
        `Prueba correcta.\n\nTrabajador: ${nombre}\nCódigo: ${selectedStaff.staff_code}\n\nLa Edge Function validó correctamente y todavía NO creó ninguna cuenta.`
      )
    } catch (err) {
      console.error(
        'ERROR EDGE FUNCTION:',
        err
      )

      alert(
        `Error al probar la Edge Function:\n\n${
          err?.message ||
          'No se pudo ejecutar la función.'
        }`
      )
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="personal-page">
        <div className="personal-loading">
          Cargando personal...
        </div>
      </div>
    )
  }

  return (
    <div className="personal-page">

      <div className="personal-header">
        <div>
          <h1>Personal</h1>
          <p>
            Gestión del personal de la institución
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            alert(
              'La creación de personal se implementará posteriormente.'
            )
          }}
        >
          + Nuevo
        </button>
      </div>

      {error && (
        <div className="personal-error">
          {error}
        </div>
      )}

      <div className="personal-toolbar">

        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por código, nombre, DNI o correo..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="filter-box">
          <select
            value={situacion}
            onChange={(e) =>
              setSituacion(e.target.value)
            }
          >
            <option value="active">
              Activos
            </option>

            <option value="all">
              Todos
            </option>

            <option value="retired">
              Retirados
            </option>

            <option value="inactive">
              Inactivos
            </option>
          </select>
        </div>

      </div>

      <div className="personal-summary">
        <span>
          Mostrando{' '}
          <strong>
            {personalFiltrado.length}
          </strong>{' '}
          registros
        </span>

        <span>
          Total personal:{' '}
          <strong>
            {personal.length}
          </strong>
        </span>
      </div>

      <div className="personal-table-container">

        <table className="personal-table">

          <thead>
            <tr>
              <th>Código</th>
              <th>Personal</th>
              <th>Documento</th>
              <th>Sexo</th>
              <th>Docente</th>
              <th>Situación</th>
              <th>Cuenta</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {personalPagina.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="empty-state"
                >
                  No se encontró personal.
                </td>
              </tr>
            ) : (
              personalPagina.map((item) => {

                const person = item.person || {}

                return (
                  <tr key={item.id}>

                    <td>
                      {item.staff_code || '—'}
                    </td>

                    <td>
                      <div className="person-name">
                        {nombreCompleto(person)}
                      </div>

                      {person.email && (
                        <div className="person-email">
                          {person.email}
                        </div>
                      )}
                    </td>

                    <td>
                      {person.document_number || '—'}
                    </td>

                    <td>
                      {person.sex || '—'}
                    </td>

                    <td>
                      {item.is_teacher ? (
                        <span className="badge badge-teacher">
                          Sí
                        </span>
                      ) : (
                        <span className="badge">
                          No
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          item.situation === 'active'
                            ? 'badge-active'
                            : ''
                        }`}
                      >
                        {item.situation || '—'}
                      </span>
                    </td>

                    <td>
                      {item.account ? (
                        <span className="account-status account-active">
                          ● Con cuenta
                        </span>
                      ) : (
                        <span className="account-status account-none">
                          — Sin cuenta
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          abrirDetalle(item)
                        }
                      >
                        Ver
                      </button>
                    </td>

                  </tr>
                )
              })
            )}

          </tbody>

        </table>

      </div>

      {totalPaginas > 1 && (
        <div className="pagination">

          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            Anterior
          </button>

          <span>
            Página {page} de {totalPaginas}
          </span>

          <button
            type="button"
            disabled={page >= totalPaginas}
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            Siguiente
          </button>

        </div>
      )}

      {showModal && selectedStaff && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarModal()
            }
          }}
        >

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Detalle del personal
                </h2>

                <p>
                  Código:{' '}
                  {selectedStaff.staff_code}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={cerrarModal}
                disabled={testing}
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <div className="detail-grid">

                <div className="detail-item">
                  <span>
                    Apellidos y nombres
                  </span>

                  <strong>
                    {nombreCompleto(
                      selectedStaff.person
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Documento
                  </span>

                  <strong>
                    {selectedStaff.person
                      ?.document_number || '—'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Correo
                  </span>

                  <strong>
                    {selectedStaff.person
                      ?.email || '—'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Docente
                  </span>

                  <strong>
                    {selectedStaff.is_teacher
                      ? 'Sí'
                      : 'No'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Situación
                  </span>

                  <strong>
                    {selectedStaff.situation ||
                      '—'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Cuenta
                  </span>

                  <strong>
                    {selectedStaff.account
                      ? 'Con cuenta'
                      : 'Sin cuenta'}
                  </strong>
                </div>

              </div>

              <div className="account-test-section">

                <h3>
                  Prueba de cuenta
                </h3>

                <p>
                  Esta prueba solamente valida
                  si la Edge Function puede
                  procesar este trabajador.
                  No crea todavía ninguna cuenta.
                </p>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={
                    testing ||
                    Boolean(
                      selectedStaff.account
                    )
                  }
                  onClick={
                    probarCrearCuenta
                  }
                >
                  {testing
                    ? 'Validando...'
                    : selectedStaff.account
                      ? 'Ya tiene cuenta'
                      : 'Probar Edge Function'}
                </button>

              </div>

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="btn-secondary"
                onClick={cerrarModal}
                disabled={testing}
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Personal