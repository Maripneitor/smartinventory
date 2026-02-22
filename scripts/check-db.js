
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("--- Locations ---");
    const { data: locations } = await supabase.from('locations').select('*');
    console.log(JSON.stringify(locations, null, 2));

    console.log("\n--- Containers ---");
    const { data: containers } = await supabase.from('containers').select('*');
    console.log(JSON.stringify(containers, null, 2));

    console.log("\n--- Items ---");
    const { data: items } = await supabase.from('items').select('*');
    console.log(JSON.stringify(items, null, 2));
}

checkData();
