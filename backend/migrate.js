const fs=require('fs');const path=require('path');const {Pool}=require('pg');require('dotenv').config();
const root=path.join(__dirname,'../database/schema.sql');
const pool=new Pool({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME||'academyhub',user:process.env.DB_USER||'postgres',password:process.env.DB_PASSWORD||'',ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:false}:false});
(async()=>{try{await pool.query(fs.readFileSync(root,'utf8'));console.log('Schema is up to date')}catch(e){console.error('Migration failed:',e.message);process.exitCode=1}finally{await pool.end()}})();
