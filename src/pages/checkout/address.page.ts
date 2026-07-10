import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { ROUTES } from '../../data/constants.js';
import type { Address } from '../../data/types.js';

/**
 * The address step of checkout — covers both the select screen
 * (`/#/address/select`) and the create form (`/#/address/create`).
 *
 * The create-form inputs render with dynamic `mat-input-N` ids, so we locate
 * them by their (stable) placeholder text instead — confirmed via probe.
 */
export class AddressPage extends BasePage {
  readonly addNewAddressButton: Locator;
  readonly continueButton: Locator;
  readonly addressRows: Locator;
  readonly radios: Locator;
  // create form
  readonly countryInput: Locator;
  readonly nameInput: Locator;
  readonly mobileInput: Locator;
  readonly zipInput: Locator;
  readonly streetAddressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addNewAddressButton = page.locator('button[aria-label="Add a new address"]');
    // Label reads "payment selection" but this actually advances to delivery.
    this.continueButton = page.locator('button[aria-label="Proceed to payment selection"]');
    this.addressRows = page.locator('mat-row');
    this.radios = page.locator('mat-radio-button');
    this.countryInput = page.getByPlaceholder('Please provide a country.');
    this.nameInput = page.getByPlaceholder('Please provide a name.');
    this.mobileInput = page.getByPlaceholder('Please provide a mobile number.');
    this.zipInput = page.getByPlaceholder('Please provide a ZIP code.');
    this.streetAddressInput = page.locator('#address');
    this.cityInput = page.getByPlaceholder('Please provide a city.');
    this.stateInput = page.getByPlaceholder('Please provide a state.');
    this.submitButton = page.locator('#submitButton');
  }

  gotoSelect(): Promise<void> {
    return this.open(ROUTES.addressSelect);
  }

  async fillForm(address: Address): Promise<void> {
    await this.countryInput.fill(address.country);
    await this.nameInput.fill(address.fullName);
    await this.mobileInput.fill(address.mobileNumber);
    await this.zipInput.fill(address.zipCode);
    await this.streetAddressInput.fill(address.streetAddress);
    await this.cityInput.fill(address.city);
    await this.stateInput.fill(address.state);
  }

  /** From the select screen: open the form, fill it, submit, return to select. */
  async addNewAddress(address: Address): Promise<void> {
    await this.addNewAddressButton.click();
    await this.page.waitForURL(/address\/create/);
    await this.fillForm(address);
    await this.submitButton.click();
    await this.page.waitForURL(/address\/select/);
  }

  row(text: string): Locator {
    return this.addressRows.filter({ hasText: text });
  }

  async selectFirst(): Promise<void> {
    await this.radios.first().click();
  }

  async select(text: string): Promise<void> {
    await this.row(text).locator('mat-radio-button').click();
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
    await this.page.waitForURL(/delivery-method/);
  }
}
