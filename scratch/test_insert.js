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

async function testInsert() {
  console.log('Testing Workspace Insert...');
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ 
      name: "Test Workspace",
      slug: `test-${Math.random().toString(36).substring(7)}`
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed (as expected if RLS is tight):', error.message);
    console.error('Full error:', error);
  } else {
    console.log('Insert successful! Data:', data);
  }
}

testInsert();
