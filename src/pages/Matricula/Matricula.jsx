import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './Matricula.css'

const SCHOOL_ID = '423ade47-40f5-41d5-ae49-fa3bbe3fe5cb'
const YEAR_ID = '959e1e32-c386-4b28-96fa-cd19efe792da'

const PAGE_SIZE = 50

function Matricula() {
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('2026')
  const [level, setLevel] = useState('Todos')

  // TODOS los registros cargados desde Supabase
  const [allStudents, setAllStudents] = useState([])

  const [selectedStudent, setSelectedStudent] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================================
  // CARGAR TODAS LAS MATRÍCULAS
  // =========================================================

  useEffect(() => {
    cargarMatriculas()
  }, [year])

  async function cargarMatriculas() {
    try {
      setLoading(true)
      setError('')

      console.log('======================================')
      console.log('🔄 CARGANDO TODAS LAS MATRÍCULAS')
      console.log('Año:', year)
      console.log('======================================')

      // =====================================================
      // 1. MATRÍCULAS
      // =====================================================

      const {
        data: enrollments,
        error: enrollmentsError,
      } = await supabase
        .from('enrollments')
        .select(
          `
            id,
            school_id,
            academic_year_id,
            student_id,
            salon_id,
            enrollment_date,
            status,
            official_status
          `
        )
        .eq('school_id', SCHOOL_ID)
        .eq('academic_year_id', YEAR_ID)
        .order('id', {
          ascending: true,
        })

      if (enrollmentsError) {
        throw enrollmentsError
      }

      console.log(
        '✅ Matrículas recibidas:',
        enrollments?.length || 0
      )

      if (
        !enrollments ||
        enrollments.length === 0
      ) {
        setAllStudents([])
        return
      }

      // =====================================================
      // 2. IDS DE ESTUDIANTES
      // =====================================================

      const studentIds = [
        ...new Set(
          enrollments
            .map(
              (item) =>
                item.student_id
            )
            .filter(Boolean)
        ),
      ]

      // =====================================================
      // 3. IDS DE SALONES
      // =====================================================

      const salonIds = [
        ...new Set(
          enrollments
            .map(
              (item) =>
                item.salon_id
            )
            .filter(Boolean)
        ),
      ]

      // =====================================================
      // 4. ESTUDIANTES
      // =====================================================

      let studentsData = []

      if (studentIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('students')
          .select(
            `
              id,
              person_id,
              family_id,
              student_code,
              siagie_student_code,
              admission_year,
              admission_date,
              student_status
            `
          )
          .in(
            'id',
            studentIds
          )

        if (error) {
          throw error
        }

        studentsData = data || []
      }

      console.log(
        '✅ Estudiantes:',
        studentsData.length
      )

      // =====================================================
      // 5. PERSONAS
      // =====================================================

      const personIds = [
        ...new Set(
          studentsData
            .map(
              (student) =>
                student.person_id
            )
            .filter(Boolean)
        ),
      ]

      let peopleData = []

      if (personIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('people')
          .select(
            `
              id,
              first_name,
              paternal_last_name,
              maternal_last_name,
              document_type,
              document_number
            `
          )
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
      // 6. FAMILIAS
      // =====================================================

      const familyIds = [
        ...new Set(
          studentsData
            .map(
              (student) =>
                student.family_id
            )
            .filter(Boolean)
        ),
      ]

      let familiesData = []

      if (familyIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('families')
          .select(
            `
              id,
              family_code,
              family_name
            `
          )
          .in(
            'id',
            familyIds
          )

        if (error) {
          throw error
        }

        familiesData = data || []
      }

      console.log(
        '✅ Familias:',
        familiesData.length
      )

      // =====================================================
      // 7. SALONES
      // =====================================================

      let salonsData = []

      if (salonIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('salons')
          .select(
            `
              id,
              code,
              description,
              level_id,
              grade_id,
              section_id
            `
          )
          .in(
            'id',
            salonIds
          )

        if (error) {
          throw error
        }

        salonsData = data || []
      }

      console.log(
        '✅ Salones:',
        salonsData.length
      )

      // =====================================================
      // 8. NIVELES
      // =====================================================

      const levelIds = [
        ...new Set(
          salonsData
            .map(
              (salon) =>
                salon.level_id
            )
            .filter(Boolean)
        ),
      ]

      let levelsData = []

      if (levelIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('levels')
          .select(
            `
              id,
              code,
              name
            `
          )
          .in(
            'id',
            levelIds
          )

        if (error) {
          throw error
        }

        levelsData = data || []
      }

      // =====================================================
      // 9. GRADOS
      // =====================================================

      const gradeIds = [
        ...new Set(
          salonsData
            .map(
              (salon) =>
                salon.grade_id
            )
            .filter(Boolean)
        ),
      ]

      let gradesData = []

      if (gradeIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('grades')
          .select(
            `
              id,
              code,
              name
            `
          )
          .in(
            'id',
            gradeIds
          )

        if (error) {
          throw error
        }

        gradesData = data || []
      }

      // =====================================================
      // 10. SECCIONES
      // =====================================================

      const sectionIds = [
        ...new Set(
          salonsData
            .map(
              (salon) =>
                salon.section_id
            )
            .filter(Boolean)
        ),
      ]

      let sectionsData = []

      if (sectionIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('sections')
          .select(
            `
              id,
              code,
              name
            `
          )
          .in(
            'id',
            sectionIds
          )

        if (error) {
          throw error
        }

        sectionsData = data || []
      }

      // =====================================================
      // 11. CREAR MAPAS
      // =====================================================

      const studentsMap =
        new Map(
          studentsData.map(
            (student) => [
              student.id,
              student,
            ]
          )
        )

      const peopleMap =
        new Map(
          peopleData.map(
            (person) => [
              person.id,
              person,
            ]
          )
        )

      const familiesMap =
        new Map(
          familiesData.map(
            (family) => [
              family.id,
              family,
            ]
          )
        )

      const salonsMap =
        new Map(
          salonsData.map(
            (salon) => [
              salon.id,
              salon,
            ]
          )
        )

      const levelsMap =
        new Map(
          levelsData.map(
            (item) => [
              item.id,
              item,
            ]
          )
        )

      const gradesMap =
        new Map(
          gradesData.map(
            (item) => [
              item.id,
              item,
            ]
          )
        )

      const sectionsMap =
        new Map(
          sectionsData.map(
            (item) => [
              item.id,
              item,
            ]
          )
        )

      // =====================================================
      // 12. ARMAR TODOS LOS ALUMNOS
      // =====================================================

      const alumnos =
        enrollments.map(
          (enrollment) => {

            const student =
              studentsMap.get(
                enrollment.student_id
              )

            const person =
              student
                ? peopleMap.get(
                    student.person_id
                  )
                : null

            const family =
              student?.family_id
                ? familiesMap.get(
                    student.family_id
                  )
                : null

            const salon =
              enrollment.salon_id
                ? salonsMap.get(
                    enrollment.salon_id
                  )
                : null

            const nivel =
              salon?.level_id
                ? levelsMap.get(
                    salon.level_id
                  )
                : null

            const grado =
              salon?.grade_id
                ? gradesMap.get(
                    salon.grade_id
                  )
                : null

            const seccion =
              salon?.section_id
                ? sectionsMap.get(
                    salon.section_id
                  )
                : null

            const nombreCompleto = [
              person?.paternal_last_name,
              person?.maternal_last_name,
              person?.first_name,
            ]
              .filter(Boolean)
              .join(' ')

            let estado =
              enrollment.status

            switch (estado) {
              case 'vigente':
                estado =
                  'Vigente'
                break

              case 'retirado':
                estado =
                  'Retirado'
                break

              case 'pre_matricula':
                estado =
                  'Pre-matrícula'
                break

              case 'en_proceso':
                estado =
                  'En proceso'
                break

              case 'trasladado':
                estado =
                  'Trasladado'
                break

              case 'anulado':
                estado =
                  'Anulado'
                break

              default:
                break
            }

            return {
              id:
                enrollment.id,

              studentId:
                student?.id ||
                null,

              code:
                student?.student_code ||
                '',

              siagieCode:
                student?.siagie_student_code ||
                '',

              name:
                nombreCompleto ||
                'Sin nombre',

              documentType:
                person?.document_type ||
                '',

              documentNumber:
                person?.document_number ||
                '',

              level:
                nivel?.name ||
                '',

              levelCode:
                nivel?.code ||
                '',

              grade:
                grado?.name ||
                '',

              gradeCode:
                grado?.code ||
                '',

              section:
                seccion?.name ||
                seccion?.code ||
                '',

              sectionCode:
                seccion?.code ||
                '',

              salon:
                salon?.code ||
                salon?.description ||
                '',

              familyId:
                family?.id ||
                null,

              familyCode:
                family?.family_code ||
                null,

              familyName:
                family?.family_name ||
                null,

              status: estado,

              officialStatus:
                enrollment.official_status ||
                '',

              enrollmentDate:
                enrollment.enrollment_date ||
                '',

              admissionYear:
                student?.admission_year ||
                '',

              studentStatus:
                student?.student_status ||
                '',
            }
          }
        )

      setAllStudents(alumnos)

      console.log(
        '🎓 TOTAL DE ALUMNOS CARGADOS:',
        alumnos.length
      )

    } catch (err) {

      console.error(
        '❌ ERROR CARGANDO MATRÍCULAS'
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

      setAllStudents([])

      setError(
        err?.message ||
        'No se pudieron cargar las matrículas.'
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // FILTRADO GLOBAL
  // =========================================================

  const filteredStudents =
    allStudents.filter(
      (student) => {

        const text =
          search
            .toLowerCase()
            .trim()

        // -----------------------------------------------
        // BUSCADOR
        // -----------------------------------------------

        const matchesSearch =
          !text ||
          student.name
            .toLowerCase()
            .includes(text) ||
          student.code
            .toLowerCase()
            .includes(text) ||
          student.documentNumber
            .toLowerCase()
            .includes(text) ||
          student.siagieCode
            .toLowerCase()
            .includes(text)

        // -----------------------------------------------
        // NIVEL
        // -----------------------------------------------

        const matchesLevel =
          level === 'Todos' ||
          student.level === level

        return (
          matchesSearch &&
          matchesLevel
        )
      }
    )

  // =========================================================
  // PAGINACIÓN SOBRE LOS RESULTADOS FILTRADOS
  // =========================================================

  const totalRecords =
    filteredStudents.length

  const totalPages =
    Math.ceil(
      totalRecords /
      PAGE_SIZE
    )

  // Si se eliminó una página por un filtro,
  // mantenemos la página dentro del rango.
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

  // =========================================================
  // REGISTROS VISIBLES
  // =========================================================

  const visibleStudents =
    filteredStudents.slice(
      (safeCurrentPage - 1) *
        PAGE_SIZE,

      safeCurrentPage *
        PAGE_SIZE
    )

  // =========================================================
  // CAMBIAR PÁGINA
  // =========================================================

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

  // =========================================================
  // CAMBIAR NIVEL
  // =========================================================

  function cambiarNivel(e) {

    setLevel(
      e.target.value
    )

    setCurrentPage(1)
  }

  // =========================================================
  // CAMBIAR BÚSQUEDA
  // =========================================================

  function cambiarBusqueda(e) {

    setSearch(
      e.target.value
    )

    // Siempre volvemos a la página 1
    // al realizar una nueva búsqueda.
    setCurrentPage(1)
  }

  // =========================================================
  // CAMBIAR AÑO
  // =========================================================

  function cambiarYear(e) {

    setYear(
      e.target.value
    )

    setCurrentPage(1)
  }

  // =========================================================
  // NÚMEROS DE PÁGINA
  // =========================================================

  function obtenerPaginas() {

    const pages = []

    // Hasta 8 páginas visibles.
    // Para 363 alumnos son 8 exactamente.

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

    // Cuando existan más páginas,
    // mostramos una ventana alrededor
    // de la página actual.

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
  // COMPONENTE DE PAGINACIÓN
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

          {/* ANTERIOR */}

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
            aria-label="Página anterior"
          >
            ‹
          </button>

          {/* PÁGINAS */}

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

          {/* SIGUIENTE */}

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
            aria-label="Página siguiente"
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
    <div className="matricula-page">

      {/* ===================================================
          CABECERA
      =================================================== */}

      <div className="page-header">

        <div>

          <h2>
            Matrícula
          </h2>

          <p>
            Gestión de matrículas del año escolar {year}
          </p>

        </div>

        <button
          className="primary-button"
          type="button"
        >
          + Nueva matrícula
        </button>

      </div>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <div className="matricula-filters">

        <div className="filter-group search-group">

          <label>
            Buscar alumno
          </label>

          <div className="search-input">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Nombre, código o DNI..."
              value={search}
              onChange={
                cambiarBusqueda
              }
            />

          </div>

        </div>

        <div className="filter-group">

          <label>
            Año escolar
          </label>

          <select
            value={year}
            onChange={
              cambiarYear
            }
          >

            <option value="2026">
              2026
            </option>

          </select>

        </div>

        <div className="filter-group">

          <label>
            Nivel
          </label>

          <select
            value={level}
            onChange={
              cambiarNivel
            }
          >

            <option value="Todos">
              Todos
            </option>

            <option value="Inicial">
              Inicial
            </option>

            <option value="Primaria">
              Primaria
            </option>

            <option value="Secundaria">
              Secundaria
            </option>

          </select>

        </div>

      </div>

      {/* ===================================================
          RESULTADOS
      =================================================== */}

      <div className="results-card">

        <div className="results-header">

          <div>

            <strong>
              Alumnos
            </strong>

            <span>
              {loading
                ? 'Cargando...'
                : `${totalRecords} resultados`}
            </span>

          </div>

        </div>

        {/* ERROR */}

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}

        {/* CARGANDO */}

        {loading ? (

          <div className="loading-state">
            Cargando matrículas...
          </div>

        ) : (

          <>

            {/* ==========================================
                PAGINACIÓN SUPERIOR
            ========================================== */}

            <Pagination sticky />

            {/* ==========================================
                TABLA
            ========================================== */}

            <div className="table-container">

              <table className="matricula-table">

                <thead>

                  <tr>

                    <th>
                      Código
                    </th>

                    <th>
                      Alumno
                    </th>

                    <th>
                      Nivel
                    </th>

                    <th>
                      Grado
                    </th>

                    <th>
                      Sección
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {visibleStudents.length === 0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="empty-state"
                      >

                        {search ? (
                          <>
                            No se encontraron
                            alumnos para{' '}
                            <strong>
                              "{search}"
                            </strong>
                            .
                          </>
                        ) : (
                          'No se encontraron alumnos.'
                        )}

                      </td>

                    </tr>

                  ) : (

                    visibleStudents.map(
                      (student) => (

                        <tr
                          key={
                            student.id
                          }
                        >

                          {/* CÓDIGO */}

                          <td>

                            <span className="student-code">
                              {student.code}
                            </span>

                          </td>

                          {/* ALUMNO */}

                          <td>

                            <strong className="student-name">
                              {student.name}
                            </strong>

                          </td>

                          {/* NIVEL */}

                          <td>
                            {student.level ||
                              '—'}
                          </td>

                          {/* GRADO */}

                          <td>
                            {student.grade ||
                              '—'}
                          </td>

                          {/* SECCIÓN */}

                          <td>
                            {student.section ||
                              '—'}
                          </td>

                          {/* ESTADO */}

                          <td>

                            <span
                              className={
                                `status-badge ${
                                  student.status ===
                                  'Vigente'
                                    ? 'status-vigente'
                                    : student.status ===
                                      'Retirado'
                                      ? 'status-retirado'
                                      : student.status ===
                                        'Trasladado'
                                        ? 'status-trasladado'
                                        : student.status ===
                                          'Anulado'
                                          ? 'status-anulado'
                                          : student.status ===
                                            'En proceso'
                                            ? 'status-proceso'
                                            : student.status ===
                                              'Pre-matrícula'
                                              ? 'status-prematricula'
                                              : 'status-otro'
                                }`
                              }
                            >
                              {student.status}
                            </span>

                          </td>

                          {/* VER */}

                          <td>

                            <button
                              type="button"
                              className="view-button"
                              onClick={() =>
                                setSelectedStudent(
                                  student
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

            {/* ==========================================
                PAGINACIÓN INFERIOR
            ========================================== */}

            <Pagination />

            {/* ==========================================
                INFORMACIÓN DE BÚSQUEDA
            ========================================== */}

            {search && (

              <div className="search-results-info">

                Mostrando resultados para:{' '}

                <strong>
                  "{search}"
                </strong>

                {' · '}

                {totalRecords}{' '}
                {totalRecords === 1
                  ? 'resultado'
                  : 'resultados'}

              </div>

            )}

          </>

        )}

      </div>

      {/* =================================================
          MODAL DE MATRÍCULA
      ================================================= */}

      {selectedStudent && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedStudent(
              null
            )
          }
        >

          <div
            className="enrollment-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <h3>
                  {selectedStudent.name}
                </h3>

                <span>
                  Código:{' '}
                  {selectedStudent.code}
                </span>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setSelectedStudent(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            {/* CONTENIDO */}

            <div className="modal-content">

              <h4>
                Matrícula {year}
              </h4>

              {/* RESUMEN */}

              <div className="enrollment-grid">

                <div>

                  <span>
                    Nivel
                  </span>

                  <strong>
                    {selectedStudent.level ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Grado
                  </span>

                  <strong>
                    {selectedStudent.grade ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Sección
                  </span>

                  <strong>
                    {selectedStudent.section ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Estado
                  </span>

                  <strong>
                    {selectedStudent.status}
                  </strong>

                </div>

              </div>

              {/* PESTAÑAS */}

              <div className="modal-tabs">

                <button
                  type="button"
                  className="active"
                >
                  Matrícula
                </button>

                <button
                  type="button"
                >
                  Documentos
                </button>

                <button
                  type="button"
                >
                  Requisitos
                </button>

                <button
                  type="button"
                >
                  Historial
                </button>

              </div>

              {/* DETALLE */}

              <div className="modal-detail">

                <div>

                  <span>
                    DNI
                  </span>

                  <strong>
                    {selectedStudent.documentNumber ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Familia
                  </span>

                  <strong>
                    {selectedStudent.familyName ||
                      'Sin familia registrada'}
                  </strong>

                </div>

                <div>

                  <span>
                    Código familiar
                  </span>

                  <strong>
                    {selectedStudent.familyCode ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Código SIAGIE
                  </span>

                  <strong>
                    {selectedStudent.siagieCode ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Salón
                  </span>

                  <strong>
                    {selectedStudent.salon ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Matrícula oficial
                  </span>

                  <strong>
                    {selectedStudent.officialStatus ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Fecha de matrícula
                  </span>

                  <strong>
                    {selectedStudent.enrollmentDate ||
                      '—'}
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Matricula