import { Ref, ref, computed, onMounted, ComputedRef } from "vue-demi";
import { getAvailableSalutations } from "@shopware-pwa/shopware-6-client";
import { ClientApiError } from "@shopware-pwa/commons/interfaces/errors/ApiError";
import { useSharedState } from "@shopware-pwa/composables";
import { ApplicationVueContext, getApplicationContext } from "../appContext";
import { Salutation } from "@shopware-pwa/commons/interfaces/models/system/salutation/Salutation";

/**
 * @beta
 */
export interface UseSalutations {
  mountedCallback: () => Promise<void>;
  getSalutations: ComputedRef<Salutation[]>;
  fetchSalutations: () => Promise<void>;
  error: Ref<any>;
}

/**
 * @beta
 */
export const useSalutations = (
  rootContext: ApplicationVueContext
): UseSalutations => {
  const { apiInstance } = getApplicationContext(rootContext, "useSalutations");
  const { sharedRef } = useSharedState(rootContext);
  const _salutations: Ref<Salutation[] | null> = sharedRef(
    "sw-useSalutations-salutations"
  );

  const error: Ref<any> = ref(null);

  const fetchSalutations = async (): Promise<void> => {
    try {
      const { elements } = await getAvailableSalutations(apiInstance);
      _salutations.value = elements;
    } catch (e) {
      const err: ClientApiError = e;
      error.value = err.messages;
    }
  };

  // created separate function for testing proposes
  const mountedCallback = async () => {
    if (!_salutations.value) {
      await fetchSalutations();
    }
  };

  const getSalutations = computed(() => {
    return _salutations.value || [];
  });

  onMounted(mountedCallback);

  return {
    mountedCallback,
    fetchSalutations,
    getSalutations,
    error,
  };
};
