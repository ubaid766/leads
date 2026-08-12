import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djemekbqkqgclulekrgf.supabase.co'
const supabaseAnonKey = 'sb_publishable_d49CDVZ088Z7mcs09iMDgA_lhFBK...' // Isay poori tarah copy karke yahan paste kar dein

export const supabase = createClient(supabaseUrl, supabaseAnonKey)