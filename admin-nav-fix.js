/* HELP FOR YOU — Admin navigation/runtime safety fix */
(()=>{'use strict';
function bind(){
 const items=[...document.querySelectorAll('.side .m')];
 items.forEach(el=>{
  const m=(el.getAttribute('onclick')||'').match(/show\(['"]([^'"]+)['"]/);
  if(!m)return;
  const id=m[1];
  el.onclick=function(ev){
   if(ev)ev.preventDefault();
   try{
    if(typeof window.show==='function')window.show(id,el);
    else{
     document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
     const p=document.getElementById(id);if(p)p.classList.add('on');
     document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
     el.classList.add('on');
    }
   }catch(e){console.error('HFY Admin navigation error',e);alert('Admin option error: '+(e?.message||e))}
   return false;
  };
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();