import { defaultInstance } from "../../../src/apiService";
import { getCategoryProducts } from "@shopware-pwa/shopware-6-client";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("ProductService - getCategoryProducts", () => {
  const mockedPost = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      post: mockedPost,
    } as any;
  });
  it("should return listing data with no searchCriteria", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { elements: [{ id: "044a190a54ab4f06803909c3ee8063ef" }] },
    });
    const categoryId = "044a190a54ab4f06803909c3ee8063ef";
    const result = await getCategoryProducts(categoryId);
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      "/store-api/product-listing/044a190a54ab4f06803909c3ee8063ef",
      undefined
    );
    expect(result).toHaveProperty("elements");
  });
  it("should return listing data with searchCriteria provided", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { elements: [{ id: "044a190a54ab4f06803909c3ee8063ef" }] },
    });
    const categoryId = "044a190a54ab4f06803909c3ee8063ef";
    const result = await getCategoryProducts(categoryId, {
      limit: 10,
    });
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      "/store-api/product-listing/044a190a54ab4f06803909c3ee8063ef",
      { limit: 10 }
    );
    expect(result).toHaveProperty("elements");
  });
});
