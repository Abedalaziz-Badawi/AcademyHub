const fs=require('fs');const path=require('path');const {Pool}=require('pg');require('dotenv').config();
const root=path.join(__dirname,'../database/schema.sql');
const pool=new Pool(require('./db'));
(async()=>{try{await pool.query(fs.readFileSync(root,'utf8'));console.log('Schema is up to date')}catch(e){console.error('Migration failed:',e.message);process.exitCode=1}finally{await pool.end()}})();
