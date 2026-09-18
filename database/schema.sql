CREATE TABLE IF NOT EXISTS academy_settings (
 id BIGSERIAL PRIMARY KEY, academy_name TEXT NOT NULL DEFAULT 'AcademyHub Sports Academy', logo_url TEXT,
 phone TEXT,email TEXT,location TEXT,
 sports TEXT[] NOT NULL DEFAULT ARRAY['Football','Basketball','Swimming','Volleyball','Taekwondo'],
 categories TEXT[] NOT NULL DEFAULT ARRAY['U10','U12','U14','U16','Senior'],
 subscription_plans JSONB NOT NULL DEFAULT '[{"name":"Monthly","months":1,"price":35},{"name":"3 Months","months":3,"price":90},{"name":"6 Months","months":6,"price":165},{"name":"Annual","months":12,"price":300}]'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS players (
 id BIGSERIAL PRIMARY KEY, first_name TEXT NOT NULL,last_name TEXT NOT NULL,date_of_birth DATE NOT NULL,gender TEXT NOT NULL,
 phone TEXT,parent_name TEXT,parent_phone TEXT,emergency_contact TEXT,sport TEXT NOT NULL,category TEXT NOT NULL,coach TEXT,
 join_date DATE NOT NULL DEFAULT CURRENT_DATE,photo_url TEXT,status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive')),created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS subscriptions (
 id BIGSERIAL PRIMARY KEY,player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,plan_name TEXT NOT NULL,start_date DATE NOT NULL,expiry_date DATE NOT NULL,
 amount NUMERIC(10,2) NOT NULL DEFAULT 0,payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK(payment_status IN ('Paid','Pending','Overdue')),created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attendance (
 id BIGSERIAL PRIMARY KEY,player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,attendance_date DATE NOT NULL,status TEXT NOT NULL CHECK(status IN ('Present','Absent')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(player_id,attendance_date)
);
CREATE TABLE IF NOT EXISTS player_notes (
 id BIGSERIAL PRIMARY KEY,player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,note TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
 id BIGSERIAL PRIMARY KEY,player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,message TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'renewal',
 status TEXT NOT NULL DEFAULT 'Unread' CHECK(status IN ('Unread','Read','Sent')),created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activity_log (
 id BIGSERIAL PRIMARY KEY,action TEXT NOT NULL,detail TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff_users (
 id BIGSERIAL PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,name TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'Staff' CHECK(role IN ('Admin','Staff')),created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
