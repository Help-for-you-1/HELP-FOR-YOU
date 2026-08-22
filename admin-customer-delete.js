/* HELP FOR YOU — customer delete action only. EMI untouched. */
(function(){
'use strict';
function S(){return window.HFY_ADMIN_SB||window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
window.deleteCustomer=async function(i){
 var rows=(window.HFY_ADMIN_DB&&window.HFY_ADMIN_DB.customers)||[];
 var x=rows[i];
 if(!x){alert('Customer not found');return;}
 if(!confirm('Delete this customer? This will not delete EMI records.'))return;
 try{
   var r=await S().from('customers').delete().eq('id',x.customerId);
   if(r.error)throw r.error;
   if(window.loadData)await window.loadData();
   alert('Customer deleted successfully');
 }catch(e){alert('Delete failed: '+(e.message||e));}
};
var oldRender=window.render;
window.render=function(){
 if(oldRender)oldRender.apply(this,arguments);
 var rows=(window.HFY_ADMIN_DB&&window.HFY_ADMIN_DB.customers)||[];
 var body=document.getElementById('cuRows');
 if(!body)return;
 Array.from(body.querySelectorAll('tr')).forEach(function(tr,idx){
   var cell=tr.lastElementChild;
   if(cell && idx<rows.length && !cell.querySelector('[data-delete-customer]')){
     var b=document.createElement('button');b.className='btn red';b.textContent='Delete';b.setAttribute('data-delete-customer','1');b.onclick=function(){window.deleteCustomer(idx)};cell.appendChild(b);
   }
 });
};
})();
