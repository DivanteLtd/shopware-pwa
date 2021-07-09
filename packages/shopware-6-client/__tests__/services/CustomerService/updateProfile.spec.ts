import { name, datatype } from "faker";
import { defaultInstance } from "../../../src/apiService";
import { updateProfile } from "@shopware-pwa/shopware-6-client";
import { getCustomerDetailsUpdateEndpoint } from "../../../src/endpoints";

const customerData = {
  salutationId: datatype.uuid(),
  firstName: name.firstName(),
  lastName: name.lastName(),
  title: "d",
};

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("CustomerService - updateProfile", () => {
  const mockedPost = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      post: mockedPost,
    } as any;
  });

  it("returns no data if successfully updated", async () => {
    mockedPost.mockResolvedValueOnce(null);
    const result = await updateProfile(customerData);

    expect(result).toBeFalsy();
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      getCustomerDetailsUpdateEndpoint(),
      customerData
    );
  });
});
