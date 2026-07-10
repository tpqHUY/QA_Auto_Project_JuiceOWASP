import type { APIResponse } from '@playwright/test';
import { BaseApi } from './base.api.js';
import { ENDPOINTS } from '../data/constants.js';
import { BasketResponseSchema, type BasketResponse } from './schemas.js';

/**
 * Basket API client. Two roles:
 *  - Fast setup: seed a basket before a checkout UI test.
 *  - Verification: the "UI action → API verify state" pattern — after the UI
 *    adds/removes an item, we read the basket here to assert the backend agrees.
 */
export class BasketApi extends BaseApi {
  getRaw(basketId: number | string): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.basket(basketId));
  }

  async get(basketId: number | string): Promise<BasketResponse['data']> {
    const res = await this.getRaw(basketId);
    return BasketResponseSchema.parse(await res.json()).data;
  }

  addItemRaw(basketId: number | string, productId: number, quantity = 1): Promise<APIResponse> {
    return this.httpPost(ENDPOINTS.basketItems, {
      ProductId: productId,
      BasketId: String(basketId),
      quantity,
    });
  }

  removeItemRaw(basketItemId: number): Promise<APIResponse> {
    return this.httpDelete(ENDPOINTS.basketItem(basketItemId));
  }

  /** Total quantity of a given product currently in the basket (0 if absent). */
  async quantityOf(basketId: number | string, productId: number): Promise<number> {
    const basket = await this.get(basketId);
    const line = basket.Products.find((p) => p.id === productId);
    return line?.BasketItem.quantity ?? 0;
  }

  /** Number of distinct line items in the basket. */
  async lineCount(basketId: number | string): Promise<number> {
    const basket = await this.get(basketId);
    return basket.Products.length;
  }
}
