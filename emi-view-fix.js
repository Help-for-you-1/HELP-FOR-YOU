/* HELP FOR YOU — EMI View only
   Keeps the existing admin page unchanged and replaces only the EMI View modal.
*/
(function () {
  function install() {
    if (typeof window.openBox !== 'function') return;

    window.showEmiModal = function (x, es) {
      es = Array.isArray(es) ? es.slice() : [];
      es.sort(function (a, b) {
        return Number(a.no || 0) - Number(b.no || 0);
      });

      var today = new Date().toISOString().slice(0, 10);
      var total = 0, paid = 0, pending = 0, overdue = 0, penalty = 0, remaining = 0;

      es.forEach(function (e) {
        var amount = Number(e.amount || 0);
        var pen = Number(e.penalty || 0);
        var p = Number(e.paid || 0);
        var rem = Math.max(0, amount + pen - p);
        var st = String(e.status || 'pending').toLowerCase();

        if (st !== 'paid' && e.due && e.due < today) st = 'overdue';

        total += amount + pen;
        paid += p;
        penalty += pen;
        remaining += rem;
        if (st === 'paid') paid += 0;
        else if (st === 'overdue') overdue++;
        else pending++;
      });

      var paidCount = es.filter(function (e) {
        return String(e.status || '').toLowerCase() === 'paid';
      }).length;

      var next = es.find(function (e) {
        return String(e.status || '').toLowerCase() !== 'paid' && e.due >= today;
      });

      var rows = es.map(function (e) {
        var amount = Number(e.amount || 0);
        var pen = Number(e.penalty || 0);
        var p = Number(e.paid || 0);
        var rem = Math.max(0, amount + pen - p);
        var st = String(e.status || 'pending').toLowerCase();

        if (st !== 'paid' && e.due && e.due < today) st = 'overdue';

        var cls = st === 'paid' ? 'paid' : st === 'overdue' ? 'over' : 'pending';
        var action = st === 'paid'
          ? '<span class="paid"><b>Paid</b></span> '
          : '<button class="btn green" onclick="pay(\'' + esc(e.id) + '\')">Paid</button> ';

        action += '<button class="btn gray" onclick="editEmi(\'' + esc(e.id) + '\')">Edit</button>';

        return '<tr>' +
          '<td>' + esc(e.no) + '</td>' +
          '<td>' + esc(e.due || '') + '</td>' +
          '<td>₹' + money(amount) + '</td>' +
          '<td>₹' + money(pen) + '</td>' +
          '<td>₹' + money(amount + pen) + '</td>' +
          '<td>₹' + money(p) + '</td>' +
          '<td>₹' + money(rem) + '</td>' +
          '<td class="' + cls + '">' + esc(st) + '</td>' +
          '<td>' + action + '</td>' +
          '</tr>';
      }).join('');

      if (!rows) {
        rows = '<tr><td colspan="9">No EMI schedule found for this loan.</td></tr>';
      }

      window.openBox(
        'EMI Schedule — ' + esc(x.loanId),
        '<p><b>' + esc(x.name || '') + '</b> | Mobile: ' + esc(x.mobile || '') + '</p>' +
        '<div class="cards" style="grid-template-columns:repeat(3,1fr);margin:12px 0;">' +
          '<div class="card">Total EMI<b>' + es.length + '</b></div>' +
          '<div class="card">Paid EMI<b>' + paidCount + '</b></div>' +
          '<div class="card">Pending EMI<b>' + pending + '</b></div>' +
          '<div class="card">Overdue EMI<b>' + overdue + '</b></div>' +
          '<div class="card">Total Paid<b>₹' + money(paid) + '</b></div>' +
          '<div class="card">Remaining<b>₹' + money(remaining) + '</b></div>' +
        '</div>' +
        '<p><b>Penalty:</b> ₹' + money(penalty) + ' &nbsp; <b>Total Due:</b> ₹' + money(total) +
        ' &nbsp; <b>Next EMI:</b> ' + (next ? ('EMI ' + esc(next.no) + ' — ' + esc(next.due)) : 'None') + '</p>' +
        '<div class="wrap"><table style="min-width:1050px">' +
          '<thead><tr>' +
            '<th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th>' +
            '<th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>'
      );
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
