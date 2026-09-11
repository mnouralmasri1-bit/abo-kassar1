(() => {
 const sidebar=document.querySelector('#app>aside');
 const toggle=document.getElementById('menuToggle');
 const shade=document.getElementById('navShade');
 const mobile=window.matchMedia('(max-width:750px)');
 function setOpen(open,restoreFocus=false){
  document.body.classList.toggle('nav-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  sidebar.inert=mobile.matches&&!open;
  if(open) sidebar.querySelector('.nav:not(.hidden)')?.focus();
  else if(restoreFocus) toggle.focus();
 }
 toggle.addEventListener('click',()=>setOpen(!document.body.classList.contains('nav-open')));
 shade.addEventListener('click',()=>setOpen(false,true));
 sidebar.addEventListener('click',e=>{if(e.target.closest('.nav'))setOpen(false,true)});
 document.addEventListener('keydown',e=>{
  if(!document.body.classList.contains('nav-open'))return;
  if(e.key==='Escape'){setOpen(false,true);return}
  if(e.key==='Tab'){
   const list=[...sidebar.querySelectorAll('button,a,input,select')].filter(el=>el.getClientRects().length&&!el.disabled);
   const first=list[0],last=list.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
 });
 mobile.addEventListener('change',()=>setOpen(false));
 setOpen(false);
})();
