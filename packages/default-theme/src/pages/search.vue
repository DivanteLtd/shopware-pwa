<template>
  <div class="search-page">
    <h3 v-if="!getSearchTerm && !loading" class="search-page__warning">
      {{ this.$t("You didn't provide any term to be found") }}
    </h3>
    <SfLoader v-else :loading="loading">
      <div v-if="getElements" class="search-page__main">
        <h3 class="search-page__heading">
          {{ this.$t("search results for") }}
          <strong>{{ getSearchTerm }}</strong
          >:
        </h3>

        <SwProductListingFilters listingType="productSearchListing" />
        <SwProductListing listingType="productSearchListing" />
      </div>
    </SfLoader>
  </div>
</template>
<script>
import { SfLoader } from "@storefront-ui/vue"
import { useUIState, useListing } from "@shopware-pwa/composables"

import { computed, ref } from "@vue/composition-api"
import SwProductListing from "@/components/SwProductListing.vue"
import SwProductListingFilters from "@/components/SwProductListingFilters.vue"

export default {
  name: "SearchResultsPage",
  watchQuery: (newQuery, oldQuery) => {
    return newQuery.query !== oldQuery.query
  },
  components: {
    SfLoader,
    SwProductListing,
    SwProductListingFilters,
  },
  asyncData: async ({ app, query }) => {
    const { initSearch } = useListing(app, "productSearchListing")

    try {
      await initSearch(query)
    } catch (e) {
      console.error("[search] Problem with initial search", e.messages)
    }

    return {}
  },
  setup(props, { root }) {
    const { getElements, loading, getCurrentFilters } = useListing(
      root,
      "productSearchListing"
    )

    const getSearchTerm = computed(() => getCurrentFilters.value?.search)

    return {
      getSearchTerm,
      getElements,
      loading,
    }
  },
}
</script>
<style lang="scss">
@import "@/assets/scss/variables";

.search-page {
  @include for-desktop {
    max-width: 1272px;
    margin: 0 auto;
    padding: 0 var(--spacer-base);
  }

  .sf-loader {
    min-height: 50vh;
  }

  &__warning {
    padding-top: 20vh;
    min-height: 30vh;
  }

  &__main {
    @include for-desktop {
      flex: 1;
      padding: var(--spacer-lg) 0 0 0;
    }
  }

  &__heading {
    text-align: center;
    margin: var(--spacer-xl) auto;
  }
}
</style>
