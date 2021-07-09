import { addProductToCart } from "@shopware-pwa/shopware-6-client";
import { defaultInstance } from "../../../src/apiService";
import { datatype, commerce } from "faker";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("CartService - addProductToCart", () => {
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
        name: commerce.productName(),
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
            id: "044a190a54ab4f06803909c3ee8063ef",
            label: commerce.productName(),
            quantity: 5,
            payload: {
              productNumber: datatype.uuid(),
            },
          },
        ],
      },
    });

    let productId = "044a190a54ab4f06803909c3ee8063ef";

    const result = await addProductToCart(productId, 1);
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [
        {
          quantity: 1,
          referencedId: "044a190a54ab4f06803909c3ee8063ef",
          type: "product",
          id: "044a190a54ab4f06803909c3ee8063ef",
        },
      ],
    });

    expect(result.lineItems).toHaveLength(2);
  });

  it("should throw unhandled 400 error when non-existing productID given", async () => {
    mockedPost.mockRejectedValueOnce(new Error("400: FRAMEWORK__INVALID_UUID"));

    let productId = "someNonExistingProductId";

    expect(addProductToCart(productId, 1)).rejects.toThrow(
      "400: FRAMEWORK__INVALID_UUID"
    );
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      "/store-api/checkout/cart/line-item",

      {
        items: [
          {
            quantity: 1,
            referencedId: "someNonExistingProductId",
            type: "product",
            id: "someNonExistingProductId",
          },
        ],
      }
    );
  });

  it("should throw unhandled 404 error when empty productId given", async () => {
    mockedPost.mockRejectedValueOnce(new Error("404: Not Found"));

    let productId = "";

    expect(addProductToCart(productId, 2)).rejects.toThrow("404: Not Found");
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [
        {
          referencedId: "",
          type: "product",
          quantity: 2,
          id: "",
        },
      ],
    });
  });

  it("should send quantity 1 on 0 value", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          name: commerce.productName(),
        },
      },
    });
    await addProductToCart("qwe", 0);
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [
        {
          quantity: 1,
          referencedId: "qwe",
          type: "product",
          id: "qwe",
        },
      ],
    });
  });
});
