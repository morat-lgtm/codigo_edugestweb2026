import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './Familias.css'

const SCHOOL_ID = '423ade47-40f5-41d5-ae49-fa3bbe3fe5cb'
const PAGE_SIZE = 50

function Familias() {
  const [search, setSearch] = useState('')
  const [allFamilies, setAllFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarFamilias()
  }, [])

  async function cargarFamilias() {
    try {
      setLoading(true)
      setError('')

      console.log('======================================')
      console.log('🔄 CARGANDO FAMILIAS')
      console.log('======================================')

      // =====================================================
      // 1. FAMILIAS
      // =====================================================

      const {
        data: familiesData,
        error: familiesError,
      } = await supabase
        .from('families')
        .select(`
          id,
          school_id,
          family_code,
          family_name,
          address,
          reference,
          urbanization,
          status,
          entry_year,
          entry_date,
          exit_date,
          accounting_code
        `)
        .eq('school_id', SCHOOL_ID)
        .order('family_code', {
          ascending: true,
        })

      if (familiesError) {
        throw familiesError
      }

      console.log(
        '✅ Familias:',
        familiesData?.length || 0
      )

      if (
        !familiesData ||
        familiesData.length === 0
      ) {
        setAllFamilies([])
        return
      }

      const familyIds = familiesData.map(
        (family) => family.id
      )

      // =====================================================
      // 2. MIEMBROS DE FAMILIA
      // =====================================================

      const {
        data: membersData,
        error: membersError,
      } = await supabase
        .from('family_members')
        .select(`
          id,
          family_id,
          person_id,
          relationship,
          is_payment_responsible,
          is_enrollment_responsible,
          is_emergency_contact,
          lives_with_student
        `)
        .in(
          'family_id',
          familyIds
        )

      if (membersError) {
        throw membersError
      }

      console.log(
        '✅ Miembros:',
        membersData?.length || 0
      )

      // =====================================================
      // 3. ALUMNOS
      // =====================================================

      const {
        data: studentsData,
        error: studentsError,
      } = await supabase
        .from('students')
        .select(`
          id,
          person_id,
          family_id,
          student_code,
          siagie_student_code,
          student_status
        `)
        .eq('school_id', SCHOOL_ID)
        .in(
          'family_id',
          familyIds
        )

      if (studentsError) {
        throw studentsError
      }

      console.log(
        '✅ Hijos:',
        studentsData?.length || 0
      )


      // =====================================================
      // 4. PERSONAS
      // =====================================================

      const personIds = [
        ...new Set(
          [
            ...(membersData || []).map(
              (member) => member.person_id
            ),
            ...(studentsData || []).map(
              (student) => student.person_id
            ),
          ].filter(Boolean)
        ),
      ]

      let peopleData = []

      if (personIds.length > 0) {
        const {
          data,
          error,
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
            email,
            address
          `)
          .in(
            'id',
            personIds
          )

        if (error) {
          throw error
        }

        peopleData = data || []
      }

      console.log(
        '✅ Personas:',
        peopleData.length
      )

      // =====================================================
      // 6. MAPAS
      // =====================================================

      const peopleMap =
        new Map(
          peopleData.map(
            (person) => [
              person.id,
              person,
            ]
          )
        )

      // =====================================================
      // 7. CONSTRUIR FAMILIAS
      // =====================================================

      const familias =
        familiesData.map(
          (family) => {

            const members =
              (membersData || [])
                .filter(
                  (member) =>
                    member.family_id ===
                    family.id
                )
                .map(
                  (member) => {

                    const person =
                      peopleMap.get(
                        member.person_id
                      )

                    const name = [
                      person?.paternal_last_name,
                      person?.maternal_last_name,
                      person?.first_name,
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return {
                      id:
                        member.id,

                      personId:
                        member.person_id,

                      name:
                        name ||
                        'Sin nombre',

                      relationship:
                        member.relationship ||
                        '',

                      documentType:
                        person?.document_type ||
                        '',

                      documentNumber:
                        person?.document_number ||
                        '',

                      email:
                        person?.email ||
                        '',

                      isPaymentResponsible:
                        member.is_payment_responsible ||
                        false,

                      isEnrollmentResponsible:
                        member.is_enrollment_responsible ||
                        false,

                      isEmergencyContact:
                        member.is_emergency_contact ||
                        false,

                      livesWithStudent:
                        member.lives_with_student ||
                        false,
                    }
                  }
                )

            const children =
              (studentsData || [])
                .filter(
                  (student) =>
                    student.family_id ===
                    family.id
                )
                .map(
                  (student) => {

                    const person =
                      peopleMap.get(
                        student.person_id
                      )

                    const name = [
                      person?.paternal_last_name,
                      person?.maternal_last_name,
                      person?.first_name,
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return {
                      id:
                        student.id,

                      code:
                        student.student_code ||
                        '',

                      siagieCode:
                        student.siagie_student_code ||
                        '',

                      name:
                        name ||
                        'Sin nombre',

                      status:
                        student.student_status ||
                        '',
                    }
                  }
                )

            const paymentResponsible =
              members.find(
                (member) =>
                  member.isPaymentResponsible
              )

            const enrollmentResponsible =
              members.find(
                (member) =>
                  member.isEnrollmentResponsible
              )

            return {
              id:
                family.id,

              code:
                family.family_code ||
                '',

              name:
                family.family_name ||
                '',

              address:
                family.address ||
                '',

              reference:
                family.reference ||
                '',

              urbanization:
                family.urbanization ||
                '',

              status:
                family.status ||
                '',

              entryYear:
                family.entry_year ||
                '',

              entryDate:
                family.entry_date ||
                '',

              exitDate:
                family.exit_date ||
                '',

              accountingCode:
                family.accounting_code ||
                '',

              members,

              children,

              paymentResponsible:
                paymentResponsible ||
                null,

              enrollmentResponsible:
                enrollmentResponsible ||
                null,
            }
          }
        )

      setAllFamilies(familias)

      console.log(
        '🏠 TOTAL FAMILIAS:',
        familias.length
      )

    } catch (err) {

      console.error(
        '❌ ERROR CARGANDO FAMILIAS'
      )

      console.error(
        'Código:',
        err?.code
      )

      console.error(
        'Mensaje:',
        err?.message
      )

      console.error(
        'Detalles:',
        err?.details
      )

      console.error(
        'Hint:',
        err?.hint
      )

      setAllFamilies([])

      setError(
        err?.message ||
        'No se pudieron cargar las familias.'
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // BÚSQUEDA
  // =========================================================

  const filteredFamilies =
    allFamilies.filter(
      (family) => {

        const text =
          search
            .toLowerCase()
            .trim()

        if (!text) {
          return true
        }

        const familyText = [
          family.code,
          family.name,
          family.address,
          ...family.members.map(
            (member) =>
              member.name
          ),
          ...family.children.map(
            (child) =>
              child.name
          ),
          ...family.children.map(
            (child) =>
              child.code
          ),
        ]
          .join(' ')
          .toLowerCase()

        return familyText.includes(text)
      }
    )

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  const totalRecords =
    filteredFamilies.length

  const totalPages =
    Math.ceil(
      totalRecords /
      PAGE_SIZE
    )

  const safeCurrentPage =
    totalPages === 0
      ? 1
      : Math.min(
          currentPage,
          totalPages
        )

  const firstRecord =
    totalRecords === 0
      ? 0
      : (safeCurrentPage - 1) *
          PAGE_SIZE +
        1

  const lastRecord =
    Math.min(
      safeCurrentPage *
        PAGE_SIZE,
      totalRecords
    )

  const visibleFamilies =
    filteredFamilies.slice(
      (safeCurrentPage - 1) *
        PAGE_SIZE,
      safeCurrentPage *
        PAGE_SIZE
    )

  function cambiarBusqueda(e) {
    setSearch(
      e.target.value
    )

    setCurrentPage(1)
  }

  function cambiarPagina(page) {

    if (
      page < 1 ||
      page > totalPages
    ) {
      return
    }

    setCurrentPage(page)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function obtenerPaginas() {

    const pages = []

    if (totalPages <= 8) {

      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i)
      }

      return pages
    }

    let start =
      Math.max(
        1,
        safeCurrentPage - 3
      )

    let end =
      Math.min(
        totalPages,
        start + 7
      )

    if (
      end - start < 7
    ) {
      start =
        Math.max(
          1,
          end - 7
        )
    }

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i)
    }

    return pages
  }

  const paginas =
    obtenerPaginas()

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  const Pagination = ({
    sticky = false,
  }) => {

    if (
      totalRecords === 0
    ) {
      return null
    }

    return (
      <div
        className={
          `pagination ${
            sticky
              ? 'pagination-top'
              : ''
          }`
        }
      >

        <div className="pagination-info">

          Mostrando{' '}

          <strong>
            {firstRecord}
          </strong>

          {' '}a{' '}

          <strong>
            {lastRecord}
          </strong>

          {' '}de{' '}

          <strong>
            {totalRecords}
          </strong>

        </div>

        <div className="pagination-controls">

          <button
            type="button"
            className="pagination-button"
            disabled={
              safeCurrentPage === 1
            }
            onClick={() =>
              cambiarPagina(
                safeCurrentPage - 1
              )
            }
          >
            ‹
          </button>

          {paginas.map(
            (page) => (

              <button
                type="button"
                key={page}
                className={
                  `pagination-button ${
                    safeCurrentPage ===
                    page
                      ? 'active'
                      : ''
                  }`
                }
                onClick={() =>
                  cambiarPagina(
                    page
                  )
                }
              >
                {page}
              </button>

            )
          )}

          <button
            type="button"
            className="pagination-button"
            disabled={
              safeCurrentPage ===
              totalPages
            }
            onClick={() =>
              cambiarPagina(
                safeCurrentPage + 1
              )
            }
          >
            ›
          </button>

        </div>

      </div>
    )
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="familias-page">

      <div className="page-header">

        <div>

          <h2>
            Familias
          </h2>

          <p>
            Gestión de familias y responsables
          </p>

        </div>

        <button
          className="primary-button"
          type="button"
        >
          + Nueva familia
        </button>

      </div>

      <div className="familias-filters">

        <div className="filter-group search-group">

          <label>
            Buscar familia
          </label>

          <div className="search-input">

            <span className="search-icon"></span>

            <input
              type="text"
              placeholder="Familia, código, padre, madre o alumno..."
              value={search}
              onChange={
                cambiarBusqueda
              }
            />

          </div>

        </div>

      </div>

      <div className="results-card">

        <div className="results-header">

          <div>

            <strong>
              Familias
            </strong>

            <span>
              {loading
                ? 'Cargando...'
                : `${totalRecords} resultados`}
            </span>

          </div>

        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (

          <div className="loading-state">
            Cargando familias...
          </div>

        ) : (

          <>

            <Pagination sticky />

            <div className="table-container">

              <table className="familias-table">

                <thead>

                  <tr>

                    <th>
                      Código
                    </th>

                    <th>
                      Familia
                    </th>

                    <th>
                      Responsables
                    </th>

                    <th>
                      Hijos
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {visibleFamilies.length === 0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="empty-state"
                      >

                        {search ? (
                          <>
                            No se encontraron
                            familias para{' '}
                            <strong>
                              "{search}"
                            </strong>
                            .
                          </>
                        ) : (
                          'No se encontraron familias.'
                        )}

                      </td>

                    </tr>

                  ) : (

                    visibleFamilies.map(
                      (family) => (

                        <tr
                          key={
                            family.id
                          }
                        >

                          <td>

                            <span className="family-code">
                              {family.code}
                            </span>

                          </td>

                          <td>

                            <strong className="family-name">
                              {family.name ||
                                'Sin nombre'}
                            </strong>

                          </td>

                          <td>

                            <div className="responsible-list">

                              {family.members
                                .slice(
                                  0,
                                  2
                                )
                                .map(
                                  (member) => (

                                    <span
                                      key={
                                        member.id
                                      }
                                      className="responsible-item"
                                    >
                                      {member.name}
                                    </span>

                                  )
                                )}

                              {family.members.length >
                                2 && (

                                <span className="more-count">
                                  +
                                  {family.members.length -
                                    2}
                                </span>

                              )}

                            </div>

                          </td>

                          <td>

                            <span className="children-count">

                              {family.children.length}

                              {family.children.length ===
                              1
                                ? ' hijo'
                                : ' hijos'}

                            </span>

                          </td>

                          <td>

                            <span
                              className={
                                `status-badge ${
                                  family.status ===
                                  'active'
                                    ? 'status-activo'
                                    : 'status-otro'
                                }`
                              }
                            >
                              {family.status ===
                              'active'
                                ? 'Activa'
                                : family.status ||
                                  'Sin estado'}
                            </span>

                          </td>

                          <td>

                            <button
                              type="button"
                              className="view-button"
                              onClick={() =>
                                setSelectedFamily(
                                  family
                                )
                              }
                            >
                              Ver
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

            <Pagination />

          </>

        )}

      </div>

      {/* ===================================================
          MODAL FAMILIA
      =================================================== */}

      {selectedFamily && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedFamily(
              null
            )
          }
        >

          <div
            className="family-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h3>
                  {selectedFamily.name ||
                    'Familia'}
                </h3>

                <span>
                  Código:{' '}
                  {selectedFamily.code}
                </span>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setSelectedFamily(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="modal-content">

              {/* DATOS FAMILIA */}

              <h4>
                Datos de la familia
              </h4>

              <div className="family-detail-grid">

                <div>

                  <span>
                    Código familiar
                  </span>

                  <strong>
                    {selectedFamily.code ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Nombre
                  </span>

                  <strong>
                    {selectedFamily.name ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Estado
                  </span>

                  <strong>
                    {selectedFamily.status ===
                    'active'
                      ? 'Activa'
                      : selectedFamily.status ||
                        '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Año de ingreso
                  </span>

                  <strong>
                    {selectedFamily.entryYear ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Dirección
                  </span>

                  <strong>
                    {selectedFamily.address ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Referencia
                  </span>

                  <strong>
                    {selectedFamily.reference ||
                      '—'}
                  </strong>

                </div>

              </div>

              {/* RESPONSABLES */}

              <h4 className="section-title">
                Responsables y miembros
              </h4>

              <div className="family-members-list">

                {selectedFamily.members.length ===
                0 ? (

                  <div className="no-data">
                    No hay miembros registrados.
                  </div>

                ) : (

                  selectedFamily.members.map(
                    (member) => (

                      <div
                        className="family-member"
                        key={
                          member.id
                        }
                      >

                        <div className="member-main">

                          <strong>
                            {member.name}
                          </strong>

                          <span>
                            {member.relationship ||
                              'Sin parentesco'}
                          </span>

                        </div>

                        <div className="member-tags">

                          {member.isPaymentResponsible && (
                            <span className="member-tag payment">
                              Responsable de pago
                            </span>
                          )}

                          {member.isEnrollmentResponsible && (
                            <span className="member-tag enrollment">
                              Responsable de matrícula
                            </span>
                          )}

                          {member.isEmergencyContact && (
                            <span className="member-tag emergency">
                              Contacto de emergencia
                            </span>
                          )}

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

              {/* HIJOS */}

              <h4 className="section-title">
                Hijos
              </h4>

              <div className="family-children-list">

                {selectedFamily.children.length ===
                0 ? (

                  <div className="no-data">
                    No hay alumnos vinculados.
                  </div>

                ) : (

                  selectedFamily.children.map(
                    (child) => (

                      <div
                        className="family-child"
                        key={
                          child.id
                        }
                      >

                        <div>

                          <strong>
                            {child.name}
                          </strong>

                          <span>
                            Código:{' '}
                            {child.code ||
                              '—'}
                          </span>

                        </div>

                        <span className="child-status">
                          {child.status ||
                            '—'}
                        </span>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Familias