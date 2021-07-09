import { getCart } from "@shopware-pwa/shopware-6-client";
import { defaultInstance } from "../../../src/apiService";
import { datatype, commerce } from "faker";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("CartService - getCart", () => {
  const mockedGet = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      get: mockedGet,
    } as any;
  });
  it("should return existing cart object", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          name: datatype.uuid(),
          token: datatype.uuid(),
          lineItems: [
            {
              id: datatype.uuid(),
              label: commerce.productName(),
              quantity: 5,
              payload: {
                productNumber: datatype.uuid(),
              },
            },
            {
              id: datatype.uuid(),
              label: commerce.productName(),
              quantity: 3,
              payload: {
                productNumber: datatype.uuid(),
              },
            },
          ],
        },
      },
    });

    const result = await getCart();
    expect(mockedGet).toBeCalledTimes(1);
    expect(mockedGet).toBeCalledWith("/store-api/checkout/cart");
    expect(result.lineItems).not.toBeNull();
  });
});
