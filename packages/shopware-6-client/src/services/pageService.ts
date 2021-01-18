import { getPageResolverEndpoint } from "../endpoints";
import { defaultInstance, ShopwareApiInstance } from "../apiService";
import {
  SearchCriteria,
  ShopwareSearchParams,
} from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import { CmsPage } from "@shopware-pwa/commons/interfaces/models/content/cms/CmsPage";
import { Product } from "@shopware-pwa/commons/interfaces/models/content/product/Product";
import { Aggregation } from "@shopware-pwa/commons/interfaces/search/Aggregation";

import { convertSearchCriteria } from "../helpers/searchConverter";

/**
 * @beta
 */
export interface PageResolverResult<T> {
  cmsPage: T;
  breadcrumb: {
    [id: string]: {
      name: string;
      path: string;
    };
  };
  listingConfiguration: any;
  resourceType: string;
  resourceIdentifier: string;
  apiAlias: string;
}

/**
 * @beta
 */
export interface PageResolverProductResult {
  product: Partial<Product>;
  aggregations: Aggregation[];
  resourceType: string;
  resourceIdentifier: string;
  cannonicalPathInfo: string;
  apiAlias: string;
}

/**
 * @throws ClientApiError
 * @beta
 */
export async function getPage(
  path: string,
  searchCriteria?: SearchCriteria,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<PageResolverResult<CmsPage>> {
  contextInstance.defaults.headers["sw-include-seo-urls"] = true;
  const resp = await contextInstance.invoke.post(getPageResolverEndpoint(), {
    path: path,
    ...convertSearchCriteria({
      searchCriteria,
      config: contextInstance.config,
    }),
  });

  return resp.data;
}

/**
 * @throws ClientApiError
 * @beta
 */
export async function getCmsPage(
  path: string,
  criteria?: ShopwareSearchParams,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<PageResolverResult<CmsPage>> {
  contextInstance.defaults.headers["sw-include-seo-urls"] = true;
  const resp = await contextInstance.invoke.post(getPageResolverEndpoint(), {
    path: path,
    ...criteria,
  });

  return resp.data;
}

/**
 * @throws ClientApiError
 * @beta
 */
export async function getProductPage(
  path: string,
  searchCriteria?: SearchCriteria,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<PageResolverProductResult> {
  const resp = await contextInstance.invoke.post(getPageResolverEndpoint(), {
    path: path,
    ...convertSearchCriteria({
      searchCriteria,
      config: contextInstance.config,
    }),
  });

  return resp.data;
}

/**
 * Returns an array of SEO URLs for given entity
 * Can be used for other languages as well by providing the languageId
 *
 * @beta
 */
export async function getSeoUrls(
  entityId: string,
  languageId?: string,
  contextInstance: ShopwareApiInstance = defaultInstance
): Promise<
  {
    apiAlias: string;
    seoPathInfo: string;
  }[]
> {
  if (languageId) {
    contextInstance.defaults.headers["sw-language-id"] = languageId;
  }
  const resp = await contextInstance.invoke.post("/store-api/v3/seo-url", {
    filter: [
      {
        type: "equals",
        field: "foreignKey",
        value: entityId,
      },
    ],
    includes: {
      seo_url: ["seoPathInfo"],
    },
  });

  return resp.data;
}
