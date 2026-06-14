import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mobile: text('mobile').notNull().unique(),
  stb_number: text('stb_number').notNull(),
  area: text('area').notNull(),
  pin_hash: text('pin_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // in paise
  duration_days: integer('duration_days').notNull(),
  channels: text('channels').array().notNull(),
  is_popular: boolean('is_popular').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const recharges = pgTable('recharges', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull().references(() => customers.id),
  plan_id: text('plan_id').notNull().references(() => plans.id),
  plan_name: text('plan_name').notNull(),
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
  // Foreign keys do NOT get an index automatically. The dashboard history query
  // filters by customer_id and orders by created_at — index both to avoid
  // full table scans as recharge volume grows.
  customerIdx: index('recharges_customer_id_idx').on(table.customer_id),
  statusIdx: index('recharges_status_idx').on(table.status),
}));

export const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
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

export const accessories = pgTable('accessories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // in paise
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const accessoryOrders = pgTable('accessory_orders', {
  id: text('id').primaryKey(),
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

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  recharges: many(recharges),
  priceOverrides: many(customerPriceOverrides),
  accessoryOrders: many(accessoryOrders),
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
  customer: one(customers, {
    fields: [recharges.customer_id],
    references: [customers.id],
  }),
  plan: one(plans, {
    fields: [recharges.plan_id],
    references: [plans.id],
  }),
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
