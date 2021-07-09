import { Ref, ref } from "vue-demi";
import { ClientApiError } from "@shopware-pwa/commons/interfaces/errors/ApiError";

// Mock API client
import * as shopwareClient from "@shopware-pwa/shopware-6-client";
jest.mock("@shopware-pwa/shopware-6-client");
const mockedApiClient = shopwareClient as jest.Mocked<typeof shopwareClient>;

import * as Composables from "@shopware-pwa/composables";
jest.mock("@shopware-pwa/composables");
const mockedComposables = Composables as jest.Mocked<typeof Composables>;

const consoleErrorSpy = jest.spyOn(console, "error");

import { useUser } from "../src/hooks/useUser";
describe("Composables - useUser", () => {
  const stateUser: Ref<Object | null> = ref(null);
  const rootContextMock: any = {
    $shopwareApiInstance: jest.fn(),
  };

  const interceptMock = jest.fn();
  const broadcastMock = jest.fn();
  const refreshSessionContextMock = jest.fn();
  const refreshCartMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    stateUser.value = null;
    mockedComposables.useIntercept.mockImplementation(() => {
      return {
        broadcast: broadcastMock,
        intercept: interceptMock,
      } as any;
    });

    mockedComposables.useSessionContext.mockImplementation(() => {
      return {
        refreshSessionContext: refreshSessionContextMock,
      } as any;
    });

    mockedComposables.useSharedState.mockImplementation(() => {
      return {
        sharedRef: () => stateUser,
      } as any;
    });

    mockedComposables.useCart.mockImplementation(() => {
      return {
        refreshCart: refreshCartMock,
      } as any;
    });

    consoleErrorSpy.mockImplementationOnce(() => {});
  });

  describe("computed", () => {
    describe("user", () => {
      it("should return null when no user", () => {
        const { user } = useUser(rootContextMock);
        expect(user.value).toBeNull();
      });

      it("should return a proper user object", () => {
        stateUser.value = { id: "111" };
        const { user } = useUser(rootContextMock);
        expect(user.value).toEqual({ id: "111" });
      });
    });

    describe("isLoggedIn", () => {
      it("should return false when no user is set", () => {
        const { isLoggedIn } = useUser(rootContextMock);
        expect(isLoggedIn.value).toEqual(false);
      });

      it("should return true when user obnject is set", () => {
        stateUser.value = { id: "111" };
        const { isLoggedIn } = useUser(rootContextMock);
        expect(isLoggedIn.value).toEqual(true);
      });
    });
    describe("isCustomerSession", () => {
      it("should return false when user is not a guest", () => {
        stateUser.value = { id: "111", guest: true };
        const { isCustomerSession } = useUser(rootContextMock);
        expect(isCustomerSession.value).toEqual(false);
      });
      it("should return true if there is no user data in state", () => {
        stateUser.value = null;
        const { isCustomerSession } = useUser(rootContextMock);
        expect(isCustomerSession.value).toEqual(false);
      });
    });
    describe("isGuestSession", () => {
      it("should return true if user has a data and it's a guest", () => {
        stateUser.value = { id: "111", guest: true };
        const { isGuestSession } = useUser(rootContextMock);
        expect(isGuestSession.value).toEqual(true);
      });

      it("should return false if user has a data and it's not a guest", () => {
        stateUser.value = { id: "111", guest: false };
        const { isGuestSession } = useUser(rootContextMock);
        expect(isGuestSession.value).toEqual(false);
      });

      it("should return false if user is not logged in (have no customer data in state)", () => {
        stateUser.value = null;
        const { isGuestSession } = useUser(rootContextMock);
        expect(isGuestSession.value).toEqual(false);
      });
    });
  });

  describe("methods", () => {
    describe("onUserLogin", () => {
      it("should invoke an intercept function on onUserLogin event", async () => {
        const { onUserLogin } = useUser(rootContextMock);
        const callback = jest.fn();
        await onUserLogin(callback);
        expect(interceptMock).toBeCalledTimes(1);
      });
    });
    describe("onUserRegister", () => {
      it("should invoke an intercept function on onUserRegister event", async () => {
        const { onUserRegister } = useUser(rootContextMock);
        const callback = jest.fn();
        await onUserRegister(callback);
        expect(interceptMock).toBeCalledTimes(1);
      });
    });
    describe("onLogout", () => {
      it("should invoke an intercept function on onLogout event", async () => {
        const { onLogout } = useUser(rootContextMock);
        const callback = jest.fn();
        await onLogout(callback);

        expect(interceptMock).toBeCalledTimes(1);
      });
    });
    describe("refreshUser", () => {
      it("should set empty object customer when user is not logged in and false for loggedIn flag", async () => {
        mockedApiClient.getCustomer.mockResolvedValueOnce(null);
        const { user, refreshUser, isLoggedIn } = useUser(rootContextMock);
        await refreshUser();
        expect(user.value).toEqual({});
        expect(isLoggedIn.value).toEqual(false);
      });

      it("should get a customer when user is logged in", async () => {
        mockedApiClient.getCustomer.mockResolvedValueOnce({
          id: "123",
        } as any);
        const { user, refreshUser } = useUser(rootContextMock);
        await refreshUser();
        expect(user.value).toEqual({ id: "123" });
      });
      it("should set empty user on getCustomer request's rejection", async () => {
        mockedApiClient.getCustomer.mockRejectedValueOnce({
          message: "Some error",
        } as any);
        const { user, refreshUser, isLoggedIn } = useUser(rootContextMock);
        await refreshUser();
        expect(user.value).toEqual({});
        expect(stateUser.value).toEqual({});
        expect(isLoggedIn.value).toEqual(false);
        expect(consoleErrorSpy).toBeCalledWith("[useUser][refreshUser]", {
          message: "Some error",
        });
      });
    });
    describe("login", () => {
      it("should not login user without credentials", async () => {
        mockedApiClient.login.mockRejectedValueOnce({
          messages: [{ detail: "Provide username and password for login" }],
        } as any);
        const { isLoggedIn, errors, login } = useUser(rootContextMock);
        const result = await login(undefined as any);
        expect(result).toEqual(false);
        expect(isLoggedIn.value).toBeFalsy();
        expect(errors.login).toEqual([
          { detail: "Provide username and password for login" },
        ]);
      });

      it("should not login user with bad credentials", async () => {
        mockedApiClient.login.mockRejectedValueOnce({
          messages: [{ detail: "Bad user credentials" }],
        } as any);
        const { isLoggedIn, errors, login } = useUser(rootContextMock);
        const result = await login({
          username: "qwe@qwe.com",
          password: "fakePassword",
        });
        expect(result).toEqual(false);
        expect(isLoggedIn.value).toBeFalsy();
        expect(errors.login).toEqual([{ detail: "Bad user credentials" }]);
      });

      it("error message should be appriopriate to the 401 HTTP status code", async () => {
        mockedApiClient.login.mockRejectedValueOnce({
          response: {
            status: 401,
          },
        });
        const { errors, login } = useUser(rootContextMock);
        const result = await login({
          username: "qwe@qwe.com",
          password: "fakePassword",
        });
        expect(result).toEqual(false);
        expect(errors.login).toEqual(undefined);
      });

      it("should login user successfully", async () => {
        mockedApiClient.login.mockResolvedValueOnce({
          "sw-context-token": "qweqwe",
        } as any);
        mockedApiClient.getCustomer.mockResolvedValue({
          id: "123",
        } as any);
        const { isLoggedIn, error, login } = useUser(rootContextMock);
        const result = await login({
          username: "qwe@qwe.com",
          password: "correctPassword",
        });
        expect(result).toEqual(true);
        expect(isLoggedIn.value).toBeTruthy();
        expect(error.value).toBeFalsy();
      });

      it("should refresh cart after login", async () => {
        mockedApiClient.login.mockResolvedValueOnce({
          "sw-context-token": "qweqwe",
        } as any);
        mockedApiClient.getCustomer.mockResolvedValue({
          id: "123",
        } as any);
        const { login } = useUser(rootContextMock);
        await login({
          username: "qwe@qwe.com",
          password: "correctPassword",
        });
        expect(refreshCartMock).toBeCalled();
      });
    });

    describe("register", () => {
      it("should not invoke user register without any data", async () => {
        mockedApiClient.register.mockRejectedValueOnce({
          messages: [
            { detail: "Provide requested information to create user account" },
          ],
        } as any);
        const { isLoggedIn, errors, register } = useUser(rootContextMock);
        const result = await register(undefined as any);
        expect(result).toEqual(false);
        expect(isLoggedIn.value).toBeFalsy();
        expect(errors.register).toEqual([
          {
            detail: "Provide requested information to create user account",
          },
        ]);
      });
      it("should register user successfully", async () => {
        mockedApiClient.register.mockResolvedValueOnce({
          data: "mockedData",
        });
        const { errors, register } = useUser(rootContextMock);
        const result = await register({
          firstName: "qwe",
          lastName: "lastName",
          email: "qwe@qwe.com",
          password: "correctPassword",
          salutationId: "salutationId",
          billingAddress: {
            city: "anyCity",
            zipcode: "zip-code",
            countryId: "countryId",
            salutationId: "salutationId",
          },
        });
        expect(result).toBeTruthy();
        expect(errors.register).toEqual([]);
      });
      it("should register user successfully and set empty object on unknown response", async () => {
        mockedApiClient.register.mockResolvedValueOnce(undefined as any);
        const { register, user } = useUser(rootContextMock);
        await register({} as any);
        expect(user.value).toStrictEqual({});
      });

      it("should refresh session context after user registration", async () => {
        mockedApiClient.register.mockResolvedValueOnce(undefined as any);
        const { register } = useUser(rootContextMock);
        await register({} as any);
        expect(refreshSessionContextMock).toBeCalled();
      });
    });

    describe("logout", () => {
      it("should correctly logout user", async () => {
        stateUser.value = { id: "111" };
        mockedApiClient.logout.mockResolvedValueOnce({
          "sw-context-token": "qweqwe",
        } as any);
        mockedApiClient.getCustomer.mockResolvedValueOnce(null as any);
        const { isLoggedIn, error, logout } = useUser(rootContextMock);
        expect(isLoggedIn.value).toBeTruthy();
        await logout();
        expect(isLoggedIn.value).toBeFalsy();
        expect(error.value).toBeFalsy();
      });

      it("should refresh cart after logout", async () => {
        stateUser.value = { id: "111" };
        mockedApiClient.logout.mockResolvedValueOnce({
          "sw-context-token": "qweqwe",
        } as any);
        mockedApiClient.getCustomer.mockResolvedValueOnce(null as any);
        const { logout } = useUser(rootContextMock);
        await logout();
        expect(refreshCartMock).toBeCalled();
      });

      it("should show an error when user is not logged out", async () => {
        stateUser.value = { id: "111" };
        mockedApiClient.logout.mockRejectedValueOnce({
          messages: [{ detail: "Something wrong with logout" }],
        });
        mockedApiClient.getCustomer.mockResolvedValueOnce({
          id: "111",
        } as any);
        const { isLoggedIn, error, logout } = useUser(rootContextMock);
        expect(isLoggedIn.value).toBeTruthy();
        await logout();
        expect(isLoggedIn.value).toBeTruthy();
        expect(error.value).toEqual([
          { detail: "Something wrong with logout" },
        ]);
      });
    });

    describe("loadOrders", () => {
      it("should load customer's orders from different endpoint", async () => {
        const ordersResponse = [
          {
            id: "12345",
            orderNumber: "100123",
          },
        ];
        mockedApiClient.getCustomerOrders.mockResolvedValueOnce(
          ordersResponse as any
        );
        const { orders, loadOrders } = useUser(rootContextMock);
        expect(orders.value).toBeNull();
        await loadOrders();
        expect(orders.value).toHaveLength(1);
      });
    });

    describe("getOrderDetails", () => {
      it("should return order details for given orderId", async () => {
        const orderResponse = {
          id: "12345",
          orderNumber: "100123",
        };
        mockedApiClient.getCustomerOrderDetails.mockResolvedValueOnce(
          orderResponse as any
        );
        const { getOrderDetails } = useUser(rootContextMock);
        const orderDetails = await getOrderDetails("12345");
        expect(orderDetails).toBe(orderResponse);
      });
    });
    describe("updateAddress", () => {
      it("should invoke an endpoint to update an address and return true on success", async () => {
        mockedApiClient.updateCustomerAddress.mockResolvedValueOnce({
          id: "updated-id",
        } as any);
        const { updateAddress } = useUser(rootContextMock);
        const response = await updateAddress({
          id: "some-address-id",
          city: "Wrocław",
        });
        expect(mockedApiClient.updateCustomerAddress).toBeCalledTimes(1);
        expect(response).toBe("updated-id");
      });
      it("should invoke an endpoint to update an address and return false on fail", async () => {
        mockedApiClient.updateCustomerAddress.mockRejectedValueOnce(
          new Error("not ok")
        );
        const { updateAddress } = useUser(rootContextMock);
        const response = await updateAddress({
          id: "some-address-id",
          city: "Wrocław",
        });
        expect(mockedApiClient.updateCustomerAddress).toBeCalledTimes(1);
        expect(response).toBeUndefined();
      });
    });
    describe("addAddress", () => {
      it("should add address", async () => {
        mockedApiClient.createCustomerAddress.mockResolvedValueOnce({
          id: "added-id",
        } as any);
        const { addAddress } = useUser(rootContextMock);
        const response = await addAddress({ city: "Wrocław" });
        expect(mockedApiClient.createCustomerAddress).toBeCalledTimes(1);
        expect(response).toBe("added-id");
      });
      it("should not add empty address", async () => {
        mockedApiClient.createCustomerAddress.mockRejectedValueOnce({
          messages: [{ detail: "There is no address provided" }],
        } as ClientApiError);
        const { addAddress, error } = useUser(rootContextMock);
        const response = await addAddress(null as any);
        expect(mockedApiClient.createCustomerAddress).toBeCalledTimes(1);
        expect(response).toBeUndefined();
        expect(error.value).toEqual([
          { detail: "There is no address provided" },
        ]);
      });
    });

    describe("deleteAddress", () => {
      it("should invoke client deleteCustomerAddress method and return true on success", async () => {
        mockedApiClient.deleteCustomerAddress.mockResolvedValueOnce();
        const { deleteAddress } = useUser(rootContextMock);
        const response = await deleteAddress("address-1234");
        expect(mockedApiClient.deleteCustomerAddress).toBeCalledTimes(1);
        expect(response).toBe(true);
      });
      it("should invoke client deleteCustomerAddress method and return false on failure", async () => {
        mockedApiClient.deleteCustomerAddress.mockRejectedValueOnce(
          "Cannot delete the provided address"
        );
        const { deleteAddress } = useUser(rootContextMock);
        const response = await deleteAddress("address-unknown");
        expect(mockedApiClient.deleteCustomerAddress).toBeCalledTimes(1);
        expect(response).toBe(false);
      });
    });

    describe("loadAddresses", () => {
      it("should invoke client getCustomerAddresses method and assign given array to addresses ref", async () => {
        mockedApiClient.getCustomerAddresses.mockResolvedValue({
          elements: [
            {
              id: "addressId-12345",
            },
          ],
        } as any);
        const { addresses, loadAddresses, error } = useUser(rootContextMock);
        await loadAddresses();
        expect(mockedApiClient.getCustomerAddresses).toBeCalledTimes(1);
        expect(error.value).toBeFalsy();
        expect(addresses.value).toStrictEqual([
          {
            id: "addressId-12345",
          },
        ]);
      });

      it("should invoke client getCustomerAddresses method and assign undefined on falsy response", async () => {
        mockedApiClient.getCustomerAddresses.mockResolvedValue(
          undefined as any
        );
        const { addresses, loadAddresses, error } = useUser(rootContextMock);
        await loadAddresses();
        expect(mockedApiClient.getCustomerAddresses).toBeCalledTimes(1);
        expect(error.value).toBeFalsy();
        expect(addresses.value).toBeUndefined();
      });

      it("should invoke client getCustomerAddresses method and assign error message if client request is rejected", async () => {
        mockedApiClient.getCustomerAddresses.mockRejectedValueOnce({
          messages: [{ detail: "Something went wrong..." }],
        });
        const { loadAddresses, error } = useUser(rootContextMock);
        await loadAddresses();
        expect(mockedApiClient.getCustomerAddresses).toBeCalledTimes(1);
        expect(error.value).toStrictEqual([
          { detail: "Something went wrong..." },
        ]);
      });
    });

    describe("loadCountry", () => {
      it("should invoke client getUserCountry method which return country object", async () => {
        mockedApiClient.getUserCountry.mockResolvedValue([
          {
            name: "Poland",
            id: "12345",
          },
        ] as any);
        const { country, loadCountry, error } = useUser(rootContextMock);
        const userId = "123qwe";
        await loadCountry(userId);
        expect(mockedApiClient.getUserCountry).toBeCalledTimes(1);
        expect(error.value).toBeFalsy();
        expect(country.value).toStrictEqual([
          {
            name: "Poland",
            id: "12345",
          },
        ]);
      });

      it("should invoke client getUserCountry method and assign error message if client request is rejected", async () => {
        mockedApiClient.getUserCountry.mockRejectedValueOnce({
          messages: [{ detail: "Something went wrong..." }],
        });
        const { loadCountry, error } = useUser(rootContextMock);
        const salutationId = "123qwe";
        await loadCountry(salutationId);
        expect(mockedApiClient.getUserCountry).toBeCalledTimes(1);
        expect(error.value).toStrictEqual([
          { detail: "Something went wrong..." },
        ]);
      });
    });

    describe("loadSalutation", () => {
      it("should invoke client getUserSalutation method which return country object", async () => {
        mockedApiClient.getUserSalutation.mockResolvedValue([
          {
            name: "Mrs.",
            id: "12345",
          },
        ] as any);
        const { salutation, loadSalutation, error } = useUser(rootContextMock);
        const salutationId = "123qwe";
        await loadSalutation(salutationId);
        expect(mockedApiClient.getUserSalutation).toBeCalledTimes(1);
        expect(error.value).toBeFalsy();
        expect(salutation.value).toStrictEqual([
          {
            name: "Mrs.",
            id: "12345",
          },
        ]);
      });

      it("should invoke client getUserSalutation method and assign error message if client request is rejected", async () => {
        mockedApiClient.getUserSalutation.mockRejectedValueOnce({
          messages: [{ detail: "Something went wrong..." }],
        });
        const { loadSalutation, error } = useUser(rootContextMock);
        const userId = "123qwe";
        await loadSalutation(userId);
        expect(mockedApiClient.getUserSalutation).toBeCalledTimes(1);
        expect(error.value).toStrictEqual([
          { detail: "Something went wrong..." },
        ]);
      });
    });

    describe("markAddressAsDefault", () => {
      it("should invoke client setDefaultCustomerBillingAddress method and return true on success", async () => {
        mockedApiClient.setDefaultCustomerBillingAddress.mockResolvedValue(
          "address-1234"
        );
        const { markAddressAsDefault } = useUser(rootContextMock);
        const response = await markAddressAsDefault({
          addressId: "address-1234",
          type: "billing",
        } as any);
        expect(
          mockedApiClient.setDefaultCustomerBillingAddress
        ).toBeCalledTimes(1);
        expect(response).toBe(true);
      });

      it("should invoke client setDefaultCustomerShippingAddress method and return true on success", async () => {
        mockedApiClient.setDefaultCustomerShippingAddress.mockResolvedValue(
          "address-1234"
        );
        const { markAddressAsDefault } = useUser(rootContextMock);
        const response = await markAddressAsDefault({
          addressId: "address-1234",
          type: "shipping",
        } as any);
        expect(
          mockedApiClient.setDefaultCustomerShippingAddress
        ).toBeCalledTimes(1);
        expect(response).toBe(true);
      });

      it("should return false when no argument is provided", async () => {
        const { markAddressAsDefault } = useUser(rootContextMock);
        const response = await markAddressAsDefault({} as any);
        expect(response).toBe(false);
      });

      it("should return false when address type is unknown", async () => {
        const { markAddressAsDefault } = useUser(rootContextMock);
        const response = await markAddressAsDefault({
          type: "unknown",
          addressId: "someId",
        } as any);
        expect(response).toBe(false);
      });

      it("should return false and set the error.value on api-client rejection", async () => {
        mockedApiClient.setDefaultCustomerShippingAddress.mockRejectedValueOnce(
          {
            messages: [{ detail: "Error occured" }],
          }
        );
        const { markAddressAsDefault, error } = useUser(rootContextMock);
        const response = await markAddressAsDefault({
          type: "shipping",
          addressId: "someId",
        } as any);
        expect(
          mockedApiClient.setDefaultCustomerShippingAddress
        ).toBeCalledTimes(1);

        expect(response).toBe(false);
        expect(error.value).toStrictEqual([{ detail: "Error occured" }]);
      });
    });
    describe("updatePersonalInfo", () => {
      it("should invoke updateProfile api-client method and return true on success", async () => {
        mockedApiClient.updateProfile.mockImplementationOnce(async () =>
          Promise.resolve(undefined)
        );
        const { updatePersonalInfo } = useUser(rootContextMock);
        const response = await updatePersonalInfo({
          title: "some title",
          salutationId: "qweqwe",
          firstName: "qwe",
          lastName: "qew",
        });
        expect(mockedApiClient.updateProfile).toBeCalledTimes(1);
        expect(response).toBeTruthy();
      });
    });
    it("should return false and set the error.value on api-client on updateProfile rejection", async () => {
      mockedApiClient.updateProfile.mockImplementationOnce(async () =>
        Promise.reject("Incorrect user data")
      );
      const { updatePersonalInfo, error } = useUser(rootContextMock);
      const response = await updatePersonalInfo({
        title: "some title",
        salutationId: "",
        firstName: "qwe",
        lastName: "qew",
      });
      expect(mockedApiClient.updateProfile).toBeCalledTimes(1);
      expect(response).toBeFalsy();
      expect(error.value).toEqual("Incorrect user data");
    });
  });
  describe("updatePassword", () => {
    it("should invoke updatePassword api-client method and return true on success", async () => {
      mockedApiClient.updatePassword.mockImplementationOnce(async () =>
        Promise.resolve(undefined)
      );
      const { updatePassword } = useUser(rootContextMock);
      const response = await updatePassword({
        password: "qweqweqwe",
        newPassword: "qweqweqwe1",
        newPasswordConfirm: "qweqweqwe1",
      });
      expect(mockedApiClient.updatePassword).toBeCalledTimes(1);
      expect(response).toBeTruthy();
    });
    it("should return false and set the error.value on api-client on updatePassword rejection", async () => {
      mockedApiClient.updatePassword.mockRejectedValueOnce({
        messages: [{ detail: "Password must be at least 8 characters long" }],
      });
      const { updatePassword, errors } = useUser(rootContextMock);
      const response = await updatePassword({
        password: "qweqweqwe",
        newPassword: "qwe",
        newPasswordConfirm: "qwe",
      });
      expect(mockedApiClient.updatePassword).toBeCalledTimes(1);
      expect(response).toBeFalsy();
      expect(errors.updatePassword).toEqual([
        { detail: "Password must be at least 8 characters long" },
      ]);
    });
  });
  describe("resetPassword", () => {
    it("should invoke resetPassword api-client method and return true on success", async () => {
      mockedApiClient.resetPassword.mockImplementationOnce(async () =>
        Promise.resolve(undefined)
      );
      const { resetPassword } = useUser(rootContextMock);
      const response = await resetPassword({
        email: "qweqwe@qwe.com",
      });
      expect(mockedApiClient.resetPassword).toBeCalledTimes(1);
      expect(response).toBeTruthy();
    });
    it("should return false and set the error.value on api-client on resetPassword rejection", async () => {
      mockedApiClient.resetPassword.mockRejectedValueOnce({
        messages: [{ detail: "Email does not fit to any in Sales Channel" }],
      });
      const { resetPassword, errors } = useUser(rootContextMock);
      const response = await resetPassword({
        email: "qweqwe@qwe.com",
      });
      expect(mockedApiClient.resetPassword).toBeCalledTimes(1);
      expect(response).toBeFalsy();
      expect(errors.resetPassword).toEqual([
        { detail: "Email does not fit to any in Sales Channel" },
      ]);
    });
  });
  describe("updateEmail", () => {
    it("should invoke updateEmail api-client method and return true on success", async () => {
      mockedApiClient.updateEmail.mockImplementationOnce(async () =>
        Promise.resolve(undefined)
      );
      const { updateEmail } = useUser(rootContextMock);
      const response = await updateEmail({
        password: "qweqweqwe",
        email: "qweqwe@qwe.com",
        emailConfirmation: "qweqwe@qwe.com",
      });
      expect(mockedApiClient.updateEmail).toBeCalledTimes(1);
      expect(response).toBeTruthy();
    });
    it("should return false and set the error.value on api-client on updatePassword rejection", async () => {
      mockedApiClient.updateEmail.mockRejectedValueOnce({
        messages: [
          { detail: "Email confirmation does not match to the first one" },
        ],
      });

      const { updateEmail, errors } = useUser(rootContextMock);
      const response = await updateEmail({
        password: "qweqweqwe",
        email: "qweqwe@qwe.com",
        emailConfirmation: "qweqwe1@qwe.com",
      });
      expect(mockedApiClient.updateEmail).toBeCalledTimes(1);
      expect(response).toBeFalsy();
      expect(errors.updateEmail).toEqual([
        { detail: "Email confirmation does not match to the first one" },
      ]);
    });
  });
});
