import { supabase } from '../lib/supabaseClient';

export const signUp = async ({ email, password, full_name, role }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
        // ...other metadata...
      },
      emailRedirectTo: 'https://your-public-domain.com/confirm', // Use your deployed domain
    },
  });

  if (error) {
    throw error;
  }

  return data;
};