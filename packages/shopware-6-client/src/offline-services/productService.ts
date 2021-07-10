import * as innerClient from "./../index.inner";

import { ShopwareSearchParams } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import { ProductListingResult } from "@shopware-pwa/commons/interfaces/response/ProductListingResult";
import { Product } from "@shopware-pwa/commons/interfaces/models/content/product/Product";

import { defaultInstance, ShopwareApiInstance } from "../apiService";

import { open } from "../offline/store/DatabaseHandle";
import { IDBPDatabase } from "idb";

import { createProductListingResult } from "../offline/factory/ProductListingResultFactory";

import { synchroniseProducts } from "../offline/sync/ProductSynchroniser";

/**
 * Get default amount of products and listing configuration for given category
 *
 * @throws ClientApiError
 * @beta
 */
export const getCategoryProducts = async function (
  categoryId: string,
  criteria?: ShopwareSearchParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<ProductListingResult> {
  let db: IDBPDatabase;

  try {
    db = await open();
    // throw new Error("e");
  } catch (e) {
    // await synchroniseProducts(1)
    // await synchroniseProducts(2)
    // await synchroniseProducts(3)
    // await synchroniseProducts(4)
    return innerClient.getCategoryProducts(
      categoryId,
      criteria,
      contextInstance
    );
  }

  let keyRange = IDBKeyRange.only(categoryId);

  let total = await db
    .transaction("product_search_data")
    .store.index("category")
    .count(keyRange);
  let cursor = await db
    .transaction("product_search_data")
    .store.index("category")
    .openCursor(keyRange);

  let products: Array<Product> = [];

  let limit: number = criteria?.limit || 10;
  let page: number = criteria?.p || 1;
  let start: number = (page - 1) * limit;

  // If start is 0, do nothing, otherwise advance to start
  cursor = start > 0 ? (await cursor?.advance(start)) || null : cursor;

  let count = 0;

  while (cursor && count < limit) {
    products.push(cursor.value);
    cursor = await cursor.continue();
    count++;
  }

  return createProductListingResult(products, total, limit, page);
};
