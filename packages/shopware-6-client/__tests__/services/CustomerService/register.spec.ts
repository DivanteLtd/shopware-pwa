import { name, address, datatype, phone, internet } from "faker";
import { register } from "@shopware-pwa/shopware-6-client";
import { getCustomerRegisterEndpoint } from "../../../src/endpoints";
import { defaultInstance } from "../../../src/apiService";
import { CustomerRegistrationParams } from "@shopware-pwa/commons/interfaces/request/CustomerRegistrationParams";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

let customerData: CustomerRegistrationParams;

describe("CustomerService - register", () => {
  const mockedPost = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      post: mockedPost,
    } as any;
    customerData = {
      salutationId: datatype.uuid(),
      firstName: name.firstName(),
      lastName: name.lastName(),
      password: internet.password(8),
      email: internet.email(),
      storefrontUrl: internet.domainName(),
      billingAddress: {
        countryId: datatype.uuid(),
        street: address.streetName(),
        zipcode: address.zipCode(),
        city: address.city(),
        phoneNumber: phone.phoneNumber(),
      },
    };
  });

  it("should register the new customer with basic data provided", async () => {
    const customerId = datatype.uuid();
    mockedPost.mockResolvedValueOnce({ data: customerId });
    const result = await register(customerData);
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      getCustomerRegisterEndpoint(),
      customerData
    );
    expect(result).toBe(customerId);
  });

  it("should never register a customer without billing address", async () => {
    const customerDataNew: any = {
      ...customerData,
      billingAddress: undefined,
    };

    mockedPost.mockRejectedValueOnce(new Error("400"));

    expect(register(customerDataNew)).rejects.toThrowError("400");
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      getCustomerRegisterEndpoint(),
      customerDataNew
    );
  });
});
