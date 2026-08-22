// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = 'https://bvyruwvvlubgqficjblq.supabase.co';
window.HFY_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXJ1d3Z2HViZ3FmaWNqYmxxIiwiaWF0IjoxNzg2NDM2NTA5LCJleHAiOjIxMDIwMTI1MDl9.TRMtTPZrHHeShQKPkd8q1Qg_AEBW_Lo4zuWdgzMedbs';

if (location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')) {
  var hfyFix = document.createElement('script');
  hfyFix.src = 'admin-fix.js?v=3';
  hfyFix.defer = true;
  document.head.appendChild(hfyFix);
  var hfySessionFix = document.createElement('script');
  hfySessionFix.src = 'admin-session-fix.js?v=1';
  hfySessionFix.defer = true;
  document.head.appendChild(hfySessionFix);
}
