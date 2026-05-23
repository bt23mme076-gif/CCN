# Supabase Setup Guide

## Getting Your Database Connection String

1. **Go to your Supabase project dashboard**
   - Visit: https://supabase.com/dashboard/project/rsvetmwgqhxisloklsau

2. **Navigate to Database Settings**
   - Click on the **Settings** icon (⚙️) in the left sidebar
   - Click on **Database**

3. **Find Connection String**
   - Scroll down to the **Connection string** section
   - Select **URI** tab (not Transaction or Session)
   - You'll see something like:
   ```
   postgresql://postgres.rsvetmwgqhxisloklsau:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

4. **Replace `[YOUR-PASSWORD]`**
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - This is the password you set when creating the project

5. **Update your `.env` file**
   ```env
   DATABASE_URL=postgresql://postgres.rsvetmwgqhxisloklsau:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

## Alternative: Direct Connection (Not Pooled)

If you want to use direct connection instead of pooler:

1. In Supabase Dashboard > Settings > Database
2. Look for **Connection string** section
3. Select **Direct connection** 
4. Port will be `5432` instead of `6543`
5. Format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.rsvetmwgqhxisloklsau.supabase.co:5432/postgres
   ```

## Important Notes

- **Use Transaction pooling** (port 6543) for serverless/Next.js - RECOMMENDED
- **Use Direct connection** (port 5432) only for long-running processes
- Never commit your `.env` file with real credentials to git
- The connection string contains your database password - keep it secret!

## After Setting Up DATABASE_URL

1. Generate migrations:
   ```bash
   npm run db:generate
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed the database:
   ```bash
   npm run db:seed
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Error: ECONNREFUSED
- Your DATABASE_URL is incorrect or incomplete
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Check if you're using the correct port (6543 for pooler, 5432 for direct)

### Error: password authentication failed
- Your password is incorrect
- Reset your database password in Supabase Dashboard > Settings > Database > Reset Database Password

### Error: SSL connection required
- Add `?sslmode=require` to the end of your connection string:
  ```
  DATABASE_URL=postgresql://...postgres?sslmode=require
  ```
