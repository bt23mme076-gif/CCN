# Troubleshooting Guide - Bad Gateway Error

## Problem: ccn.atyant.in shows "Bad Gateway"

### Yeh Error Kyun Aa Raha Hai?

"Bad Gateway" (502) error ka matlab hai:
- ✅ Domain DNS sahi se configure hai
- ✅ Dokploy server tak request pahunch rahi hai
- ❌ Application container start nahi hua ya crash ho gaya

---

## Quick Fixes (Step by Step)

### Step 1: Dokploy Logs Check Karo

1. **Dokploy Dashboard** me jao
2. **Application (CCN)** open karo
3. **Logs** tab click karo
4. **Latest logs** dekho

**Common Errors:**
- Database connection failed
- Environment variables missing
- Port already in use
- Build failed

---

### Step 2: Application Status Check Karo

1. Dokploy dashboard me **Overview** tab
2. **Status** dekho:
   - 🟢 Running = Good
   - 🔴 Stopped = Problem
   - 🟡 Starting = Wait karo

3. Agar **Stopped** hai to:
   - **Restart** button click karo
   - Logs me error dekho

---

### Step 3: Environment Variables Verify Karo

Dokploy me **Environment** tab me jao aur check karo:

```env
✅ DATABASE_URL=postgresql://...
✅ JWT_SECRET=244ac9d587dd9414de9b7ace484cfec224e0bc4d2490bc162c898c8220467a18
✅ NODE_ENV=production
```

**Missing Variables:**
- Agar koi variable missing hai to add karo
- Application restart karo

---

### Step 4: Database Connection Test Karo

**Console** tab me jao aur run karo:

```bash
# Test database connection
node -e "const postgres = require('postgres'); const sql = postgres(process.env.DATABASE_URL); sql\`SELECT 1\`.then(() => console.log('DB Connected!')).catch(e => console.error('DB Error:', e));"
```

**Agar error aaye:**
- DATABASE_URL check karo
- Supabase dashboard me IP whitelist check karo
- Password sahi hai ya nahi verify karo

---

### Step 5: Port Check Karo

Dokploy **Settings** me:
- **Port** = `3000` hona chahiye
- **Protocol** = `HTTP` hona chahiye

---

### Step 6: Manual Restart

1. Dokploy dashboard me **Deployments** tab
2. **Redeploy** button click karo
3. Build logs carefully dekho
4. Wait for deployment to complete

---

## Common Issues & Solutions

### Issue 1: Database Connection Failed

**Error in Logs:**
```
ECONNREFUSED
connection refused
```

**Solution:**
1. Supabase dashboard open karo
2. Settings > Database > Connection Pooling
3. **Allowed IP addresses** me add karo: `0.0.0.0/0`
4. DATABASE_URL verify karo (port 6543 use karo, not 5432)

**Correct Format:**
```
postgresql://postgres.PROJECT:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
```

---

### Issue 2: Environment Variables Missing

**Error in Logs:**
```
JWT_SECRET is not defined
DATABASE_URL is not defined
```

**Solution:**
1. Dokploy > Environment tab
2. Add missing variables
3. Restart application

---

### Issue 3: Build Failed

**Error in Logs:**
```
npm run build failed
exit code: 1
```

**Solution:**
1. Check latest GitHub commit
2. Verify code has no errors
3. Redeploy from Dokploy

---

### Issue 4: Port Already in Use

**Error in Logs:**
```
EADDRINUSE: address already in use :::3000
```

**Solution:**
1. Dokploy dashboard > Advanced
2. **Stop** application
3. Wait 10 seconds
4. **Start** application

---

### Issue 5: Out of Memory

**Error in Logs:**
```
JavaScript heap out of memory
```

**Solution:**
1. Dokploy > Settings > Resources
2. Increase **Memory Limit** to 1GB
3. Restart application

---

## Debug Commands

### Check Application Status
```bash
# In Dokploy Console
docker ps | grep ccn
```

### Check Application Logs
```bash
# In Dokploy Console
docker logs -f [container-id]
```

### Test Database Connection
```bash
# In Dokploy Console
npm run db:migrate
```

### Check Environment Variables
```bash
# In Dokploy Console
env | grep DATABASE
env | grep JWT
```

---

## Step-by-Step Recovery

### If Application is Completely Down:

1. **Stop Application**
   - Dokploy > Overview > Stop

2. **Check Environment Variables**
   - Verify all required variables are set

3. **Redeploy**
   - Deployments > Redeploy
   - Watch logs carefully

4. **Run Database Migrations**
   - Console > `npm run db:migrate`
   - Console > `npm run db:seed`

5. **Restart Application**
   - Overview > Start

6. **Test Domain**
   - Open ccn.atyant.in
   - Should show homepage with plans

---

## DNS Issues

### If Domain Not Resolving:

```bash
# Check DNS
nslookup ccn.atyant.in

# Should show Dokploy server IP
```

**If DNS not working:**
1. Contact Atyant team
2. Verify A record is correct
3. Wait 5-30 minutes for propagation

---

## Emergency Fallback

### Use Dokploy Default URL:

Agar ccn.atyant.in kaam nahi kar raha:
1. Dokploy dashboard me **Domains** tab
2. **Default URL** copy karo
3. Temporarily use karo

Example: `https://ccn-atyant.dokploy.app`

---

## Contact Support

### Dokploy Issues:
- Dokploy dashboard > Support
- Check Dokploy documentation

### Database Issues:
- Supabase dashboard > Support
- Check connection settings

### Domain Issues:
- Contact Atyant team
- Verify DNS configuration

---

## Success Checklist

Application working when:
- ✅ Dokploy shows status = Running
- ✅ Logs show "ready on port 3000"
- ✅ ccn.atyant.in opens without error
- ✅ Homepage shows 5 plans
- ✅ Can register new customer
- ✅ Can login to admin panel

---

## Quick Test Commands

```bash
# Test if application is responding
curl http://localhost:3000

# Test database
npm run db:migrate

# Check environment
echo $DATABASE_URL
echo $JWT_SECRET

# Restart application
docker restart [container-id]
```

---

## Most Common Fix

**90% of the time, this works:**

1. Go to Dokploy dashboard
2. Click **Deployments** tab
3. Click **Redeploy** button
4. Wait 2-3 minutes
5. Refresh ccn.atyant.in

---

## Need More Help?

1. **Check Dokploy Logs** - Most errors are visible here
2. **Verify Environment Variables** - Missing variables cause 90% of issues
3. **Test Database Connection** - Connection issues are common
4. **Restart Application** - Simple restart fixes many issues

Good luck! 🚀
