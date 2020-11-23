import { Product } from "@shopware-pwa/commons/interfaces/models/content/product/Product";

/**
 * Get the price for 1 unit of a product
 *
 * @deprecated consider using getCalculatedListPrice or getProductCalculatedUnitPrice
 * @returns (number|undefined)
 *
 * @beta
 */
export function getProductRegularPrice(product: Product): number | undefined {
  return product?.calculatedListingPrice?.from?.unitPrice;
}
