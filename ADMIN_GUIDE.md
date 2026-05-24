# Admin Panel Guide

## 🔐 Admin Login

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

### Login URL
```
http://localhost:3000/admin/login
```

### Production URL
```
https://ccn.atyant.in/admin/login
```

---

## 📋 Admin Panel Overview

After logging in, you have access to:

### 1. Dashboard (`/admin`)
- Overview of system statistics
- Total customers
- Total recharges
- Pending activations
- Revenue summary

### 2. Plans Management (`/admin/plans`)
**What you can do:**
- ✅ View all plans
- ✅ Add new plans
- ✅ Activate/Deactivate plans
- ✅ Mark plans as popular
- ✅ Edit plan details

**How to Add a Plan:**
1. Click "Add Plan" button
2. Fill in the form:
   - **Plan Name**: e.g., "Royal HD"
   - **Price (₹)**: e.g., "349" (enter in rupees, not paise)
   - **Duration (days)**: e.g., "30"
   - **Channels**: Comma-separated list, e.g., "All HD Channels, Premium HD Quality, Sports HD, Movies HD"
   - **Mark as Popular**: Check if this should be highlighted
3. Click "Create Plan"

**How to Hide/Show a Plan:**
- Click "Hide" to remove from customer view
- Click "Show" to make visible to customers

### 3. Customers (`/admin/customers`)
**What you can do:**
- ✅ View all registered customers
- ✅ See customer details (name, mobile, STB number, area)
- ✅ View customer registration date
- ✅ Check customer status

**Customer Information Displayed:**
- Full Name
- Mobile Number
- STB (Set-Top Box) Number
- Area/Location
- Registration Date

### 4. Pending Activations (`/admin/pending`)
**What you can do:**
- ✅ View all pending recharges
- ✅ Activate recharges manually
- ✅ See customer and plan details
- ✅ Process payments

**How to Activate a Recharge:**
1. Go to Pending Activations page
2. Find the recharge request
3. Verify customer details
4. Click "Activate" button
5. Recharge is activated immediately

**Information Shown:**
- Customer Name
- Mobile Number
- STB Number
- Plan Name
- Amount Paid
- Order Date
- Razorpay Order ID (if paid online)

### 5. Recharge History (`/admin/recharges`)
**What you can do:**
- ✅ View all recharges (past and present)
- ✅ Filter by status (pending, activated, expired)
- ✅ See payment details
- ✅ Track revenue

**Recharge Statuses:**
- **Pending**: Waiting for activation
- **Activated**: Currently active
- **Expired**: Plan has ended
- **Failed**: Payment failed

---

## 🔒 Security Best Practices

### 1. Change Default Password
**IMPORTANT**: Change the default password immediately after first login!

```bash
npm run change-admin-password
```

Follow the prompts:
1. Enter username (default: admin)
2. Enter new password (min 6 characters)
3. Confirm new password

### 2. Use Strong Passwords
- Minimum 8 characters
- Mix of uppercase and lowercase
- Include numbers and special characters
- Don't use common words

### 3. Keep Credentials Safe
- Don't share admin credentials
- Don't write them down
- Use a password manager
- Change password regularly

### 4. Logout When Done
- Always logout after using admin panel
- Don't leave admin panel open on shared computers

---

## 📊 Common Admin Tasks

### Task 1: Add Royal HD Pack
1. Login to admin panel
2. Go to `/admin/plans`
3. Click "Add Plan"
4. Enter:
   - Name: `Royal HD`
   - Price: `349`
   - Duration: `30`
   - Channels: `All HD Channels, Premium HD Quality, Sports HD, Movies HD`
5. Click "Create Plan"

### Task 2: Activate a Customer Recharge
1. Go to `/admin/pending`
2. Find the customer's recharge
3. Verify details
4. Click "Activate"
5. Customer receives instant activation

### Task 3: Hide/Show a Plan
1. Go to `/admin/plans`
2. Find the plan
3. Click "Hide" to remove from customer view
4. Click "Show" to make it visible again

### Task 4: View Customer Details
1. Go to `/admin/customers`
2. Browse the customer list
3. View all customer information
4. Check registration dates

### Task 5: Check Revenue
1. Go to `/admin` (Dashboard)
2. View total recharges
3. See pending activations
4. Track customer growth

---

## 🛠️ Troubleshooting

### Issue 1: Can't Login
**Solutions:**
- Check username and password
- Ensure database is running
- Check if admin user exists in database
- Try resetting password with script

### Issue 2: Plans Not Showing
**Solutions:**
- Check if plan is marked as "Active"
- Verify plan was created successfully
- Refresh the page
- Check database connection

### Issue 3: Can't Activate Recharge
**Solutions:**
- Check if recharge is in "pending" status
- Verify customer exists
- Check database connection
- Look for error messages in console

### Issue 4: Forgot Admin Password
**Solution:**
Run the password reset script:
```bash
npm run change-admin-password
```

Or manually update in database:
```sql
-- Generate new password hash (for 'newpassword123')
-- Use bcrypt to hash, then update:
UPDATE admins 
SET password_hash = '$2a$10$...' 
WHERE username = 'admin';
```

---

## 📱 Mobile Access

The admin panel is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones

Access from any device with internet connection.

---

## 🔄 Admin Workflow

### Daily Tasks
1. **Morning**:
   - Login to admin panel
   - Check pending activations
   - Activate overnight recharges

2. **Throughout Day**:
   - Monitor new registrations
   - Process recharge requests
   - Respond to customer issues

3. **Evening**:
   - Review day's statistics
   - Check revenue
   - Plan for next day

### Weekly Tasks
- Review all plans
- Check customer growth
- Analyze popular plans
- Update plan offerings if needed

### Monthly Tasks
- Generate revenue reports
- Review customer retention
- Plan promotional offers
- Update channel lists

---

## 📞 Support

### For Technical Issues
- Check console for errors
- Review database logs
- Verify environment variables
- Check network connection

### For Business Questions
- Review customer feedback
- Analyze plan popularity
- Monitor competition
- Adjust pricing if needed

---

## 🎯 Quick Reference

### URLs
- **Admin Login**: `/admin/login`
- **Dashboard**: `/admin`
- **Plans**: `/admin/plans`
- **Customers**: `/admin/customers`
- **Pending**: `/admin/pending`
- **Recharges**: `/admin/recharges`

### Commands
```bash
# Change admin password
npm run change-admin-password

# Add Royal HD pack
npm run add-royal-hd

# Seed database (initial setup)
npm run db:seed

# Run migrations
npm run db:migrate
```

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN**

---

## 📝 Notes

1. **Always logout** when done
2. **Change default password** immediately
3. **Backup database** regularly
4. **Monitor pending activations** daily
5. **Keep plans updated** with latest offerings
6. **Respond to customers** promptly
7. **Track revenue** and growth
8. **Update channel lists** when broadcasters change

---

## ✅ Admin Checklist

### First Time Setup
- [ ] Login with default credentials
- [ ] Change admin password
- [ ] Add all plans (Basic, All-in-One, Royal HD, etc.)
- [ ] Test plan activation
- [ ] Verify customer registration works
- [ ] Test payment flow

### Daily Operations
- [ ] Check pending activations
- [ ] Activate recharges
- [ ] Monitor new customers
- [ ] Review any issues
- [ ] Update plans if needed

### Security
- [ ] Strong password set
- [ ] Logout after use
- [ ] No shared credentials
- [ ] Regular password changes
- [ ] Monitor admin access logs

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Production Ready
