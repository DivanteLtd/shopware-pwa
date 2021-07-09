import { changeCartItemQuantity } from "@shopware-pwa/shopware-6-client";
import { defaultInstance } from "../../../src/apiService";
import { datatype, commerce } from "faker";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("CartService - changeCartItemQuantity", () => {
  const mockedPatch = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      patch: mockedPatch,
    } as any;
  });

  it("should call valid endpoint and return cart with no items", async () => {
    mockedPatch.mockResolvedValueOnce({
      data: {
        name: datatype.uuid(),
        token: datatype.uuid(),
        lineItems: [
          {
            id: "geawq90a5dab4206843d0vc3sa8wefdf",
            label: commerce.productName(),
            quantity: 3,
            payload: {
              productNumber: datatype.uuid,
            },
          },
        ],
      },
    });

    let lineItemId = "geawq90a5dab4206843d0vc3sa8wefdf";

    const result = await changeCartItemQuantity(lineItemId, 3);
    expect(mockedPatch).toBeCalledTimes(1);
    expect(mockedPatch).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [{ quantity: 3, id: "geawq90a5dab4206843d0vc3sa8wefdf" }],
    });
    expect(result.lineItems[0].quantity).toEqual(3);
  });

  it("should throw unhandled 400 error when non-existing lineItemId given", async () => {
    mockedPatch.mockRejectedValueOnce(
      new Error("400: CHECKOUT__CART_LINEITEM_NOT_FOUND")
    );

    let lineItemId = "someNonExistingLineItemId";

    expect(changeCartItemQuantity(lineItemId, 1)).rejects.toThrow(
      "400: CHECKOUT__CART_LINEITEM_NOT_FOUND"
    );
    expect(mockedPatch).toBeCalledTimes(1);
    expect(mockedPatch).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [
        {
          quantity: 1,
          id: "someNonExistingLineItemId",
        },
      ],
    });
  });

  it("should throw unhandled 400 error when negative quantity given", async () => {
    mockedPatch.mockRejectedValueOnce(
      new Error("400: CHECKOUT__CART_INVALID_LINEITEM_QUANTITY")
    );

    let lineItemId = "geawq90a5dab4206843d0vc3sa8wefdf";

    expect(changeCartItemQuantity(lineItemId, -2)).rejects.toThrow(
      "400: CHECKOUT__CART_INVALID_LINEITEM_QUANTITY"
    );
    expect(mockedPatch).toBeCalledTimes(1);
    expect(mockedPatch).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [
        {
          id: "geawq90a5dab4206843d0vc3sa8wefdf",
          quantity: -2,
        },
      ],
    });
  });

  it("should call api with default value of quantity", async () => {
    mockedPatch.mockResolvedValueOnce({
      data: {},
    });

    let lineItemId = "geawq90a5dab4206843d0vc3sa8wefdf";

    await changeCartItemQuantity(lineItemId);
    expect(mockedPatch).toBeCalledTimes(1);
    expect(mockedPatch).toBeCalledWith("/store-api/checkout/cart/line-item", {
      items: [{ quantity: 1, id: "geawq90a5dab4206843d0vc3sa8wefdf" }],
    });
  });
});
