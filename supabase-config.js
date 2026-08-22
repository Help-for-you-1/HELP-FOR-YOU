// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = "https://bvyruwvvlubgqficjblq.supabase.co";
window.HFY_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47t";

(function(){
  if(location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')){
    function add(src){var s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);}
    add('admin-master.js?v=20260822-2');
    add('admin-approval-fix.js?v=20260822-2');
    add('emi-view-fix.js?v=20260822-2');
    add('admin-final-fix.js?v=20260822-4');
    setTimeout(function(){add('admin-final-fix.js?v=20260822-4-late');add('emi-action-fix.js?v=20260822-1');},1500);
    setTimeout(function(){add('emi-action-fix.js?v=20260822-1-late');},3000);
    setTimeout(function(){add('emi-final-fix.js?v=20260822-1');},4500);
    setTimeout(function(){add('admin-final-fix.js?v=20260822-4-final');},6000);
    setTimeout(function(){add('admin-customer-fix.js?v=20260822-2');},7000);
    setTimeout(function(){add('admin-staff-fix.js?v=20260822-1');},8000);
    setTimeout(function(){add('admin-flow-fix.js?v=20260822-1');},9000);
    setTimeout(function(){add('approval-edit-save-fix.js?v=20260822-2');},10000);
    setTimeout(function(){add('admin-customer-delete.js?v=20260822-1');},11000);
  }
})();