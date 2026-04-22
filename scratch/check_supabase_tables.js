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

async function checkStructure() {
  console.log('Checking tables...');
  
  // Check profiles
  const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
  if (pError) console.error('Profiles table error:', pError.message);
  else console.log('Profiles table accessible.');

  // Check workspaces
  const { data: wData, error: wError } = await supabase.from('workspaces').select('*').limit(1);
  if (wError) console.error('Workspaces table error:', wError.message);
  else console.log('Workspaces table accessible.');
}

checkStructure();
