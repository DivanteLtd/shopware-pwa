import { address, name, datatype } from "faker";
import { createCustomerAddress } from "@shopware-pwa/shopware-6-client";
import { defaultInstance } from "../../../src/apiService";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("CustomerService - createCustomerAddress", () => {
  const newAddressData = {
    countryId: datatype.uuid(),
    salutationId: datatype.uuid(),
    firstName: name.firstName(),
    lastName: name.lastName(),
    zipcode: address.zipCode(),
    city: address.city(),
    street: address.streetName(),
  };
  const mockedPost = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      post: mockedPost,
    } as any;
  });

  it("should return created address id", async () => {
    mockedPost.mockResolvedValueOnce({
      data: "2bbb89dfa4664bc581e80b37eaa80fb7",
    });
    const result = await createCustomerAddress(newAddressData);
    expect(result).toEqual("2bbb89dfa4664bc581e80b37eaa80fb7");
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      "/store-api/account/address",
      newAddressData
    );
  });
});
