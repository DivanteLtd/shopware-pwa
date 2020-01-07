import {
  SearchFilterType,
  MultiFilter,
  EqualsAnyFilter,
  EqualsFilter,
  RangeFilter,
  Sort
} from "@shopware-pwa/shopware-6-client";

const createMultiFilter = (operator: string, queries: any[]): MultiFilter => ({
  type: SearchFilterType.MULTI,
  operator: operator,
  queries: queries
});

const createRangeFilter = (filterData: any, field: string): RangeFilter => ({
  type: SearchFilterType.RANGE,
  field: field,
  parameters: filterData
});

const createEqualsFilter = (value: string, field: string): EqualsFilter => ({
  type: SearchFilterType.EQUALS,
  field,
  value
});

const createEqualsAnyFilter = (
  value: string[],
  field: string = "propertyIds"
): EqualsAnyFilter => ({
  type: SearchFilterType.EQUALS_ANY,
  field,
  value
});

/**
 * Get the right filter format depending on filter's code
 */
const extractFilter = (
  filterCode: string,
  filterData: any
): RangeFilter | EqualsFilter | EqualsAnyFilter | MultiFilter => {
  let extractedFilter = null;
  console.error("FILTER CODE", filterCode);
  switch (filterCode) {
    case "price":
      extractedFilter = createRangeFilter(filterData, filterCode);
      break;
    case "shipping-free":
      extractedFilter = createEqualsFilter(filterData, filterCode);
      break;
    case "categoryTree":
      extractedFilter = createEqualsFilter(
        filterData.shift(),
        "product.categoriesRo.id"
      );
      break;
    case "manufacturer":
      extractedFilter = createEqualsAnyFilter(filterData, "manufacturerId");
      break;
    default:
      const subFilters = [];
      subFilters.push(createEqualsAnyFilter(filterData));
      // passed propertyIds could be also interpreted as optionIds
      subFilters.push(createEqualsAnyFilter(filterData, "optionIds"));
      extractedFilter = createMultiFilter("OR", subFilters);
  }

  return extractedFilter;
};

export const getFilterSearchCriteria = (selectedFilters: any): any[] => {
  const filters: any[] = [];

  console.warn(selectedFilters);
  if (!selectedFilters) {
    return filters;
  }

  for (const filterName of Object.keys(selectedFilters)) {
    // if (!selectedFilters[filterName].length && typeof selectedFilters[filterName] !== "boolean" && !selectedFilters[filterName].hasOwnProperty('gte')) {
    //   continue;
    // }
    filters.push(extractFilter(filterName, selectedFilters[filterName]));
  }

  return filters;
};

export interface SwSorting {
  name: string;
  active: boolean;
  field: string;
  order: string;
}

export const getSortingSearchCriteria = (selectedSorting: SwSorting): Sort => {
  if (!selectedSorting) {
    return {} as Sort;
  }

  console.warn("selectedSorting: ", selectedSorting);
  return {
    field: selectedSorting.field,
    desc: selectedSorting.order === "desc"
  };
};
