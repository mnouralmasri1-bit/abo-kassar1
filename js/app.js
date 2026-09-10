const KEY='abuKassarCars', USERS_KEY='abuKassarUsers', SESSION_KEY='abuKassarSession', HIDE_KEY='abuKassarHideCosts', SHOP_KEY='abuKassarShop', REPORT_KEY='abuKassarReportDraft';
const API='/api';
let cars=[], users=[], currentUser=null, hideCosts=localStorage.getItem(HIDE_KEY)==='1', shopCache={name:'أبو كسار',address:'حماة - المنطقة الصناعية',phone:'0955991989',hours:'من 8:00 صباحاً - حتى 7:00 مساءً'}, reportDraftCache={};
const $=id=>document.getElementById(id);
const money=n=>Number(n||0).toLocaleString('ar-SY');
const total=c=>(Number(c.pc)||0)+(Number(c.lc)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const costText=n=>hideCosts?'••••••':money(n)+' ل.س';
const token=()=>localStorage.getItem(SESSION_KEY)||'';
async function api(path, options={}){
 const headers={'Content-Type':'application/json',...(options.headers||{})};
 const t=token(); if(t) headers.Authorization='Bearer '+t;
 const res=await fetch(API+path,{...options,headers});
 let data={}; try{data=await res.json()}catch{}
 if(!res.ok){ if(res.status===401){localStorage.removeItem(SESSION_KEY);currentUser=null} throw new Error(data.message||'حدث خطأ في الاتصال بالخادم'); }
 return data;
}
async function loadData(){
 try{
  if(!token()){currentUser=null;cars=[];users=[];return}
  const me=await api('/me'); currentUser=me.user;
  cars=await api('/cars');
  shopCache=await api('/shop');
  reportDraftCache=await api('/report-draft');
  if(currentUser.role==='admin') users=await api('/users');
 }catch(e){currentUser=null;cars=[];users=[];console.warn(e.message)}
}
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)}
function saveCars(){renderAll()}
function saveUsers(){renderSettings()}
function shop(){return {...{name:'أبو كسار',address:'حماة - المنطقة الصناعية',phone:'0955991989',hours:'من 8:00 صباحاً - حتى 7:00 مساءً'},...shopCache}}
function setCostHidden(v){hideCosts=v;localStorage.setItem(HIDE_KEY,v?'1':'0');renderAll();toast(v?'تم إخفاء التكاليف والإيرادات':'تم إظهار التكاليف والإيرادات')}
function showPage(page,focus=false){
 document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
 const el=$(page);if(!el)return;el.classList.remove('hidden');
 document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
 if(page==='home')renderHome(); if(page==='cars'){renderCars();if(focus)setTimeout(()=>{$('search')?.focus();$('search')?.select()},50)}
 if(page==='customers')renderCustomers(); if(page==='invoices')renderInvoices(); if(page==='reports')renderReports(); if(page==='settings')renderSettings(); if(page==='add')prepareForm();
}
async function login(){
 const username=$('user').value.trim(),password=$('pass').value;
 try{const data=await api('/auth/login',{method:'POST',body:JSON.stringify({username,password})});localStorage.setItem(SESSION_KEY,data.token);currentUser=data.user;await loadData();$('login').classList.add('hidden');$('app').classList.remove('hidden');$('headerUser').textContent=currentUser.username;showPage('home');renderAll();$('err').textContent=''}catch(e){$('err').textContent=e.message}
}
function logout(){localStorage.removeItem(SESSION_KEY);currentUser=null;location.reload()}
function prepareForm(){if(!$('id').value)clearForm()}

