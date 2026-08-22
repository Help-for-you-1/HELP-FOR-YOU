(function(){
const esc0=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money0=v=>'₹'+Number(v||0).toFixed(2);
const dt0=v=>v?new Date(v).toLocaleDateString('en-IN'):'';
function staffEmiView(customerId,loanId){
 const all=window.cache?.emis||[];
 const rows=all.filter(e=>String(e.customer_id)===String(customerId)&&(!loanId||String(e.loan_id)===String(loanId)));
 const customer=(window.cache?.customers||[]).find(c=>String(c.id)===String(customerId));
 const loan=(window.cache?.loans||[]).find(l=>String(l.id)===String(loanId)||String(l.loan_id)===String(loanId));
 const title=`Full EMI List — ${esc0(customer?.full_name||'Customer')} | Loan ID: ${esc0(loan?.loan_id||loanId||'')}`;
 const body=`<h3>${title}</h3><p><b>Name:</b> ${esc0(customer?.full_name||'')} &nbsp; <b>Mobile:</b> ${esc0(customer?.mobile||'')} &nbsp; <b>Sanction Loan:</b> ${money0(loan?.loan_amount||0)} &nbsp; <b>Total Loan:</b> ${money0(loan?.total_repayment||0)}</p><div class="wrap"><table><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(e=>{const paid=Number(e.paid_amount||0),rem=Number(e.remaining_amount??Math.max(Number(e.total_due||0)-paid,0));const st=String(e.status||'pending').toLowerCase();return `<tr><td>${esc0(e.emi_number)}</td><td>${dt0(e.due_date)}</td><td>${money0(e.emi_amount)}</td><td>${money0(e.penalty)}</td><td>${money0(e.total_due)}</td><td>${money0(paid)}</td><td>${money0(rem)}</td><td>${esc0(st)}</td><td>${st==='paid'||rem<=0?'<b class="paid">Paid</b>':`<button class="btn green" onclick="staffPayEmi('${esc0(e.id)}')">Pay</button>`}</td></tr>`}).join('')}</tbody></table></div>`;
 if(typeof window.openM==='function'){window.openM(title,body)}else{alert('EMI view unavailable')}
}
window.staffEmiView=staffEmiView;
window.staffPayEmi=function(emiId){
 const e=(window.cache?.emis||[]).find(x=>String(x.id)===String(emiId));
 if(!e)return;
 const amount=Number(e.remaining_amount??Math.max(Number(e.total_due||0)-Number(e.paid_amount||0),0));
 const html=`<h3>EMI Payment</h3><p><b>EMI:</b> ${esc0(e.emi_number)} &nbsp; <b>Amount:</b> ${money0(amount)}</p><p>Payment method</p><select id="staffPayMethod"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option></select><p style="margin-top:12px"><b>UPI ID:</b> Q526188998@ybl</p><button class="btn green" onclick="staffConfirmEmiPay('${esc0(e.id)}',${amount})">Confirm Payment</button>`;
 if(typeof window.openM==='function')window.openM('EMI Payment',html);
};
window.staffConfirmEmiPay=async function(emiId,amount){
 try{
  if(!window.sb) throw new Error('Payment connection unavailable');
  const {data,error}=await window.sb.rpc('hfy_mark_emi_paid',{p_emi_id:emiId,p_paid_amount:amount,p_payment_method:document.getElementById('staffPayMethod')?.value||'upi'});
  if(error)throw error;
  if(typeof window.closeM==='function')window.closeM();
  if(typeof window.load==='function')await window.load();
  alert('EMI payment successful.');
 }catch(err){alert('EMI payment failed: '+(err.message||err))}
};
})();