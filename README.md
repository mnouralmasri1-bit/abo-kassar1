# أبو كسار — نظام إدارة الورشة + MongoDB

هذه النسخة تحول البيانات الأساسية من `localStorage` إلى خادم Node.js/Express مع MongoDB.

## المكونات
- Frontend: HTML / CSS / JavaScript
- Backend: Node.js + Express
- Database: MongoDB / MongoDB Atlas
- Authentication: JWT + bcrypt
- بيانات السيارات والفواتير والعملاء والمستخدمين وبيانات المحل محفوظة في MongoDB.
- الموقع يعمل من الكمبيوتر والهاتف بعد نشر الخادم على استضافة تدعم Node.js.

## تشغيل المشروع على الكمبيوتر

### 1. تثبيت Node.js
ثبت Node.js LTS على الكمبيوتر.

### 2. تثبيت الحزم
من داخل مجلد المشروع:

```bash
npm install
```

### 3. إعداد MongoDB Atlas
أنشئ Cluster في MongoDB Atlas ثم أنشئ Database User، وبعدها خذ MongoDB connection string.

### 4. إنشاء ملف البيئة
انسخ:

```text
.env.example
```

إلى:

```text
.env
```

ثم ضع القيم الخاصة بك:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/abu_kassar?retryWrites=true&w=majority
JWT_SECRET=ضع_هنا_سراً_طويلاً_وعشوائياً
ADMIN_USERNAME=0955991989
ADMIN_PASSWORD=A430353
```

**لا ترفع ملف `.env` إلى GitHub ولا ترسل كلمة مرور MongoDB لأي شخص.**

### 5. تشغيل السيرفر

```bash
npm start
```

ثم افتح:

```text
http://localhost:5000
```

وللتأكد من حالة السيرفر وقاعدة البيانات:

```text
http://localhost:5000/api/health
```

إذا ظهر:

```json
{"ok":true,"service":"abu-kassar-server","database":"connected"}
```
فالسيرفر متصل بـ MongoDB بنجاح.

## حساب المدير الأول

```text
Username: 0955991989
Password: A430353
```

بعد أول دخول يفضل تغيير كلمة المرور من الإعدادات.

## مهم
الخادم هو الوسيط بين الموقع وMongoDB:

```text
الهاتف / الكمبيوتر
        ↓
      الموقع
        ↓
 Node.js + Express
        ↓
     MongoDB
```

لا يضع الموقع كلمة مرور MongoDB داخل JavaScript الخاص بالواجهة.
