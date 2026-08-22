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

  // Customer loan application only: route application INSERT through the
  // security-definer submit RPC. This does not change Admin/Staff/Customer
  // dashboards or any other database operation.
  if(location.pathname.endsWith('/apply-loan.html') || location.pathname.endsWith('apply-loan.html')){
    var originalCreateClient = window.supabase.createClient;
    window.supabase.createClient = function(){
      var client = originalCreateClient.apply(this, arguments);
      var originalFrom = client.from.bind(client);
      client.from = function(table){
        if(table !== 'loan_applications') return originalFrom(table);
        return {
          insert: function(payload){
            var promise = client.rpc('hfy_submit_loan_application', {p_payload: payload}).then(function(res){
              if(res.error) return {error: res.error, data: null};
              return {error: null, data: res.data};
            });
            return {
              select: function(){ return this; },
              single: function(){ return promise; }
            };
          }
        };
      };
      return client;
    };
  }
})();