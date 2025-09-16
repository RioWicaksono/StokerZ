import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnofekqucnacbvecinrg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFub2Zla3F1Y25hY2J2ZWNpbnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjE0NTEsImV4cCI6MjA3MzU5NzQ1MX0.pKQ5JnTju2l-cmCW_9obcXWjZ4oBvzTE9nmcAZj6RWU';

export const supabase = createClient(supabaseUrl, supabaseKey);
