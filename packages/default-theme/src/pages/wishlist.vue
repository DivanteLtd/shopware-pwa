<template>
  <div class="wishlistPage">
    <SfLoader :loading="isLoading">
      <div v-if="products.length">
        <SfHeading :title="$t('Wishlist')" :level="3" />
        <div class="wishlist-grid">
          <SwProductCard
            v-for="product in products"
            :key="product.id"
            class=""
            :product="product"
          />
        </div>
      </div>

      <div v-else class="no-results">
        <SwImage
          class="image"
          :src="require('@/assets/hearts.svg')"
          alt="wishlist-heart"
        />
        <SfHeading
          :title="$t('No favourites yet')"
          :level="2"
          class="main-headline"
        />
        <SfHeading
          :title="$t('Tap any heart next to a product to favorite.')"
          :level="4"
        />
        <SfHeading :title="$t('We’ll save them for you here!')" :level="4" />
      </div>
    </SfLoader>
  </div>
</template>

<script>
import { getProducts } from "@shopware-pwa/shopware-6-client"
import {
  getApplicationContext,
  useWishlist,
  useBreadcrumbs,
} from "@shopware-pwa/composables"
import SwProductCard from "@/components/SwProductCard.vue"
import { SfHeading, SfLoader } from "@storefront-ui/vue"
import { onMounted, ref, watch } from "@vue/composition-api"
import { PAGE_WISHLIST } from "@/helpers/pages"
import SwImage from "@/components/atoms/SwImage.vue"

export default {
  name: "Wishlist",
  components: {
    SwProductCard,
    SfHeading,
    SwImage,
    SfLoader,
  },

  props: {
    product: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { root }) {
    const { removeFromWishlist, items } = useWishlist(root)
    const { setBreadcrumbs } = useBreadcrumbs(root)
    const { apiInstance } = getApplicationContext(root, "Wishlist")

    const products = ref([])
    const isLoading = ref(false)

    setBreadcrumbs([
      {
        name: root.$t("Wishlist"),
        path: PAGE_WISHLIST,
      },
    ])

    const loadProductsByItemIds = async (itemIds) => {
      isLoading.value = true
      try {
        const result = await getProducts(
          {
            configuration: {
              ids: itemIds || items.value,
            },
          },
          apiInstance
        )
        if (result) {
          products.value = result.elements
        }
      } catch (e) {
        console.error("[wishlist][loadProductsByItemIds]", e.messages)
      }
      isLoading.value = false
    }

    onMounted(async () => {
      if (!items.value.length) {
        return
      }
      loadProductsByItemIds(items.value)
    })

    watch(items, (items, prev) => {
      if (items.length !== prev.length) {
        products.value = products.value.filter(({ id }) => items.includes(id))
      }
    })

    return {
      removeFromWishlist,
      products,
      isLoading,
    }
  },
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/variables";

.wishlistPage {
  padding-top: var(--spacer-lg);

  .no-results {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    --heading-title-font-weight: var(--font-weight--normal);
    --heading-title-font-size: var(--font-size--base);

    .main-headline {
      --heading-title-color: var(--c-primary);
      --heading-title-font-size: var(--h2-font-size);
      --heading-title-font-weight: var(--font-weight--semibold);
      margin-bottom: var(--spacer-xl);
    }

    .image {
      margin-bottom: var(--spacer-xl);
      margin-top: var(--spacer-xl);
      --image-width: 200px;
      @include for-desktop {
        margin-bottom: var(--spacer-2xl);
        margin-top: var(--spacer-2xl);
        --image-width: 300px;
      }
    }
  }

  .wishlist-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin: var(--spacer-lg) auto 0;
    max-width: 1366px;

    .sw-product-card {
      @include for-desktop {
        margin: var(--spacer-base);
      }
    }
  }
}
</style>
