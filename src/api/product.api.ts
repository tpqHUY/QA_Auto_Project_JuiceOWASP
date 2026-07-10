import type { APIResponse } from '@playwright/test';
import { BaseApi } from './base.api.js';
import { ENDPOINTS } from '../data/constants.js';
import { ProductListResponseSchema, type Product } from './schemas.js';

/** Products API client — list, get-by-id, and search. */
export class ProductApi extends BaseApi {
  listRaw(): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.products);
  }

  async list(): Promise<Product[]> {
    const res = await this.listRaw();
    return ProductListResponseSchema.parse(await res.json()).data;
  }

  searchRaw(query: string): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.productSearch, { q: query });
  }

  async search(query: string): Promise<Product[]> {
    const res = await this.searchRaw(query);
    return ProductListResponseSchema.parse(await res.json()).data;
  }

  /** Fetch a single product by id (returns undefined if not found). */
  async getById(id: number): Promise<Product | undefined> {
    const all = await this.list();
    return all.find((p) => p.id === id);
  }

  /** Convenience: the first product in the catalog (stable = Apple Juice). */
  async first(): Promise<Product> {
    const [first] = await this.list();
    if (!first) throw new Error('Product catalog is empty');
    return first;
  }
}
