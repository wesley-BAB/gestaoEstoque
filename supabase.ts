import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwkburfesthrdfhorpwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a2J1cmZlc3RocmRmaG9ycHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDk3NDIsImV4cCI6MjA4MTMyNTc0Mn0.89G-BBHYhjPhRJPn8R3UwdSMsZs9ZbKA0wTFUzLiUdg';

export const supabase = createClient(supabaseUrl, supabaseKey);