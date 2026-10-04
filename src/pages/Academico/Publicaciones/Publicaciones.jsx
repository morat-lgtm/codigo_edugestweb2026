import { useEffect, useMemo, useState } from 'react'
import './Publicaciones.css'
import { supabase } from '../../../lib/supabaseClient'

const ESTADOS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'SCHEDULED', label: 'Programadas' },
  { value: 'PUBLISHED', label: 'Publicadas' },
  { value: 'ARCHIVED', label: 'Archivadas' },
]

const TIPOS = [
  { value: 'COMUNICADO', label: 'Comunicado' },
  { value: 'AVISO', label: 'Aviso' },
  { value: 'NOTICIA', label: 'Noticia' },
  { value: 'EVENTO', label: 'Evento' },
  { value: 'DOCUMENTO', label: 'Documento' },
]

const ESTADO_LABEL = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Archivada',
}

function emptyForm() {
  return {
    id: null,
    title: '',
    summary: '',
    content: '',
    type: 'COMUNICADO',
    image_url: '',
    document_url: '',
    start_at: '',
    end_at: '',
    status: 'DRAFT',
    is_featured: false,
  }
}

function toInputDateTime(value) {
  if (!value) return ''

  const date = new Date(value)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toIso(value) {
  if (!value) return null

  return new Date(value).toISOString()
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function Publicaciones() {
  const [schoolId, setSchoolId] = useState(null)

  const [publicaciones, setPublicaciones] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [filtroEstado, setFiltroEstado] = useState('ALL')

  const [modalOpen, setModalOpen] = useState(false)

  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    inicializar()
  }, [])

  async function inicializar() {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!user) {
        throw new Error('No existe una sesión activa.')
      }

      const { data: memberships, error: membershipError } =
        await supabase
          .from('school_memberships')
          .select('school_id, created_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)

      if (membershipError) throw membershipError

      const membership = memberships?.[0]

      if (!membership) {
        throw new Error(
          'No se encontró un colegio asociado al usuario.'
        )
      }

      setSchoolId(membership.school_id)

      await cargarPublicaciones(membership.school_id)
    } catch (err) {
      console.error(err)
      setError(
        err.message ||
          'No fue posible cargar las publicaciones.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function cargarPublicaciones(currentSchoolId = schoolId) {
    if (!currentSchoolId) return

    const { data, error: publicationsError } =
      await supabase
        .from('institutional_publications')
        .select(`
          id,
          school_id,
          title,
          summary,
          content,
          type,
          image_url,
          document_url,
          start_at,
          end_at,
          status,
          is_featured,
          published_at,
          created_at,
          updated_at
        `)
        .eq('school_id', currentSchoolId)
        .order('is_featured', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        })

    if (publicationsError) {
      throw publicationsError
    }

    setPublicaciones(data || [])
  }

  function abrirNueva() {
    setForm({
      ...emptyForm(),
      start_at: toInputDateTime(new Date()),
    })

    setSuccess('')
    setError('')
    setModalOpen(true)
  }

  function abrirEditar(publicacion) {
    setForm({
      id: publicacion.id,
      title: publicacion.title || '',
      summary: publicacion.summary || '',
      content: publicacion.content || '',
      type: publicacion.type || 'COMUNICADO',
      image_url: publicacion.image_url || '',
      document_url: publicacion.document_url || '',
      start_at: toInputDateTime(
        publicacion.start_at
      ),
      end_at: toInputDateTime(
        publicacion.end_at
      ),
      status: publicacion.status || 'DRAFT',
      is_featured:
        publicacion.is_featured || false,
    })

    setSuccess('')
    setError('')
    setModalOpen(true)
  }

  function cerrarModal() {
    if (saving) return

    setModalOpen(false)
    setForm(emptyForm())
  }

  function actualizarCampo(campo, valor) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }))
  }

  async function guardar() {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!schoolId) {
        throw new Error(
          'No se encontró el colegio del usuario.'
        )
      }

      if (!form.title.trim()) {
        throw new Error(
          'El título es obligatorio.'
        )
      }

      if (!form.start_at) {
        throw new Error(
          'La fecha de inicio es obligatoria.'
        )
      }

      if (
        form.end_at &&
        new Date(form.end_at) <
          new Date(form.start_at)
      ) {
        throw new Error(
          'La fecha de término no puede ser anterior a la fecha de inicio.'
        )
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error(
          'La sesión ha expirado.'
        )
      }

      const payload = {
        school_id: schoolId,
        title: form.title.trim(),
        summary:
          form.summary.trim() || null,
        content:
          form.content.trim() || null,
        type: form.type,
        image_url:
          form.image_url.trim() || null,
        document_url:
          form.document_url.trim() || null,
        start_at: toIso(form.start_at),
        end_at: toIso(form.end_at),
        status: form.status,
        is_featured: form.is_featured,
      }

      if (!form.id) {
        payload.created_by = user.id

        const { error: insertError } =
          await supabase
            .from(
              'institutional_publications'
            )
            .insert(payload)

        if (insertError) {
          throw insertError
        }

        setSuccess(
          'Publicación creada correctamente.'
        )
      } else {
        const { error: updateError } =
          await supabase
            .from(
              'institutional_publications'
            )
            .update(payload)
            .eq('id', form.id)
            .eq('school_id', schoolId)

        if (updateError) {
          throw updateError
        }

        setSuccess(
          'Publicación actualizada correctamente.'
        )
      }

      setModalOpen(false)
      setForm(emptyForm())

      await cargarPublicaciones()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'No fue posible guardar la publicación.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(publicacion) {
    const confirmar = window.confirm(
      `¿Deseas eliminar "${publicacion.title}"?`
    )

    if (!confirmar) return

    try {
      setError('')
      setSuccess('')

      const { error: deleteError } =
        await supabase
          .from('institutional_publications')
          .delete()
          .eq('id', publicacion.id)
          .eq('school_id', schoolId)

      if (deleteError) {
        throw deleteError
      }

      setSuccess(
        'Publicación eliminada correctamente.'
      )

      await cargarPublicaciones()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'No fue posible eliminar la publicación.'
      )
    }
  }

  async function cambiarEstado(
    publicacion,
    nuevoEstado
  ) {
    try {
      setError('')
      setSuccess('')

      const payload = {
        status: nuevoEstado,
      }

      if (
        nuevoEstado === 'PUBLISHED' &&
        !publicacion.published_at
      ) {
        payload.published_at = new Date().toISOString()
      }

      const { error: updateError } =
        await supabase
          .from('institutional_publications')
          .update(payload)
          .eq('id', publicacion.id)
          .eq('school_id', schoolId)

      if (updateError) {
        throw updateError
      }

      setSuccess(
        `Publicación ${ESTADO_LABEL[nuevoEstado].toLowerCase()} correctamente.`
      )

      await cargarPublicaciones()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'No fue posible cambiar el estado.'
      )
    }
  }

  const publicacionesFiltradas = useMemo(() => {
    if (filtroEstado === 'ALL') {
      return publicaciones
    }

    return publicaciones.filter(
      (item) =>
        item.status === filtroEstado
    )
  }, [publicaciones, filtroEstado])

  if (loading) {
    return (
      <div className="publicaciones-page">
        <div className="publicaciones-loading">
          Cargando gestión de publicaciones...
        </div>
      </div>
    )
  }

  return (
    <div className="publicaciones-page">

      <header className="publicaciones-header">

        <div>
          <span className="section-kicker">
            COMUNICACIÓN
          </span>

          <h1>Gestionar publicaciones</h1>

          <p>
            Administra comunicados, avisos, noticias,
            eventos y documentos institucionales.
          </p>
        </div>

        <button
          type="button"
          className="publicaciones-primary-button"
          onClick={abrirNueva}
        >
          + Nueva publicación
        </button>

      </header>


      {error && (
        <div className="publicaciones-alert error">
          {error}
        </div>
      )}


      {success && (
        <div className="publicaciones-alert success">
          {success}
        </div>
      )}


      <div className="publicaciones-tabs">

        {ESTADOS.map((estado) => (
          <button
            key={estado.value}
            type="button"
            className={
              filtroEstado === estado.value
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltroEstado(
                estado.value
              )
            }
          >
            {estado.label}

            <span>
              {estado.value === 'ALL'
                ? publicaciones.length
                : publicaciones.filter(
                    (item) =>
                      item.status ===
                      estado.value
                  ).length}
            </span>
          </button>
        ))}

      </div>


      <section className="publicaciones-list">

        {publicacionesFiltradas.length === 0 ? (
          <div className="publicaciones-empty">

            <div className="empty-icon">
              +
            </div>

            <h2>
              No hay publicaciones
            </h2>

            <p>
              No existen publicaciones dentro
              del filtro seleccionado.
            </p>

            <button
              type="button"
              onClick={abrirNueva}
              className="publicaciones-secondary-button"
            >
              Crear publicación
            </button>

          </div>
        ) : (
          publicacionesFiltradas.map(
            (publicacion) => (
              <article
                key={publicacion.id}
                className="publicacion-row"
              >

                <div className="publicacion-main">

                  <div className="publicacion-row-top">

                    <span
                      className={`publicacion-type ${publicacion.type.toLowerCase()}`}
                    >
                      {getTypeLabel(
                        publicacion.type
                      )}
                    </span>

                    {publicacion.is_featured && (
                      <span className="featured-badge">
                        Destacada
                      </span>
                    )}

                    <span
                      className={`status-badge ${publicacion.status.toLowerCase()}`}
                    >
                      {
                        ESTADO_LABEL[
                          publicacion.status
                        ]
                      }
                    </span>

                  </div>


                  <h2>
                    {publicacion.title}
                  </h2>


                  {publicacion.summary && (
                    <p>
                      {publicacion.summary}
                    </p>
                  )}


                  <div className="publicacion-meta">

                    <span>
                      Inicio:{' '}
                      {formatDate(
                        publicacion.start_at
                      )}
                    </span>

                    <span>
                      {publicacion.end_at
                        ? `Fin: ${formatDate(
                            publicacion.end_at
                          )}`
                        : 'Sin fecha de término'}
                    </span>

                    {publicacion.document_url && (
                      <span>
                        PDF / Drive
                      </span>
                    )}

                  </div>

                </div>


                <div className="publicacion-actions">

                  <button
                    type="button"
                    onClick={() =>
                      abrirEditar(
                        publicacion
                      )
                    }
                  >
                    Editar
                  </button>


                  {publicacion.status ===
                    'DRAFT' && (
                    <button
                      type="button"
                      onClick={() =>
                        cambiarEstado(
                          publicacion,
                          'PUBLISHED'
                        )
                      }
                    >
                      Publicar
                    </button>
                  )}


                  {publicacion.status ===
                    'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() =>
                        cambiarEstado(
                          publicacion,
                          'ARCHIVED'
                        )
                      }
                    >
                      Archivar
                    </button>
                  )}


                  {publicacion.status ===
                    'ARCHIVED' && (
                    <button
                      type="button"
                      onClick={() =>
                        cambiarEstado(
                          publicacion,
                          'DRAFT'
                        )
                      }
                    >
                      Recuperar
                    </button>
                  )}


                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      eliminar(
                        publicacion
                      )
                    }
                  >
                    Eliminar
                  </button>

                </div>

              </article>
            )
          )
        )}

      </section>


      {modalOpen && (
        <div
          className="publicaciones-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarModal()
            }
          }}
        >

          <div className="publicaciones-modal">

            <div className="modal-header">

              <div>
                <span className="section-kicker">
                  PUBLICACIÓN
                </span>

                <h2>
                  {form.id
                    ? 'Editar publicación'
                    : 'Nueva publicación'}
                </h2>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={saving}
                className="modal-close"
              >
                ×
              </button>

            </div>


            <div className="modal-body">

              <div className="form-grid">

                <label className="form-field full">
                  <span>
                    Título *
                  </span>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      actualizarCampo(
                        'title',
                        event.target.value
                      )
                    }
                    placeholder="Ej. Reglamento Interno 2026"
                  />
                </label>


                <label className="form-field">
                  <span>
                    Tipo *
                  </span>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      actualizarCampo(
                        'type',
                        event.target.value
                      )
                    }
                  >
                    {TIPOS.map((tipo) => (
                      <option
                        key={tipo.value}
                        value={tipo.value}
                      >
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </label>


                <label className="form-field">
                  <span>
                    Estado *
                  </span>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      actualizarCampo(
                        'status',
                        event.target.value
                      )
                    }
                  >
                    <option value="DRAFT">
                      Borrador
                    </option>

                    <option value="SCHEDULED">
                      Programada
                    </option>

                    <option value="PUBLISHED">
                      Publicada
                    </option>

                    <option value="ARCHIVED">
                      Archivada
                    </option>
                  </select>
                </label>


                <label className="form-field full">
                  <span>
                    Resumen
                  </span>

                  <textarea
                    rows="3"
                    value={form.summary}
                    onChange={(event) =>
                      actualizarCampo(
                        'summary',
                        event.target.value
                      )
                    }
                    placeholder="Breve descripción que aparecerá en el Inicio."
                  />
                </label>


                <label className="form-field full">
                  <span>
                    Contenido
                  </span>

                  <textarea
                    rows="6"
                    value={form.content}
                    onChange={(event) =>
                      actualizarCampo(
                        'content',
                        event.target.value
                      )
                    }
                    placeholder="Contenido completo de la publicación."
                  />
                </label>


                <label className="form-field full">
                  <span>
                    Imagen — URL opcional
                  </span>

                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(event) =>
                      actualizarCampo(
                        'image_url',
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                  />
                </label>


                <label className="form-field full">
                  <span>
                    Documento / PDF — Google Drive
                  </span>

                  <input
                    type="url"
                    value={form.document_url}
                    onChange={(event) =>
                      actualizarCampo(
                        'document_url',
                        event.target.value
                      )
                    }
                    placeholder="https://drive.google.com/..."
                  />

                  <small>
                    El PDF permanece alojado en Google Drive.
                    EduGestWeb solo guarda el enlace.
                  </small>
                </label>


                <label className="form-field">
                  <span>
                    Fecha de inicio *
                  </span>

                  <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(event) =>
                      actualizarCampo(
                        'start_at',
                        event.target.value
                      )
                    }
                  />
                </label>


                <label className="form-field">
                  <span>
                    Fecha de término
                  </span>

                  <input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(event) =>
                      actualizarCampo(
                        'end_at',
                        event.target.value
                      )
                    }
                  />
                </label>


                <label className="featured-check">

                  <input
                    type="checkbox"
                    checked={
                      form.is_featured
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        'is_featured',
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    <strong>
                      Mostrar como publicación destacada
                    </strong>

                    <small>
                      Aparecerá en la parte principal
                      del Inicio Académico.
                    </small>
                  </span>

                </label>

              </div>

            </div>


            <div className="modal-footer">

              <button
                type="button"
                className="publicaciones-secondary-button"
                onClick={cerrarModal}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="publicaciones-primary-button"
                onClick={guardar}
                disabled={saving}
              >
                {saving
                  ? 'Guardando...'
                  : 'Guardar publicación'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

function getTypeLabel(type) {
  const labels = {
    COMUNICADO: 'Comunicado',
    AVISO: 'Aviso',
    NOTICIA: 'Noticia',
    EVENTO: 'Evento',
    DOCUMENTO: 'Documento',
  }

  return labels[type] || type
}

export default Publicaciones