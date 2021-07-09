import {
  getCustomerEndpoint,
  getCustomerAddressEndpoint,
  getCustomerUpdateEmailEndpoint,
  getCustomerRegisterEndpoint,
  getCustomerDetailsUpdateEndpoint,
  getCustomerUpdatePasswordEndpoint,
  getCustomerResetPasswordEndpoint,
  getCustomerDefaultBillingAddressEndpoint,
  getCustomerDefaultShippingAddressEndpoint,
  getCustomerLogoutEndpoint,
  getCustomerLoginEndpoint,
  getCustomerOrderEndpoint,
  getCustomerAddAddressEndpoint,
  getConfirmPasswordResetEndpoint,
} from "../endpoints";
import { Customer } from "@shopware-pwa/commons/interfaces/models/checkout/customer/Customer";
import { defaultInstance, ShopwareApiInstance } from "../apiService";
import { CustomerAddress } from "@shopware-pwa/commons/interfaces/models/checkout/customer/CustomerAddress";
import { CustomerRegistrationParams } from "@shopware-pwa/commons/interfaces/request/CustomerRegistrationParams";
import { ContextTokenResponse } from "@shopware-pwa/commons/interfaces/response/SessionContext";
import { Order } from "@shopware-pwa/commons/interfaces/models/checkout/order/Order";
import { EntityResult } from "@shopware-pwa/commons/interfaces/response/EntityResult";

/**
 * @beta
 */
export interface CustomerRegisterResponse {
  data: string;
}

/**
 * Register a customer
 *
 * @throws ClientApiError
 * @beta
 */
