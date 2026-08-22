// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = "https://bvyruwvvlubgqficjblq.supabase.co";
window.HFY_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47t";

(function(){
  if(location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')){
    function add(src){var s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);}
    // Single stable load order. Do not load the same fix repeatedly.
    add('admin-master.js?v=20260822-3');
    add('admin-approval-fix.js?v=20260822-3');
    add('emi-view-fix.js?v=20260822-3');
    add('admin-customer-fix.js?v=20260822-3');
    add('admin-staff-fix.js?v=20260822-2');
    add('admin-flow-fix.js?v=20260822-2');
    add('approval-edit-save-fix.js?v=20260822-3');
    add('emi-final-fix.js?v=20260822-2');
    add('admin-customer-delete.js?v=20260822-2');
  }
})();