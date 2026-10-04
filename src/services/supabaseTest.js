import { supabase } from '../lib/supabaseClient'

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name')
    .limit(1)

  if (error) {
    console.error('Error de Supabase:', error)
    return {
      success: false,
      error,
    }
  }

  console.log('Supabase conectado:', data)

  return {
    success: true,
    data,
  }
}