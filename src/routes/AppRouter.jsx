import { BrowserRouter, Routes, Route } from 'react-router-dom'

import AdminLayout from '../layouts/AdminLayout'
import Login from '../pages/Login/Login'

import Dashboard from '../pages/Dashboard/Dashboard'
import Alumnos from '../pages/Alumnos/Alumnos'
import Familias from '../pages/Familias/Familias'
import Personal from '../pages/Personal/Personal'
import Matricula from '../pages/Matricula/Matricula'

import Academico from '../pages/Academico/Academico'
import Anio from '../pages/Academico/Mantenimiento/Anio/Anio'
import Publicaciones from '../pages/Academico/Publicaciones/Publicaciones'
import RedesSociales from '../pages/Academico/Publicaciones/RedesSociales'

import Tesoreria from '../pages/Tesoreria/Tesoreria'
import Reportes from '../pages/Reportes/Reportes'
import Configuracion from '../pages/Configuracion/Configuracion'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* PANEL ADMINISTRATIVO */}
        <Route
          element={<AdminLayout />}
        >
          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="alumnos"
            element={<Alumnos />}
          />

          <Route
            path="familias"
            element={<Familias />}
          />

          <Route
            path="personal"
            element={<Personal />}
          />

          <Route
            path="matricula"
            element={<Matricula />}
          />

          {/* ACADÉMICO */}
          <Route
            path="academico"
            element={<Academico />}
          />

          <Route
  path="academico/mantenimiento/anio"
  element={<Anio />}
/>

          {/* COMUNICACIÓN */}
          <Route
            path="academico/publicaciones"
            element={<Publicaciones />}
          />

          <Route
            path="academico/redes-sociales"
            element={<RedesSociales />}
          />

          {/* TESORERÍA */}
          <Route
            path="tesoreria"
            element={<Tesoreria />}
          />

          {/* REPORTES */}
          <Route
            path="reportes"
            element={<Reportes />}
          />

          {/* CONFIGURACIÓN */}
          <Route
            path="configuracion"
            element={<Configuracion />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter