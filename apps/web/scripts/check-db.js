const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase environment variables.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking database connection...');
  
  const { data, error } = await supabase.from('items').select('id').limit(1);

  if (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Database connection successful.');
  
  // Check tables
  const tables = ['items', 'containers', 'locations', 'devices'];
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('id').limit(1);
    if (tableError) {
      console.warn(`⚠️ Warning: Table '${table}' might be missing or inaccessible:`, tableError.message);
    } else {
      console.log(`✅ Table '${table}' is active.`);
    }
  }

  console.log('🚀 All systems go!');
}

checkDatabase();
