# Dokploy Deployment Guide - CableEasy

## Overview
Yeh Next.js application hai jo frontend aur backend dono ko ek saath deploy karega. Dokploy me isko deploy karne ke liye Docker use karenge.

## Prerequisites
- Dokploy account aur server setup
- PostgreSQL database (Supabase ya koi bhi)
- Cashfree account (payment gateway)
- Wildcard domain (e.g. `*.atyant.in`) — multi-tenant operators har ek apni
  subdomain se serve hote hain, see nginx.conf

---

## Step 1: Dockerfile Create Karo

Dockerfile already create kar diya hai (neeche dekho). Yeh file automatically build karega.

## Step 2: Environment Variables Setup

Dokploy dashboard me jaake yeh environment variables add karo:

```env
# Database
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@HOST:PORT/postgres

# Cashfree
CASHFREE_APP_ID=xxxxx
CASHFREE_SECRET_KEY=xxxxx
CASHFREE_ENV=PRODUCTION          # or SANDBOX for testing
NEXT_PUBLIC_CASHFREE_ENV=production   # or sandbox — must match CASHFREE_ENV

# JWT Secret (koi bhi random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# Public app URL — used to build Cashfree return_url after payment
NEXT_PUBLIC_APP_URL=https://ccn.atyant.in

# Web push (optional — generate with `npx web-push generate-vapid-keys`)
VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxx

# Multi-tenant fallback — which operator to serve when the Host header
# doesn't match a known subdomain (e.g. requests hitting the bare server IP)
DEFAULT_OPERATOR_SUBDOMAIN=ccn

# Node Environment
NODE_ENV=production
```

> `NEXT_PUBLIC_*` values get baked into the client bundle at **build time**,
> not read at container start. Dokploy needs to pass them as Docker build
> args (see `docker-compose.yml`), not just runtime env vars — otherwise the
> browser bundle ships with `undefined`/sandbox defaults.

## Step 3: Dokploy Me Deploy Kaise Kare

### Method 1: GitHub Se Deploy (Recommended)

1. **Dokploy Dashboard me jao**
2. **"New Application" click karo**
3. **Application Type select karo:**
   - Type: `Application`
   - Name: `cableeasy`
4. **Git Repository connect karo:**
   - Repository: `https://github.com/bt23mme076-gif/CCN`
   - Branch: `main`
5. **Build Settings:**
   - Build Type: `Dockerfile`
   - Dockerfile Path: `./Dockerfile`
6. **Environment Variables add karo** (upar diye gaye)
7. **Port Configuration:**
   - Container Port: `3000`
   - Public Port: `80` ya `443` (SSL ke liye)
8. **Deploy button click karo**

### Method 2: Docker Image Se Deploy

1. Local me image build karo:
   ```bash
   docker build -t cableeasy .
   ```
2. Dokploy me image upload karo
3. Environment variables set karo
4. Deploy karo

## Step 4: Database Migrations Run Karo

Deployment ke baad, ek baar migrations run karna padega:

### Option A: Dokploy Console Se

1. Dokploy dashboard me application open karo
2. "Console" tab me jao
3. Yeh commands run karo:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

### Option B: Local Se (Database Direct Access)

Agar aapke paas database ka direct access hai:
```bash
# Local me .env file me production DATABASE_URL dalo
npm run db:migrate
npm run db:seed
```

## Step 5: Verify Deployment

1. **Application URL open karo** (Dokploy me milega)
2. **Homepage check karo** - Plans dikhne chahiye
3. **Register karo** - Naya customer account banao
4. **Admin login karo:**
   - URL: `https://your-domain.com/admin/login`
   - Username: `admin`
   - Password: `admin123`

---

## Important Notes

### Database Connection
- Supabase use kar rahe ho to **Transaction Pooling** (port 6543) use karo
- Direct connection (port 5432) mat use karo serverless apps me

### Security
- Deployment ke baad admin password **zaroor change karo**
- JWT_SECRET ko strong rakho (minimum 32 characters)
- Production me HTTPS enable karo

### Troubleshooting

#### Error: Database connection failed
**Solution:** 
- DATABASE_URL check karo
- Supabase me IP whitelist check karo (0.0.0.0/0 allow karo)

#### Error: Build failed
**Solution:**
- Dokploy logs check karo
- Environment variables sahi se set hain ya nahi check karo

#### Error: Application not starting
**Solution:**
- Port 3000 expose ho raha hai ya nahi check karo
- Logs me error dekho

