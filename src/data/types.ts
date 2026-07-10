/** Shared domain types produced by the data factories. */

export interface TestUser {
  email: string;
  password: string;
  securityQuestionId: number;
  securityAnswer: string;
}

export interface Address {
  fullName: string;
  mobileNumber: string;
  zipCode: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
}

export interface PaymentCard {
  fullName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
}
