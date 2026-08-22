/* HELP FOR YOU — EMI View only
   EMI / Repayment View: full EMI list + Paid/Pending/Overdue status + actions.
   No other Admin section is changed.
*/
(function () {
  function install() {
    if (typeof window.openBox !== 'function') return;
    if (typeof window.esc !== 'function' || typeof window.money !== 'function') return;

    window.showEmiModal = function (x, es) {
      es = Array.isArray(es) ? es.slice() : [];
      es.sort(function (a, b) {
        return Number(a.no || 0) - Number(b.no || 0);
      });

      var today = new Date().toISOString().slice(0, 10);
      var paidCount = 0, pendingCount = 0, overdueCount = 0;
      var total = 0, paidAmount = 0, remaining = 0, penalty = 0;

      function getStatus(e) {
        var st = String(e.status || 'pending').toLowerCase().trim();
        if (st === 'paid') return 'paid';
        if (st === 'overdue') return 'overdue';
        if (e.due && e.due < today) return 'overdue';
        return 'pending';
      }

      es.forEach(function (e) {
        var amount = Number(e.amount || 0);
        var pen = Number(e.penalty || 0);
        var p = Number(e.paid || 0);
        var rem = Math.max(0, amount + pen - p);
        var st = getStatus(e);

        total += amount + pen;
        paidAmount += p;
        penalty += pen;
        remaining += rem;

        if (st === 'paid') paidCount++;
        else if (st === 'overdue') overdueCount++;
        else pendingCount++;
      });

      var next = es.find(function (e) {
        return getStatus(e) !== 'paid' && e.due && e.due >= today;
      });

      var rows = es.map(function (e) {
        var amount = Number(e.amount || 0);
        var pen = Number(e.penalty || 0);
        var p = Number(e.paid || 0);
        var rem = Math.max(0, amount + pen - p);
        var st = getStatus(e);
        var cls = st === 'paid' ? 'paid' : st === 'overdue' ? 'over' : 'pending';

        var action = '';
        if (st === 'paid') {
          action = '<span class="paid"><b>Paid</b></span>';
        } else {
          action = '<button class="btn ' + (st === 'overdue' ? 'red' : 'green') + '" onclick="pay(\'' + window.esc(e.id) + '\')">Paid</button>';
        }
        action += ' <button class="btn gray" onclick="editEmi(\'' + window.esc(e.id) + '\')">Edit</button>';

        return '<tr>' +
          '<td>' + window.esc(e.no) + '</td>' +
          '<td>' + window.esc(e.due || '') + '</td>' +
          '<td>₹' + window.money(amount) + '</td>' +
          '<td>₹' + window.money(pen) + '</td>' +
          '<td>₹' + window.money(amount + pen) + '</td>' +
          '<td>₹' + window.money(p) + '</td>' +
          '<td>₹' + window.money(rem) + '</td>' +
          '<td class="' + cls + '"><b>' + window.esc(st) + '</b></td>' +
          '<td>' + action + '</td>' +
          '</tr>';
      }).join('');

      if (!rows) {
        rows = '<tr><td colspan="9">No EMI schedule found for this loan.</td></tr>';
      }

      window.openBox(
        'EMI Schedule — ' + window.esc(x.loanId),
        '<p><b>' + window.esc(x.name || '') + '</b> | Mobile: ' + window.esc(x.mobile || '') + '</p>' +
        '<div class="cards" style="grid-template-columns:repeat(3,1fr);margin:12px 0;">' +
          '<div class="card">Total EMI<b>' + es.length + '</b></div>' +
          '<div class="card">Paid EMI<b>' + paidCount + '</b></div>' +
          '<div class="card">Pending EMI<b>' + pendingCount + '</b></div>' +
          '<div class="card">Overdue EMI<b>' + overdueCount + '</b></div>' +
          '<div class="card">Total Paid<b>₹' + window.money(paidAmount) + '</b></div>' +
          '<div class="card">Remaining<b>₹' + window.money(remaining) + '</b></div>' +
        '</div>' +
        '<p><b>Penalty:</b> ₹' + window.money(penalty) + ' &nbsp; <b>Total Due:</b> ₹' + window.money(total) +
        ' &nbsp; <b>Next EMI:</b> ' + (next ? ('EMI ' + window.esc(next.no) + ' — ' + window.esc(next.due)) : 'None') + '</p>' +
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

  function start() {
    if (typeof window.openBox === 'function') install();
    else setTimeout(start, 100);
  }

  start();
})();
