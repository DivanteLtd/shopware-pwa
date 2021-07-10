import { ShopwareSearchParams } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";

import { ProductListingResult } from "@shopware-pwa/commons/interfaces/response/ProductListingResult";
import { Product } from "@shopware-pwa/commons/interfaces/models/content/product/Product";

import { createProductListingResult } from "../factory/ProductListingResultFactory";

import { buildFilters } from "./CriteriaBuilder";

import FilterInterface from "./filter/FilterInterface";

const handleRequest = async function (
  allElements: Array<Product>,
  criteria?: ShopwareSearchParams
): Promise<ProductListingResult> {
  let filters: Array<FilterInterface> = [];
  if (typeof criteria !== "undefined") {
    filters = buildFilters(criteria);
  }

  /* Build Criteria */

  console.time("parseCriteria");

  /* Init empty result set */
  let elements: Array<Product> = [];

  if (typeof criteria !== "undefined" && criteria.query) {
    /* Execute filters */
    elements = _applyFilters(filters, allElements);
  }

  console.timeEnd("parseCriteria");

  return createProductListingResult(elements, criteria);
};

/* Simple method for filtering */
const _applyFilters = function (
  filters: Array<FilterInterface>,
  elements: Array<Product>
): Array<Product> {
  let filteredElements = elements.filter((product: Product) => {
    return filters
      .map((filter): boolean => {
        return filter.supports(product) && filter.match(product);
      })
      .reduce((evaluated, current) => {
        return evaluated && current;
      });
  });

  return filteredElements;
};

export { handleRequest };