function clearForm(){
  const form=$('form');
  if(form) form.reset();
  if($('id')) $('id').value='';
  if($('invoiceNo')) $('invoiceNo').value='';
  if($('make')) $('make').value='Mercedes';
  if($('pc')) $('pc').value=0;
  if($('lc')) $('lc').value=0;
  if($('createdAt')) $('createdAt').value=new Date().toISOString().slice(0,16);
  if($('formTitle')) $('formTitle').textContent='إضافة سيارة جديدة';
  updateFormTotal();
}
function openCar(id){
  const c=cars.find(x=>x.id===id);
  if(!c)return;
  showPage('cars');
  requestAnimationFrame(()=>{
    const el=[...document.querySelectorAll('[data-action="edit"]')].find(b=>b.dataset.id===id)?.closest('.car');
    el?.scrollIntoView({behavior:'smooth',block:'center'});
  });
}
function printInvoice(id){
  const c=cars.find(x=>x.id===id); if(!c)return;
  const s=shop();
  const area=$('printArea');
  area.innerHTML=`<div class="print-sheet" dir="rtl"><div class="print-brand"><img src="assets/mercedes-print-logo.png"><div><h1>${esc(s.name)}</h1><p>جميع أنواع السيارات الحديثة</p></div></div><hr><h2>فاتورة صيانة</h2><div class="print-grid"><p><b>رقم الفاتورة:</b> ${esc(c.invoiceNo||'-')}</p><p><b>التاريخ:</b> ${esc(c.date||'-')}</p><p><b>السيارة:</b> ${esc(c.make||'Mercedes')} ${esc(c.model||'')}</p><p><b>اللوحة:</b> ${esc(c.plate||'-')}</p><p><b>VIN:</b> ${esc(c.vin||'-')}</p><p><b>العميل:</b> ${esc(c.owner||'-')}</p><p><b>الهاتف:</b> ${esc(c.phone||'-')}</p><p><b>العداد:</b> ${esc(c.odo||'-')}</p></div><h3>القطع والأعمال</h3><p class="print-parts">${esc(c.parts||'لا توجد قطع أو أعمال مسجلة').replace(/\n/g,'<br>')}</p><div class="print-total"><span>تكلفة القطع</span><b>${money(c.pc)} ل.س</b><span>أجرة التصليح</span><b>${money(c.lc)} ل.س</b><span>الإجمالي</span><b>${money(total(c))} ل.س</b></div><div class="print-footer">${esc(s.address)} · ${esc(s.phone)} · ${esc(s.hours)}</div></div>`;
  area.classList.remove('hidden');
  window.print();
  setTimeout(()=>{area.classList.add('hidden');area.innerHTML=''},300);
}
function printCustomers(){
  const s=shop(), area=$('printArea'), map=new Map();
  cars.forEach(c=>{const k=(c.owner||'بدون اسم').trim()||'بدون اسم'; if(!map.has(k))map.set(k,[]); map.get(k).push(c)});
  area.innerHTML=`<div class="print-sheet" dir="rtl"><div class="print-brand"><img src="assets/mercedes-print-logo.png"><div><h1>${esc(s.name)}</h1><p>قائمة العملاء</p></div></div><table class="print-table"><thead><tr><th>العميل</th><th>الهاتف</th><th>السيارات</th></tr></thead><tbody>${[...map.entries()].map(([name,list])=>`<tr><td>${esc(name)}</td><td>${esc(list[0]?.phone||'-')}</td><td>${list.map(c=>esc(c.plate)).join('، ')}</td></tr>`).join('')}</tbody></table></div>`;
  area.classList.remove('hidden'); window.print(); setTimeout(()=>{area.classList.add('hidden');area.innerHTML=''},300);
}
function printReport(){
  saveReportDraft();
  const paper=$('reportPaper'); if(!paper)return;
  document.body.classList.add('printing-report');
  window.print();
  setTimeout(()=>document.body.classList.remove('printing-report'),300);
}
function handleAction(el){
  const action=el.dataset.action, id=el.dataset.id;
  if(action==='edit') editCar(id);
  else if(action==='delete') deleteCar(id);
  else if(action==='print') printInvoice(id);
  else if(action==='openCar') openCar(id);
  else if(action==='deleteUser') deleteUser(id);
}

