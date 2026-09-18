const ssl=process.env.DB_SSL==='true'?{rejectUnauthorized:false}:false;
module.exports=process.env.DATABASE_URL
 ?{connectionString:process.env.DATABASE_URL,ssl}
 :{host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME||'academyhub',user:process.env.DB_USER||'postgres',password:process.env.DB_PASSWORD||'',ssl};
