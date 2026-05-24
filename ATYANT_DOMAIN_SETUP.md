# Atyant Domain Setup - ccn.atyant.in

## Overview
Aap `ccn.atyant.in` subdomain use karenge apne CableEasy application ke liye.

---

## Step 1: Dokploy Me Application Deploy Karo

Pehle normal deployment karo (DOKPLOY_HINDI_GUIDE.md follow karo), phir domain setup karenge.

---

## Step 2: Dokploy Server IP Note Karo

### Dokploy Dashboard Se IP Lo:
1. Dokploy dashboard me jao
2. Apna application open karo
3. **Settings** ya **Overview** me **Server IP** dikhega
4. Yeh IP note kar lo (example: `123.45.67.89`)

---

## Step 3: Atyant Team Ko DNS Update Request Karo

Atyant team ko yeh information do:

### DNS Configuration Request:

```
Subdomain: ccn.atyant.in
Record Type: A Record
Value: [Dokploy Server IP]
TTL: 3600 (1 hour)
```

### Email Template (Atyant Team Ko Bhejo):

```
Subject: DNS Configuration Request - ccn.atyant.in

Hi Atyant Team,

Main apne CableEasy application ke liye subdomain setup karna chahta/chahti hoon.

Details:
- Subdomain: ccn.atyant.in
- Record Type: A Record
- IP Address: [Dokploy Server IP]
- TTL: 3600

Kripya yeh DNS record add kar dijiye.

Thanks,
[Your Name]
```

---

## Step 4: Dokploy Me Domain Add Karo

DNS update hone ke baad (usually 5-30 minutes):

### 4.1 Dokploy Dashboard Me Jao
1. Apna application open karo
2. **Domains** section me jao

### 4.2 Domain Add Karo
1. **"Add Domain"** button click karo
2. Domain name enter karo: `ccn.atyant.in`
3. **"Add"** button click karo

### 4.3 SSL Certificate Setup
- Dokploy automatically Let's Encrypt SSL certificate generate karega
- 2-5 minutes me SSL active ho jayega
- HTTPS automatically enable ho jayega

---

## Step 5: Verify Domain

### 5.1 DNS Propagation Check Karo
Terminal me yeh command run karo:
```bash
nslookup ccn.atyant.in
```

Output me Dokploy server IP dikhna chahiye.

### 5.2 Application Access Karo
Browser me open karo:
- **HTTP:** `http://ccn.atyant.in`
- **HTTPS:** `https://ccn.atyant.in` (SSL ke baad)

---

## Step 6: Environment Variables Update (Optional)

Agar aapke application me absolute URLs use ho rahe hain, to environment variable add karo:

```env
NEXT_PUBLIC_APP_URL=https://ccn.atyant.in
```

Dokploy dashboard me:
1. Application > **Environment Variables**
2. Add karo: `NEXT_PUBLIC_APP_URL=https://ccn.atyant.in`
3. Application restart karo

---

## Important URLs (After Setup)

### Customer Portal:
- **Homepage:** `https://ccn.atyant.in`
- **Login:** `https://ccn.atyant.in/login`
- **Register:** `https://ccn.atyant.in/register`
- **Dashboard:** `https://ccn.atyant.in/dashboard`
- **Plans:** `https://ccn.atyant.in/plans`

### Admin Panel:
- **Login:** `https://ccn.atyant.in/admin/login`
- **Dashboard:** `https://ccn.atyant.in/admin/pending`
- **Customers:** `https://ccn.atyant.in/admin/customers`
- **Plans:** `https://ccn.atyant.in/admin/plans`

---

## Troubleshooting

### Problem 1: Domain Not Resolving
**Possible Reasons:**
- DNS propagation pending (wait 5-30 minutes)
- DNS record galat configure hua
- Atyant team ne abhi add nahi kiya

**Solution:**
```bash
# Check DNS
nslookup ccn.atyant.in

# Check with Google DNS
nslookup ccn.atyant.in 8.8.8.8
```

