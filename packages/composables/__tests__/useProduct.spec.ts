import { ClientApiError } from "@shopware-pwa/commons/interfaces/errors/ApiError";

import { useProduct, getDefaultApiParams } from "@shopware-pwa/composables";
import * as shopwareClient from "@shopware-pwa/shopware-6-client";

jest.mock("@shopware-pwa/shopware-6-client");
const mockedAxios = shopwareClient as jest.Mocked<typeof shopwareClient>;

describe("Composables - useProduct", () => {
  const rootContextMock: any = {
    $shopwareApiInstance: jest.fn(),
    $shopwareDefaults: getDefaultApiParams(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe("no reference to the product", () => {
    it("should have no value if search wasn't performed", async () => {
      const { product } = useProduct(rootContextMock);
      const response: any = {
        id: "3f637f17cd9f4891a2d7625d19fb37c9",
      };
      mockedAxios.getProductPage.mockResolvedValueOnce(response);
      expect(product.value).toBeUndefined();
    });
  });

  describe("search", () => {
    it("should not have product under value if response search does not contain product property", async () => {
      const { search, product } = useProduct(rootContextMock);
      const response: any = undefined;

      mockedAxios.getProduct.mockResolvedValueOnce(response);
      expect(product.value).toBeUndefined();
      await search("3f637f17cd9f4891a2d7625d19fb37c9");
      expect(product.value).toBeUndefined();
    });
    it("should have product under value if search was triggered", async () => {
      const { search, product } = useProduct(rootContextMock);
      const response: any = {
        product: {
          id: "3f637f17cd9f4891a2d7625d19fb37c9",
        },
      };
      mockedAxios.getProduct.mockResolvedValueOnce(response);
      expect(product.value).toBeUndefined();
      await search("3f637f17cd9f4891a2d7625d19fb37c9");
      expect(product.value).toBeTruthy();
      expect(product.value.id).toBe("3f637f17cd9f4891a2d7625d19fb37c9");
    });
    it("should keep reference to passed product until search is executed", async () => {
      const passedProduct: any = {
        id: "some-old-id",
      };
      const { search, product } = useProduct(rootContextMock, passedProduct);
      const response: any = {
        product: {
          id: "3f637f17cd9f4891a2d7625d19fb37c9",
        },
      };
      mockedAxios.getProduct.mockResolvedValueOnce(response);
      expect(product.value).toBeTruthy();
      expect(product.value.id).toBe("some-old-id");
      await search("3f637f17cd9f4891a2d7625d19fb37c9");
      expect(product.value).toBeTruthy();
      expect(product.value.id).toBe("3f637f17cd9f4891a2d7625d19fb37c9");
    });
  });

  describe("loadAssociations", () => {
    it("should load associations from parent if parentId is not null", async () => {
      const loadedProduct: any = {
        id: "3f637f17cd9f4891a2d7625d19fb37c9",
        parentId: "1c3e927309014a67a07f3bb574f9e804",
      };
      mockedAxios.getProductPage.mockResolvedValueOnce({} as any);
      const { loadAssociations } = useProduct(rootContextMock, loadedProduct);
      const includesParams = getDefaultApiParams()?.["useProduct"]?.includes;
      const associationsParams =
        getDefaultApiParams()?.["useProduct"]?.associations;
      loadAssociations({} as any);
      expect(mockedAxios.getProductPage).toBeCalledWith(
        "detail/1c3e927309014a67a07f3bb574f9e804",
        {
          configuration: {
            includes: includesParams,
            associations: associationsParams,
          },
        },
        rootContextMock.$shopwareApiInstance
      );
    });

    it("should have children association if loadAssociations was triggered", async () => {
      const loadedProduct: any = {
        id: "3f637f17cd9f4891a2d7625d19fb37c9",
      };
      const { loadAssociations, product } = useProduct(
        rootContextMock,
        loadedProduct
      );
      const responseLoadAssociations: any = {
        product: {
          id: "3f637f17cd9f4891a2d7625d19fb37c9",
          crossSellings: { id: "cross-id" },
        },
      };
      mockedAxios.getProductPage.mockResolvedValueOnce(
        responseLoadAssociations
      );
      await loadAssociations();
      expect(product.value).toHaveProperty("crossSellings");
    });
    it("should have failed on empty product during loading associations", async () => {
      const { loadAssociations, error } = useProduct(rootContextMock);
      try {
        await loadAssociations({});
      } catch (e) {
        expect(e.toString()).toBe(
          "Associations cannot be loaded for undefined product"
        );
      }
      expect(error.value).toBeNull();
    });
  });

  describe("problems", () => {
    it("should have failed on bad url settings", async () => {
      const { search, product, error } = useProduct(rootContextMock);
      mockedAxios.getProduct.mockRejectedValueOnce({
        messages: [{ detail: "Something went wrong..." }],
      } as ClientApiError);
      expect(product.value).toBeUndefined();
      await search("");
      expect(product.value).toBeUndefined();
      expect(error.value).toEqual([{ detail: "Something went wrong..." }]);
    });
  });
});
