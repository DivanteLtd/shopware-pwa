import { ProductListingResult } from "@shopware-pwa/commons/interfaces/response/ProductListingResult";
import { Product } from "@shopware-pwa/commons/interfaces/models/content/product/Product";

const createProductListingResult = function (
  elements: Array<Product>,
  total: number,
  limit: number,
  page: number
): ProductListingResult {
  return {
    apiAlias: "product_listing",
    total: total,
    elements,
    sorting: "score",
    sortings: [],
    limit,
    page,
    currentFilters: {
      search: "",
    },
    aggregations: {},
  };
};

export { createProductListingResult };
