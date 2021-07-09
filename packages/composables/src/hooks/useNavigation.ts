import { computed, ComputedRef } from "vue-demi";
import { getStoreNavigation } from "@shopware-pwa/shopware-6-client";
import {
  StoreNavigationElement,
  StoreNavigationType,
} from "@shopware-pwa/commons/interfaces/models/content/navigation/Navigation";
import {
  useDefaults,
  getApplicationContext,
  useSharedState,
} from "@shopware-pwa/composables";
import { ApplicationVueContext } from "../appContext";

/**
 * interface for {@link useNavigation} composable
 *
 * Provides state for navigation trees depending on navigation type.
 *
 * @beta
 */
export interface IUseNavigation {
  navigationElements: ComputedRef<StoreNavigationElement[] | null>;
  /**
   * @deprecated use loadNavigationElements instead. Remove after v0.8
   */
  fetchNavigationElements: (depth: number) => Promise<void>;

  /**
   * Load navigation elements
   */
  loadNavigationElements: (params: { depth: number }) => Promise<void>;
}

/**
 * Composable for navigation. Options - {@link IUseNavigation}
 *
 * @example
 * ```
 * // get main navigation
 * useNavigation( root )
 * // get footer navigation
 * useNavigation( root, { type: "footer-navigation" } )
 * ```
 *
 * @beta
 */
export const useNavigation = (
  rootContext: ApplicationVueContext,
  params: {
    type: StoreNavigationType;
  } = {
    type: "main-navigation",
  }
): IUseNavigation => {
  const { apiInstance } = getApplicationContext(rootContext, "useNavigation");
  const { sharedRef } = useSharedState(rootContext);

  const { getIncludesConfig, getAssociationsConfig } = useDefaults(
    rootContext,
    "useNavigation"
  );

  const sharedElements = sharedRef<StoreNavigationElement[]>(
    `useNavigation-${params.type}`
  );
  const navigationElements = computed(() => sharedElements.value);

  const loadNavigationElements = async ({ depth }: { depth: number }) => {
    try {
      const navigationResponse = await getStoreNavigation(
        {
          requestActiveId: params.type,
          requestRootId: params.type,
          searchCriteria: {
            configuration: {
              includes: getIncludesConfig(),
              associations: getAssociationsConfig(),
            },
          },
          depth,
        },
        apiInstance
      );

      sharedElements.value = navigationResponse || [];
    } catch (e) {
      sharedElements.value = [];
      console.error("[useNavigation][loadNavigationElements]", e.messages);
    }
  };

  return {
    navigationElements,
    fetchNavigationElements: (depth: number) =>
      loadNavigationElements({ depth }),
    loadNavigationElements,
  };
};
