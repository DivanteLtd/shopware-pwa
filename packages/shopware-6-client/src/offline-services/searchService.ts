import * as innerClient from "./../index.inner";

import { open } from "./../offline/store/DatabaseHandle";
import { handleRequest } from "./../offline/criteria/RequestCriteriaHandler";

import { ProductListingResult } from "@shopware-pwa/commons/interfaces/response/ProductListingResult";
import { ShopwareSearchParams } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import { defaultInstance, ShopwareApiInstance } from "./../apiService";

import { IDBPDatabase } from "idb";

export async function searchProducts(
  criteria?: ShopwareSearchParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<ProductListingResult> {
  let db: IDBPDatabase;

  try {
    db = await open();
  } catch (e) {
    return innerClient.searchProducts(criteria, contextInstance);
  }

  let elements = await db.transaction("product").store.getAll();

  /* This is where the magic happens */
  let productResult: ProductListingResult = await handleRequest(
    elements,
    criteria
  );

  return productResult;
}

/**
 * Search for suggested products based on criteria.
 * From: Shopware 6.4
 *
 * @beta
 */
export async function searchSuggestedProducts(
  criteria?: ShopwareSearchParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<ProductListingResult> {
  let db: IDBPDatabase;

  try {
    db = await open();
  } catch (e) {
    return innerClient.searchSuggestedProducts(criteria, contextInstance);
  }

  let elements = await db.transaction("product").store.getAll();

  /* This is where the magic happens */
  let productResult: ProductListingResult = await handleRequest(
    elements,
    criteria
  );

  return productResult;
}
