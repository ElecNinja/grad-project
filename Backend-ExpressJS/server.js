import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'

const supabase = createClient(
  'https://otookoesyojpumdxrdmf.supabase.co',
  'sb_publishable_zgN4xYHZL09hJTL4Nu1TTg_6bYR7Hmh'
)
export default supabase