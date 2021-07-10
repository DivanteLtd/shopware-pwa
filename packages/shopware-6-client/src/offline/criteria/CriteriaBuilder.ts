import { ShopwareSearchParams } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";

import FilterInterface from "./filter/FilterInterface";

import TermFilter from "./filter/TermFilter";
// import RangeFilter from "./filter/RangeFilter"
// import EqualsFilter from "./filter/EqualsFilter"

const buildFilters = function (
  criteria: ShopwareSearchParams,
  filters: Array<FilterInterface> = []
): Array<FilterInterface> {
  console.log(criteria);

  filters.push(new TermFilter(criteria?.query || ""));
  // filters.push(new RangeFilter('ratingAverage', { gt: 3 }))
  // filters.push(new EqualsFilter('id', 'c6a351be9ad54596b1062196f7fd7240'))

  return filters;
};

export { buildFilters };
