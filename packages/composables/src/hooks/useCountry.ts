import { computed, ComputedRef, Ref } from "@vue/composition-api";
import { Country } from "@shopware-pwa/commons/interfaces/models/system/country/Country";

/**
 * @beta
 */
export interface UseCountry {
  currentCountry: ComputedRef<Country | null>;
  displayState: Readonly<Ref<boolean>>;
  forceState: Readonly<Ref<boolean>>;
}

/**
 * @beta
 */
export const useCountry = (
  countryId: Ref<Readonly<string>>,
  countries: Ref<Readonly<Country[]>>
): UseCountry => {
  const currentCountry = computed(() => {
    if (!countryId.value) return null;
    return (
      countries.value.find((country) => country.id === countryId.value) ?? null
    );
  });

  const displayState = computed(() => {
    // TODO: Currently only forceStateInRegistration can be configured in administration
    //  when displayStateInRegistration also is configurable, switch to displayStateInRegistration
    return currentCountry.value?.forceStateInRegistration ?? false;
  });

  const forceState = computed(() => {
    return currentCountry.value?.forceStateInRegistration ?? false;
  });

  return {
    currentCountry,
    displayState,
    forceState,
  };
};
