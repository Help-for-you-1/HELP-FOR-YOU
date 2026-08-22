// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = 'https://bvyruwvvlubgqficjblq.supabase.co';
window.HFY_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXJ1d3Z2bHViZ3FmaWNqYmxxIiwiaWF0IjoxNzg2NDM2NTA5LCJleHAiOjIxMDIwMTI1MDl9.TRMtTPZrHHeShQKPkd8q1Qg_AEBW_Lo4zuWdgzMedbs';

// Load only the targeted admin fix; existing Supabase settings remain unchanged.
if (location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')) {
  var hfyFix = document.createElement('script');
  hfyFix.src = 'admin-fix.js';
  hfyFix.defer = true;
  document.head.appendChild(hfyFix);
}
