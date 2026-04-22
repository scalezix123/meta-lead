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

async function checkData() {
  console.log('Checking Workspaces...');
  const { data: wData, error: wError } = await supabase.from('workspaces').select('*');
  if (wError) console.error('Workspaces error:', wError);
  else console.log('Workspaces:', wData);

  console.log('Checking Profiles...');
  const { data: pData, error: pError } = await supabase.from('profiles').select('*');
  if (pError) console.error('Profiles error:', pError);
  else console.log('Profiles:', pData);
}

checkData();
