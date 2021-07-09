import { addPromotionCode } from "../../../src";
import { defaultInstance } from "../../../src/apiService";
import { datatype } from "faker";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("CartService - addPromotionCode", () => {
  const mockedPost = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      post: mockedPost,
    } as any;
  });

  it("should call valid endpoint and return a cart", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        name: datatype.uuid(),
        token: datatype.uuid(),
        price: {
          netPrice: 150,
        },
        lineItems: {
          type: "promotion",
          payload: {
            code: "3a64e872ca404522a2c5d43ebc751e6b",
          },
        },
      },
    });

    let promotionCode = "3a64e872ca404522a2c5d43ebc751e6b";

    const result = await addPromotionCode(promotionCode);
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [
        { referencedId: "3a64e872ca404522a2c5d43ebc751e6b", type: "promotion" },
      ],
    });
    expect(result.price.netPrice).toEqual(150);
  });

  it("should throw unhandled 404 error when empty promotion code given", async () => {
    mockedPost.mockRejectedValueOnce(new Error("404: Not Found"));

    let promotionCode = "";

    expect(addPromotionCode(promotionCode)).rejects.toThrow("404: Not Found");
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [{ referencedId: "", type: "promotion" }],
    });
  });
});
