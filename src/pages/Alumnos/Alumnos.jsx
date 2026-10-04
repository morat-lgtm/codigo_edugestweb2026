import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './Alumnos.css'

const SCHOOL_ID = '423ade47-40f5-41d5-ae49-fa3bbe3fe5cb'
const PAGE_SIZE = 50

function Alumnos() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')
  const [level, setLevel] = useState('Todos')

  const [allStudents, setAllStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================================
  // CARGAR ALUMNOS
  // =========================================================

  useEffect(() => {
    cargarAlumnos()
  }, [])

  async function cargarAlumnos() {
    try {
      setLoading(true)
      setError('')

      console.log('======================================')
      console.log('🔄 CARGANDO ALUMNOS')
      console.log('======================================')

      // =====================================================
      // 1. ALUMNOS
      // =====================================================

      const {
        data: studentsData,
        error: studentsError,
      } = await supabase
        .from('students')
        .select(`
          id,
          school_id,
          person_id,
          family_id,
          student_code,
          siagie_student_code,
          admission_year,
          admission_date,
          student_status
        `)
        .eq('school_id', SCHOOL_ID)
        .order('student_code', {
          ascending: true,
        })

      if (studentsError) {
        throw studentsError
      }

      console.log(
        '✅ Alumnos:',
        studentsData?.length || 0
      )

      if (
        !studentsData ||
        studentsData.length === 0
      ) {
        setAllStudents([])
        return
      }

      // =====================================================
      // 2. PERSONAS
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
      // 3. FAMILIAS
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
          .select(`
  id,
  family_code,
  family_name,
  address,
  reference,
  urbanization,
  status
`)
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
      // 4. MAPAS
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

      const familiesMap =
        new Map(
          familiesData.map(
            (family) => [
              family.id,
              family,
            ]
          )
        )

      // =====================================================
      // 5. ARMAR ALUMNOS
      // =====================================================

      const alumnos =
        studentsData.map(
          (student) => {

            const person =
              peopleMap.get(
                student.person_id
              )

            const family =
              student.family_id
                ? familiesMap.get(
                    student.family_id
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
              student.student_status

            switch (estado) {
              case 'active':
                estado = 'Activo'
                break

              case 'suspended':
                estado = 'Suspendido'
                break

              case 'expelled':
                estado = 'Expulsado'
                break

              case 'withdrawn':
                estado = 'Retirado'
                break

              case 'transferred':
                estado = 'Trasladado'
                break

              default:
                estado =
                  estado || 'Sin estado'
            }

            return {
              id: student.id,

              code:
                student.student_code ||
                '',

              siagieCode:
                student.siagie_student_code ||
                '',

              name:
                nombreCompleto ||
                'Sin nombre',

              firstName:
                person?.first_name ||
                '',

              paternalLastName:
                person?.paternal_last_name ||
                '',

              maternalLastName:
                person?.maternal_last_name ||
                '',

              documentType:
                person?.document_type ||
                '',

              documentNumber:
                person?.document_number ||
                '',

              birthDate:
                person?.birth_date ||
                '',

              sex:
                person?.sex ||
                '',

              nationality:
                person?.nationality ||
                '',

              phone:
                person?.phone_mobile ||
                '',

              email:
                person?.email ||
                '',

              address:
                person?.address ||
                '',

              familyId:
                family?.id ||
                null,

              familyCode:
                family?.family_code ||
                '',

              familyName:
                family?.family_name ||
                '',

              familyAddress:
                family?.address ||
                '',

              familyPhone:
                family?.phone_home ||
                '',

              emergencyPhone:
                family?.emergency_phone ||
                '',

              admissionYear:
                student?.admission_year ||
                '',

              admissionDate:
                student?.admission_date ||
                '',

              status: estado,

              rawStatus:
                student?.student_status ||
                '',
            }
          }
        )

      setAllStudents(alumnos)

      console.log(
        '🎓 TOTAL ALUMNOS:',
        alumnos.length
      )

    } catch (err) {

      console.error(
        '❌ ERROR CARGANDO ALUMNOS'
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
        'No se pudieron cargar los alumnos.'
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // FILTROS
  // =========================================================

  const filteredStudents =
    allStudents.filter(
      (student) => {

        const text =
          search
            .toLowerCase()
            .trim()

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

        const matchesStatus =
          status === 'Todos' ||
          student.status === status

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  const totalRecords =
    filteredStudents.length

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
  // BÚSQUEDA
  // =========================================================

  function cambiarBusqueda(e) {
    setSearch(
      e.target.value
    )

    setCurrentPage(1)
  }

  // =========================================================
  // ESTADO
  // =========================================================

  function cambiarEstado(e) {
    setStatus(
      e.target.value
    )

    setCurrentPage(1)
  }

  // =========================================================
  // PÁGINAS
  // =========================================================

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
    <div className="alumnos-page">

      {/* ===================================================
          CABECERA
      =================================================== */}

      <div className="page-header">

        <div>

          <h2>
            Alumnos
          </h2>

          <p>
            Gestión de alumnos de la institución educativa
          </p>

        </div>

        <button
          className="primary-button"
          type="button"
        >
          + Nuevo alumno
        </button>

      </div>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <div className="alumnos-filters">

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
            Estado
          </label>

          <select
            value={status}
            onChange={
              cambiarEstado
            }
          >

            <option value="Todos">
              Todos
            </option>

            <option value="Activo">
              Activo
            </option>

            <option value="Suspendido">
              Suspendido
            </option>

            <option value="Expulsado">
              Expulsado
            </option>

            <option value="Retirado">
              Retirado
            </option>

            <option value="Trasladado">
              Trasladado
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

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}

        {loading ? (

          <div className="loading-state">
            Cargando alumnos...
          </div>

        ) : (

          <>

            {/* PAGINACIÓN SUPERIOR */}

            <Pagination sticky />

            {/* TABLA */}

            <div className="table-container">

              <table className="alumnos-table">

                <thead>

                  <tr>

                    <th>
                      Código
                    </th>

                    <th>
                      Alumno
                    </th>

                    <th>
                      DNI
                    </th>

                    <th>
                      Código SIAGIE
                    </th>

                    <th>
                      Familia
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

                          <td>

                            <span className="student-code">
                              {student.code}
                            </span>

                          </td>

                          <td>

                            <strong className="student-name">
                              {student.name}
                            </strong>

                          </td>

                          <td>
                            {student.documentNumber ||
                              '—'}
                          </td>

                          <td>
                            {student.siagieCode ||
                              '—'}
                          </td>

                          <td>

                            {student.familyName ||
                              'Sin familia'}

                          </td>

                          <td>

                            <span
                              className={
                                `status-badge ${
                                  student.status ===
                                  'Activo'
                                    ? 'status-activo'
                                    : student.status ===
                                      'Suspendido'
                                      ? 'status-suspendido'
                                      : student.status ===
                                        'Expulsado'
                                        ? 'status-expulsado'
                                        : student.status ===
                                          'Retirado'
                                          ? 'status-retirado'
                                          : student.status ===
                                            'Trasladado'
                                            ? 'status-trasladado'
                                            : 'status-otro'
                                }`
                              }
                            >
                              {student.status}
                            </span>

                          </td>

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

            {/* PAGINACIÓN INFERIOR */}

            <Pagination />

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

      {/* ===================================================
          MODAL
      =================================================== */}

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
            className="student-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

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

            <div className="modal-content">

              <h4>
                Datos del alumno
              </h4>

              <div className="student-detail-grid">

                <div>

                  <span>
                    Código
                  </span>

                  <strong>
                    {selectedStudent.code ||
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
                    Tipo documento
                  </span>

                  <strong>
                    {selectedStudent.documentType ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Documento
                  </span>

                  <strong>
                    {selectedStudent.documentNumber ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Nombres
                  </span>

                  <strong>
                    {selectedStudent.firstName ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Apellido paterno
                  </span>

                  <strong>
                    {selectedStudent.paternalLastName ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Apellido materno
                  </span>

                  <strong>
                    {selectedStudent.maternalLastName ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Sexo
                  </span>

                  <strong>
                    {selectedStudent.sex ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Fecha de nacimiento
                  </span>

                  <strong>
                    {selectedStudent.birthDate ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Nacionalidad
                  </span>

                  <strong>
                    {selectedStudent.nationality ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Año de ingreso
                  </span>

                  <strong>
                    {selectedStudent.admissionYear ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Fecha de ingreso
                  </span>

                  <strong>
                    {selectedStudent.admissionDate ||
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
                    Teléfono
                  </span>

                  <strong>
                    {selectedStudent.phone ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Correo
                  </span>

                  <strong>
                    {selectedStudent.email ||
                      '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Dirección
                  </span>

                  <strong>
                    {selectedStudent.address ||
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

export default Alumnos