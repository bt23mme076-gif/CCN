import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const superAdmins = pgTable('super_admins', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const operators = pgTable('operators', {
  id: text('id').primaryKey(), // slug, e.g. 'ccn', 'reliancecable'
  name: text('name').notNull(), // display name
  business_name: text('business_name').notNull(),
  subdomain: text('subdomain').notNull().unique(), // ccn → ccn.yourdomain.com
  cashfree_vendor_id: text('cashfree_vendor_id'), // set after Easy Split KYC
  commission_percent: integer('commission_percent').notNull().default(10), // CCN's cut
  kyc_status: text('kyc_status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  status: text('status').notNull().default('active'), // 'active' | 'pending' | 'suspended'
  // Branding — shown on customer-facing pages for this operator's subdomain
  logo_url: text('logo_url'),
  primary_color: text('primary_color').default('#6366f1'), // hex color for buttons/accents
  tagline: text('tagline'),
  support_phone: text('support_phone'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  name: text('name').notNull(),
  mobile: text('mobile').notNull().unique(),
  stb_number: text('stb_number').notNull(),
  area: text('area').notNull(),
  pin_hash: text('pin_hash').notNull(),
  outstanding_balance: integer('outstanding_balance').default(0).notNull(), // in rupees, cash dues
  notes: text('notes'),
  fast_recharge_enabled: boolean('fast_recharge_enabled').default(false).notNull(),
  fast_recharge_amount: integer('fast_recharge_amount').default(0).notNull(), // in paise
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  name: text('name').notNull(),
  price: integer('price').notNull(), // in paise
  duration_days: integer('duration_days').notNull(),
  channels: text('channels').array().notNull(),
  is_popular: boolean('is_popular').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Additional STB connections for a customer (beyond their primary stb_number)
export const customerConnections = pgTable('customer_connections', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  stb_number: text('stb_number').notNull(),
  area: text('area').notNull().default(''),
  label: text('label'), // optional nickname e.g. "Home", "Office"
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('cust_conns_customer_id_idx').on(table.customer_id),
}));

export const recharges = pgTable('recharges', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  customer_id: text('customer_id').notNull().references(() => customers.id),
  // null = primary STB (customers.stb_number); set = additional connection
  connection_id: text('connection_id').references(() => customerConnections.id),
  plan_id: text('plan_id').references(() => plans.id),
  plan_name: text('plan_name').notNull(),
  duration_days: integer('duration_days'), // overrides plan's default duration when a multi-month recharge was bought
  amount: integer('amount').notNull(), // in paise
  status: text('status').notNull(), // 'pending' | 'paid' | 'activated' | 'failed'
  cashfree_order_id: text('cashfree_order_id'),
  cashfree_payment_id: text('cashfree_payment_id'),
  cashfree_signature: text('cashfree_signature'),
  paid_at: timestamp('paid_at'),
  activated_at: timestamp('activated_at'),
  activated_by: text('activated_by'),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('recharges_customer_id_idx').on(table.customer_id),
  statusIdx: index('recharges_status_idx').on(table.status),
}));

export const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  text: text('text').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  speed: integer('speed').default(30).notNull(), // seconds for one full scroll (lower = faster)
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Customer-specific plan price overrides
export const customerPriceOverrides = pgTable('customer_price_overrides', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  plan_id: text('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  custom_price: integer('custom_price').notNull(), // in paise
  note: text('note'), // optional admin note e.g. "Loyal customer discount"
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // /api/plans looks up overrides by customer_id on every logged-in page load.
  customerIdx: index('price_overrides_customer_id_idx').on(table.customer_id),
}));

// Customer-specific multi-month recharge discounts, set per plan per duration tier (3/6/12 months)
export const customerPlanDiscounts = pgTable('customer_plan_discounts', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  plan_id: text('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  months: integer('months').notNull(), // 3, 6, or 12
  discount_percent: integer('discount_percent').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('plan_discounts_customer_id_idx').on(table.customer_id),
  uniqueCombo: uniqueIndex('plan_discounts_customer_plan_months_idx').on(table.customer_id, table.plan_id, table.months),
}));

