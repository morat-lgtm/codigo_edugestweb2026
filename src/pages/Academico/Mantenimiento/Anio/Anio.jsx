import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import './Anio.css'

const SCHOOL_ID = '423ade47-40f5-41d5-ae49-fa3bbe3fe5cb'

// ============================================================
// PRUEBA TEMPORAL DE AUTENTICACIÓN Y PERMISOS DE CURRÍCULO
// ============================================================

async function probarPermisosCurriculo() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log('USUARIO AUTH:', user)
  console.log('ERROR USUARIO:', userError)

  const { data: ver, error: verError } = await supabase.rpc(
    'has_my_curriculum_permission',
    {
      required_permission_code: 'CURRICULUM_VER'
    }
  )

  console.log('CURRICULUM_VER:', ver)
  console.log('ERROR VER:', verError)

  const { data: gestionar, error: gestionarError } = await supabase.rpc(
    'has_my_curriculum_permission',
    {
      required_permission_code: 'CURRICULUM_GESTIONAR'
    }
  )

  console.log('CURRICULUM_GESTIONAR:', gestionar)
  console.log('ERROR GESTIONAR:', gestionarError)
}

const ESTADOS = [
  { value: 'inicio', label: 'Inicio' },
  { value: 'proceso', label: 'Proceso' },
  { value: 'cierre', label: 'Cierre' },
]

