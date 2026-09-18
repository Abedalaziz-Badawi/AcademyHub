const {Pool}=require('pg');require('dotenv').config();
const pool=new Pool(require('./db'));
const players=[
['Ahmed','Khaled','2015-04-12','Male','Football','U12','Coach Omar'],['Yousef','Ali','2012-08-21','Male','Football','U14','Coach Omar'],
['Rana','Nabil','2014-02-09','Female','Basketball','U14','Coach Lina'],['Noor','Fadi','2016-11-03','Female','Swimming','U10','Coach Samer'],
['Mariam','Odeh','2011-06-18','Female','Football','U16','Coach Omar'],['Tala','Hani','2015-01-27','Female','Basketball','U12','Coach Lina'],
['Hassan','Rashid','2010-09-15','Male','Football','U16','Coach Omar'],['Omar','Haddad','2008-05-06','Male','Football','Senior','Coach Kareem'],
['Lina','Sami','2013-12-20','Female','Swimming','U14','Coach Samer'],['Adam','Saleh','2016-03-11','Male','Football','U10','Coach Omar'],
['Dana','Mahmoud','2014-07-25','Female','Volleyball','U14','Coach Rami'],['Zaid','Nasser','2012-10-14','Male','Basketball','U14','Coach Lina'],
['Jana','Yasin','2015-05-30','Female','Football','U12','Coach Omar'],['Laith','Khalil','2009-01-19','Male','Swimming','U16','Coach Samer'],
['Samer','Qasem','2007-08-08','Male','Football','Senior','Coach Kareem'],['Aya','Fares','2013-03-17','Female','Basketball','U14','Coach Lina'],
['Malak','Saeed','2011-11-29','Female','Volleyball','U16','Coach Rami'],['Tamer','Adel','2016-06-04','Male','Football','U10','Coach Omar']];
function days(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
(async()=>{try{
 const existing=await pool.query('SELECT count(*)::int AS c FROM players');
 if(existing.rows[0].c>0){console.log('Players already present, skipping demo seed');await pool.end();return}
 await pool.query("INSERT INTO academy_settings(academy_name,phone,email,location) SELECT 'AcademyHub Sports Academy','+962 7 9000 0000','admin@academyhub.local','Amman, Jordan' WHERE NOT EXISTS(SELECT 1 FROM academy_settings)");
 for(const [i,p] of players.entries()){const r=await pool.query("INSERT INTO players(first_name,last_name,date_of_birth,gender,phone,parent_name,parent_phone,sport,category,coach,join_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Active') RETURNING id",[p[0],p[1],p[2],p[3],`+962 7 ${10000000+i}`,`Guardian ${p[0]}`,`+962 7 ${20000000+i}`,p[4],p[5],p[6],days(-(60+i*3))]);
 const id=r.rows[0]?.id;if(!id)continue;let offset=[3,7,3,7,7,3,7,45,30,60,5,20,75,-5,90,50,15,120][i];
 await pool.query("INSERT INTO subscriptions(player_id,plan_name,start_date,expiry_date,amount,payment_status) VALUES($1,'Monthly',$2,$3,$4,$5)",[id,days(offset-30),days(offset),35,offset<0?'Overdue':'Paid']);
 for(let j=0;j<7;j++)await pool.query("INSERT INTO attendance(player_id,attendance_date,status) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",[id,days(-j),j%6===0?'Absent':'Present']);
 if(offset>0&&offset<=7)await pool.query("INSERT INTO notifications(player_id,message,status) VALUES($1,$2,'Unread')",[id,`${p[0]} ${p[1]}'s subscription expires in ${offset} days.`]);
 }
 await pool.query("INSERT INTO activity_log(action,detail) VALUES('New player registered','Ahmed Khaled joined Football')");
 await pool.query("INSERT INTO activity_log(action,detail) VALUES('Subscription renewed','Omar Haddad renewed for 3 months')");
 await pool.query("INSERT INTO activity_log(action,detail) VALUES('Attendance recorded','17 players checked in today')");
 console.log('Seed complete');}catch(e){console.error(e);process.exitCode=1}finally{await pool.end()}})();
