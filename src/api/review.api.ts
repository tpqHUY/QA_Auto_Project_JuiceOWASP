import type { APIResponse } from '@playwright/test';
import { BaseApi } from './base.api.js';
import { ENDPOINTS } from '../data/constants.js';

/**
 * Product-review API client. Reads are public; adding a review needs a bearer
 * token (set via `setToken`). Returns raw responses so specs can assert status
 * codes and body shape.
 */
export class ReviewApi extends BaseApi {
  /** Read all reviews for a product. */
  getForProduct(productId: number | string): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.productReviews(productId));
  }

  /** Add a review to a product (requires auth). */
  add(
    productId: number | string,
    review: { message: string; author: string }
  ): Promise<APIResponse> {
    return this.httpPut(ENDPOINTS.productReviews(productId), review);
  }
}
