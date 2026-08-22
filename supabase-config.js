// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = "https://bvyruwvvlubgqficjblq.supabase.co";
window.HFY_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXJ1d3Z2bHViZ3FmaWNqYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MzY1MDksImV4cCI6MjEwMjAxMjUwOX0.TRMtTPZrHHeShQKPkd8q1Qg_AEBW_Lo4zuWdgzMedbs";
if (location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')) {
  var hfyFix = document.createElement('script');
  hfyFix.src = 'admin-fix.js?v=7';
  hfyFix.defer = true;
  document.head.appendChild(hfyFix);
  var hfySessionFix = document.createElement('script');
  hfySessionFix.src = 'admin-session-fix.js?v=5';
  hfySessionFix.defer = true;
  document.head.appendChild(hfySessionFix);
  var hfyAdminEnhance = document.createElement('script');
  hfyAdminEnhance.src = 'admin-enhancements.js?v=3';
  hfyAdminEnhance.defer = true;
  document.head.appendChild(hfyAdminEnhance);
  var hfyEmiViewFix = document.createElement('script');
  hfyEmiViewFix.src = 'emi-view-fix.js?v=3';
  hfyEmiViewFix.defer = true;
  document.head.appendChild(hfyEmiViewFix);
}
