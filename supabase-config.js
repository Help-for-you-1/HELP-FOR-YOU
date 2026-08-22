// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = "https://bvyruwvvlubgqficjblq.supabase.co";
window.HFY_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47t";
if (location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')) {
  var hfyFix = document.createElement('script');
  hfyFix.src = 'admin-fix.js?v=6';
  hfyFix.defer = true;
  document.head.appendChild(hfyFix);
  var hfySessionFix = document.createElement('script');
  hfySessionFix.src = 'admin-session-fix.js?v=4';
  hfySessionFix.defer = true;
  document.head.appendChild(hfySessionFix);
  var hfyAdminEnhance = document.createElement('script');
  hfyAdminEnhance.src = 'admin-enhancements.js?v=2';
  hfyAdminEnhance.defer = true;
  document.head.appendChild(hfyAdminEnhance);
  var hfyEmiViewFix = document.createElement('script');
  hfyEmiViewFix.src = 'emi-view-fix.js?v=2';
  hfyEmiViewFix.defer = true;
  document.head.appendChild(hfyEmiViewFix);
}