function updateFormTotal(){if($('total'))$('total').textContent=money((Number($('pc').value)||0)+(Number($('lc').value)||0))}
function nextInvoiceNo(){let max=0;cars.forEach(c=>{const n=parseInt(String(c.invoiceNo||'').replace(/\D/g,''),10);if(n>max)max=n});return 'AK-'+String(max+1).padStart(5,'0')}
function renderAll(){renderHome();renderCars();renderCustomers();renderInvoices();renderReports();updateCostButtons();if(currentUser)renderSettings()}
function uniqueCustomers(){return new Map(cars.map(c=>[(c.owner||'').trim().toLowerCase(),c])).size}
function renderHome(){
 const rev=cars.reduce((s,c)=>s+total(c),0);$('customersCount').textContent=uniqueCustomers();$('carsCount').textContent=cars.length;$('invoicesCount').textContent=cars.length;$('revenue').textContent=hideCosts?'••••••':money(rev)+' ل.س';
 $('recent').innerHTML=cars.slice(0,6).map(c=>`<button class="recentrow" data-action="openCar" data-id="${esc(c.id)}"><span><b>${esc(c.plate)}</b><small>${esc(c.owner||'بدون اسم')} · ${esc(c.phone||'لا يوجد هاتف')}</small></span><strong>${esc(c.make||'Mercedes')} ${esc(c.model||'')}</strong><em>${esc(c.invoiceNo||'-')}</em></button>`).join('')||'<div class="empty-state">لا توجد سيارات مسجلة بعد.</div>';
 const avg=cars.length?Math.round(rev/cars.length):0, withPhone=cars.filter(c=>c.phone).length;
 $('homeSummary').innerHTML=`<div><span>متوسط الفاتورة</span><b>${hideCosts?'••••••':money(avg)+' ل.س'}</b></div><div><span>ملفات فيها هاتف</span><b>${withPhone}</b></div><div><span>آخر إضافة</span><b>${cars[0]?esc(cars[0].date):'لا يوجد'}</b></div>`;
}
function matches(c,q){return !q||[c.invoiceNo,c.plate,c.vin,c.owner,c.phone,c.make,c.model,c.year,c.odo,c.parts,c.date].join(' ').toLowerCase().includes(q.toLowerCase())}
function partsHtml(parts){return (parts||'').split(/[,،\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>`<span class="chip">${esc(x)}</span>`).join('')||'<span class="chip">لا توجد قطع أو أعمال مسجلة</span>'}
function renderCars(){
 const box=$('list');if(!box)return;const q=($('search')?.value||'').trim();const found=cars.filter(c=>matches(c,q));
 box.innerHTML=found.map(c=>`<article class="car"><div class="car-top"><div><h3>🚘 ${esc(c.make||'Mercedes')} ${esc(c.model||'')}</h3><span class="invoice-badge">${esc(c.invoiceNo||'بدون فاتورة')}</span></div><b class="plate">${esc(c.plate)}</b></div><div class="vin">VIN: ${esc(c.vin)}</div><div class="car-grid"><div><span>العميل</span><b>${esc(c.owner||'-')}</b></div><div><span>الهاتف</span><b>${esc(c.phone||'-')}</b></div><div><span>السنة</span><b>${esc(c.year||'-')}</b></div><div><span>العداد</span><b>${c.odo?money(c.odo)+' كم':'-'}</b></div><div><span>تاريخ التسجيل</span><b>${esc(c.date||'-')}</b></div><div><span>الإجمالي</span><b>${costText(total(c))}</b></div></div><div class="parts-title">القطع والأعمال</div><div class="chips">${partsHtml(c.parts)}</div><div class="actions"><button data-action="edit" data-id="${esc(c.id)}">✎ تعديل</button><button data-action="print" data-id="${esc(c.id)}">🖨 الفاتورة</button><button data-action="delete" data-id="${esc(c.id)}">حذف</button></div></article>`).join('')||'<div class="panel empty-state">لا توجد ملفات مطابقة للبحث.</div>';
}
function renderCustomers(){
 const box=$('custList');if(!box)return;const q=($('customerSearch')?.value||'').trim().toLowerCase();const map=new Map();
 cars.forEach(c=>{const key=(c.owner||'بدون اسم').trim()||'بدون اسم';if(!map.has(key))map.set(key,[]);map.get(key).push(c)});
 const groups=[...map.entries()].filter(([name,list])=>!q||[name,list[0]?.phone,...list.flatMap(x=>[x.plate,x.vin,x.invoiceNo])].join(' ').toLowerCase().includes(q));
 box.innerHTML=groups.map(([name,list])=>`<div class="client"><div class="client-main"><div class="avatar">${esc(name.charAt(0))}</div><div><h3>${esc(name)}</h3><p>الهاتف: <b>${esc(list[0].phone||'غير مسجل')}</b></p><small>${list.length} سيارة · ${list.length} فاتورة</small></div></div><div class="customer-cars">${list.map(c=>`<button data-action="openCar" data-id="${esc(c.id)}">${esc(c.plate)} · ${esc(c.make||'Mercedes')} ${esc(c.model||'')}</button>`).join('')}</div></div>`).join('')||'<div class="empty-state">لا يوجد عملاء مطابقون. أضف اسم العميل داخل ملف السيارة.</div>';
}
function renderInvoices(){
 const box=$('invList');if(!box)return;const q=($('invoiceSearch')?.value||'').trim().toLowerCase();const found=cars.filter(c=>!q||matches(c,q));
 box.innerHTML=found.map(c=>`<div class="inv"><div><b>${esc(c.invoiceNo||'-')}</b><strong>${esc(c.plate)}</strong><small>${esc(c.owner||'بدون اسم')} · ${esc(c.phone||'لا يوجد هاتف')} · VIN: ${esc(c.vin)}</small><small>${esc(c.make||'Mercedes')} ${esc(c.model||'')} · ${esc(c.date||'')}</small></div><div class="inv-actions"><strong>${costText(total(c))}</strong><button data-action="print" data-id="${esc(c.id)}">🖨 طباعة</button><button data-action="openCar" data-id="${esc(c.id)}">فتح الملف</button></div></div>`).join('')||'<div class="empty-state">لا توجد فواتير مطابقة للبحث.</div>';
}
function reportDraft(){return reportDraftCache||{}}
function saveReportDraft(){
 const items=[...document.querySelectorAll('.report-item-row')].map(row=>({type:row.querySelector('.ri-type')?.value||'',part:row.querySelector('.ri-part')?.value||'',qty:row.querySelector('.ri-qty')?.value||1,price:row.querySelector('.ri-price')?.value||0}));
 const data={title:$('reportTitle')?.value||'',date:$('reportDate')?.value||'',customer:$('reportCustomer')?.value||'',plate:$('reportPlate')?.value||'',phone:$('reportPhone')?.value||'',vin:$('reportVin')?.value||'',author:$('reportAuthor')?.value||'',text:$('reportText')?.value||'',items};
 reportDraftCache=data; if(currentUser) api('/report-draft',{method:'PUT',body:JSON.stringify(data)}).catch(()=>{});
}
function reportRow(item={}){
 const row=document.createElement('tr');row.className='report-item-row';
 row.innerHTML=`<td><input class="ri-type" placeholder="مثلاً صيانة" value="${esc(item.type||'')}"></td><td><input class="ri-part" placeholder="اسم القطعة أو الخدمة" value="${esc(item.part||'')}"></td><td><input class="ri-qty" type="number" min="0" step="0.01" value="${Number(item.qty)||1}"></td><td><input class="ri-price" type="number" min="0" step="1" value="${Number(item.price)||0}"></td><td class="ri-total">0 ل.س</td><td class="no-print"><button type="button" class="remove-report-item">حذف</button></td>`;
 row.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{updateReportTotal();saveReportDraft()}));
 row.querySelector('.remove-report-item').addEventListener('click',()=>{row.remove();updateReportTotal();saveReportDraft()});$('reportItems').appendChild(row);updateReportTotal();
}
function updateReportTotal(){let grand=0;document.querySelectorAll('.report-item-row').forEach(row=>{const qty=Number(row.querySelector('.ri-qty')?.value)||0,price=Number(row.querySelector('.ri-price')?.value)||0,t=qty*price;grand+=t;if(row.querySelector('.ri-total'))row.querySelector('.ri-total').textContent=money(t)+' ل.س'});if($('reportGrandTotal'))$('reportGrandTotal').textContent=money(grand)+' ل.س'}
function renderReports(){
 const s=shop(),d=reportDraft();if($('reportShopName'))$('reportShopName').textContent=s.name;if($('reportShopMeta'))$('reportShopMeta').innerHTML=`${esc(s.address)}<br>${esc(s.phone)}<br>${esc(s.hours)}`;
 ['reportTitle','reportDate','reportCustomer','reportPlate','reportPhone','reportVin','reportAuthor','reportText'].forEach(id=>{if($(id)&&d[id]!==undefined)$(id).value=d[id]});
 const body=$('reportItems');if(body&&!body.children.length){const items=Array.isArray(d.items)&&d.items.length?d.items:Array.from({length:5},()=>({qty:1,price:0}));items.forEach(reportRow)}updateReportTotal();
}
function editCar(id){const c=cars.find(x=>x.id===id);if(!c)return;showPage('add');$('id').value=c.id;$('invoiceNo').value=c.invoiceNo||'';['plate','vin','make','model','year','odo','createdAt','owner','phone','parts','pc','lc'].forEach(k=>$(k).value=c[k]??'');updateFormTotal();$('formTitle').textContent='تعديل ملف السيارة'}
async function deleteCar(id){if(!confirm('هل تريد حذف ملف السيارة والفاتورة المرتبطة به نهائياً؟'))return;try{await api('/cars/'+encodeURIComponent(id),{method:'DELETE'});cars=cars.filter(c=>c.id!==id);renderAll();toast('تم حذف الملف')}catch(e){toast(e.message)}}
async function backup(){let data={version:3,cars,users,shop:shop()};try{data=await api('/backup')}catch(e){}const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='abu-kassar-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('تم تنزيل النسخة الاحتياطية')}
function updateCostButtons(){const txt=hideCosts?'◉ إظهار التكاليف':'◉ إخفاء التكاليف';document.querySelectorAll('.cost-toggle,#costs,#invoiceCostToggle').forEach(b=>b.textContent=txt);if($('homeCostToggle'))$('homeCostToggle').textContent=hideCosts?'◉ إظهار الإيرادات':'◉ إخفاء الإيرادات'}
function renderSettings(){if(!currentUser)return;$('accountUsername').value=currentUser.username;$('usersPanel').style.display=currentUser.role==='admin'?'block':'none';if(currentUser.role==='admin'){const list=$('usersList');list.innerHTML=users.map(u=>`<div class="user-row"><div><b>${esc(u.username)}</b><small>${u.role==='admin'?'مدير':'موظف'}${u.id===currentUser.id?' · حسابك':''}</small></div><div>${u.id!==currentUser.id?`<button class="outline" data-action="deleteUser" data-id="${esc(u.id)}">حذف</button>`:''}</div></div>`).join('');$('usersHint').textContent='المستخدم يستطيع تغيير كلمة مروره من قسم حسابي. المدير يستطيع إضافة أو حذف المستخدمين.'}const s=shop();$('shopName').value=s.name;$('shopAddress').value=s.address;$('shopPhone').value=s.phone;$('shopHours').value=s.hours}
async function changeAccount(e){e.preventDefault();const current=$('currentPassword').value,newName=$('accountUsername').value.trim(),newPass=$('newPassword').value,confirmPass=$('confirmPassword').value;if(!newName){toast('أدخل اسم المستخدم');return}if(newPass&&newPass!==confirmPass){toast('تأكيد كلمة المرور غير مطابق');return}try{const data=await api('/me',{method:'PUT',body:JSON.stringify({currentPassword:current,username:newName,newPassword:newPass})});localStorage.setItem(SESSION_KEY,data.token);currentUser=data.user;$('currentPassword').value='';$('newPassword').value='';$('confirmPassword').value='';$('headerUser').textContent=currentUser.username;await loadData();renderSettings();toast('تم حفظ بيانات الحساب')}catch(e){toast(e.message)}}
function addUser(e){e.preventDefault();if(currentUser?.role!=='admin')return;const username=$('newUsername').value.trim(),password=$('newUserPassword').value,role=$('newUserRole').value;if(!username||!password){toast('أدخل اسم المستخدم وكلمة المرور');return}api('/users',{method:'POST',body:JSON.stringify({username,password,role})}).then(u=>{users.push(u);$('userForm').reset();$('userModal').classList.add('hidden');renderSettings();toast('تمت إضافة المستخدم')}).catch(e=>toast(e.message))}
function deleteUser(id){if(currentUser?.role!=='admin'||id===currentUser.id)return;if(confirm('حذف هذا المستخدم؟'))api('/users/'+encodeURIComponent(id),{method:'DELETE'}).then(()=>{users=users.filter(u=>u.id!==id);renderSettings();toast('تم حذف المستخدم')}).catch(e=>toast(e.message))}
async function saveShop(){try{shopCache=await api('/shop',{method:'PUT',body:JSON.stringify({name:$('shopName').value.trim()||'أبو كسار',address:$('shopAddress').value.trim(),phone:$('shopPhone').value.trim(),hours:$('shopHours').value.trim()})});renderSettings();renderHome();renderReports();toast('تم حفظ بيانات المحل')}catch(e){toast(e.message)}}
document.addEventListener('click',e=>{
 const pageBtn=e.target.closest('[data-page]');
 if(pageBtn){e.preventDefault();showPage(pageBtn.dataset.page);return}
 const actionBtn=e.target.closest('[data-action]');
 if(actionBtn){e.preventDefault();handleAction(actionBtn);return}
 if(e.target.closest('#logout')){e.preventDefault();logout();return}
 if(e.target.closest('#clear')){e.preventDefault();clearForm();showPage('cars');return}
 if(e.target.closest('#backup')){e.preventDefault();backup();return}
 if(e.target.closest('#costs')||e.target.closest('#invoiceCostToggle')||e.target.closest('#homeCostToggle')){e.preventDefault();setCostHidden(!hideCosts);return}
 if(e.target.closest('#printCustomers')){e.preventDefault();printCustomers();return}
 if(e.target.closest('#printReport')){e.preventDefault();printReport();return}
 if(e.target.closest('#addUserBtn')){e.preventDefault();$('userModal')?.classList.remove('hidden');return}
 if(e.target.closest('#closeUserModal')||e.target.closest('#cancelUser')){e.preventDefault();$('userModal')?.classList.add('hidden');return}
});
$('loginBtn')?.addEventListener('click',login);$('pass')?.addEventListener('keydown',e=>{if(e.key==='Enter')login()});$('showPass')?.addEventListener('click',()=>{$('pass').type=$('pass').type==='password'?'text':'password'});
$('homeSearchBtn')?.addEventListener('click',()=>{const q=$('homeSearch').value.trim();if(q){showPage('cars',true);$('search').value=q;renderCars()}});$('homeSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('homeSearchBtn').click()});
$('pc')?.addEventListener('input',updateFormTotal);$('lc')?.addEventListener('input',updateFormTotal);$('search')?.addEventListener('input',renderCars);$('customerSearch')?.addEventListener('input',renderCustomers);$('invoiceSearch')?.addEventListener('input',renderInvoices);['reportTitle','reportDate','reportCustomer','reportPlate','reportPhone','reportVin','reportAuthor','reportText'].forEach(id=>$(id)?.addEventListener('input',saveReportDraft));$('addReportItem')?.addEventListener('click',()=>{reportRow({qty:1,price:0});saveReportDraft()});$('accountForm')?.addEventListener('submit',changeAccount);$('userForm')?.addEventListener('submit',addUser);
$('form')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('id').value||('car-'+Date.now()),old=cars.find(x=>x.id===id),created=$('createdAt').value||new Date().toISOString(),invoiceNo=old?.invoiceNo||$('invoiceNo').value||nextInvoiceNo();const c={id,invoiceNo,plate:$('plate').value.trim(),vin:$('vin').value.trim(),make:$('make').value.trim()||'Mercedes',model:$('model').value.trim(),year:$('year').value,odo:$('odo').value,owner:$('owner').value.trim(),phone:$('phone').value.trim(),parts:$('parts').value.trim(),pc:Number($('pc').value)||0,lc:Number($('lc').value)||0,createdAt:old?.createdAt||created,dateISO:String(created).slice(0,10),date:new Date(created).toLocaleDateString('ar-SY')};if(!c.plate||!c.vin){toast('أدخل رقم السيارة ورقم الشاصي');return}try{const saved=await api('/cars',{method:'POST',body:JSON.stringify(c)});const i=cars.findIndex(x=>x.id===id);if(i>=0)cars[i]=saved;else cars.unshift(saved);clearForm();showPage('cars');renderAll();toast(i>=0?'تم تعديل ملف السيارة':'تم حفظ السيارة والفاتورة بنجاح')}catch(e){toast(e.message)}});
async function init(){
 const remembered=localStorage.getItem('abuKassarRemember');if(remembered)$('user').value=remembered;
 await loadData();
 if(currentUser){$('login').classList.add('hidden');$('app').classList.remove('hidden');$('headerUser').textContent=currentUser.username;showPage('home');renderAll()}
 else{$('login').classList.remove('hidden');$('app').classList.add('hidden')}
}
init();
