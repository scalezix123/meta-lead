import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const envVars = {};
lines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function describeTable() {
  console.log('Describing Workspaces...');
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'workspaces' });
  if (error) {
    // If RPC doesn't exist, try a simple query
    console.log('RPC failed, trying raw query...');
    const { data: cols, error: cError } = await supabase.from('workspaces').select('*').limit(0);
    if (cError) console.error('Error:', cError);
    else console.log('Columns:', Object.keys(cols[0] || {}));
  } else {
    console.log('Table info:', data);
  }
}

describeTable();
