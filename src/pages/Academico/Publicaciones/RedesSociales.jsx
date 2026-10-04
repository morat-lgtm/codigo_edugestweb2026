import { useEffect, useMemo, useState } from 'react'
import './RedesSociales.css'
import { supabase } from '../../../lib/supabaseClient'

const PLATFORMS = [
  { value: 'FACEBOOK', label: 'Facebook', icon: 'f' },
  { value: 'INSTAGRAM', label: 'Instagram', icon: '◎' },
  { value: 'YOUTUBE', label: 'YouTube', icon: '▶' },
  { value: 'TIKTOK', label: 'TikTok', icon: '♪' },
  { value: 'LINKEDIN', label: 'LinkedIn', icon: 'in' },
  { value: 'OTRO', label: 'Otra red social', icon: '↗' },
]

const emptyForm = {
  platform: 'FACEBOOK',
  url: '',
  is_active: true,
  show_on_home: true,
  display_order: 1,
}

function RedesSociales() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [schoolId, setSchoolId] = useState(null)

  const [canCreate, setCanCreate] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const platformMap = useMemo(
    () =>
      Object.fromEntries(
        PLATFORMS.map((item) => [item.value, item])
      ),
    []
  )

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!user) {
        setError('No hay una sesión activa.')
        return
      }

      const { data: membership, error: membershipError } =
        await supabase
          .from('school_memberships')
          .select('school_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

      if (membershipError) throw membershipError

      if (!membership) {
        setError(
          'No se encontró una membresía activa para este usuario.'
        )
        return
      }

      setSchoolId(membership.school_id)

      const [
        viewResult,
        createResult,
        editResult,
        deleteResult,
      ] = await Promise.all([
        supabase.rpc('has_my_school_permission', {
          target_school_id: membership.school_id,
          required_permission_code: 'SOCIAL_LINKS_VER',
        }),

        supabase.rpc('has_my_school_permission', {
          target_school_id: membership.school_id,
          required_permission_code: 'SOCIAL_LINKS_CREAR',
        }),

        supabase.rpc('has_my_school_permission', {
          target_school_id: membership.school_id,
          required_permission_code: 'SOCIAL_LINKS_EDITAR',
        }),

        supabase.rpc('has_my_school_permission', {
          target_school_id: membership.school_id,
          required_permission_code: 'SOCIAL_LINKS_ELIMINAR',
        }),
      ])

      if (viewResult.error) throw viewResult.error

      setCanCreate(Boolean(createResult.data))
      setCanEdit(Boolean(editResult.data))
      setCanDelete(Boolean(deleteResult.data))

      await cargarRedes(membership.school_id)
    } catch (err) {
      console.error(
        'Error cargando redes sociales:',
        err
      )

      setError(
        err?.message ||
          'No se pudo cargar la configuración de redes sociales.'
      )
    } finally {
      setLoading(false)
    }
  }

  const cargarRedes = async (currentSchoolId = schoolId) => {
    if (!currentSchoolId) return

    const { data, error: queryError } = await supabase
      .from('institutional_social_links')
      .select(
        'id, school_id, platform, url, is_active, show_on_home, display_order, created_at, updated_at'
      )
      .eq('school_id', currentSchoolId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (queryError) throw queryError

    setLinks(data || [])
  }

  const abrirNuevo = () => {
    const nextOrder =
      links.length > 0
        ? Math.max(
            ...links.map(
              (item) => Number(item.display_order) || 0
            )
          ) + 1
        : 1

    setEditingLink(null)

    setForm({
      ...emptyForm,
      display_order: nextOrder,
    })

    setError('')
    setShowModal(true)
  }

  const abrirEditar = (link) => {
    setEditingLink(link)

    setForm({
      platform: link.platform,
      url: link.url,
      is_active: link.is_active,
      show_on_home: link.show_on_home,
      display_order: link.display_order,
    })

    setError('')
    setShowModal(true)
  }

  const cerrarModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingLink(null)
    setForm(emptyForm)
  }

  const actualizarCampo = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const guardar = async (event) => {
    event.preventDefault()

    const cleanUrl = form.url.trim()

    if (!cleanUrl) {
      setError('Ingresa la URL de la red social.')
      return
    }

    try {
      new URL(cleanUrl)
    } catch {
      setError(
        'Ingresa una URL válida, por ejemplo: https://...'
      )
      return
    }

    if (!schoolId) {
      setError(
        'No se encontró el colegio asociado al usuario.'
      )
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        school_id: schoolId,
        platform: form.platform,
        url: cleanUrl,
        is_active: Boolean(form.is_active),
        show_on_home: Boolean(form.show_on_home),
        display_order: Math.max(
          0,
          Number(form.display_order) || 0
        ),
      }

      if (editingLink) {
        const { error: updateError } = await supabase
          .from('institutional_social_links')
          .update({
            platform: payload.platform,
            url: payload.url,
            is_active: payload.is_active,
            show_on_home: payload.show_on_home,
            display_order: payload.display_order,
          })
          .eq('id', editingLink.id)
          .eq('school_id', schoolId)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('institutional_social_links')
          .insert(payload)

        if (insertError) throw insertError
      }

      await cargarRedes(schoolId)
      cerrarModal()
    } catch (err) {
      console.error(
        'Error guardando red social:',
        err
      )

      if (err?.code === '23505') {
        setError(
          'Ya existe una red social de este tipo para este colegio.'
        )
      } else {
        setError(
          err?.message ||
            'No se pudo guardar la red social.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (link) => {
    if (!canEdit) return

    try {
      setError('')

      const { error: updateError } = await supabase
        .from('institutional_social_links')
        .update({
          is_active: !link.is_active,
        })
        .eq('id', link.id)
        .eq('school_id', schoolId)

      if (updateError) throw updateError

      await cargarRedes(schoolId)
    } catch (err) {
      console.error(
        'Error cambiando estado:',
        err
      )

      setError(
        err?.message ||
          'No se pudo cambiar el estado.'
      )
    }
  }

  const cambiarVisibilidadInicio = async (link) => {
    if (!canEdit) return

    try {
      setError('')

      const { error: updateError } = await supabase
        .from('institutional_social_links')
        .update({
          show_on_home: !link.show_on_home,
        })
        .eq('id', link.id)
        .eq('school_id', schoolId)

      if (updateError) throw updateError

      await cargarRedes(schoolId)
    } catch (err) {
      console.error(
        'Error cambiando visibilidad:',
        err
      )

      setError(
        err?.message ||
          'No se pudo actualizar la visibilidad.'
      )
    }
  }

  const eliminar = async (link) => {
    if (!canDelete) return

    const platformName =
      platformMap[link.platform]?.label ||
      link.platform

    const confirmed = window.confirm(
      `¿Deseas eliminar la configuración de ${platformName}?`
    )

    if (!confirmed) return

    try {
      setError('')

      const { error: deleteError } = await supabase
        .from('institutional_social_links')
        .delete()
        .eq('id', link.id)
        .eq('school_id', schoolId)

      if (deleteError) throw deleteError

      await cargarRedes(schoolId)
    } catch (err) {
      console.error(
        'Error eliminando red social:',
        err
      )

      setError(
        err?.message ||
          'No se pudo eliminar la red social.'
      )
    }
  }

  const abrirRed = (url) => {
    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  if (loading) {
    return (
      <main className="social-page">
        <div className="social-loading">
          <div className="social-spinner" />
          <span>
            Cargando redes sociales...
          </span>
        </div>
      </main>
    )
  }

  return (
    <main className="social-page">
      <section className="social-header">
        <div>
          <span className="social-kicker">
            COMUNICACIÓN
          </span>

          <h1>Redes sociales</h1>

          <p>
            Configura las redes oficiales que deseas
            mostrar en Inicio.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="social-primary-button"
            onClick={abrirNuevo}
          >
            <span>+</span>
            Agregar red social
          </button>
        )}
      </section>

      {error && (
        <div
          className="social-alert"
          role="alert"
        >
          <span className="social-alert-icon">
            !
          </span>

          <div>
            <strong>
              No se pudo completar la operación
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      <section className="social-content">
        <div className="social-section-title">
          <div>
            <h2>Redes configuradas</h2>

            <p>
              Estas redes pertenecen al colegio
              actual y se administran de forma
              independiente.
            </p>
          </div>

          <span className="social-count">
            {links.length}{' '}
            {links.length === 1
              ? 'red'
              : 'redes'}
          </span>
        </div>

        {links.length === 0 ? (
          <div className="social-empty">
            <div className="social-empty-icon">
              ◎
            </div>

            <h3>
              No hay redes sociales configuradas
            </h3>

            <p>
              Agrega las redes oficiales del colegio
              para poder mostrarlas en Inicio.
            </p>

            {canCreate && (
              <button
                type="button"
                className="social-secondary-button"
                onClick={abrirNuevo}
              >
                + Agregar primera red
              </button>
            )}
          </div>
        ) : (
          <div className="social-list">
            {links.map((link) => {
              const platform =
                platformMap[link.platform] || {
                  label: link.platform,
                  icon: '↗',
                }

              return (
                <article
                  className="social-card"
                  key={link.id}
                >
                  <div className="social-card-main">
                    <div className="social-platform-icon">
                      {platform.icon}
                    </div>

                    <div className="social-card-info">
                      <div className="social-card-title-row">
                        <h3>
                          {platform.label}
                        </h3>

                        <span
                          className={`social-status ${
                            link.is_active
                              ? 'active'
                              : 'inactive'
                          }`}
                        >
                          <span className="social-status-dot" />

                          {link.is_active
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="social-url"
                        onClick={() =>
                          abrirRed(link.url)
                        }
                        title="Abrir red social"
                      >
                        {link.url}
                      </button>

                      <div className="social-card-meta">
                        <button
                          type="button"
                          className={`social-check ${
                            link.show_on_home
                              ? 'checked'
                              : ''
                          }`}
                          onClick={() =>
                            cambiarVisibilidadInicio(
                              link
                            )
                          }
                          disabled={!canEdit}
                        >
                          <span className="social-checkbox">
                            {link.show_on_home
                              ? '✓'
                              : ''}
                          </span>

                          Mostrar en Inicio
                        </button>

                        <span className="social-order">
                          Orden:{' '}
                          <strong>
                            {link.display_order}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="social-card-actions">
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          className="social-action-button"
                          onClick={() =>
                            abrirEditar(link)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="social-action-button"
                          onClick={() =>
                            cambiarEstado(link)
                          }
                        >
                          {link.is_active
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>
                      </>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="social-action-button danger"
                        onClick={() =>
                          eliminar(link)
                        }
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="social-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              cerrarModal()
            }
          }}
        >
          <div
            className="social-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-modal-title"
          >
            <div className="social-modal-header">
              <div>
                <span className="social-kicker">
                  COMUNICACIÓN
                </span>

                <h2 id="social-modal-title">
                  {editingLink
                    ? 'Editar red social'
                    : 'Nueva red social'}
                </h2>
              </div>

              <button
                type="button"
                className="social-modal-close"
                onClick={cerrarModal}
                disabled={saving}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <form
              className="social-form"
              onSubmit={guardar}
            >
              <label>
                <span>Red social</span>

                <select
                  value={form.platform}
                  onChange={(event) =>
                    actualizarCampo(
                      'platform',
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  {PLATFORMS.map(
                    (platform) => (
                      <option
                        key={platform.value}
                        value={platform.value}
                      >
                        {platform.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>URL oficial</span>

                <input
                  type="url"
                  value={form.url}
                  onChange={(event) =>
                    actualizarCampo(
                      'url',
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  required
                  disabled={saving}
                />

                <small>
                  Usa la URL pública oficial del
                  colegio.
                </small>
              </label>

              <div className="social-form-grid">
                <label>
                  <span>Orden</span>

                  <input
                    type="number"
                    min="0"
                    value={form.display_order}
                    onChange={(event) =>
                      actualizarCampo(
                        'display_order',
                        event.target.value
                      )
                    }
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="social-form-options">
                <label className="social-switch-row">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      actualizarCampo(
                        'is_active',
                        event.target.checked
                      )
                    }
                    disabled={saving}
                  />

                  <span>
                    <strong>
                      Red activa
                    </strong>

                    <small>
                      Permite que la red esté
                      disponible para el sistema.
                    </small>
                  </span>
                </label>

                <label className="social-switch-row">
                  <input
                    type="checkbox"
                    checked={form.show_on_home}
                    onChange={(event) =>
                      actualizarCampo(
                        'show_on_home',
                        event.target.checked
                      )
                    }
                    disabled={saving}
                  />

                  <span>
                    <strong>
                      Mostrar en Inicio
                    </strong>

                    <small>
                      La red podrá mostrarse en la
                      página principal.
                    </small>
                  </span>
                </label>
              </div>

              <div className="social-modal-footer">
                <button
                  type="button"
                  className="social-secondary-button"
                  onClick={cerrarModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="social-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando...'
                    : editingLink
                      ? 'Guardar cambios'
                      : 'Guardar red social'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default RedesSociales