import { ref, Ref, UnwrapRef, computed, ComputedRef, reactive } from "vue-demi";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  updatePassword as apiUpdatePassword,
  resetPassword as apiResetPassword,
  updateEmail as apiUpdateEmail,
  getCustomer,
  getCustomerOrders,
  getCustomerOrderDetails,
  getCustomerAddresses,
  getUserCountry,
  getUserSalutation,
  setDefaultCustomerBillingAddress,
  setDefaultCustomerShippingAddress,
  deleteCustomerAddress,
  createCustomerAddress,
  updateProfile,
  CustomerUpdateProfileParam,
  CustomerUpdatePasswordParam,
  CustomerUpdateEmailParam,
  CustomerResetPasswordParam,
  updateCustomerAddress,
} from "@shopware-pwa/shopware-6-client";
import { Customer } from "@shopware-pwa/commons/interfaces/models/checkout/customer/Customer";
import { Order } from "@shopware-pwa/commons/interfaces/models/checkout/order/Order";
import {
  CustomerAddress,
  AddressType,
} from "@shopware-pwa/commons/interfaces/models/checkout/customer/CustomerAddress";
import { CustomerRegistrationParams } from "@shopware-pwa/commons/interfaces/request/CustomerRegistrationParams";
import {
  ClientApiError,
  ShopwareError,
} from "@shopware-pwa/commons/interfaces/errors/ApiError";
import { Country } from "@shopware-pwa/commons/interfaces/models/system/country/Country";
import { Salutation } from "@shopware-pwa/commons/interfaces/models/system/salutation/Salutation";
import {
  IInterceptorCallbackFunction,
  INTERCEPTOR_KEYS,
  useIntercept,
  useSharedState,
  useSessionContext,
  useCart,
} from "@shopware-pwa/composables";
import { ApplicationVueContext, getApplicationContext } from "../appContext";

/**
 * interface for {@link useUser} composable
 *
 * @beta
 */
export interface IUseUser {
  login: ({
    username,
    password,
  }: {
    username?: string;
    password?: string;
  }) => Promise<boolean>;
  register: ({}: CustomerRegistrationParams) => Promise<boolean>;
  user: ComputedRef<Partial<Customer> | null>;
  orders: Ref<Order[] | null>;
  addresses: Ref<CustomerAddress[] | null>;
  loading: Ref<boolean>;
  error: Ref<any>;
  errors: UnwrapRef<{
    login: ShopwareError[];
    register: ShopwareError[];
    resetPassword: ShopwareError[];
    updatePassword: ShopwareError[];
    updateEmail: ShopwareError[];
  }>;
  isLoggedIn: ComputedRef<boolean>;
  isCustomerSession: ComputedRef<boolean>;
  isGuestSession: ComputedRef<boolean>;
  country: Ref<Country | null>;
  salutation: Ref<Salutation | null>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  loadOrders: () => Promise<void>;
  getOrderDetails: (orderId: string) => Promise<Order | undefined>;
  loadAddresses: () => Promise<void>;
  loadCountry: (countryId: string) => Promise<void>;
  loadSalutation: (salutationId: string) => Promise<void>;
  addAddress: (params: Partial<CustomerAddress>) => Promise<string | undefined>;
  updateAddress: (
    params: Partial<CustomerAddress>
  ) => Promise<string | undefined>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  updatePersonalInfo: (
    personals: CustomerUpdateProfileParam
  ) => Promise<boolean>;
  updateEmail: (updateEmailData: CustomerUpdateEmailParam) => Promise<boolean>;
  updatePassword: (
    updatePasswordData: CustomerUpdatePasswordParam
  ) => Promise<boolean>;
  resetPassword: (
    resetPasswordData: CustomerResetPasswordParam
  ) => Promise<boolean>;
  markAddressAsDefault: ({
    addressId,
    type,
  }: {
    addressId?: string;
    type?: AddressType;
  }) => Promise<string | boolean>;
  /**
   * React on user logout
   */
  onLogout: (fn: () => void) => void;
  onUserLogin: (fn: (params: { customer: Customer }) => void) => void;
  onUserRegister: (fn: () => void) => void;
}

