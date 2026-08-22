// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = "https://bvyruwvvlubgqficjblq.supabase.co";
window.HFY_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47t";
if (location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')) {
  var hfyFix = document.createElement('script');
  hfyFix.src = 'admin-fix.js?v=4';
  hfyFix.defer = true;
  document.head.appendChild(hfyFix);
  var hfySessionFix = document.createElement('script');
  hfySessionFix.src = 'admin-session-fix.js?v=2';
  hfySessionFix.defer = true;
  document.head.appendChild(hfySessionFix);
}
