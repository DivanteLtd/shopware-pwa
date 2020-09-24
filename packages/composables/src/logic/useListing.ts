import {
  getCategoryProducts,
  searchProducts,
} from "@shopware-pwa/shopware-6-client";

import {
  useCms,
  ApplicationVueContext,
  getApplicationContext,
  useDefaults,
  createListingComposable,
  IUseListing,
} from "@shopware-pwa/composables";
import { ShopwareSearchParams } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";

/**
 * @beta
 */
export type useListingKey = "productSearchListing" | "categoryListing";

/**
 * @beta
 */
export const useListing = (
  rootContext: ApplicationVueContext,
  listingKey: useListingKey
): IUseListing => {
  const { getDefaults } = useDefaults(rootContext, "useProductListing");
  const { apiInstance } = getApplicationContext(rootContext, "useListing");

  let searchMethod;
  if (listingKey === "productSearchListing") {
    searchMethod = async (searchCriteria: Partial<ShopwareSearchParams>) => {
      return searchProducts(searchCriteria, apiInstance);
    };
  } else {
    const { categoryId } = useCms(rootContext);
    searchMethod = async (searchCriteria: Partial<ShopwareSearchParams>) => {
      return getCategoryProducts(categoryId.value, searchCriteria, apiInstance);
    };
  }

  return createListingComposable({
    rootContext,
    listingKey,
    searchMethod,
    searchDefaults: getDefaults(),
  });
};