/**
 * Composable for user management. Options - {@link IUseUser}
 *
 * @beta
 */
export const useUser = (rootContext: ApplicationVueContext): IUseUser => {
  const { contextName, apiInstance } = getApplicationContext(
    rootContext,
    "useUser"
  );
  const { broadcast, intercept } = useIntercept(rootContext);
  const { refreshSessionContext } = useSessionContext(rootContext);
  const { refreshCart } = useCart(rootContext);

  const { sharedRef } = useSharedState(rootContext);
  const storeUser = sharedRef<Partial<Customer>>(`${contextName}-user`);
  const storeAddresses = sharedRef<CustomerAddress[]>(
    `${contextName}-addresses`
  );

  const loading: Ref<boolean> = ref(false);
  const error: Ref<any> = ref(null);
  const errors: UnwrapRef<{
    login: ShopwareError[];
    register: ShopwareError[];
    resetPassword: ShopwareError[];
    updatePassword: ShopwareError[];
    updateEmail: ShopwareError[];
  }> = reactive({
    login: [],
    register: [],
    resetPassword: [],
    updatePassword: [],
    updateEmail: [],
  });
  const orders: Ref<Order[] | null> = ref(null);
  const addresses = computed(() => storeAddresses.value);
  const country: Ref<Country | null> = ref(null);
  const salutation: Ref<Salutation | null> = ref(null);
  const user = computed(() => storeUser.value);

  const login = async ({
    username,
    password,
  }: { username?: string; password?: string } = {}): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    errors.login = [] as any;
    try {
      await apiLogin({ username, password }, apiInstance);
      await refreshUser();
      broadcast(INTERCEPTOR_KEYS.USER_LOGIN, {
        user: user.value,
      });
      return true;
    } catch (e) {
      const err: ClientApiError = e;
      errors.login = err.messages;
      broadcast(INTERCEPTOR_KEYS.ERROR, {
        methodName: `[${contextName}][login]`,
        inputParams: {},
        error: err,
      });
      return false;
    } finally {
      loading.value = false;
      await refreshUser();
      await refreshCart();
    }
  };

  const register = async (
    params: CustomerRegistrationParams
  ): Promise<boolean> => {
    loading.value = true;
    errors.register = [];
    try {
      const userObject = await apiRegister(params, apiInstance);
      broadcast(INTERCEPTOR_KEYS.USER_REGISTER);
      storeUser.value = (userObject as any) || {}; // TODO change returning tyoe to customer
      refreshSessionContext();
      return true;
    } catch (e) {
      const err: ClientApiError = e;
      // temporary workaround - get rid of such hacks in the future
      // TODO: https://github.com/vuestorefront/shopware-pwa/issues/1498
      errors.register = err.messages;
      broadcast(INTERCEPTOR_KEYS.ERROR, {
        methodName: `[${contextName}][register]`,
        inputParams: {},
        error: err,
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiLogout(apiInstance);
      broadcast(INTERCEPTOR_KEYS.USER_LOGOUT);
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
      broadcast(INTERCEPTOR_KEYS.ERROR, {
        methodName: `[${contextName}][logout]`,
        inputParams: {},
        error: err,
      });
    } finally {
      await refreshUser();
      await refreshCart();
    }
  };
  const onLogout = (fn: IInterceptorCallbackFunction) =>
    intercept(INTERCEPTOR_KEYS.USER_LOGOUT, fn);

  const onUserLogin = (fn: IInterceptorCallbackFunction) =>
    intercept(INTERCEPTOR_KEYS.USER_LOGIN, fn);

  const onUserRegister = (fn: IInterceptorCallbackFunction) =>
    intercept(INTERCEPTOR_KEYS.USER_REGISTER, fn);

  const refreshUser = async (): Promise<void> => {
    try {
      const user = await getCustomer(apiInstance);
      storeUser.value = user || {};
    } catch (e) {
      storeUser.value = {};
      console.error("[useUser][refreshUser]", e);
    }
  };

  const loadOrders = async (): Promise<void> => {
    const fetchedOrders = await getCustomerOrders(apiInstance);
    orders.value = fetchedOrders;
  };

  const getOrderDetails = async (orderId: string): Promise<Order | undefined> =>
    getCustomerOrderDetails(orderId, apiInstance);

  const loadAddresses = async (): Promise<void> => {
    try {
      const response = await getCustomerAddresses(apiInstance);
      storeAddresses.value = response?.elements;
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
    }
  };

  const loadCountry = async (userId: string): Promise<void> => {
    try {
      country.value = await getUserCountry(userId, apiInstance);
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
    }
  };

  const loadSalutation = async (salutationId: string): Promise<void> => {
    try {
      salutation.value = await getUserSalutation(salutationId, apiInstance);
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
    }
  };

  const markAddressAsDefault = async ({
    addressId,
    type,
  }: {
    addressId?: string;
    type?: AddressType;
  }): Promise<boolean> => {
    if (!addressId || !type) {
      return false;
    }

    try {
      switch (type) {
        case AddressType.billing:
          await setDefaultCustomerBillingAddress(addressId, apiInstance);
          break;
        case AddressType.shipping:
          await setDefaultCustomerShippingAddress(addressId, apiInstance);
          break;
        default:
          return false;
      }
      await refreshUser();
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
      return false;
    }

    return true;
  };

  const updateAddress = async (
    params: Partial<CustomerAddress>
  ): Promise<string | undefined> => {
    try {
      const { id } = await updateCustomerAddress(params, apiInstance);
      return id;
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
    }
  };

  const addAddress = async (
    params: Partial<CustomerAddress>
  ): Promise<string | undefined> => {
    try {
      const { id } = await createCustomerAddress(params, apiInstance);
      return id;
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
    }
  };

  const deleteAddress = async (addressId: string): Promise<boolean> => {
    try {
      await deleteCustomerAddress(addressId, apiInstance);
      return true;
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
    }

    return false;
  };

  const updatePersonalInfo = async (
    personals: CustomerUpdateProfileParam
  ): Promise<boolean> => {
    try {
      await updateProfile(personals, apiInstance);
    } catch (e) {
      error.value = e;
      return false;
    }
    return true;
  };

  const updatePassword = async (
    updatePasswordData: CustomerUpdatePasswordParam
  ): Promise<boolean> => {
    try {
      errors.updatePassword = [];
      await apiUpdatePassword(updatePasswordData, apiInstance);
    } catch (e) {
      errors.updatePassword = e.messages;
      return false;
    }
    return true;
  };

  const resetPassword = async (
    resetPasswordData: CustomerResetPasswordParam
  ): Promise<boolean> => {
    try {
      await apiResetPassword(resetPasswordData, apiInstance);
    } catch (e) {
      errors.resetPassword = e.messages;
      return false;
    }
    return true;
  };

  const updateEmail = async (
    updateEmailData: CustomerUpdateEmailParam
  ): Promise<boolean> => {
    try {
      await apiUpdateEmail(updateEmailData, apiInstance);
    } catch (e) {
      errors.updateEmail = e.messages;
      return false;
    }
    return true;
  };

  const isLoggedIn = computed(() => !!user.value?.id);
  const isCustomerSession = computed(
    () => !!user.value?.id && !user.value.guest
  );
  const isGuestSession = computed(() => !!user.value?.guest);

  return {
    login,
    register,
    user,
    error,
    loading,
    isLoggedIn,
    isCustomerSession,
    isGuestSession,
    refreshUser,
    logout,
    orders,
    loadOrders,
    getOrderDetails,
    loadAddresses,
    addresses,
    markAddressAsDefault,
    updateEmail,
    updatePersonalInfo,
    updatePassword,
    resetPassword,
    addAddress,
    updateAddress,
    deleteAddress,
    loadSalutation,
    salutation,
    loadCountry,
    country,
    errors,
    onLogout,
    onUserLogin,
    onUserRegister,
  };
};
