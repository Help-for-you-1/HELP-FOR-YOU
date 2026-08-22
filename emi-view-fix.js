/* HELP FOR YOU — EMI / Repayment FIX ONLY
   Full EMI list + Pending/Overdue/Paid + Paid/Edit actions.
   This file creates its own Supabase client because admin.html uses a
   lexical `const sb`, which is NOT available as window.sb.
   No Dashboard, Customer, Approval or other UI code is changed here.
*/
(function(){
'use strict';

function getClient(){
  if(window.sb) return window.sb;
  if(window.supabase && window.HFY_SUPABASE_URL && window.HFY_SUPABASE_PUBLISHABLE_KEY){
    window.sb=window.supabase.createClient(
      window.HFY_SUPABASE_URL,
      window.HFY_SUPABASE_PUBLISHABLE_KEY
    );
    return window.sb;
  }
  return null;
}

function wait(){
  var client=getClient();
  if(window.openBox && window.db && client){
    install(client);
  }else{
    setTimeout(wait,100);
  }
}

function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function money(v){return Number(v||0).toFixed(2)}
function $(id){return document.getElementById(id)}
function today(){return new Date().toISOString().slice(0,10)}

function statusOf(e){
  var s=String(e.status||'pending').toLowerCase().trim();
  if(s==='paid')return 'paid';
  if(s==='overdue')return 'overdue';
  if(e.due && String(e.due).slice(0,10)<today())return 'overdue';
  return 'pending';
}

async function getEmis(sb,loanId){
  var r=await sb
    .from('loan_emi_schedule')
    .select('*')
    .eq('loan_id',loanId)
    .order('emi_number',{ascending:true});
  if(r.error)throw r.error;
  return (r.data||[]).map(e=>({
    id:e.id,
    loanId:String(e.loan_id||''),
    no:e.emi_number,
    due:e.due_date,
    amount:Number(e.emi_amount||0),
    penalty:Number(e.penalty||0),
    paid:Number(e.paid_amount||0),
    status:String(e.status||'pending').toLowerCase()
  }));
}

function renderList(x,es){
  es=(es||[]).slice().sort((a,b)=>Number(a.no||0)-Number(b.no||0));
  var pc=0,pnd=0,ov=0,total=0,paid=0,remain=0,pen=0;

  es.forEach(e=>{
    var s=statusOf(e),a=Number(e.amount||0),p=Number(e.penalty||0),pa=Number(e.paid||0),r=Math.max(0,a+p-pa);
    total+=a+p; paid+=pa; remain+=r; pen+=p;
    if(s==='paid')pc++; else if(s==='overdue')ov++; else pnd++;
  });

  var rows=es.map(e=>{
    var s=statusOf(e),a=Number(e.amount||0),p=Number(e.penalty||0),pa=Number(e.paid||0),r=Math.max(0,a+p-pa);
    var c=s==='paid'?'paid':s==='overdue'?'over':'pending';
    var action=s==='paid'
      ? '<span class="paid"><b>Paid</b></span>'
      : '<button class="btn '+(s==='overdue'?'red':'green')+'" onclick="pay(\''+esc(e.id)+'\')">Paid</button>';
    action+=' <button class="btn gray" onclick="editEmi(\''+esc(e.id)+'\')">Edit</button>';
    return '<tr>'+
      '<td>'+esc(e.no)+'</td>'+
      '<td>'+esc(e.due||'')+'</td>'+
      '<td>₹'+money(a)+'</td>'+
      '<td>₹'+money(p)+'</td>'+
      '<td>₹'+money(a+p)+'</td>'+
      '<td>₹'+money(pa)+'</td>'+
      '<td>₹'+money(r)+'</td>'+
      '<td class="'+c+'"><b>'+esc(s)+'</b></td>'+
      '<td>'+action+'</td></tr>';
  }).join('');

  if(!rows)rows='<tr><td colspan="9">No EMI schedule found for this loan.</td></tr>';

  window.openBox(
    'EMI Schedule — '+esc(x.loanId),
    '<p><b>'+esc(x.name||'')+'</b> | Mobile: '+esc(x.mobile||'')+' | Sanction Date: '+esc(x.sanction||'')+'</p>'+ 
    '<div class="cards" style="grid-template-columns:repeat(3,1fr);margin:12px 0;">'+
      '<div class="card">Total EMI<b>'+es.length+'</b></div>'+
      '<div class="card">Paid EMI<b>'+pc+'</b></div>'+
      '<div class="card">Pending EMI<b>'+pnd+'</b></div>'+
      '<div class="card">Overdue EMI<b>'+ov+'</b></div>'+
      '<div class="card">Total Paid<b>₹'+money(paid)+'</b></div>'+
      '<div class="card">Remaining<b>₹'+money(remain)+'</b></div>'+
    '</div>'+ 
    '<p><b>Penalty:</b> ₹'+money(pen)+' &nbsp; <b>Total Due:</b> ₹'+money(total)+'</p>'+ 
    '<div class="wrap"><table style="min-width:1100px"><thead><tr>'+ 
      '<th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th>'+ 
    '</tr></thead><tbody>'+rows+'</tbody></table></div>'
  );
}

function install(sb){
  if(window.__HFY_EMI_FIX_INSTALLED__) return;
  window.__HFY_EMI_FIX_INSTALLED__=true;

  window.viewRepay=async function(i){
    var x=window.db.customers[i];
    if(!x)return alert('Customer/loan record not found.');
    try{
      var es=await getEmis(sb,x.loanId);
      if(!es.length)return alert('No EMI schedule found for Loan ID '+x.loanId+'.');
      renderList(x,es);
    }catch(e){
      console.error(e);
      alert('EMI list load failed: '+(e.message||e));
    }
  };

  window.showEmiModal=function(x,es){renderList(x,es||[])};

  window.editEmi=async function(id){
    var r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
    if(r.error)return alert('EMI load failed: '+r.error.message);
    if(!r.data)return alert('EMI record not found.');
    var e=r.data,s=String(e.status||'pending').toLowerCase();
    window.openBox('Edit EMI',
      '<div class="form">'+
      '<label>EMI Number<input value="'+esc(e.emi_number)+'" readonly></label>'+
      '<label>Due Date<input id="fix_due" type="date" value="'+esc(String(e.due_date||'').slice(0,10))+'"></label>'+
      '<label>EMI Amount<input id="fix_amount" type="number" step="0.01" min="0.01" value="'+Number(e.emi_amount||0)+'"></label>'+
      '<label>Penalty<input id="fix_penalty" type="number" step="0.01" min="0" value="'+Number(e.penalty||0)+'"></label>'+
      '<label>Paid Amount<input id="fix_paid" type="number" step="0.01" min="0" value="'+Number(e.paid_amount||0)+'"></label>'+
      '<label>Status<select id="fix_status">'+
        '<option value="pending" '+(s==='pending'?'selected':'')+'>Pending</option>'+ 
        '<option value="overdue" '+(s==='overdue'?'selected':'')+'>Overdue</option>'+ 
        '<option value="paid" '+(s==='paid'?'selected':'')+'>Paid</option>'+ 
      '</select></label>'+ 
      '<div class="full"><button class="btn blue" onclick="saveEmiFix(\''+esc(id)+'\')">Save Changes</button></div>'+ 
      '</div>'
    );
  };

  window.saveEmiFix=async function(id){
    var a=Number($('fix_amount').value||0),
        p=Number($('fix_penalty').value||0),
        pa=Number($('fix_paid').value||0),
        d=$('fix_due').value,
        s=$('fix_status').value;
    if(a<=0)return alert('EMI amount must be greater than 0.');
    if(!d)return alert('Due Date is required.');
    if(p<0||pa<0)return alert('Penalty/Paid amount cannot be negative.');
    var total=a+p;
    if(s==='paid')pa=total;
    pa=Math.min(pa,total);
    var rem=Math.max(0,total-pa);
    if(s!=='paid'&&d<today()&&s==='pending')s='overdue';
    var r=await sb.from('loan_emi_schedule').update({
      due_date:d,emi_amount:a,penalty:p,total_due:total,paid_amount:pa,remaining_amount:rem,status:s
    }).eq('id',id);
    if(r.error)return alert('EMI update failed: '+r.error.message);
    await recalcLoan(sb,id);
    if(window.loadData)await window.loadData();
    window.closeM();
    alert('EMI updated successfully.');
  };

  window.pay=async function(id){
    var r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
    if(r.error)return alert('EMI load failed: '+r.error.message);
    if(!r.data)return alert('EMI record not found.');
    if(String(r.data.status||'').toLowerCase()==='paid')return alert('This EMI is already paid.');
    var total=Number(r.data.emi_amount||0)+Number(r.data.penalty||0);
    var u=await sb.from('loan_emi_schedule').update({paid_amount:total,remaining_amount:0,total_due:total,status:'paid'}).eq('id',id);
    if(u.error)return alert('Payment update failed: '+u.error.message);
    await recalcLoan(sb,id);
    if(window.loadData)await window.loadData();
    window.closeM();
    alert('EMI marked as Paid successfully.');
  };
}

async function recalcLoan(sb,id){
  try{
    var q=await sb.from('loan_emi_schedule').select('loan_id').eq('id',id).maybeSingle();
    if(q.error||!q.data)return;
    var a=await sb.from('loan_emi_schedule').select('paid_amount,remaining_amount,penalty').eq('loan_id',q.data.loan_id);
    if(a.error)return;
    var paid=0,remaining=0,penalty=0;
    (a.data||[]).forEach(e=>{paid+=Number(e.paid_amount||0);remaining+=Number(e.remaining_amount||0);penalty+=Number(e.penalty||0)});
    var l=await sb.from('loan_accounts').select('id').eq('loan_id',q.data.loan_id).maybeSingle();
    if(l.error||!l.data)return;
    await sb.from('loan_accounts').update({total_paid:paid,remaining_amount:remaining,penalty_amount:penalty,loan_status:remaining<=0?'closed':'active'}).eq('id',l.data.id);
  }catch(e){console.error('EMI loan recalculation',e)}
}

wait();
})();
