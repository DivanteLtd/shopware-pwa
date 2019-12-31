import Vue from "vue";
import VueCompositionApi, {
  reactive,
  ref,
  computed,
  Ref
} from "@vue/composition-api";
Vue.use(VueCompositionApi);

import { useCategoryFilters, setStore } from "@shopware-pwa/composables/src";

describe("Composables - useCategoryFilters", () => {
  const statePage: Ref<Object | null> = ref(null);
  beforeEach(() => {
    jest.resetAllMocks();
    statePage.value = null;
    setStore({
      getters: reactive({ getPage: computed(() => statePage.value) }),
      commit: (name: string, value: any) => {
        statePage.value = value;
      }
    });
  });

  describe("computed", () => {
    describe("availableFilters", () => {
      it("should return empty array if there is no page loaded", () => {
        const { availableFilters } = useCategoryFilters();
        expect(availableFilters.value).toBeTruthy();
        expect(availableFilters.value).toHaveLength(0);
      });
      it("should return array filters if there is page loaded", () => {
        const { availableFilters } = useCategoryFilters();
        expect(availableFilters.value).toBeTruthy();
        expect(availableFilters.value).toHaveLength(0);
        statePage.value = {
          listingConfiguration: {
            availableFilters: {
              manufacturer: {
                type: "entity",
                name: "manufacturer",
                values: {
                  "4a65e4a0c3f349c789c8a700d5fedba5": {
                    name: "Hill Group"
                  }
                }
              }
            }
          }
        };

        expect(availableFilters.value).toHaveLength(1);
      });
    });
    describe("activeFilters", () => {
      it("should return empty array if there is no page loaded", () => {
        const { activeFilters } = useCategoryFilters();
        expect(activeFilters.value).toBeTruthy();
        expect(activeFilters.value).toHaveLength(0);
      });
      it("should return array of active filters if there is a page loaded", () => {
        statePage.value = {};
        const { activeFilters } = useCategoryFilters();
        expect(activeFilters.value).toBeTruthy();
        expect(activeFilters.value).toHaveLength(0);
        statePage.value = {
          listingConfiguration: {
            activeFilters: {
              navigationId: "34b081d3d1044ab594cd522f672a929d",
              manufacturer: [],
              properties: [],
              "shipping-free": null,
              rating: null,
              price: {
                min: null,
                max: null
              }
            }
          }
        };

        expect(activeFilters.value).toHaveProperty("manufacturer");
        expect(activeFilters.value).toHaveProperty("properties");
        expect(activeFilters.value).toHaveProperty("shipping-free");
        expect(activeFilters.value).toHaveProperty("rating");
        expect(activeFilters.value).toHaveProperty("price");
      });
    });
  });
});
