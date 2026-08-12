import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djemekbqkqclulekrgf.supabase.co'
const supabaseAnonKey = 'sb_publishable_d49cDVZ088Z7mcsO9iMDgA_lhFBKNIJ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})