// Debug frontend environment variables
console.log('🔍 Frontend Environment Debug:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('import.meta.env:', import.meta.env);

// Export for debugging
export const debugEnv = () => {
  console.log('🔍 Supabase Configuration Debug:');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
};
