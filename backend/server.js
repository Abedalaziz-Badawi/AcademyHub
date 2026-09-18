const express=require('express');
const path=require('path');
const cors=require('cors');
const {Pool,types}=require('pg');
const crypto=require('crypto');
require('dotenv').config();

types.setTypeParser(1082,val=>val);

const app=express();
const pool=new Pool({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME||'academyhub',user:process.env.DB_USER||'postgres',password:process.env.DB_PASSWORD||'',ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:false}:false});
app.use(cors());app.use(express.json({limit:'8mb'}));app.use(express.static(path.join(__dirname,'../frontend')));

const clean=v=>typeof v==='string'?v.trim():v;
const q=async(sql,params=[])=>{const r=await pool.query(sql,params);return r};

const authUsername=String(process.env.ADMIN_USERNAME||'').trim();
const authPassword=String(process.env.ADMIN_PASSWORD||'');
const authSecret=String(process.env.AUTH_SECRET||'');
const authConfigured=Boolean(authUsername&&authPassword&&authSecret.length>=32);
const createToken=username=>{const payload=Buffer.from(JSON.stringify({username,exp:Date.now()+1000*60*60*8})).toString('base64url');const signature=crypto.createHmac('sha256',authSecret).update(payload).digest('base64url');return `${payload}.${signature}`};
const readToken=token=>{try{const [payload,signature]=String(token||'').split('.');if(!payload||!signature)return null;const expected=crypto.createHmac('sha256',authSecret).update(payload).digest('base64url');if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));return data.exp>Date.now()?data:null}catch{return null}};
const credentialsMatch=(username,password)=>{const supplied=Buffer.from(String(password||''));const expected=Buffer.from(authPassword);return String(username||'').trim()===authUsername&&supplied.length===expected.length&&crypto.timingSafeEqual(supplied,expected)};
app.post('/api/auth/login',(req,res)=>{if(!authConfigured)return res.status(503).json({error:'Login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD, and AUTH_SECRET in .env.'});const {username,password}=req.body||{};if(!credentialsMatch(username,password))return res.status(401).json({error:'Incorrect username or password'});return res.json({token:createToken(authUsername),user:{username:authUsername,name:'Academy Admin'}})});
const requireAuth=(req,res,next)=>{const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');if(!authConfigured)return res.status(503).json({error:'Login is not configured'});if(!readToken(token))return res.status(401).json({error:'Please sign in to continue'});next()};
app.all('/api/data',requireAuth,async(req,res)=>{
 const type=req.query.type||'dashboard';
 try{
  if(req.method==='GET'){
   if(type==='dashboard'){
    const [p,s,a,r,rev,activity,att]=await Promise.all([
      q("SELECT count(*)::int AS total FROM players"),
      q("SELECT count(*)::int AS total FROM (SELECT DISTINCT ON (player_id) expiry_date FROM subscriptions ORDER BY player_id, expiry_date DESC) s WHERE expiry_date >= CURRENT_DATE"),
      q("SELECT count(*)::int AS total FROM (SELECT DISTINCT ON (player_id) expiry_date FROM subscriptions ORDER BY player_id, expiry_date DESC) s WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7"),
      q("SELECT count(*)::int AS total FROM (SELECT DISTINCT ON (player_id) expiry_date FROM subscriptions ORDER BY player_id, expiry_date DESC) s WHERE expiry_date < CURRENT_DATE"),
      q("SELECT COALESCE(sum(amount),0)::numeric AS total FROM subscriptions WHERE payment_status='Paid' AND date_trunc('month', created_at)=date_trunc('month', CURRENT_DATE)"),
      q("SELECT id,action,detail,created_at FROM activity_log ORDER BY created_at DESC LIMIT 8"),
      q("SELECT count(*) FILTER (WHERE status='Present')::int AS present,count(*) FILTER (WHERE status='Absent')::int AS absent FROM attendance WHERE attendance_date=CURRENT_DATE")
    ]);
    return res.json({totalPlayers:p.rows[0].total,activeSubscriptions:s.rows[0].total,expiringSoon:a.rows[0].total,expiredSubscriptions:r.rows[0].total,monthlyRevenue:rev.rows[0].total,todayAttendance:att.rows[0],activity:activity.rows});
   }
   if(type==='players'){
    const search=clean(req.query.search||'');const params=[];let where='';
    if(search){params.push(`%${search}%`);where=`WHERE concat_ws(' ',p.first_name,p.last_name,p.sport,p.category) ILIKE $1`}
    const result=await q(`SELECT p.*,EXTRACT(YEAR FROM age(CURRENT_DATE,p.date_of_birth))::int AS age,(SELECT row_to_json(x) FROM (SELECT s.id,s.plan_name,s.start_date,s.expiry_date,s.amount,s.payment_status,CASE WHEN s.expiry_date<CURRENT_DATE THEN 'Expired' WHEN s.expiry_date<=CURRENT_DATE+7 THEN 'Expiring Soon' ELSE 'Active' END AS subscription_status FROM subscriptions s WHERE s.player_id=p.id ORDER BY s.expiry_date DESC LIMIT 1)x) AS subscription FROM players p ${where} ORDER BY p.first_name,p.last_name`,params);return res.json({players:result.rows});
   }
   if(type==='player'){const id=Number(req.query.id);if(!id)return res.status(400).json({error:'Invalid player id'});const p=await q("SELECT p.*,EXTRACT(YEAR FROM age(CURRENT_DATE,p.date_of_birth))::int AS age FROM players p WHERE p.id=$1",[id]);if(!p.rows.length)return res.status(404).json({error:'Player not found'});const [subs,att,notes]=await Promise.all([q("SELECT *,CASE WHEN expiry_date<CURRENT_DATE THEN 'Expired' WHEN expiry_date<=CURRENT_DATE+7 THEN 'Expiring Soon' ELSE 'Active' END AS subscription_status FROM subscriptions WHERE player_id=$1 ORDER BY start_date DESC",[id]),q("SELECT * FROM attendance WHERE player_id=$1 ORDER BY attendance_date DESC LIMIT 30",[id]),q("SELECT * FROM player_notes WHERE player_id=$1 ORDER BY created_at DESC",[id])]);return res.json({player:p.rows[0],subscriptions:subs.rows,attendance:att.rows,notes:notes.rows})}
   if(type==='subscriptions'){const result=await q("SELECT s.*,p.first_name,p.last_name,p.sport,p.category,CASE WHEN s.expiry_date<CURRENT_DATE THEN 'Expired' WHEN s.expiry_date<=CURRENT_DATE+7 THEN 'Expiring Soon' ELSE 'Active' END AS subscription_status FROM subscriptions s JOIN players p ON p.id=s.player_id ORDER BY s.expiry_date ASC");return res.json({subscriptions:result.rows})}
   if(type==='notifications'){const result=await q("SELECT n.*,p.first_name,p.last_name FROM notifications n LEFT JOIN players p ON p.id=n.player_id ORDER BY n.created_at DESC LIMIT 30");return res.json({notifications:result.rows})}
   if(type==='attendance'){const date=req.query.date||new Date().toISOString().slice(0,10),category=req.query.category||'';const params=[date];let where="WHERE p.status='Active'";if(category){params.push(category);where+=' AND p.category=$2'}const result=await q(`SELECT p.id,p.first_name,p.last_name,p.sport,p.category,COALESCE(a.status,'Absent') AS attendance_status FROM players p LEFT JOIN attendance a ON a.player_id=p.id AND a.attendance_date=$1 ${where} ORDER BY p.category,p.first_name`,params);return res.json({date,players:result.rows})}
   if(type==='settings'){const result=await q('SELECT * FROM academy_settings ORDER BY id LIMIT 1');return res.json({settings:result.rows[0]})}
   return res.status(400).json({error:'Unknown data type'});
  }
  const b=req.body||{};
  if(req.method==='POST'){
   if(type==='player'){const r=await q("INSERT INTO players(first_name,last_name,date_of_birth,gender,phone,parent_name,parent_phone,emergency_contact,sport,category,coach,join_date,photo_url,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id",[clean(b.first_name),clean(b.last_name),b.date_of_birth,b.gender,clean(b.phone),clean(b.parent_name),clean(b.parent_phone),clean(b.emergency_contact),clean(b.sport),clean(b.category),clean(b.coach),b.join_date||new Date().toISOString().slice(0,10),clean(b.photo_url)||null,b.status||'Active']);await q("INSERT INTO activity_log(action,detail) VALUES('New player registered',$1)",[`${b.first_name} ${b.last_name} joined ${b.sport}`]);return res.status(201).json({id:r.rows[0].id})}
   if(type==='subscription'){const r=await q("INSERT INTO subscriptions(player_id,plan_name,start_date,expiry_date,amount,payment_status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",[b.player_id,b.plan_name,b.start_date,b.expiry_date,b.amount||0,b.payment_status||'Paid']);await q("INSERT INTO activity_log(action,detail) VALUES('Subscription created',$1)",[`${b.plan_name} subscription`]);return res.status(201).json({id:r.rows[0].id})}
   if(type==='renew'){const old=await q("SELECT s.*,p.first_name,p.last_name FROM subscriptions s JOIN players p ON p.id=s.player_id WHERE s.id=$1",[b.id]);if(!old.rows.length)return res.status(404).json({error:'Subscription not found'});const x=old.rows[0],months=Number(b.months||1),today=new Date().toISOString().slice(0,10),existingExpiry=new Date(x.expiry_date).toISOString().slice(0,10),start=existingExpiry<today?today:existingExpiry;const end=new Date(start+'T00:00:00Z');end.setUTCMonth(end.getUTCMonth()+months);const expiry=end.toISOString().slice(0,10);const r=await q("INSERT INTO subscriptions(player_id,plan_name,start_date,expiry_date,amount,payment_status) VALUES($1,$2,$3,$4,$5,'Paid') RETURNING id,expiry_date",[x.player_id,b.plan_name||x.plan_name,start,expiry,b.amount||x.amount]);await q("INSERT INTO activity_log(action,detail) VALUES('Subscription renewed',$1)",[`${x.first_name} ${x.last_name} renewed for ${months} month${months>1?'s':''}`]);return res.json({subscription:r.rows[0]})}
   if(type==='attendance'){await q("INSERT INTO attendance(player_id,attendance_date,status) VALUES($1,$2,$3) ON CONFLICT(player_id,attendance_date) DO UPDATE SET status=EXCLUDED.status",[b.player_id,b.attendance_date,b.status]);return res.json({ok:true})}
   if(type==='note'){const r=await q("INSERT INTO player_notes(player_id,note) VALUES($1,$2) RETURNING *",[b.player_id,clean(b.note)]);return res.status(201).json({note:r.rows[0]})}
   if(type==='reminder'){await q("INSERT INTO notifications(player_id,message,type,status) VALUES($1,$2,'renewal','Sent')",[b.player_id,b.message]);await q("INSERT INTO activity_log(action,detail) VALUES('Renewal reminder sent',$1)",[b.message]);return res.json({ok:true})}
  }
  if(req.method==='PUT'){
   if(type==='player'){await q("UPDATE players SET first_name=$1,last_name=$2,date_of_birth=$3,gender=$4,phone=$5,parent_name=$6,parent_phone=$7,emergency_contact=$8,sport=$9,category=$10,coach=$11,status=$12,photo_url=CASE WHEN $13::boolean THEN NULL WHEN $14::text IS NOT NULL THEN $14::text ELSE photo_url END WHERE id=$15",[b.first_name,b.last_name,b.date_of_birth,b.gender,b.phone,b.parent_name,b.parent_phone,b.emergency_contact,b.sport,b.category,b.coach,b.status,b.remove_photo===true||b.remove_photo==='true',clean(b.photo_url)||null,b.id]);return res.json({ok:true})}
   if(type==='settings'){await q("UPDATE academy_settings SET academy_name=$1,phone=$2,email=$3,location=$4,sports=$5,categories=$6 WHERE id=$7",[b.academy_name,b.phone,b.email,b.location,b.sports,b.categories,b.id]);return res.json({ok:true})}
  }
  if(req.method==='DELETE'&&type==='player'){await q("DELETE FROM players WHERE id=$1",[Number(req.query.id)]);return res.json({ok:true})}
  return res.status(400).json({error:'Unsupported operation'});
 }catch(e){console.error(e);return res.status(500).json({error:'Server error',detail:process.env.NODE_ENV==='development'?e.message:undefined})}
});
app.use((err,req,res,next)=>{if(err&&err.type==='entity.too.large')return res.status(413).json({error:'That photo is too large. Please choose a smaller image.'});if(err&&err.type==='entity.parse.failed')return res.status(400).json({error:'Invalid request body'});console.error(err);return res.status(500).json({error:'Server error'})});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../frontend/index.html')));
const PORT=Number(process.env.PORT||3000);
app.listen(PORT,()=>console.log(`AcademyHub running on http://localhost:${PORT}`));
