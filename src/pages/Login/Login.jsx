import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error de inicio de sesión:', error)
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    console.log('✅ Usuario autenticado:', data.user)

    setLoading(false)

    navigate('/')
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-brand">

          <div className="login-logo">
            E
          </div>

          <div>
            <h1>EduGestWeb</h1>
            <span>Gestión Educativa</span>
          </div>

        </div>

        <div className="login-header">
          <h2>Bienvenido</h2>
          <p>
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="login-field">

            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              placeholder="correo@institucion.edu.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

          </div>

          <div className="login-field">

            <label htmlFor="password">
              Contraseña
            </label>

            <div className="password-wrapper">

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>

            </div>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? 'Ingresando...'
              : 'Iniciar sesión'}
          </button>

        </form>

        <div className="login-footer">
          <span>EduGestWeb</span>
          <span>•</span>
          <span>Gestión Educativa</span>
        </div>

      </div>

    </div>
  )
}

export default Login