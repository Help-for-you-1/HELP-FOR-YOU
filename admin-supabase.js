// HELP FOR YOU — Supabase data bridge for the existing Admin Page.
// This file does not change the Admin Page layout/menu.
(function () {
  if (!window.supabase || !window.HFY_SUPABASE_URL || !window.HFY_SUPABASE_PUBLISHABLE_KEY) {
    console.warn('HFY Supabase client/config not loaded.');
    return;
  }
  window.hfySupabase = window.supabase.createClient(
    window.HFY_SUPABASE_URL,
    window.HFY_SUPABASE_PUBLISHABLE_KEY
  );

  window.HFYDB = {
    async applications() {
      const { data, error } = await hfySupabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async customers() {
      const { data, error } = await hfySupabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async loans() {
      const { data, error } = await hfySupabase
        .from('loan_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async emiSchedule(loanId) {
      let q = hfySupabase.from('loan_emi_schedule').select('*').order('due_date', { ascending: true });
      if (loanId) q = q.eq('loan_account_id', loanId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async repayments() {
      const { data, error } = await hfySupabase
        .from('loan_repayments')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  };
})();
