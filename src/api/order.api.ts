import type { APIResponse } from '@playwright/test';
import { BaseApi } from './base.api.js';
import { ENDPOINTS } from '../data/constants.js';
import {
  CheckoutResponseSchema,
  DeliveryListResponseSchema,
  OrderListResponseSchema,
  type DeliveryMethod,
  type Order,
} from './schemas.js';

export interface OrderDetails {
  paymentId: number | string;
  addressId: number | string;
  deliveryMethodId: number;
}

/**
 * Order API client: delivery methods, placing an order, and reading orders back.
 * Powers both fast checkout setup and the "UI action → API verify" pattern —
 * after the UI places an order we read it here to confirm the backend agrees.
 */
export class OrderApi extends BaseApi {
  listDeliveryMethodsRaw(): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.deliveries);
  }

  async listDeliveryMethods(): Promise<DeliveryMethod[]> {
    const res = await this.listDeliveryMethodsRaw();
    return DeliveryListResponseSchema.parse(await res.json()).data;
  }

  checkoutRaw(bid: number | string, orderDetails: OrderDetails): Promise<APIResponse> {
    return this.httpPost(ENDPOINTS.checkout(bid), { couponData: null, orderDetails });
  }

  /** Place an order and return its confirmation id (throws on failure). */
  async checkout(bid: number | string, orderDetails: OrderDetails): Promise<string> {
    const res = await this.checkoutRaw(bid, orderDetails);
    if (!res.ok()) {
      throw new Error(`Checkout failed (${res.status()}): ${await res.text()}`);
    }
    return CheckoutResponseSchema.parse(await res.json()).orderConfirmation;
  }

  historyRaw(): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.orderHistory);
  }

  async history(): Promise<Order[]> {
    const res = await this.historyRaw();
    return OrderListResponseSchema.parse(await res.json()).data;
  }

  trackRaw(orderId: string): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.trackOrder(orderId));
  }

  /** Track a single order (returns the matching row, or undefined). */
  async track(orderId: string): Promise<Order | undefined> {
    const res = await this.trackRaw(orderId);
    const rows = OrderListResponseSchema.parse(await res.json()).data;
    return rows.find((o) => o.orderId === orderId) ?? rows[0];
  }

  /** Find an order in the user's history by confirmation id. */
  async findInHistory(orderId: string): Promise<Order | undefined> {
    return (await this.history()).find((o) => o.orderId === orderId);
  }
}
