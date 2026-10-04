import { supabase } from '../lib/supabaseClient'

export async function validateStaffUser(staffId, email) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  if (!session) {
    throw new Error('No hay una sesión activa')
  }

  const { data, error } = await supabase.functions.invoke(
    'create-staff-user',
    {
      body: {
        staff_id: staffId,
        email,
      },
    }
  )

  if (error) {
    throw error
  }

  return data
}