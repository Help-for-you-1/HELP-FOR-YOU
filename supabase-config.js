// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = 'https://bvyruwvvlubgqficjblq.supabase.co';
window.HFY_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47t';

// Admin session guard + Approval-page fix for the existing admin.html.
(function () {
  if (!window.supabase || !window.HFY_SUPABASE_URL || !window.HFY_SUPABASE_PUBLISHABLE_KEY) return;
  const client = window.supabase.createClient(window.HFY_SUPABASE_URL, window.HFY_SUPABASE_PUBLISHABLE_KEY);
  window.hfySupabase = client;

  if (location.pathname.toLowerCase().endsWith('/admin.html')) {
    (async function guardAdmin() {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!session) { location.replace('login.html'); return; }
        const { data: ok, error } = await client.rpc('is_admin');
        if (error || !ok) { await client.auth.signOut(); sessionStorage.removeItem('hfy_admin'); location.replace('login.html'); return; }
        sessionStorage.setItem('hfy_admin', 'true');
      } catch (e) {
        console.error('Admin session check failed', e);
        location.replace('login.html');
      }
    })();

    // The existing Approval table used the filtered-row index. When a previously
    // approved/rejected application appeared before a pending one, Edit opened
    // the wrong customer. Re-render Approval using the real db index.
    setTimeout(function fixApproval() {
      if (!window.db || !window.apRows || !window.openBox) return;
      const pending = (window.db.applications || []).map((x, index) => ({ x, index }))
        .filter(({ x }) => !['approved','rejected','disbursed'].includes(String(x.status || '').toLowerCase()));
      window.apRows.innerHTML = pending.map(({ x, index }) => `<tr><td>${esc(x.name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.date)}</td><td>₹${money(x.amount)}</td><td class="pending">Pending for Approval</td><td><button class="btn blue" onclick="editApproval(${index})">Edit</button></td></tr>`).join('') || '<tr><td colspan="6">No pending approval.</td></tr>';
    }, 800);
  }
})();
