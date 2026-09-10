require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

const carSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true }, invoiceNo: String, plate: String, vin: String,
  make: String, model: String, year: String, odo: String, owner: String, phone: String,
  parts: String, pc: Number, lc: Number, createdAt: String, dateISO: String, date: String
}, { timestamps: true });
const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true }, username: { type: String, unique: true, index: true },
  passwordHash: String, role: { type: String, enum: ['admin','staff'], default: 'staff' }
}, { timestamps: true });
const shopSchema = new mongoose.Schema({ key: { type: String, unique: true }, name: String, address: String, phone: String, hours: String });
const reportSchema = new mongoose.Schema({ key: { type: String, unique: true }, data: mongoose.Schema.Types.Mixed, updatedAt: { type: Date, default: Date.now } });
const Car = mongoose.model('Car', carSchema);
const User = mongoose.model('User', userSchema);
const Shop = mongoose.model('Shop', shopSchema);
const Report = mongoose.model('Report', reportSchema);

const safeUser = u => ({ id: u.id, username: u.username, role: u.role });
const tokenFor = u => jwt.sign({ id: u.id, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
async function auth(req,res,next){
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) return res.status(401).json({message:'غير مسجل الدخول'});
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: payload.id });
    if (!user) return res.status(401).json({message:'الجلسة غير صالحة'});
    req.user = user; next();
  } catch { res.status(401).json({message:'الجلسة غير صالحة أو منتهية'}); }
}
function adminOnly(req,res,next){ if(req.user.role!=='admin') return res.status(403).json({message:'هذه العملية للمدير فقط'}); next(); }

app.get('/api/health', (req,res)=>res.json({ok:true, service:'abu-kassar-server', database: mongoose.connection.readyState===1?'connected':'disconnected'}));
app.post('/api/auth/login', async (req,res)=>{
  try {
    const {username,password} = req.body || {};
    const user = await User.findOne({username: String(username||'').trim()});
    if(!user || !(await bcrypt.compare(String(password||''), user.passwordHash))) return res.status(401).json({message:'اسم المستخدم أو كلمة المرور غير صحيحة'});
    res.json({token: tokenFor(user), user: safeUser(user)});
  } catch(e){ res.status(500).json({message:'خطأ في تسجيل الدخول'}); }
});

app.get('/api/me', auth, (req,res)=>res.json({user:safeUser(req.user)}));
app.put('/api/me', auth, async (req,res)=>{
  try {
    const {currentPassword, username, newPassword} = req.body || {};
    if(!(await bcrypt.compare(String(currentPassword||''), req.user.passwordHash))) return res.status(400).json({message:'كلمة المرور الحالية غير صحيحة'});
    const newName = String(username||'').trim();
    if(!newName) return res.status(400).json({message:'أدخل اسم المستخدم'});
    const duplicate = await User.findOne({username:newName, _id:{$ne:req.user._id}});
    if(duplicate) return res.status(400).json({message:'اسم المستخدم مستخدم مسبقاً'});
    req.user.username = newName;
    if(newPassword) req.user.passwordHash = await bcrypt.hash(String(newPassword), 12);
    await req.user.save();
    res.json({token:tokenFor(req.user), user:safeUser(req.user)});
  } catch(e){ res.status(500).json({message:'تعذر حفظ بيانات الحساب'}); }
});

app.get('/api/cars', auth, async (req,res)=>res.json(await Car.find().sort({createdAt:-1,_id:-1}).lean()));
app.post('/api/cars', auth, async (req,res)=>{
  try {
    const c = {...req.body};
    if(!c.id) c.id='car-'+Date.now();
    if(!c.plate || !c.vin) return res.status(400).json({message:'أدخل رقم السيارة ورقم الشاصي'});
    const saved = await Car.findOneAndUpdate({id:c.id}, c, {new:true, upsert:true, setDefaultsOnInsert:true});
    res.json(saved);
  } catch(e){ res.status(500).json({message:'تعذر حفظ السيارة'}); }
});
app.delete('/api/cars/:id', auth, async (req,res)=>{ await Car.deleteOne({id:req.params.id}); res.json({ok:true}); });

app.get('/api/users', auth, adminOnly, async (req,res)=>res.json((await User.find().sort({createdAt:1})).map(safeUser)));
app.post('/api/users', auth, adminOnly, async (req,res)=>{
  try {
    const {username,password,role='staff'}=req.body||{};
    if(!username||!password) return res.status(400).json({message:'أدخل اسم المستخدم وكلمة المرور'});
    if(await User.findOne({username:String(username).trim()})) return res.status(400).json({message:'اسم المستخدم موجود مسبقاً'});
    const user=await User.create({id:'u-'+Date.now(),username:String(username).trim(),passwordHash:await bcrypt.hash(String(password),12),role:role==='admin'?'admin':'staff'});
    res.json(safeUser(user));
  } catch(e){ res.status(500).json({message:'تعذر إضافة المستخدم'}); }
});
app.delete('/api/users/:id', auth, adminOnly, async (req,res)=>{ if(req.params.id===req.user.id)return res.status(400).json({message:'لا يمكنك حذف حسابك'}); await User.deleteOne({id:req.params.id}); res.json({ok:true}); });

const defaultShop={name:'أبو كسار',address:'حماة - المنطقة الصناعية',phone:'0955991989',hours:'من 8:00 صباحاً - حتى 7:00 مساءً'};
app.get('/api/shop', auth, async (req,res)=>res.json((await Shop.findOne({key:'main'}))?.toObject() || defaultShop));
app.put('/api/shop', auth, async (req,res)=>{ const s={...defaultShop,...req.body}; const saved=await Shop.findOneAndUpdate({key:'main'},{key:'main',name:s.name,address:s.address,phone:s.phone,hours:s.hours},{new:true,upsert:true}); res.json(saved); });
app.get('/api/report-draft', auth, async (req,res)=>res.json((await Report.findOne({key:'main'}))?.data || {}));
app.put('/api/report-draft', auth, async (req,res)=>{ await Report.findOneAndUpdate({key:'main'},{key:'main',data:req.body,updatedAt:new Date()},{upsert:true}); res.json({ok:true}); });

app.get('/api/backup', auth, async (req,res)=>res.json({version:3,cars:await Car.find().lean(),users:(await User.find()).map(safeUser),shop:(await Shop.findOne({key:'main'}))?.toObject()||defaultShop}));

app.get(/.*/, (req,res)=>res.sendFile(path.join(__dirname,'index.html')));

mongoose.connect(process.env.MONGODB_URI).then(async()=>{
  const existing=await User.findOne({username:process.env.ADMIN_USERNAME || '0955991989'});
  if(!existing){
    await User.create({id:'u-admin',username:process.env.ADMIN_USERNAME||'0955991989',passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD||'A430353',12),role:'admin'});
    console.log('Default admin account created. Change its password after first login.');
  }
  await Shop.findOneAndUpdate({key:'main'},{key:'main',...defaultShop},{upsert:true});
  app.listen(PORT,()=>console.log(`Abu Kassar server running on http://localhost:${PORT}`));
}).catch(err=>{ console.error('MongoDB connection failed:',err.message); process.exit(1); });
