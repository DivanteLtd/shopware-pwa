export * from "./index.inner";

// Explicitly import offline overrides and alias them

// Product Listing
import { getCategoryProducts as offlineGetCategoryProducts } from "./offline-services/productService";

const getCategoryProducts = offlineGetCategoryProducts;

// Product Search
import {
  searchProducts as offlineSearchProducts,
  searchSuggestedProducts as offlineSearchSuggestedProducts,
} from "./offline-services/searchService";

const searchProducts = offlineSearchProducts;
const searchSuggestedProducts = offlineSearchSuggestedProducts;

// Re-export them with original name, because local modules have priority in bundler
export { searchProducts, searchSuggestedProducts, getCategoryProducts };