export async function register(
  params: CustomerRegistrationParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<CustomerRegisterResponse> {
  const resp = await contextInstance.invoke.post(
    getCustomerRegisterEndpoint(),
    params
  );
  return resp.data;
}

/**
 * Login user to shopware instance.
 *
 * @throws ClientApiError
 * @beta
 */
export async function login(
  { username, password }: { username?: string; password?: string } = {},
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<ContextTokenResponse> {
  const resp = await contextInstance.invoke.post(getCustomerLoginEndpoint(), {
    username,
    password,
  });
  const contextToken =
    resp.data["sw-context-token"] || resp.data["contextToken"];
  return { contextToken };
}

/**
 * End up the user session.
 *
 * @throws ClientApiError
 * @beta
 */
export async function logout(
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {
  await contextInstance.invoke.post(getCustomerLogoutEndpoint());
}

/**
 * Get customer's object
 *
 * @throws ClientApiError
 * @beta
 */
export async function getCustomer(
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<Customer | null> {
  try {
    // TODO: implement generic parameter converter for GET query string; related issue #568
    const resp = await contextInstance.invoke.get(`${getCustomerEndpoint()}`, {
      params: "associations[salutation][]",
    });
    return resp.data;
  } catch (e) {
    if (e.statusCode === 403) return null;
    throw new Error("Unexpected getCustomerResponse. " + e);
  }
}

/**
 * Get all customer's addresses
 *
 * @throws ClientApiError
 * @beta
 */
export async function getCustomerAddresses(
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<EntityResult<"customer_address", CustomerAddress[]>> {
  const resp = await contextInstance.invoke.get(getCustomerAddressEndpoint());
  return resp.data;
}

/**
 * Get all customer's orders
 *
 * @throws ClientApiError
 * @beta
 */
export async function getCustomerOrders(
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<Order[]> {
  const resp = await contextInstance.invoke.get(getCustomerOrderEndpoint(), {
    params: {
      sort: "-createdAt",
    },
  });
  return resp.data.orders?.elements || [];
}

/**
 * Get order details
 *
 * @throws ClientApiError
 * @beta
 */
export async function getCustomerOrderDetails(
  orderId: string,
  contextInstance: ShopwareApiInstance = defaultInstance,
  additionalQueryParams?: string
): Promise<Order | undefined> {
  if (!orderId) {
    return;
  }

  const resp = await contextInstance.invoke.get(getCustomerOrderEndpoint(), {
    // TODO: move into plain Object after https://github.com/DivanteLtd/shopware-pwa/issues/911 is merged
    params: additionalQueryParams
      ? `filter[id]=${orderId}&${additionalQueryParams}`
      : `sort=-transactions.createdAt&limit=1&filter[id]=${orderId}&associations[lineItems][]&associations[addresses][]&associations[transactions][associations][paymentMethod][]&associations[deliveries][associations][shippingMethod][]`,
  });
  return resp.data.orders?.elements?.[0];
}

/**
 * Get the customer's address by id
 *
 * @throws ClientApiError
 * @beta
 */
export async function getCustomerAddress(
  addressId: string,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<CustomerAddress> {
  const resp = await contextInstance.invoke.get(
    getCustomerAddressEndpoint(addressId)
  );
  return resp.data.data;
}

/**
 * Create an address and respond the new address's id
 *
 * @throws ClientApiError
 * @beta
 */
export async function createCustomerAddress(
  params: Partial<CustomerAddress>,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<CustomerAddress> {
  const resp = await contextInstance.invoke.post(
    getCustomerAddAddressEndpoint(),
    params
  );
  return resp.data;
}

/**
 * Update an address for specific ID
 *
 * @throws ClientApiError
 * @beta
 */
export async function updateCustomerAddress(
  params: Partial<CustomerAddress>,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<CustomerAddress> {
  const resp = await contextInstance.invoke.patch(
    getCustomerAddressEndpoint(params.id),
    params
  );
  return resp.data;
}

/**
 * Delete's the customer's address by id
 *
 * @throws ClientApiError
 * @beta
 */
export async function deleteCustomerAddress(
  addressId: string,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {
  await contextInstance.invoke.delete(getCustomerAddressEndpoint(addressId));
}

/**
 * Set address as default
 *
 * @throws ClientApiError
 * @beta
 */
export async function setDefaultCustomerBillingAddress(
  addressId: string,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<string> {
  const response = await contextInstance.invoke.patch(
    getCustomerDefaultBillingAddressEndpoint(addressId)
  );
  return response.data;
}

/**
 * Set address as default
 *
 * @throws ClientApiError
 * @beta
 */
export async function setDefaultCustomerShippingAddress(
  addressId: string,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<string> {
  const response = await contextInstance.invoke.patch(
    getCustomerDefaultShippingAddressEndpoint(addressId)
  );
  return response.data;
}

/**
 * @beta
 */
export interface CustomerUpdateEmailParam {
  email: string;
  emailConfirmation: string;
  password: string;
}

/**
 * Update a customer's email
 *
 * @throws ClientApiError
 * @beta
 */
export async function updateEmail(
  params: CustomerUpdateEmailParam,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {
  await contextInstance.invoke.post(getCustomerUpdateEmailEndpoint(), params);
}

/**
 * @beta
 */
export interface CustomerUpdatePasswordParam {
  password: string;
  newPassword: string;
  newPasswordConfirm: string;
}

/**
 * Update a customer's password
 *
 * @throws ClientApiError
 * @beta
 */
export async function updatePassword(
  params: CustomerUpdatePasswordParam,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {
  await contextInstance.invoke.post(
    getCustomerUpdatePasswordEndpoint(),
    params
  );
}

/**
 * @beta
 */
export interface CustomerResetPasswordParam {
  email: string;
  storefrontUrl?: string;
}

/**
 * Reset a customer's password
 *
 * @throws ClientApiError
 * @beta
 */
export async function resetPassword(
  params: CustomerResetPasswordParam,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {
  if (params && !params.storefrontUrl) {
    params.storefrontUrl = contextInstance.config.endpoint;
  }

  await contextInstance.invoke.post(getCustomerResetPasswordEndpoint(), params);
}

/**
 * Confirm a customer's password reset. Set new password for account.
 *
 * @throws ClientApiError
 * @beta
 */
export async function confirmPasswordReset(
  params: {
    newPassword: string;
    hash: string;
    [key: string]: unknown; // additional params
  },
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {
  if (!params) return;
  await contextInstance.invoke.post(getConfirmPasswordResetEndpoint(), {
    newPasswordConfirm: params.newPassword,
    ...params,
  });
}

/**
 * @beta
 */
export interface CustomerUpdateProfileParam {
  firstName: string;
  lastName: string;
  salutationId: string;
  title: string | null;
}

/**
 * Update a customer's profile data
 *
 * @throws ClientApiError
 * @beta
 */
export async function updateProfile(
  params: CustomerUpdateProfileParam,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<void> {
  await contextInstance.invoke.post(getCustomerDetailsUpdateEndpoint(), params);
}
