import type { APIResponse } from '@playwright/test';
import { BaseApi } from './base.api.js';
import { ENDPOINTS } from '../data/constants.js';
import { AddressResponseSchema } from './schemas.js';
import type { Address } from '../data/types.js';

/** Address API client (endpoint is Juice Shop's triple-`s` `/api/Addresss`). */
export class AddressApi extends BaseApi {
  createRaw(address: Address): Promise<APIResponse> {
    return this.httpPost(ENDPOINTS.addresses, {
      fullName: address.fullName,
      mobileNum: Number(address.mobileNumber), // API expects a numeric mobile
      zipCode: address.zipCode,
      streetAddress: address.streetAddress,
      city: address.city,
      state: address.state,
      country: address.country,
    });
  }

  /** Create an address and return its id (throws on failure). */
  async create(address: Address): Promise<number> {
    const res = await this.createRaw(address);
    if (!res.ok()) {
      throw new Error(`Create address failed (${res.status()}): ${await res.text()}`);
    }
    return AddressResponseSchema.parse(await res.json()).data.id;
  }

  listRaw(): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.addresses);
  }

  async list(): Promise<Array<{ id: number; fullName: string; streetAddress: string }>> {
    const res = await this.listRaw();
    return (await res.json()).data;
  }
}
