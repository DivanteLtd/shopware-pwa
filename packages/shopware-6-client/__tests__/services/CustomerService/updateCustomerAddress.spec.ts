import { address, name, datatype } from "faker";
import { updateCustomerAddress } from "@shopware-pwa/shopware-6-client";
import { defaultInstance } from "../../../src/apiService";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("CustomerService - updateCustomerAddress", () => {
  const newAddressData = {
    id: "some-address-id",
    countryId: datatype.uuid(),
    salutationId: datatype.uuid(),
    firstName: name.firstName(),
    lastName: name.lastName(),
    zipcode: address.zipCode(),
    city: address.city(),
    street: address.streetName(),
  };
  const mockedPatch = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      patch: mockedPatch,
    } as any;
  });

  it("should return created address id", async () => {
    mockedPatch.mockResolvedValueOnce({
      data: "2bbb89dfa4664bc581e80b37eaa80fb7",
    });
    const result = await updateCustomerAddress(newAddressData);
    expect(result).toEqual("2bbb89dfa4664bc581e80b37eaa80fb7");
    expect(mockedPatch).toBeCalledTimes(1);
    expect(mockedPatch).toBeCalledWith(
      "/store-api/account/address/some-address-id",
      newAddressData
    );
  });
});
