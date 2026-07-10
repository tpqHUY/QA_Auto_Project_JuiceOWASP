import { z } from 'zod';

/**
 * Response schemas for Juice Shop's REST API.
 *
 * Why schema validation (not just status-code checks): a 200 with a subtly
 * wrong body is still a bug. Parsing every response through zod turns "the
 * contract changed" into an immediate, readable test failure and gives us typed
 * data downstream for free.
 */

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  deluxePrice: z.number(),
  image: z.string(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductListResponseSchema = z.object({
  status: z.literal('success'),
  data: z.array(ProductSchema),
});

export const LoginResponseSchema = z.object({
  authentication: z.object({
    token: z.string().min(1),
    bid: z.number(),
    umail: z.string().email(),
  }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegisterResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    id: z.number(),
    email: z.string().email(),
    role: z.string(),
  }),
});

export const SecurityQuestionsResponseSchema = z.object({
  status: z.literal('success'),
  data: z.array(z.object({ id: z.number(), question: z.string() })).min(1),
});

/** A product row inside a basket carries its line quantity under `BasketItem`. */
export const BasketProductSchema = ProductSchema.extend({
  BasketItem: z.object({
    id: z.number(),
    ProductId: z.number(),
    BasketId: z.number(),
    quantity: z.number(),
  }),
});

export const BasketResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    id: z.number(),
    coupon: z.string().nullable(),
    Products: z.array(BasketProductSchema),
  }),
});
export type BasketResponse = z.infer<typeof BasketResponseSchema>;

export const BasketItemResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    id: z.number(),
    ProductId: z.number(),
    BasketId: z.union([z.number(), z.string()]),
    quantity: z.number(),
  }),
});

// ---- Checkout ----

export const AddressResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    id: z.number(),
    fullName: z.string(),
    mobileNum: z.number(),
    zipCode: z.string(),
    streetAddress: z.string(),
    city: z.string(),
    country: z.string(),
  }),
});

export const CardResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    id: z.number(),
    fullName: z.string(),
    // Juice Shop returns the card number as a number in the response body.
    cardNum: z.union([z.number(), z.string()]),
    expMonth: z.number(),
    expYear: z.number(),
  }),
});

export const DeliveryMethodSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  eta: z.number(),
});
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;

export const DeliveryListResponseSchema = z.object({
  status: z.literal('success'),
  data: z.array(DeliveryMethodSchema).min(1),
});

export const CheckoutResponseSchema = z.object({
  orderConfirmation: z.string().min(1),
});

/** Shape shared by /rest/track-order and /rest/order-history rows. */
export const OrderSchema = z.object({
  orderId: z.string(),
  totalPrice: z.number(),
  deliveryPrice: z.number(),
  eta: z.union([z.number(), z.string()]),
  products: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
      total: z.number(),
    })
  ),
});
export type Order = z.infer<typeof OrderSchema>;

export const OrderListResponseSchema = z.object({
  status: z.literal('success'),
  data: z.array(OrderSchema),
});
