import { useEffect, useMemo, useState } from 'react'

import './Academico.css'

import { supabase } from '../../lib/supabaseClient'



function formatDate(date) {

  if (!date) return ''



  return new Intl.DateTimeFormat('es-PE', {

    day: '2-digit',

    month: 'short',

    year: 'numeric',

  }).format(new Date(date))

}



function formatDateShort(date) {

  if (!date) {

    return {

      day: '--',

      month: '---',

    }

  }



  const parsedDate = new Date(date)



  return {

    day: parsedDate.getDate().toString().padStart(2, '0'),

    month: new Intl.DateTimeFormat('es-PE', {

      month: 'short',

    })

      .format(parsedDate)

      .replace('.', '')

      .toUpperCase(),

  }

}



function formatValidity(date) {

  if (!date) return 'Vigencia indefinida'



  return `Hasta el ${formatDate(date)}`

}



function getPublicationLabel(type) {

  const labels = {

    COMUNICADO: 'COMUNICADO',

    AVISO: 'AVISO',

    NOTICIA: 'NOTICIA',

    EVENTO: 'EVENTO',

    DOCUMENTO: 'DOCUMENTO',

  }



  return labels[type] || type

}



function Academico() {

  const [publicaciones, setPublicaciones] = useState([])
  const [redesSociales, setRedesSociales] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')



  useEffect(() => {

    cargarPublicaciones()

  }, [])



  async function cargarPublicaciones() {

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

        setPublicaciones([])

        return

      }



      /*

       * Obtenemos el colegio activo del usuario.

       *

       * En la estructura actual un usuario puede tener

       * memberships en uno o varios colegios, por eso

       * tomamos el membership activo más reciente.

       */

      const { data: memberships, error: membershipError } =

        await supabase

          .from('school_memberships')

          .select('school_id, created_at')

          .eq('user_id', user.id)

          .eq('is_active', true)

          .order('created_at', { ascending: false })

          .limit(1)



      if (membershipError) {

        throw membershipError

      }



      const membership = memberships?.[0]



      if (!membership) {

        setPublicaciones([])

        return

      }



      const now = new Date().toISOString()



      /*

       * Solo se solicitan publicaciones:

       *

       * - Del colegio actual

       * - Publicadas

       * - Cuya fecha de inicio ya llegó

       * - Que no hayan vencido

       */

      const { data, error: publicationsError } = await supabase

        .from('institutional_publications')

        .select(`

          id,

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

          published_at

        `)

        .eq('school_id', membership.school_id)

        .eq('status', 'PUBLISHED')

        .lte('start_at', now)

        .or(`end_at.is.null,end_at.gte.${now}`)

        .order('is_featured', { ascending: false })

        .order('published_at', { ascending: false })



      if (publicationsError) {

        throw publicationsError

      }



      setPublicaciones(data || [])

      // Redes sociales configuradas para el colegio actual.
      // Solo se muestran las activas y marcadas para aparecer en Inicio.
      const {
        data: socialLinks,
        error: socialLinksError,
      } = await supabase
        .from('institutional_social_links')
        .select(`
          id,
          platform,
          url,
          is_active,
          show_on_home,
          display_order
        `)
        .eq('school_id', membership.school_id)
        .eq('is_active', true)
        .eq('show_on_home', true)
        .order('display_order', { ascending: true })

      if (socialLinksError) {
        console.error(
          'Error cargando redes sociales:',
          socialLinksError
        )
        setRedesSociales([])
      } else {
        setRedesSociales(socialLinks || [])
      }

    } catch (err) {

      console.error('Error cargando publicaciones:', err)



      setError(

        'No fue posible cargar las publicaciones institucionales.'

      )

    } finally {

      setLoading(false)

    }

  }



  /*

   * Publicación destacada.

   *

   * Si existen varias destacadas, la consulta ya las

   * devuelve primero y aquí tomamos la primera.

   */

  const destacado = useMemo(() => {

    return publicaciones.find((item) => item.is_featured) || null

  }, [publicaciones])



  /*

   * Publicaciones normales.

   */

  const recientes = useMemo(() => {

    return publicaciones.filter(

      (item) => item.id !== destacado?.id

    )

  }, [publicaciones, destacado])



  /*

   * Documentos institucionales.

   */

  const documentos = useMemo(() => {

    return publicaciones

      .filter(

        (item) =>

          item.type === 'DOCUMENTO' &&

          item.document_url

      )

      .slice(0, 3)

  }, [publicaciones])



  /*

   * Próximos eventos.

   */

  const eventos = useMemo(() => {

    return publicaciones

      .filter((item) => item.type === 'EVENTO')

      .slice(0, 3)

  }, [publicaciones])



  return (

    <div className="academico-home">



      {/* =====================================================

          ENCABEZADO

      ====================================================== */}



      <section className="academico-welcome">

        <div>

          <span className="academico-eyebrow">

            COLEGIO VANCOUVER

          </span>



          <h1>Bienvenido a EduGestWeb</h1>



          <p>

            Información institucional y novedades del Colegio Vancouver

            en un solo lugar.

          </p>

        </div>



        <div className="academico-year">

          <span>Año escolar</span>

          <strong>2026</strong>

        </div>

      </section>





      {/* =====================================================

          CARGANDO

      ====================================================== */}



      {loading && (

        <section className="publication-loading">

          Cargando publicaciones institucionales...

        </section>

      )}





      {/* =====================================================

          ERROR

      ====================================================== */}



      {!loading && error && (

        <section className="publication-error">

          {error}

        </section>

      )}





      {/* =====================================================

          SIN PUBLICACIONES

      ====================================================== */}



      {!loading &&

        !error &&

        publicaciones.length === 0 && (

          <section className="publication-empty">

            <h2>No hay publicaciones disponibles</h2>



            <p>

              Actualmente no existen publicaciones institucionales

              vigentes para mostrar.

            </p>

          </section>

        )}





      {/* =====================================================

          PUBLICACIÓN DESTACADA

      ====================================================== */}



      {!loading &&

        !error &&

        destacado && (

          <section className="academico-featured">



            <div className="featured-content">



              <div className="publication-tag">

                <span>📌</span>



                {getPublicationLabel(destacado.type)}

              </div>



              <h2>{destacado.title}</h2>



              <p>

                {destacado.summary}

              </p>



              <div className="publication-meta">

                <span>

                  Publicado:{' '}

                  {formatDate(destacado.published_at)}

                </span>



                <span>

                  {formatValidity(destacado.end_at)}

                </span>

              </div>



              {destacado.document_url ? (

                <a

                  href={destacado.document_url}

                  target="\_blank"

                  rel="noopener noreferrer"

                  className="btn-primary"

                >

                  Leer comunicado

                </a>

              ) : (

                <button

                  type="button"

                  className="btn-primary"

                >

                  Leer comunicado

                </button>

              )}

            </div>





            <div

              className="featured-illustration"

              aria-hidden="true"

            >

              {destacado.image_url ? (

                <img

                  src={destacado.image_url}

                  alt=""

                />

              ) : (

                <>

                  <div className="document-icon">

                    {destacado.document_url

                      ? 'PDF'

                      : 'INFO'}

                  </div>



                  <span>

                    {destacado.document_url

                      ? 'Documento institucional'

                      : 'Información institucional'}

                  </span>

                </>

              )}

            </div>



          </section>

        )}





      {/* =====================================================

          ÚLTIMAS PUBLICACIONES

      ====================================================== */}



      {!loading &&

        !error &&

        recientes.length > 0 && (

          <section className="academico-section">



            <div className="section-heading">



              <div>

                <span className="section-kicker">

                  INFORMACIÓN

                </span>



                <h2>Últimas publicaciones</h2>

              </div>



              <button

                type="button"

                className="btn-link"

              >

                Ver todas

              </button>



            </div>





            <div className="publication-grid">



              {recientes.map((item) => (

                <article

                  className="publication-card"

                  key={item.id}

                >



                  <div className="card-top">



                    <span className="publication-type">

                      {getPublicationLabel(item.type)}

                    </span>



                    <span className="publication-date">

                      {formatDate(item.published_at)}

                    </span>



                  </div>





                  <h3>{item.title}</h3>





                  <p>

                    {item.summary}

                  </p>





                  <div className="card-footer">



                    <span>

                      {formatValidity(item.end_at)}

                    </span>





                    {item.document_url ? (

                      <a

                        href={item.document_url}

                        target="\_blank"

                        rel="noopener noreferrer"

                      >

                        Ver información →

                      </a>

                    ) : (

                      <button type="button">

                        Ver información →

                      </button>

                    )}



                  </div>



                </article>

              ))}



            </div>



          </section>

        )}





      {/* =====================================================

          DOCUMENTOS + EVENTOS

      ====================================================== */}



      <section className="academico-columns">



        {/* ===================================================

            DOCUMENTOS

        ==================================================== */}



        <div className="info-panel">



          <div className="section-heading compact">



            <div>

              <span className="section-kicker">

                DOCUMENTOS

              </span>



              <h2>Documentos importantes</h2>

            </div>



          </div>





          <div className="document-list">



            {documentos.length > 0 ? (

              documentos.map((documento) => (

                <a

                  key={documento.id}

                  href={documento.document_url}

                  target="\_blank"

                  rel="noopener noreferrer"

                >

                  <span className="document-list-icon">

                    PDF

                  </span>



                  <span>

                    <strong>

                      {documento.title}

                    </strong>



                    <small>

                      {documento.summary ||

                        'Documento institucional'}

                    </small>

                  </span>



                  <span className="document-arrow">

                    →

                  </span>

                </a>

              ))

            ) : (

              <div className="empty-panel-message">

                <span>

                  No hay documentos institucionales

                  publicados actualmente.

                </span>

              </div>

            )}



          </div>



        </div>





        {/* ===================================================

            EVENTOS

        ==================================================== */}



        <div className="info-panel">



          <div className="section-heading compact">



            <div>

              <span className="section-kicker">

                ACTIVIDADES

              </span>



              <h2>Próximos eventos</h2>

            </div>



          </div>





          <div className="event-list">



            {eventos.length > 0 ? (

              eventos.map((evento) => {

                const fecha = formatDateShort(

                  evento.start_at

                )



                return (

                  <div

                    className="event-item"

                    key={evento.id}

                  >



                    <div className="event-date">



                      <strong>

                        {fecha.day}

                      </strong>



                      <span>

                        {fecha.month}

                      </span>



                    </div>





                    <div>



                      <strong>

                        {evento.title}

                      </strong>



                      <span>

                        {evento.summary ||

                          'Actividad institucional'}

                      </span>



                    </div>



                  </div>

                )

              })

            ) : (

              <div className="empty-panel-message">

                <span>

                  No hay próximos eventos publicados.

                </span>

              </div>

            )}



          </div>



        </div>



      </section>





      {/* =====================================================
          REDES SOCIALES
      ====================================================== */}

      {redesSociales.length > 0 && (
        <section className="academico-social">

          <div className="academico-social-header">

            <div>
              <span className="section-kicker">
                COMUNIDAD
              </span>

              <h2>Redes sociales del colegio</h2>

              <p>
                Consulta las redes oficiales del colegio
                y sus publicaciones.
              </p>
            </div>

          </div>

          <div
            className="social-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                Math.max(redesSociales.length, 1),
                4
              )}, minmax(0, 1fr))`,
            }}
          >

            {redesSociales.map((red) => {

              const labels = {
                FACEBOOK: 'Facebook',
                INSTAGRAM: 'Instagram',
                YOUTUBE: 'YouTube',
                TIKTOK: 'TikTok',
                LINKEDIN: 'LinkedIn',
                OTRO: 'Red social',
              }

              const label =
                labels[red.platform] || red.platform

              if (red.platform === 'FACEBOOK') {

                const facebookEmbedUrl =
                  `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
                    red.url
                  )}&tabs=timeline&width=500&height=650&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`

                return (
                  <article
                    key={red.id}
                    className="social-card social-card-facebook"
                  >

                    <div className="social-card-header">

                      <div>
                        <span className="social-card-kicker">
                          RED SOCIAL
                        </span>

                        <h3>{label}</h3>
                      </div>

                      <a
                        href={red.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-card-link"
                      >
                        Abrir →
                      </a>

                    </div>

                    <div className="social-embed">
                      <iframe
                        title={`Facebook - ${red.url}`}
                        src={facebookEmbedUrl}
                        style={{
                          border: 'none',
                          overflow: 'hidden',
                        }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      />
                    </div>

                  </article>
                )
              }

              return (
                <article
                  key={red.id}
                  className={`social-card social-card-${red.platform.toLowerCase()}`}
                >

                  <div className="social-card-header">

                    <div>
                      <span className="social-card-kicker">
                        RED SOCIAL
                      </span>

                      <h3>{label}</h3>
                    </div>

                    <a
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-card-link"
                    >
                      Abrir →
                    </a>

                  </div>

                  <div className="social-profile-preview">

                    <div className="social-profile-icon">
                      {red.platform === 'INSTAGRAM'
                        ? '◎'
                        : red.platform === 'YOUTUBE'
                          ? '▶'
                          : red.platform === 'TIKTOK'
                            ? '♪'
                            : red.platform === 'LINKEDIN'
                              ? 'in'
                              : '↗'}
                    </div>

                    <h4>{label}</h4>

                    <p>
                      Red oficial del colegio.
                    </p>

                    <a
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-profile-button"
                    >
                      Visitar {label}
                    </a>

                  </div>

                </article>
              )
            })}

          </div>

        </section>
      )}




    </div>

  )

}



export default Academico