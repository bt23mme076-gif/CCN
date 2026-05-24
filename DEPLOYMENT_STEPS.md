# 🚀 CableEasy Deployment - Quick Steps

## Pre-Deployment Checklist ✅

- [x] Code GitHub pe push ho gaya
- [x] Dockerfile ready hai
- [x] Environment variables list ready hai
- [ ] Supabase database setup
- [ ] Dokploy account ready
- [ ] Domain (ccn.atyant.in) DNS access

---

## Step-by-Step Deployment

### 1️⃣ Supabase Database Setup (5 min)

```bash
✅ Task: Database connection string lo

Steps:
1. https://supabase.com pe login karo
2. Project > Settings > Database
3. Connection string (URI) copy karo
4. Password replace karo

Example:
postgresql://postgres.PROJECT:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
```

---

### 2️⃣ Dokploy Deployment (10 min)

```bash
✅ Task: Application deploy karo

Steps:
1. Dokploy dashboard open karo
2. "Create Application" click karo
3. Details fill karo:
   - Name: cableeasy
   - Type: Application
   - Source: GitHub
   - Repo: bt23mme076-gif/CCN
   - Branch: main
   - Build: Dockerfile
   - Port: 3000

4. Environment Variables add karo:
   DATABASE_URL=postgresql://...
   JWT_SECRET=random-32-char-string
   RAZORPAY_KEY_ID=rzp_test_xxxxx (optional)
   RAZORPAY_KEY_SECRET=xxxxx (optional)
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx (optional)
   NODE_ENV=production

5. "Deploy" click karo
6. Wait for build (5-10 min)
```

---

### 3️⃣ Database Migrations (5 min)

```bash
✅ Task: Database setup karo

Steps:
1. Dokploy > Application > Console
2. Run commands:

npm run db:generate
npm run db:migrate
npm run db:seed

Expected Output:
✓ Plans seeded successfully!
✓ Admin seeded successfully!
  Username: admin
  Password: admin123
```

---

### 4️⃣ Domain Setup - ccn.atyant.in (15 min)

```bash
✅ Task: Custom domain configure karo

Steps:
1. Dokploy server IP note karo
2. Atyant team ko email bhejo:
   
   Subject: DNS Configuration - ccn.atyant.in
   
   Subdomain: ccn.atyant.in
   Type: A Record
   Value: [Dokploy Server IP]
   TTL: 3600

3. DNS update hone ka wait karo (5-30 min)
4. Dokploy > Domains > Add Domain
5. Enter: ccn.atyant.in
6. SSL auto-generate hoga (2-5 min)
```

---

### 5️⃣ Testing (10 min)

```bash
✅ Task: Application test karo

Test URLs:
□ https://ccn.atyant.in (homepage)
□ https://ccn.atyant.in/register (customer register)
□ https://ccn.atyant.in/login (customer login)
□ https://ccn.atyant.in/admin/login (admin login)

Test Cases:
□ Plans show ho rahe hain
□ Customer registration kaam kar raha hai
□ Customer login kaam kar raha hai
□ Dashboard accessible hai
□ Admin login kaam kar raha hai (admin/admin123)
□ Admin dashboard accessible hai
□ SSL certificate valid hai (green padlock)
```

---

### 6️⃣ Security Setup (5 min)

```bash
✅ Task: Security configure karo

Steps:
□ Admin password change karo (important!)
□ JWT_SECRET strong hai verify karo
□ HTTPS force enabled hai check karo
□ Environment variables secure hain verify karo
```

---

## Post-Deployment

### Immediate Tasks:
- [ ] Admin password change karo
- [ ] Test recharge karo
- [ ] Customers ko URL share karo

### Optional Tasks:
- [ ] Razorpay production keys add karo
- [ ] Custom email notifications setup karo
- [ ] Analytics add karo (Google Analytics)
- [ ] Monitoring setup karo

---

## Important Information

### URLs:
```
Production: https://ccn.atyant.in
Admin Panel: https://ccn.atyant.in/admin/login
Dokploy Dashboard: https://dokploy.com/dashboard
Supabase Dashboard: https://supabase.com/dashboard
```

### Default Credentials:
```
Admin Username: admin
Admin Password: admin123
⚠️ CHANGE THIS IMMEDIATELY!
```

### Support Contacts:
```
Domain Issues: Atyant Team
Deployment Issues: Dokploy Support
Database Issues: Supabase Support
Code Issues: GitHub Issues
```

---

## Troubleshooting Quick Reference

### Issue: Build Failed
```bash
Solution:
1. Check Dokploy logs
2. Verify environment variables
3. Check GitHub repository access
```

### Issue: Database Connection Error
```bash
Solution:
1. Verify DATABASE_URL
2. Check Supabase IP whitelist (allow 0.0.0.0/0)
3. Test connection from Dokploy console
```

### Issue: Domain Not Working
```bash
Solution:
1. Check DNS propagation: nslookup ccn.atyant.in
2. Verify A record points to correct IP
3. Wait 5-30 minutes for DNS propagation
```

### Issue: SSL Not Working
```bash
Solution:
1. Wait 5 minutes for Let's Encrypt
2. Check Dokploy SSL status
3. Try "Regenerate Certificate"
```

---

## Deployment Timeline

```
Total Time: ~50 minutes

Supabase Setup:        5 min  ████░░░░░░
Dokploy Deployment:   10 min  ████████░░
Database Migration:    5 min  ████░░░░░░
Domain Setup:         15 min  ████████████
Testing:              10 min  ████████░░
Security:              5 min  ████░░░░░░
```

---

## Success Criteria ✅

Application successfully deployed when:
- ✅ https://ccn.atyant.in accessible hai
- ✅ SSL certificate valid hai
- ✅ Plans homepage pe show ho rahe hain
- ✅ Customer registration kaam kar raha hai
- ✅ Admin panel accessible hai
- ✅ Database queries kaam kar rahe hain
- ✅ No console errors

---

## Next Steps After Deployment

1. **Marketing:**
   - Customers ko URL share karo
   - Social media pe promote karo
   - WhatsApp groups me share karo

2. **Monitoring:**
   - Daily application status check karo
   - Weekly logs review karo
   - Monthly analytics dekho

3. **Improvements:**
   - Customer feedback collect karo
   - New features add karo
   - Performance optimize karo

---

## Quick Commands Reference

```bash
# Database
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database

# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server

# Docker
docker build -t cableeasy .              # Build image
docker run -p 3000:3000 cableeasy        # Run container
docker-compose up                        # Run with compose

# Git
git add .                                # Stage changes
git commit -m "message"                  # Commit
git push origin main                     # Push to GitHub
```

---

## Documentation Files

- `README.md` - Project overview
- `DOKPLOY_HINDI_GUIDE.md` - Detailed Hindi guide
- `ATYANT_DOMAIN_SETUP.md` - Domain setup guide
- `SUPABASE_SETUP.md` - Database setup guide
- `DEPLOYMENT_CHECKLIST.md` - Complete checklist

---

## 🎉 Congratulations!

Aapka CableEasy application successfully deploy ho gaya hai!

**Live URL:** https://ccn.atyant.in

Happy Coding! 🚀