---

## Scaling & Performance

### For Production:
1. **Database Pooling:** Supabase Transaction pooling use karo
2. **Caching:** Redis add kar sakte ho (optional)
3. **CDN:** Static assets ke liye CDN use karo
4. **Monitoring:** Dokploy metrics check karte raho

### Resource Requirements:
- **Minimum:** 512MB RAM, 1 CPU
- **Recommended:** 1GB RAM, 2 CPU
- **Database:** Supabase free tier sufficient hai initially

---

## Post-Deployment Checklist

- [ ] Application accessible hai
- [ ] Database migrations run ho gaye
- [ ] Plans show ho rahe hain homepage pe
- [ ] Customer registration kaam kar raha hai
- [ ] Admin login kaam kar raha hai
- [ ] Admin password change kar diya
- [ ] Environment variables secure hain
- [ ] HTTPS enabled hai
- [ ] Custom domain setup (optional)

---

## Support & Maintenance

### Regular Tasks:
1. **Database Backups:** Supabase automatic backups leta hai
2. **Logs Monitoring:** Dokploy dashboard me logs check karo
3. **Updates:** Git se latest code pull karo aur redeploy karo

### Update Kaise Kare:
1. GitHub me code push karo
2. Dokploy automatically detect karega (webhook enabled ho to)
3. Ya manually "Redeploy" button click karo

---

## Wildcard Subdomain Setup (Multi-Tenant)

Har operator apni subdomain se serve hota hai (`ccn.atyant.in`, `op2.atyant.in`,
...). `middleware.ts` request ke `Host` header se subdomain nikalta hai aur
`x-operator-subdomain` header set karta hai; `lib/db/tenant.ts` usse operator
row lookup karta hai. Naya operator add karne ke liye sirf DB me row banani
hai — nginx ya DNS me kuch nahi badalna padta.

1. **DNS** — apne domain registrar/Cloudflare me ek wildcard record daalo:
   - Type: `A` (ya `CNAME` agar Dokploy/Cloudflare proxy chahiye)
   - Name: `*` (matlab `*.atyant.in`)
   - Value: server ka IP
   - Apex domain (`atyant.in`) ke liye alag se `@` A record bhi daalo
2. **SSL** — ek certificate chahiye jo `*.atyant.in` cover kare (single-domain
   cert kaam nahi karega, kyunki subdomains dynamic hain):
   - **Cloudflare use kar rahe ho:** SSL/TLS → Origin Server → Create
     Certificate → hostname `*.atyant.in, atyant.in` daalo. Cert +
     key ko `./certs/atyant.in.pem` aur `./certs/atyant.in.key` me save karo
     (yehi paths `nginx.conf` me hardcoded hain). Cloudflare proxy mode
     "Full (strict)" pe rakho.
   - **Cloudflare nahi use kar rahe:** `certbot` ke DNS-01 challenge se
     wildcard Let's Encrypt cert lo (`certbot certonly --manual
     --preferred-challenges dns -d atyant.in -d '*.atyant.in'`) — HTTP-01
     challenge wildcard certs ke liye kaam nahi karta.
3. `docker-compose.yml` `./certs` folder ko container me mount karta hai —
   pehle folder banao aur cert/key wahan daalo, phir `docker compose up -d`.
4. Naya operator onboard karne ke liye — bas `operators` table me ek row
   insert karo jiska `subdomain` column us tenant ka naam ho
   (e.g. `op2`); DNS/nginx/deploy me koi change nahi chahiye.

---

## Useful Commands

### View Logs:
```bash
# Dokploy console me
docker logs -f [container-id]
```

### Restart Application:
```bash
# Dokploy dashboard se "Restart" button click karo
```

### Database Console:
```bash
# Supabase dashboard me SQL Editor use karo
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Dokploy Server                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Docker Container                │ │
│  │                                   │ │
│  │   ┌─────────────────────────┐    │ │
│  │   │   Next.js App           │    │ │
│  │   │   (Frontend + Backend)  │    │ │
│  │   │   Port: 3000            │    │ │
│  │   └─────────────────────────┘    │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
                  │
                  │ (PostgreSQL Connection)
                  ▼
         ┌─────────────────┐
         │   Supabase DB   │
         │   Port: 6543    │
         └─────────────────┘
```

---

## Success! 🎉

Aapka CableEasy application ab live hai! Customers ab online recharge kar sakte hain aur aap admin panel se manage kar sakte ho.
