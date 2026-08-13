import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djemekbqkqgclulekrgf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZW1la2Jxa3FnY2x1bGVrcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODM2ODcsImV4cCI6MjEwMTk1OTY4N30.lxMLlNEDIfsSuxY3KQ2xi-sd13dl6YYWJ0qjowzhEOA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
})