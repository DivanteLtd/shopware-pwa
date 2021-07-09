<template>
  <div class="sw-side-cart">
    <SfSidebar
      :title="$t('My cart')"
      :visible="isSidebarOpen"
      :heading-title="$t('My cart')"
      class="sf-sidebar--right"
      @close="toggleSidebar(false)"
    >
      <template v-if="count" #content-top>
        <SfProperty
          class="my-cart__total-items"
          :name="$t('Total items')"
          :value="count"
        />
      </template>
      <transition name="fade" mode="out-in">
        <div v-if="count" key="my-cart" class="my-cart">
          <div class="collected-product-list">
            <SwPluginSlot name="sidecart-products-before" />
            <transition-group name="fade" tag="div">
              <SwCartProduct
                v-for="product in cartItems"
                :key="product.id"
                :product="product"
                :additionalItemsData="additionalItemsData"
              />
            </transition-group>
            <SwPluginSlot name="sidecart-products-after" />
          </div>
        </div>
        <div v-else key="empty-cart" class="empty-cart">
          <div class="empty-cart__banner">
            <SwImage
              :alt="$t('Empty bag')"
              class="empty-cart__image"
              :src="require('@storefront-ui/shared/icons/empty_cart.svg')"
            />
            <SfHeading
              :title="$t('Your cart is empty')"
              :level="2"
              class="empty-cart__heading"
              :description="$t('No items in cart')"
            />
          </div>
        </div>
      </transition>
      <template #content-bottom>
        <transition name="fade">
          <div v-if="count">
            <SfProperty
              :name="$t('Total price')"
              class="
                sf-property--full-width sf-property--large
                my-cart__total-price
              "
            >
              <template #value>
                <SfPrice
                  :regular="filterPrice(totalPrice)"
                  class="sf-price--big"
                />
              </template>
            </SfProperty>
            <SwButton
              class="sf-button--full-width color-secondary"
              data-cy="goToCheckout-button"
              @click="goToCheckout()"
              >{{ $t("Go to checkout") }}</SwButton
            >
            <SwPluginSlot name="sidecart-checkout-button-after" />
          </div>
          <div v-else>
            <SwButton
              class="sf-button--full-width color-primary"
              @click="toggleSidebar()"
            >
              {{ $t("Start shopping") }}
            </SwButton>
          </div>
        </transition>
      </template>
    </SfSidebar>
  </div>
</template>
<script>
import { SfSidebar, SfProperty, SfPrice, SfHeading } from "@storefront-ui/vue"
import {
  useCart,
  useUIState,
  getApplicationContext,
} from "@shopware-pwa/composables"
import { getProducts } from "@shopware-pwa/shopware-6-client"
import SwCartProduct from "@/components/SwCartProduct.vue"
import SwButton from "@/components/atoms/SwButton.vue"
import { PAGE_CHECKOUT } from "@/helpers/pages"
import SwPluginSlot from "sw-plugins/SwPluginSlot.vue"
import { computed, onMounted, ref, watch } from "@vue/composition-api"
import SwImage from "@/components/atoms/SwImage.vue"
import { usePriceFilter } from "@/logic/usePriceFilter.js"

export default {
  name: "SwCart",
  components: {
    SfSidebar,
    SfHeading,
    SwImage,
    SfProperty,
    SfPrice,
    SwCartProduct,
    SwPluginSlot,
    SwButton,
  },
  setup(props, { root }) {
    const { apiInstance } = getApplicationContext(root, "SwCart")
    const { cartItems, count, totalPrice, removeProduct } = useCart(root)
    const { isOpen: isSidebarOpen, switchState: toggleSidebar } = useUIState(
      root,
      "CART_SIDEBAR_STATE"
    )
    const additionalItemsData = ref([])
    // Load additional info: seoUrls
    // TODO: move that logic into useCart composable or create global solution for "entity enrichment" maybe during adding to cart
    // https://github.com/DivanteLtd/shopware-pwa/issues/1254
    // Component is lazy loaded so to allow animation on first load it needs to be done after it is mounted
    const isComponentMounted = ref(false)

    const loadAdditionalData = async (newItems, oldItems) => {
      if (!cartItems.value.length || newItems.length <= oldItems.length) {
        return
      }
      try {
        const result = await getProducts(
          {
            configuration: {
              ids: cartItems.value.map(({ referencedId }) => referencedId),
              includes: {
                product: ["id", "seoUrls"],
                seo_url: ["seoPathInfo"],
              },
              associations: {
                seoUrls: {},
              },
            },
          },
          apiInstance
        )
        additionalItemsData.value = result.elements
      } catch (error) {
        console.error("[SwCart][setup][onMounted]", error.messages)
      }
    }

    watch(cartItems, (newItems, oldItems) => {
      loadAdditionalData(newItems, oldItems)
    })
    onMounted(async () => {
      await loadAdditionalData(1, 0)
      isComponentMounted.value = true
    })
    const sidebarState = computed(
      () => isSidebarOpen.value && isComponentMounted.value
    )

    const getCartProducts = computed(() => {
      return cartItems.value.filter((cartItem) => cartItem.type === "product")
    })

    return {
      isSidebarOpen: sidebarState,
      toggleSidebar,
      cartItems: getCartProducts,
      count,
      totalPrice,
      removeProduct,
      additionalItemsData,
      filterPrice: usePriceFilter(),
    }
  },

  // TODO: hotfix - not final solution. To remove after fix cause of a problem.
  watch: {
    isSidebarOpen(val) {
      if (!val) {
        document.body.style.overflow = "auto"
      }
    },
  },
  methods: {
    goToCheckout() {
      this.toggleSidebar()
      return this.$router.push(this.$routing.getUrl(PAGE_CHECKOUT))
    },
  },
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/variables";

::v-deep .sf-sidebar__aside {
  height: auto;
}

.sw-side-cart {
  --sidebar-z-index: 1;
  --property-name-font-size: var(--font-size--lg);
  --property-value-font-size: var(--font-size--lg);
  --sidebar-bottom: var(--bottom-navigation-height, 0);
  --overlay-z-index: 0;
  --sidebar-bottom-padding: var(--spacer-sm) var(--spacer-sm) var(--spacer-xl);
  & > * {
    --sidebar-content-padding: 0 var(--spacer-xs) var(--spacer-xs)
      var(--spacer-xs);
  }
  @include for-desktop {
    --sidebar-z-index: 4;
    --overlay-z-index: 4;
    --sidebar-bottom: 0;
    & > * {
      --sidebar-bottom-padding: var(--spacer-base);
      --sidebar-content-padding: 0 var(--spacer-base) var(--spacer-base)
        var(--spacer-base);
    }
  }
}
.my-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  &__total-items {
    display: none;
    margin: var(--spacer-xs) 0;
    @include for-desktop {
      display: block;
      margin: var(--spacer-sm) 0;
      --property-name-font-weight: var(--font-weight--medium);
    }
  }
  &__total-price {
    --price-font-size: var(--font-size--xl);
    --price-font-weight: var(--font-weight--semibold);
    margin: 0 0 var(--spacer-base) 0;
  }
}
.collected-product-list {
  flex: 1;
}
.empty-cart {
  --heading-description-margin: 0 0 var(--spacer-xl) 0;
  --heading-title-margin: var(--spacer-base) 0;
  --heading-title-color: var(--c-primary);
  --heading-title-font-weight: var(--font-weight--semibold);
  display: flex;
  flex: 1;
  align-items: center;
  flex-direction: column;
  &__banner {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }
}
</style>
