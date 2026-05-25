import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
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
});

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

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  recharges: many(recharges),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  recharges: many(recharges),
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