export const accessories = pgTable('accessories', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  name: text('name').notNull(),
  price: integer('price').notNull(), // in paise
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const advertisements = pgTable('advertisements', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  business_name: text('business_name').notNull(),
  image_data: text('image_data').notNull(), // base64 data URL or external https URL
  phone: text('phone'),
  is_active: boolean('is_active').default(true).notNull(),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const channels = pgTable('channels', {
  id: integer('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  name: text('name').notNull(),
  hd_sd: text('hd_sd').notNull(),
  genre: text('genre').notNull(),
  epg: integer('epg').notNull(),
  type: text('type').notNull(),
  mrp: integer('mrp').notNull(), // in paise
  price: integer('price').notNull(), // in paise
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});


export const accessoryOrders = pgTable('accessory_orders', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  customer_id: text('customer_id').notNull().references(() => customers.id),
  accessory_id: text('accessory_id').notNull().references(() => accessories.id),
  accessory_name: text('accessory_name').notNull(),
  amount: integer('amount').notNull(), // in paise
  status: text('status').notNull(), // 'pending' | 'paid' | 'delivered' | 'failed'
  cashfree_order_id: text('cashfree_order_id'),
  cashfree_payment_id: text('cashfree_payment_id'),
  cashfree_signature: text('cashfree_signature'),
  paid_at: timestamp('paid_at'),
  delivered_at: timestamp('delivered_at'),
  delivered_by: text('delivered_by'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('acc_orders_customer_id_idx').on(table.customer_id),
  statusIdx: index('acc_orders_status_idx').on(table.status),
}));

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('push_subs_customer_id_idx').on(table.customer_id),
}));

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  recharges: many(recharges),
  priceOverrides: many(customerPriceOverrides),
  accessoryOrders: many(accessoryOrders),
  connections: many(customerConnections),
}));

export const customerConnectionsRelations = relations(customerConnections, ({ one, many }) => ({
  customer: one(customers, { fields: [customerConnections.customer_id], references: [customers.id] }),
  recharges: many(recharges),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  recharges: many(recharges),
  priceOverrides: many(customerPriceOverrides),
}));

export const customerPriceOverridesRelations = relations(customerPriceOverrides, ({ one }) => ({
  customer: one(customers, { fields: [customerPriceOverrides.customer_id], references: [customers.id] }),
  plan: one(plans, { fields: [customerPriceOverrides.plan_id], references: [plans.id] }),
}));

export const rechargesRelations = relations(recharges, ({ one }) => ({
  customer: one(customers, { fields: [recharges.customer_id], references: [customers.id] }),
  connection: one(customerConnections, { fields: [recharges.connection_id], references: [customerConnections.id] }),
  plan: one(plans, { fields: [recharges.plan_id], references: [plans.id] }),
}));

export const accessoriesRelations = relations(accessories, ({ many }) => ({
  orders: many(accessoryOrders),
}));

export const accessoryOrdersRelations = relations(accessoryOrders, ({ one }) => ({
  customer: one(customers, {
    fields: [accessoryOrders.customer_id],
    references: [customers.id],
  }),
  accessory: one(accessories, {
    fields: [accessoryOrders.accessory_id],
    references: [accessories.id],
  }),
}));

export const retrackRequests = pgTable('retrack_requests', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  customer_name: text('customer_name').notNull(),
  stb_number: text('stb_number').notNull(),
  mobile: text('mobile').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'done'
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const adminPushSubscriptions = pgTable('admin_push_subscriptions', {
  id: text('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const settlements = pgTable('settlements', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  cashfree_settlement_id: text('cashfree_settlement_id'),
  amount_paise: integer('amount_paise').notNull(),
  settled_at: timestamp('settled_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const refunds = pgTable('refunds', {
  id: text('id').primaryKey(),
  recharge_id: text('recharge_id').references(() => recharges.id),
  operator_id: text('operator_id').references(() => operators.id),
  amount_paise: integer('amount_paise').notNull(),
  cashfree_refund_id: text('cashfree_refund_id'),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // 'pending' | 'processed' | 'failed'
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  name: text('name').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  operator_id: text('operator_id').references(() => operators.id),
  title: text('title').notNull(),
  amount: integer('amount').notNull(), // in rupees
  category: text('category').notNull(), // 'salary' | 'rent' | 'maintenance' | 'fuel' | 'other'
  employee_id: text('employee_id').references(() => employees.id),
  note: text('note'),
  date: timestamp('date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
