import { UpgradeFunction } from "./StoreInterface";

/**
 * Name of the product store
 */
const name: string = "product_search_data";

/**
 * Abstraction for creation of product store
 */
const upgrade: UpgradeFunction = function (
  database,
  oldVersion,
  newVersion,
  transaction
) {
  if (oldVersion < 1) {
    let productSearchDataStore = database.createObjectStore(name, {
      keyPath: "id",
    });

    productSearchDataStore.createIndex("name", "name");
    productSearchDataStore.createIndex("rating", "ratingAverage");
    productSearchDataStore.createIndex("listingPrice", "listingPrice");
    productSearchDataStore.createIndex("category", "categories", {
      multiEntry: true,
    });
    productSearchDataStore.createIndex("manufacturer", "manufacturerId");
    productSearchDataStore.createIndex("shippingFree", "shippingFree");
    productSearchDataStore.createIndex("productNumber", "productNumber");
  }
};

export { name, upgrade };
