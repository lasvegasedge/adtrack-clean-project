import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { paymentMethods, insertPaymentMethodSchema } from "@shared/schema";
import { z } from "zod";

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;

export interface IPaymentStorage {
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]>;
  getDefaultPaymentMethod(userId: number): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;
  setDefaultPaymentMethod(id: number): Promise<boolean>;
  hasPaymentMethod(userId: number): Promise<boolean>;
}

export class DatabasePaymentStorage implements IPaymentStorage {
  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    // If this is the first payment method for this user, make it the default
    const existingPaymentMethods = await this.getPaymentMethodsByUserId(paymentMethod.userId);
    if (existingPaymentMethods.length === 0) {
      paymentMethod.isDefault = true;
    }

    // If this payment method is set to default, update all other payment methods
    if (paymentMethod.isDefault) {
      await db.update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, paymentMethod.userId));
    }

    const [newPaymentMethod] = await db
      .insert(paymentMethods)
      .values(paymentMethod)
      .returning();

    return newPaymentMethod;
  }

  async getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId));
  }

  async getDefaultPaymentMethod(userId: number): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isDefault, true)
        )
      );

    return paymentMethod;
  }

  async deletePaymentMethod(id: number): Promise<boolean> {
    const [deletedPaymentMethod] = await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .returning();

    // If we deleted the default payment method, set another one as default
    if (deletedPaymentMethod?.isDefault) {
      const userPaymentMethods = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, deletedPaymentMethod.userId));

      if (userPaymentMethods.length > 0) {
        await db
          .update(paymentMethods)
          .set({ isDefault: true })
          .where(eq(paymentMethods.id, userPaymentMethods[0].id));
      }
    }

    return !!deletedPaymentMethod;
  }

  async setDefaultPaymentMethod(id: number): Promise<boolean> {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id));

    if (!paymentMethod) {
      return false;
    }

    // Set all payment methods for this user to non-default
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, paymentMethod.userId));

    // Set the selected payment method as default
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(eq(paymentMethods.id, id))
      .returning();

    return !!updatedPaymentMethod;
  }

  async hasPaymentMethod(userId: number): Promise<boolean> {
    const paymentMethods = await this.getPaymentMethodsByUserId(userId);
    return paymentMethods.length > 0;
  }
}

export const paymentStorage = new DatabasePaymentStorage();