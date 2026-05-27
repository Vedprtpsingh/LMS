import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqyquzvlswriwogteace.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xeXF1enZsc3dyaXdvZ3RlYWNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTg5ODk4OCwiZXhwIjoyMDk1NDc0OTg4fQ.s0atBn4jsBRdoByEmyycTYm3yWc5xKp9kOGQ6rullhk';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function test() {
  console.log('Testing Supabase connection...');

  const { data, error } = await supabase.from('users').select('email, name').limit(1);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Success! Users:', data);
  }
}

test();
