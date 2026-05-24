# How to Get Your Supabase Connection String

## The Problem
Your current connection string is not working because either:
1. The project reference `rsvetmwgqhxisloklsau` is incorrect
2. The password is incorrect
3. The hostname format is wrong

## Solution: Get the Correct Connection String

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project

### Step 2: Get Connection String
1. Click on **Settings** (gear icon in left sidebar)
2. Click on **Database**
3. Scroll down to **Connection string** section

### Step 3: Choose the Right Connection Type

#### Option A: Direct Connection (Recommended for Development)
- Look for **URI** under "Connection string"
- It should look like:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  ```
- Copy this and replace `[YOUR-PASSWORD]` with your actual password: `123456789nitinrai2266`

#### Option B: Connection Pooling (For Production)
- Look for **Connection pooling** section
- Choose **Transaction** mode
- It should look like:
  ```
  postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  ```
- Copy this and replace `[YOUR-PASSWORD]` with: `123456789nitinrai2266`

### Step 4: Update Your .env File
Replace the DATABASE_URL in your `.env` file with the connection string you copied.

### Step 5: Test the Connection
Run:
```bash
node test-db-connection.js
```

## Common Issues

### Issue 1: "Tenant or user not found"
- **Cause**: Wrong username format or project reference
- **Fix**: Make sure you're using the exact connection string from Supabase dashboard

### Issue 2: "ENOTFOUND db.xxx.supabase.co"
- **Cause**: Project reference is incorrect or project doesn't exist
- **Fix**: Double-check the project reference in your Supabase dashboard

### Issue 3: "Authentication failed"
- **Cause**: Wrong password
- **Fix**: Reset your database password in Supabase dashboard:
  1. Go to Settings > Database
  2. Click "Reset database password"
  3. Set new password: `123456789nitinrai2266`
  4. Update your connection string

## What to Do Next

1. **Get the correct connection string** from your Supabase dashboard
2. **Update the `.env` file** with the correct DATABASE_URL
3. **Update `test-db-connection.js`** with the same connection string
4. **Run the test**: `node test-db-connection.js`
5. **If successful**, run migrations: `npm run db:migrate`
6. **Then seed the database**: `npm run db:seed`
7. **Start your app**: `npm run dev`

## Need Help?

If you're still having issues, please provide:
1. Screenshot of your Supabase Database settings page (hide the password)
2. The exact error message you're getting
3. Your project reference (the part after `db.` in the hostname)