### Problem 2: SSL Certificate Not Working
**Solution:**
- Wait 5 minutes for Let's Encrypt
- Dokploy dashboard me SSL status check karo
- Agar fail ho to "Regenerate Certificate" try karo

### Problem 3: "This site can't be reached"
**Solution:**
- Dokploy server running hai ya nahi check karo
- Firewall me port 80 aur 443 open hain ya nahi verify karo
- Dokploy dashboard me application status check karo

---

## DNS Configuration Details (For Atyant Team)

Agar Atyant team ko technical details chahiye:

### Required DNS Record:
```
Type: A
Host: ccn
Domain: atyant.in
Full Domain: ccn.atyant.in
Value: [Dokploy Server IP]
TTL: 3600
```

### Optional (For Better Performance):
```
Type: AAAA (if IPv6 available)
Host: ccn
Value: [Dokploy Server IPv6]
TTL: 3600
```

---

## Security Considerations

### 1. Force HTTPS
Dokploy automatically HTTP to HTTPS redirect karega.

### 2. HSTS (HTTP Strict Transport Security)
Dokploy me HSTS enable karo:
1. Application settings me jao
2. Security section me HSTS enable karo

### 3. Firewall Rules
Ensure these ports are open:
- Port 80 (HTTP) - for Let's Encrypt validation
- Port 443 (HTTPS) - for secure traffic

---

## Razorpay Configuration Update

Agar Razorpay use kar rahe ho, to webhook URL update karo:

### Razorpay Dashboard Me:
1. Settings > Webhooks
2. Webhook URL: `https://ccn.atyant.in/api/razorpay/webhook`
3. Events select karo: `payment.captured`
4. Save karo

---

## Testing Checklist

Domain setup ke baad yeh test karo:

- [ ] `https://ccn.atyant.in` open ho raha hai
- [ ] SSL certificate valid hai (green padlock)
- [ ] Homepage plans show kar raha hai
- [ ] Customer registration kaam kar raha hai
- [ ] Customer login kaam kar raha hai
- [ ] Admin login kaam kar raha hai (`/admin/login`)
- [ ] Admin dashboard accessible hai
- [ ] Images aur CSS load ho rahe hain

---

## Sharing With Customers

Domain setup hone ke baad customers ko share karo:

### WhatsApp/SMS Message Template:
```
🎉 CableEasy - Online Cable Recharge

Ab aap ghar baithe apna cable recharge kar sakte hain!

Website: https://ccn.atyant.in

Features:
✅ Instant Activation
✅ Secure Payment
✅ Multiple Plans
✅ Recharge History

Register karein aur recharge karein!
```

---

## Monitoring & Maintenance

### Regular Checks:
1. **Daily:** Application status check karo
2. **Weekly:** Logs review karo
3. **Monthly:** SSL certificate expiry check karo (auto-renew hota hai)

### Dokploy Dashboard:
- Application metrics dekho
- Error logs monitor karo
- Resource usage track karo

---

## Backup Domain (Optional)

Agar main domain down ho to backup ke liye:
- Dokploy default URL: `https://your-app.dokploy.app`
- Yeh hamesha kaam karega

---

## Support Contact

### Atyant Team:
- Domain/DNS issues ke liye Atyant team se contact karo

### Dokploy Support:
- Application/deployment issues ke liye Dokploy support

### Your Application:
- Database: Supabase dashboard
- Payments: Razorpay dashboard
- Logs: Dokploy console

---

## Success! 🎉

Aapka CableEasy application ab `ccn.atyant.in` pe live hai!

**Next Steps:**
1. ✅ Customers ko URL share karo
2. ✅ Test recharge karo
3. ✅ Admin panel se monitor karo
4. ✅ Feedback collect karo

---

## Quick Reference

```
Domain: ccn.atyant.in
SSL: Auto (Let's Encrypt)
Admin: https://ccn.atyant.in/admin/login
Customer: https://ccn.atyant.in

Default Admin:
Username: admin
Password: admin123 (change this!)
```

Happy Deploying! 🚀
