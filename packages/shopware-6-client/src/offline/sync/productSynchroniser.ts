import { IDBPDatabase } from "idb";
import { invokePost } from "../../index";
import { Product } from "@shopware-pwa/commons/interfaces/models/content/product/Product";
import { open } from "../store/DatabaseHandle";

const synchroniseProducts = async function (page: number = 0) {
  let products = await invokePost({
    address: "/store-api/v4/product",
    payload: {
      limit: 500,
      page,
      associations: {
        categories: {},
        categoriesRo: {},
        cover: {},
      },
      includes: {
        product: [
          "name",
          "ratingAverage",
          "calculatedPrice",
          "calculatedListingPrice",
          "manufacturerId",
          "categories",
          "categoriesRo",
          "id",
          "translated",
          "shippingFree",
          "productNumber",
          "seoUrls",
          "cover",
        ],
        product_media: ["media"],
        media: ["thumbnails", "width", "height", "url"],
        calculated_price: ["unitPrice"],
        category: ["id"],
      },
    },
  });

  /**
   * @todo Optimise storage, by removing apiAlias fields, which are not used by the search
   */

  let db: IDBPDatabase;

  try {
    db = await open();
  } catch (e) {
    console.warn("Indexing not possible, not able to open indexedDB");
    return;
  }

  let writeProducts = db.transaction("product_search_data", "readwrite");

  products.data.elements.forEach((product: Product) => {
    writeProducts.store.put({
      id: product.id,
      name: product.translated.name,
      ratingAverage: product.ratingAverage
        ? product.ratingAverage.toString()
        : "",
      listingPrice: product.calculatedListingPrice.from.unitPrice.toString(),
      calculatedListingPrice: product.calculatedListingPrice,
      calculatedPrice: product.calculatedPrice,
      categories: product.categoriesRo
        ? product.categoriesRo.map((c) => {
            return c.id;
          })
        : product.categories.map((c) => {
            return c.id;
          }),
      manufacturerId: product.manufacturerId,
      shippingFree: product.shippingFree ? 1 : 0,
      productNumber: product.productNumber,
    });
  });
};

export { synchroniseProducts };
