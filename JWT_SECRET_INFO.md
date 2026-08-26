# JWT Secret Information

## What is JWT_SECRET?

JWT_SECRET ek secret key hai jo JSON Web Tokens (JWT) ko sign karne ke liye use hoti hai. Yeh authentication aur authorization ke liye bahut important hai.

---

## Your Generated JWT_SECRET

```
<see .env — never store real secrets in this file>
```

✅ **Yeh already aapki `.env` file me add ho gaya hai!**

---

## Why is JWT_SECRET Important?

1. **Authentication:** Customer aur admin login ke liye use hota hai
2. **Security:** Tokens ko sign karne ke liye use hota hai
3. **Session Management:** User sessions ko secure rakhta hai

---

## Security Best Practices

### ✅ DO:
- Minimum 32 characters ka random string use karo
- Production me strong secret use karo
- Secret ko kabhi git me commit mat karo
- Different environments me different secrets use karo

### ❌ DON'T:
- Simple passwords use mat karo (e.g., "password123")
- Secret ko publicly share mat karo
- Same secret development aur production me use mat karo
- Secret ko code me hardcode mat karo

---

## How JWT Works in CableEasy

```
1. User Login
   ↓
2. Server verifies credentials
   ↓
3. Server creates JWT token (signed with JWT_SECRET)
   ↓
4. Token stored in httpOnly cookie
   ↓
5. Every request includes token
   ↓
6. Server verifies token using JWT_SECRET
   ↓
7. Access granted/denied
```

---

## Generate New JWT_SECRET (If Needed)

### Method 1: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: Using OpenSSL
```bash
openssl rand -hex 32
```

### Method 3: Using PowerShell
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Method 4: Online Generator
- https://generate-secret.vercel.app/32
- https://randomkeygen.com/

---

## Environment-Specific Secrets

### Development (.env.local)
```env
JWT_SECRET=<generate-your-own-see-methods-above>
```

### Production (Dokploy/Vercel)
```env
JWT_SECRET=<different-secret-for-production>
```

**Important:** Production me alag secret use karo!

---

## Troubleshooting

### Error: "Invalid token"
**Cause:** JWT_SECRET change ho gaya
**Solution:** 
- Logout karke dobara login karo
- Ya purana JWT_SECRET restore karo

### Error: "JWT malformed"
**Cause:** Token corrupt ho gaya
**Solution:**
- Browser cookies clear karo
- Dobara login karo

### Error: "jwt must be provided"
**Cause:** JWT_SECRET environment variable set nahi hai
**Solution:**
- .env file me JWT_SECRET add karo
- Server restart karo

---

## Security Checklist

- [x] JWT_SECRET minimum 32 characters ka hai
- [x] Random aur unpredictable hai
- [ ] Production me different secret use kar rahe ho
- [ ] Secret git me commit nahi hua
- [ ] Secret secure storage me hai (environment variables)
- [ ] Team members ko secret securely share kiya

---

## Rotation Policy (Advanced)

Production me JWT_SECRET ko regularly rotate karna chahiye:

1. **When to Rotate:**
   - Every 90 days (recommended)
   - After security breach
   - When team member leaves
   - After major deployment

2. **How to Rotate:**
   - New secret generate karo
   - Environment variable update karo
   - Application restart karo
   - All users ko logout kar do (optional)

---

## Your Current Configuration

```env
# Local Development
JWT_SECRET=<generate-your-own-see-methods-above>

# For Dokploy Deployment
# Generate a new secret for production:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Additional Security Measures

### 1. Token Expiration
Tokens automatically expire after 7 days (configured in `lib/auth.ts`)

### 2. HttpOnly Cookies
Tokens stored in httpOnly cookies (JavaScript se access nahi ho sakta)

### 3. Secure Flag
Production me secure flag enabled hai (HTTPS only)

### 4. SameSite Policy
CSRF attacks se protection ke liye SameSite=Lax set hai

---

## Summary

✅ **Your JWT_SECRET is ready to use!**

```
JWT_SECRET=<see your local .env — do not commit real values here>
```

**Next Steps:**
1. ✅ JWT_SECRET already set hai
2. Production deployment ke liye new secret generate karo
3. Dokploy environment variables me add karo
4. Deploy karo!

---

## Need Help?

- JWT Documentation: https://jwt.io/
- Security Best Practices: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- Node.js Crypto: https://nodejs.org/api/crypto.html

Happy Coding! 🔐
