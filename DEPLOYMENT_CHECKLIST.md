# CableEasy Deployment Checklist

## ✅ Pre-Deployment Fixes Completed

### ESLint Issues Fixed
- ✅ Fixed all unescaped apostrophes (replaced `'` with `&apos;`)
- ✅ Fixed React Hook dependency warnings (added eslint-disable comments)
- ✅ All linting errors resolved - build ready

### Application Features
- ✅ Customer registration and login
- ✅ Plan browsing and selection
- ✅ Razorpay payment integration
- ✅ Customer dashboard with recharge history
- ✅ Admin panel with pending activations
- ✅ Admin customer management
- ✅ Admin plan management
- ✅ Proper error handling and loading states

## 🚀 Deployment Steps

### 1. Environment Variables

Make sure your `.env` file has all required values:

```env
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@HOST:PORT/postgres
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### 2. Database Setup

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (plans + admin user)
npm run db:seed
```

### 3. Build and Deploy

```bash
# Test build locally
npm run build

# Start production server
npm start
```

## 📋 Post-Deployment Verification

### Customer Portal
- [ ] Homepage loads with plans
- [ ] Customer can register
- [ ] Customer can login
- [ ] Customer can view dashboard
- [ ] Customer can select and pay for plans
- [ ] Recharge history displays correctly

### Admin Panel
- [ ] Admin can login (username: admin, password: admin123)
- [ ] Dashboard shows correct stats
- [ ] Pending activations list works
- [ ] Can activate recharges
- [ ] Customer list loads
- [ ] Plan management works
- [ ] Can create new plans
- [ ] Can toggle plan visibility

## 🔐 Security Checklist

- [ ] Change default admin password after first login
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags in production
- [ ] Verify Razorpay webhook signature
- [ ] Database connection uses SSL
- [ ] Environment variables not committed to git

## 🎨 Design System

### Colors
- Brand Navy: `#1a1a2e`
- Accent Red: `#e63946`
- Accent Blue: `#457b9d`
- Success Green: `#2d6a4f`

### Fonts
- Body: DM Sans
- Display: Syne

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🐛 Known Issues & Solutions

### Issue: Database connection refused
**Solution**: Check DATABASE_URL format and ensure PostgreSQL is running

### Issue: Razorpay payment not working
**Solution**: Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct

### Issue: JWT authentication fails
**Solution**: Ensure JWT_SECRET is set and consistent across deployments

## 📊 Default Seeded Data

### Plans
1. Basic - ₹199/30 days
2. Silver - ₹299/30 days (Popular)
3. Gold - ₹399/30 days
4. Platinum - ₹599/30 days
5. Silver 3M - ₹799/90 days

### Admin User
- Username: `admin`
- Password: `admin123`
- **⚠️ Change this password immediately after deployment!**

## 🔄 Maintenance

### Update Plans
1. Login to admin panel
2. Go to Plans section
3. Add new plan or toggle existing plans

### Activate Recharges
1. Login to admin panel
2. Go to Pending Activations
3. Click "Mark Activated" for paid recharges

### View Customer Data
1. Login to admin panel
2. Go to Customers section
3. Search by name, mobile, STB number, or area

## 📞 Support

For issues or questions:
1. Check the README.md for setup instructions
2. Check SUPABASE_SETUP.md for database connection help
3. Review error logs in the console
4. Verify all environment variables are set correctly

## ✨ Success!

Your CableEasy application is now ready for deployment! 🎉
