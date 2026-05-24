# 🚀 Dokploy Me Deploy Kaise Kare - Step by Step

## Taiyari (Prerequisites)

1. **Dokploy Account** - https://dokploy.com pe account banao
2. **Supabase Database** - https://supabase.com pe free database banao
3. **GitHub Repository** - Aapka code already GitHub pe hai ✅

---

## Step 1: Supabase Database Setup (5 minutes)

### 1.1 Supabase Me Login Karo
- https://supabase.com pe jao
- Sign in karo

### 1.2 Database Connection String Lo
1. Apna project open karo
2. Left sidebar me **Settings** (⚙️) click karo
3. **Database** click karo
4. Neeche scroll karo **Connection string** tak
5. **URI** tab select karo
6. Connection string copy karo, kuch aisa dikhega:
   ```
   postgresql://postgres.PROJECT:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. `[YOUR-PASSWORD]` ko apne actual password se replace karo

---

## Step 2: Dokploy Me Application Banao (10 minutes)

### 2.1 Dokploy Dashboard Me Jao
- https://dokploy.com pe login karo
- Apna server select karo

### 2.2 New Application Create Karo
1. **"Create Application"** button click karo
2. **Application Details:**
   - **Name:** `cableeasy`
   - **Type:** `Application` select karo

### 2.3 Git Repository Connect Karo
1. **Source** section me:
   - **Provider:** `GitHub` select karo
   - **Repository:** `bt23mme076-gif/CCN` select karo
   - **Branch:** `main` select karo

### 2.4 Build Configuration
1. **Build Type:** `Dockerfile` select karo
2. **Dockerfile Path:** `./Dockerfile` (already set hoga)

### 2.5 Environment Variables Add Karo
**Environment Variables** section me yeh add karo:

```env
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
JWT_SECRET=my-super-secret-jwt-key-minimum-32-characters-long
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
NODE_ENV=production
```

**Important:**
- `DATABASE_URL` me apna Supabase connection string dalo
- `JWT_SECRET` me koi bhi random 32+ character string dalo
- Razorpay keys optional hain (testing ke liye skip kar sakte ho)

### 2.6 Port Configuration
1. **Port** section me:
   - **Container Port:** `3000`
   - **Public Port:** `80` (ya `443` SSL ke liye)

### 2.7 Deploy Karo!
1. **"Deploy"** button click karo
2. Build process start hoga (5-10 minutes lagenge)
3. Logs dekh sakte ho build progress ke liye

---

## Step 3: Database Setup (5 minutes)

Build complete hone ke baad, database setup karna padega:

### 3.1 Dokploy Console Open Karo
1. Apna application open karo Dokploy me
2. **"Console"** tab click karo
3. Terminal open hoga

### 3.2 Database Commands Run Karo
Terminal me yeh commands ek-ek karke run karo:

```bash
# Migrations generate karo
npm run db:generate

# Migrations run karo
npm run db:migrate

# Database seed karo (plans aur admin user)
npm run db:seed
```

**Output dikhega:**
```
Seeding database...
Plans seeded successfully!
Admin seeded successfully!
Username: admin
Password: admin123
Seeding completed!
```

---

## Step 4: Application Test Karo (5 minutes)

### 4.1 Application URL Open Karo
- Dokploy dashboard me aapko URL milega
- Example: `https://cableeasy.dokploy.app`

### 4.2 Homepage Check Karo
- 5 plans dikhne chahiye (Basic, ALL in ONE, Gold, Platinum, ALL in ONE 3M)
- Agar plans nahi dikh rahe to database setup dobara check karo

### 4.3 Customer Registration Test Karo
1. **"Recharge Now"** button click karo
2. Registration form fill karo:
   - Name: Test User
   - Mobile: 9876543210
   - STB Number: STB123456
   - Area: Test Area
   - PIN: 1234
3. Register karo
4. Dashboard dikhna chahiye

### 4.4 Admin Panel Test Karo
1. URL me `/admin/login` add karo
2. Login karo:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Admin dashboard dikhna chahiye

---

## Step 5: Security Setup (Important! 🔒)

### 5.1 Admin Password Change Karo
1. Admin panel me login karo
2. Password change karo (future update me feature add karenge)
3. Abhi ke liye database me manually change kar sakte ho

### 5.2 Environment Variables Secure Karo
- Dokploy dashboard me environment variables encrypted rehte hain
- Kabhi bhi `.env` file git me commit mat karo

---

## Troubleshooting (Agar Problem Aaye)

### Problem 1: Build Failed
**Solution:**
- Dokploy logs check karo
- Environment variables sahi se set hain ya nahi verify karo
- GitHub repository access check karo

### Problem 2: Database Connection Error
**Solution:**
- DATABASE_URL sahi hai ya nahi check karo
- Supabase me IP whitelist check karo:
  1. Supabase dashboard > Settings > Database
  2. Connection pooling > Allowed IP addresses
  3. `0.0.0.0/0` add karo (all IPs allow)

### Problem 3: Plans Nahi Dikh Rahe
**Solution:**
- Database seed run kiya ya nahi check karo
- Console me `npm run db:seed` dobara run karo

### Problem 4: Application Slow Hai
**Solution:**
- Dokploy me resources increase karo:
  - Minimum: 512MB RAM
  - Recommended: 1GB RAM

---

## Custom Domain Setup (Optional)

### Apna Domain Connect Karo
1. Dokploy dashboard me **"Domains"** section me jao
2. Apna domain add karo (e.g., `cableeasy.com`)
3. DNS settings me A record add karo:
   - **Type:** `A`
   - **Name:** `@`
   - **Value:** `[Dokploy Server IP]` (dashboard me milega)
4. SSL certificate automatic generate hoga

---

## Update Kaise Kare

### Code Update Karne Ke Liye:
1. GitHub me code push karo
2. Dokploy automatically detect karega (webhook enabled ho to)
3. Ya manually **"Redeploy"** button click karo

---

## Important URLs

- **Homepage:** `https://your-app.dokploy.app`
- **Customer Login:** `https://your-app.dokploy.app/login`
- **Customer Register:** `https://your-app.dokploy.app/register`
- **Admin Login:** `https://your-app.dokploy.app/admin/login`

---

## Default Credentials

### Admin Panel:
- **Username:** `admin`
- **Password:** `admin123`
- ⚠️ **Zaroor change karo production me!**

### Test Customer:
- Khud register karke test karo

---

## Support

Agar koi problem aaye to:
1. Dokploy logs check karo
2. Supabase logs check karo
3. GitHub issues me question pucho

---

## Success! 🎉

Congratulations! Aapka CableEasy application ab live hai!

**Next Steps:**
1. ✅ Admin password change karo
2. ✅ Test recharge karo
3. ✅ Razorpay setup karo (real payments ke liye)
4. ✅ Custom domain add karo
5. ✅ Customers ko share karo!

---

## Architecture Diagram

```
Internet
   │
   ▼
Dokploy Server (Docker)
   │
   ├─► Next.js App (Port 3000)
   │   ├─► Frontend (React)
   │   └─► Backend (API Routes)
   │
   └─► Supabase PostgreSQL
       └─► Database (Plans, Customers, Recharges)
```

Happy Deploying! 🚀