function Anio() {
  const [anios, setAnios] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [canManage, setCanManage] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    year: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'inicio',
    is_current: false,
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: membership, error: membershipError } = await supabase
        .from('school_memberships')
        .select('id')
        .eq('school_id', SCHOOL_ID)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle()

      if (membershipError) throw membershipError

      if (!membership) {
        throw new Error('No tienes una membresía activa en este colegio.')
      }

      const { data: permisos, error: permisosError } = await supabase.rpc(
        'has_my_school_permission',
        {
          target_school_id: SCHOOL_ID,
          required_permission_code: 'ACADEMIC_YEARS_GESTIONAR',
        }
      )

      if (permisosError) throw permisosError

      setCanManage(Boolean(permisos))

      const { data, error: aniosError } = await supabase
        .from('academic_years')
        .select(`
          id,
          year,
          description,
          start_date,
          end_date,
          status,
          is_current
        `)
        .eq('school_id', SCHOOL_ID)
        .order('year', { ascending: false })

      if (aniosError) throw aniosError

      setAnios(data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudieron cargar los años escolares.')
    } finally {
      setLoading(false)
    }
  }

  const abrirNuevo = () => {
    setEditingId(null)

    setForm({
      year: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'inicio',
      is_current: false,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const abrirEditar = (anio) => {
    setEditingId(anio.id)

    setForm({
      year: anio.year ?? '',
      description: anio.description ?? '',
      start_date: anio.start_date ?? '',
      end_date: anio.end_date ?? '',
      status: anio.status ?? 'inicio',
      is_current: Boolean(anio.is_current),
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const cerrarModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingId(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const guardar = async (e) => {
    e.preventDefault()

    if (!canManage) {
      setError('No tienes permisos para gestionar años escolares.')
      return
    }

    if (!form.year) {
      setError('Ingresa el año escolar.')
      return
    }

    const yearNumber = Number(form.year)

    if (
      !Number.isInteger(yearNumber) ||
      yearNumber < 2000 ||
      yearNumber > 2100
    ) {
      setError('El año escolar no es válido.')
      return
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        school_id: SCHOOL_ID,
        year: yearNumber,
        description:
          form.description.trim() || `Año Escolar ${yearNumber}`,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        is_current: form.is_current,
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('academic_years')
          .update({
            year: payload.year,
            description: payload.description,
            start_date: payload.start_date,
            end_date: payload.end_date,
            status: payload.status,
            is_current: payload.is_current,
          })
          .eq('id', editingId)
          .eq('school_id', SCHOOL_ID)

        if (updateError) throw updateError

        setSuccess('Año escolar actualizado correctamente.')
      } else {
        const { error: insertError } = await supabase
          .from('academic_years')
          .insert(payload)

        if (insertError) throw insertError

        setSuccess('Año escolar creado correctamente.')
      }

      setShowModal(false)
      setEditingId(null)

      await cargarDatos()
    } catch (err) {
      console.error(err)

      if (err.code === '23505') {
        setError(
          'No se puede guardar: el colegio ya tiene un año actual o el año escolar ya existe.'
        )
      } else {
        setError(err.message || 'No se pudo guardar el año escolar.')
      }
    } finally {
      setSaving(false)
    }
  }

  const establecerActual = async (anio) => {
    if (!canManage) {
      setError('No tienes permisos para cambiar el año actual.')
      return
    }

    if (anio.is_current) return

    const confirmar = window.confirm(
      `¿Deseas establecer el año ${anio.year} como año actual?`
    )

    if (!confirmar) return

    setError('')
    setSuccess('')

    try {
      /*
       * Primero quitamos el estado actual del año vigente.
       * El índice único de PostgreSQL garantiza que nunca
       * queden dos años actuales simultáneamente.
       */

      const { error: resetError } = await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('school_id', SCHOOL_ID)
        .eq('is_current', true)

      if (resetError) throw resetError

      const { error: currentError } = await supabase
        .from('academic_years')
        .update({ is_current: true })
        .eq('id', anio.id)
        .eq('school_id', SCHOOL_ID)

      if (currentError) throw currentError

      setSuccess(`El año ${anio.year} ahora es el año actual.`)

      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo establecer el año actual.')
    }
  }

  const cambiarEstado = async (anio, nuevoEstado) => {
    if (!canManage) {
      setError('No tienes permisos para cambiar el estado.')
      return
    }

    if (anio.status === nuevoEstado) return

    const etiqueta = ESTADOS.find(
      (estado) => estado.value === nuevoEstado
    )?.label

    const confirmar = window.confirm(
      `¿Deseas cambiar el estado del año ${anio.year} a "${etiqueta}"?`
    )

    if (!confirmar) return

    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('academic_years')
        .update({ status: nuevoEstado })
        .eq('id', anio.id)
        .eq('school_id', SCHOOL_ID)

      if (updateError) throw updateError

      setSuccess(`El estado del año ${anio.year} fue actualizado.`)

      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo cambiar el estado.')
    }
  }

  const obtenerEstadoLabel = (status) => {
    return (
      ESTADOS.find((estado) => estado.value === status)?.label ||
      status
    )
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '—'

    const [year, month, day] = fecha.split('-')

    return `${day}/${month}/${year}`
  }

  return (
    <div className="anio-page">

      {/* =====================================================
          BOTÓN TEMPORAL PARA PROBAR CURRÍCULO
          ===================================================== */}

      <button
        type="button"
        onClick={probarPermisosCurriculo}
        style={{
          marginBottom: '20px',
          padding: '10px 16px',
          cursor: 'pointer',
        }}
      >
        PROBAR PERMISOS CURRÍCULO
      </button>

      <div className="anio-header">
        <div>
          <span className="anio-breadcrumb">
            Académico / Mantenimiento
          </span>

          <h1>Años escolares</h1>

          <p>
            Gestiona los años académicos de la institución educativa.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="anio-btn anio-btn-primary"
            onClick={abrirNuevo}
          >
            + Nuevo año
          </button>
        )}
      </div>

      {error && (
        <div className="anio-alert anio-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="anio-alert anio-alert-success">
          {success}
        </div>
      )}

      <div className="anio-card">
        <div className="anio-card-header">
          <div>
            <h2>Registro de años escolares</h2>

            <span>
              {anios.length}{' '}
              {anios.length === 1
                ? 'año registrado'
                : 'años registrados'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="anio-loading">
            Cargando años escolares...
          </div>
        ) : anios.length === 0 ? (
          <div className="anio-empty">
            <div className="anio-empty-icon">📅</div>

            <h3>No hay años escolares registrados</h3>

            <p>
              Crea el primer año escolar para comenzar la
              configuración académica.
            </p>

            {canManage && (
              <button
                type="button"
                className="anio-btn anio-btn-primary"
                onClick={abrirNuevo}
              >
                Crear año escolar
              </button>
            )}
          </div>
        ) : (
          <div className="anio-table-wrapper">
            <table className="anio-table">
              <thead>
                <tr>
                  <th>Año</th>
                  <th>Descripción</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Actual</th>
                  {canManage && <th>Acciones</th>}
                </tr>
              </thead>

              <tbody>
                {anios.map((anio) => (
                  <tr key={anio.id}>
                    <td>
                      <strong>{anio.year}</strong>
                    </td>

                    <td>
                      {anio.description ||
                        `Año Escolar ${anio.year}`}
                    </td>

                    <td>
                      {formatearFecha(anio.start_date)}
                    </td>

                    <td>
                      {formatearFecha(anio.end_date)}
                    </td>

                    <td>
                      <span
                        className={`anio-status anio-status-${anio.status}`}
                      >
                        {obtenerEstadoLabel(anio.status)}
                      </span>
                    </td>

                    <td>
                      {anio.is_current ? (
                        <span className="anio-current">
                          ✓ Actual
                        </span>
                      ) : (
                        <span className="anio-not-current">
                          —
                        </span>
                      )}
                    </td>

                    {canManage && (
                      <td>
                        <div className="anio-actions">

                          <button
                            type="button"
                            className="anio-action"
                            onClick={() => abrirEditar(anio)}
                          >
                            Editar
                          </button>

                          {!anio.is_current && (
                            <button
                              type="button"
                              className="anio-action anio-action-current"
                              onClick={() =>
                                establecerActual(anio)
                              }
                            >
                              Hacer actual
                            </button>
                          )}

                          <select
                            value={anio.status}
                            onChange={(e) =>
                              cambiarEstado(
                                anio,
                                e.target.value
                              )
                            }
                            className="anio-status-select"
                            aria-label={`Cambiar estado del año ${anio.year}`}
                          >
                            {ESTADOS.map((estado) => (
                              <option
                                key={estado.value}
                                value={estado.value}
                              >
                                {estado.label}
                              </option>
                            ))}
                          </select>

                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="anio-modal-overlay"
          onMouseDown={cerrarModal}
        >
          <div
            className="anio-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >

            <div className="anio-modal-header">
              <div>
                <span>
                  Mantenimiento / Año
                </span>

                <h2>
                  {editingId
                    ? 'Editar año escolar'
                    : 'Nuevo año escolar'}
                </h2>
              </div>

              <button
                type="button"
                className="anio-modal-close"
                onClick={cerrarModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={guardar}>

              <div className="anio-form-grid">

                <div className="anio-field">
                  <label htmlFor="year">
                    Año escolar *
                  </label>

                  <input
                    id="year"
                    name="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={form.year}
                    onChange={handleChange}
                    placeholder="2027"
                    required
                  />
                </div>

                <div className="anio-field">
                  <label htmlFor="description">
                    Descripción
                  </label>

                  <input
                    id="description"
                    name="description"
                    type="text"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Año Escolar 2027"
                  />
                </div>

                <div className="anio-field">
                  <label htmlFor="start_date">
                    Fecha de inicio
                  </label>

                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="anio-field">
                  <label htmlFor="end_date">
                    Fecha de fin
                  </label>

                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={form.end_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="anio-field">
                  <label htmlFor="status">
                    Estado
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {ESTADOS.map((estado) => (
                      <option
                        key={estado.value}
                        value={estado.value}
                      >
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="anio-field anio-field-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="is_current"
                      checked={form.is_current}
                      onChange={handleChange}
                    />

                    <span>
                      Establecer como año actual
                    </span>
                  </label>

                  <small>
                    Solo puede existir un año actual por colegio.
                  </small>
                </div>

              </div>

              <div className="anio-modal-footer">

                <button
                  type="button"
                  className="anio-btn anio-btn-secondary"
                  onClick={cerrarModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="anio-btn anio-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Crear año'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

export default Anio