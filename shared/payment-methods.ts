import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./schema";
import { createInsertSchema } from "drizzle-zod";

// Payment methods model
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  paymentMethodId: text("payment_method_id").notNull(), // Stripe payment method ID
  last4: text("last4"), // Last 4 digits of card
  brand: text("brand"), // Card brand (Visa, Mastercard, etc.)
  expiryMonth: integer("expiry_month"), // Card expiry month
  expiryYear: integer("expiry_year"), // Card expiry year
  isDefault: boolean("is_default").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  userId: true,
  paymentMethodId: true,
  last4: true,
  brand: true,
  expiryMonth: true,
  expiryYear: true,
  isDefault: true,
});

// Types
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof insertPaymentMethodSchema._type;