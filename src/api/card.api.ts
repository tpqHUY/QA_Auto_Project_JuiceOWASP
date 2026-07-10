import type { APIResponse } from '@playwright/test';
import { BaseApi } from './base.api.js';
import { ENDPOINTS } from '../data/constants.js';
import { CardResponseSchema } from './schemas.js';
import type { PaymentCard } from '../data/types.js';

/**
 * Card API client. Used for API-first checkout setup: seeding a payment card is
 * far more robust than driving the payment form, whose expiry-year field is
 * constrained by Juice Shop's `expYear >= 2080` quirk (see MIN_CARD_EXP_YEAR).
 */
export class CardApi extends BaseApi {
  createRaw(card: PaymentCard): Promise<APIResponse> {
    return this.httpPost(ENDPOINTS.cards, {
      fullName: card.fullName,
      cardNum: card.cardNumber,
      expMonth: card.expiryMonth,
      expYear: card.expiryYear,
    });
  }

  /** Create a card and return its id (throws on failure). */
  async create(card: PaymentCard): Promise<number> {
    const res = await this.createRaw(card);
    if (!res.ok()) {
      throw new Error(`Create card failed (${res.status()}): ${await res.text()}`);
    }
    return CardResponseSchema.parse(await res.json()).data.id;
  }
}
