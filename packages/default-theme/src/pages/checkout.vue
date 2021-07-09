<template>
  <SfLoader :loading="isCreatingOrder">
    <div class="checkout" :key="$route.fullPath">
      <div class="checkout__main">
        <div class="log-in" v-if="!isLoggedIn">
          <div class="log-in__buttons-container">
            <SwButton
              class="log-in__button color-secondary"
              @click="switchLoginModalState(true)"
            >
              {{ $t("Log in to your account") }}
            </SwButton>
            <SwPluginSlot name="checkout-login-after" />
          </div>
          <p class="log-in__info">
            {{ $t("or fill the details below:") }}
          </p>
        </div>
        <SfHeading
          v-if="!isLoggedIn"
          :title="$t('Personal details')"
          class="sf-heading--left sf-heading--no-underline title"
        />
        <SwErrorsList :list="registrationFormErrors" />
        <SwRegistrationForm
          v-if="!isLoggedIn"
          v-model="registrationFormData"
          @invokeRegister="invokeRegister"
          allow-guest-registration
        />
        <CheckoutSummary v-if="isLoggedIn" />
        <SwAlert
          v-if="isLoggedIn && $v.$errors.length"
          :message="
            $t('Please fill form data correctly to complete the order.')
          "
          type="danger"
        />
        <div v-if="isLoggedIn">
          <p v-for="error of $v.$errors" :key="error.$uid">
            <SwAlert :message="error.$message" type="danger" />
          </p>
          <SwErrorsList :list="errorMessages" />
        </div>
      </div>
      <div class="checkout__aside">
        <transition name="fade">
          <SidebarOrderSummary
            v-if="!isLoggedIn"
            key="order-summary"
            class="checkout__aside-order"
            @create-account="invokeRegister"
          />
          <SidebarOrderReview
            v-else
            key="order-review"
            class="checkout__aside-order"
            @create-order="createOrder"
          />
        </transition>
      </div>
    </div>
    <template #loader>
      <div class="sf-loader">
        <transition name="sf-fade" mode="out-in">
          <div class="sf-loader__overlay">
            <SfHeading
              :level="3"
              :title="$t('Your order is being created.')"
              :description="$t('Please wait...')"
            />
            <svg
              class="sf-loader__spinner"
              role="img"
              width="38"
              height="38"
              viewBox="0 0 38 38"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g fill="none" fill-rule="evenodd">
                <g transform="translate(1 1)" stroke-width="2">
                  <circle stroke-opacity=".5" cx="18" cy="18" r="18" />
                  <path d="M36 18c0-9.94-8.06-18-18-18">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 18 18"
                      to="360 18 18"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              </g>
            </svg>
          </div>
        </transition>
      </div>
    </template>
  </SfLoader>
</template>
<script lang="ts">
import SidebarOrderReview from "@/components/checkout/sidebar/SidebarOrderReview.vue"
import SidebarOrderSummary from "@/components/checkout/sidebar/SidebarOrderSummary.vue"
import CheckoutSummary from "@/components/checkout/CheckoutSummary.vue"
import SwErrorsList from "@/components/SwErrorsList.vue"

import {
  PAGE_CHECKOUT,
  PAGE_ORDER_SUCCESS,
  PAGE_ORDER_PAYMENT_FAILURE,
} from "@/helpers/pages"
import {
  useBreadcrumbs,
  useCheckout,
  useUIState,
  useUser,
  useCart,
  getApplicationContext,
} from "@shopware-pwa/composables"
import { computed, ref, watch } from "@vue/composition-api"
import { handlePayment } from "@shopware-pwa/shopware-6-client"
import SwRegistrationForm from "@/components/forms/SwRegistrationForm.vue"
import SwButton from "@/components/atoms/SwButton.vue"
import SwPluginSlot from "sw-plugins/SwPluginSlot.vue"
import { SfHeading, SfLoader } from "@storefront-ui/vue"
import { useVuelidate } from "@vuelidate/core"
import SwAlert from "@/components/atoms/SwAlert.vue"

export default {
  name: "CheckoutPage",
  layout: "checkoutLayout",
  components: {
    SwButton,
    SwRegistrationForm,
    CheckoutSummary,
    SidebarOrderSummary,
    SidebarOrderReview,
    SwPluginSlot,
    SfHeading,
    SwAlert,
    SfLoader,
    SwErrorsList,
  },
  setup(props, { root }) {
    const isCreatingOrder = ref(false)
    const { setBreadcrumbs } = useBreadcrumbs(root)
    const { isLoggedIn, register, errors } = useUser(root)
    const { createOrder: invokeCreateOrder, loadings } = useCheckout(root)
    const { apiInstance } = getApplicationContext(root)
    const { refreshCart } = useCart(root)
    const errorMessages = ref([])

    const registrationFormData = ref()
    async function invokeRegister() {
      $v.value.$reset()
      const isFormCorrect = await $v.value.$validate()
      if (!isFormCorrect) {
        return
      }
      await register(registrationFormData.value)
    }
    const registrationFormErrors = computed(() => errors.register)

    const getRedirectUrl = (handlePaymentResponse: {
      apiAlias: string
      redirectUrl: string | null
    }) => handlePaymentResponse.redirectUrl
    async function createOrder() {
      $v.value.$reset()
      const isFormCorrect = await $v.value.$validate()
      if (!isFormCorrect) {
        return
      }
      // The steps from https://github.com/vuestorefront/shopware-pwa/issues/1419 are followed
      // turn on the loader
      isCreatingOrder.value = true
      try {
        // 1. place an order
        const order = await invokeCreateOrder()
        // 2. call handle-payment endpoint for further actions
        const handledPaymentResponse = await handlePayment(
          order.id,
          // pass finishUrl as a success page (used only in async payment flow)
          root.$routing.getAbsoluteUrl(
            `${PAGE_ORDER_SUCCESS}?orderId=${order.id}`
          ),
          // pass errorUrl as a failure page when the payment isn't done successfully
          // (used only in async payment flow)
          root.$routing.getAbsoluteUrl(
            `${PAGE_ORDER_PAYMENT_FAILURE}?orderId=${order.id}`
          ),
          apiInstance
        )
        // extract redirectUrl from handle-payment's response
        const redirectUrl = getRedirectUrl(handledPaymentResponse)
        if (!redirectUrl) {
          // redirect to the success page if there is no redirectUrl in ther response
          return root.$router.push(
            root.$routing.getUrl(`${PAGE_ORDER_SUCCESS}?orderId=${order.id}`)
          )
        }
        // perform a redirection to the external payment gateway
        window.location.href = redirectUrl
      } catch (error) {
        // TODO
        errorMessages.value = [
          root.$t("Your order cannot be placed. Please try again later."),
        ]
        isCreatingOrder.value = false
      }
    }

    watch(isLoggedIn, () => {
      refreshCart()
    })

    function goToShop() {
      root.$router.push(root.$routing.getUrl("/"))
    }

    setBreadcrumbs([
      {
        name: root.$t("Checkout"),
        path: PAGE_CHECKOUT,
      },
    ])

    const { switchState: switchLoginModalState } = useUIState(
      root,
      "LOGIN_MODAL_STATE"
    )

    const $v = useVuelidate() as any // until vuelidate fix types

    return {
      isLoggedIn,
      registrationFormData,
      invokeRegister,
      createOrder,
      loadings,
      goToShop,
      switchLoginModalState,
      $v,
      isCreatingOrder,
      errorMessages,
      registrationFormErrors,
    }
  },
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/variables";

.checkout {
  @include for-desktop {
    max-width: 1272px;
    margin: 0 auto;
    padding: 0 var(--spacer-base);
    display: flex;
  }
  &__main {
    padding: 0 var(--spacer-sm);
    @include for-desktop {
      flex: 1;
      padding: var(--spacer-lg) 0 0 0;
    }

    &__action {
      margin: var(--spacer-base) 0 0 0;
      display: flex;
      flex-wrap: wrap;
      button {
        width: 100%;
        @include for-desktop {
          width: 50%;
        }
        &:last-child {
          @include for-mobile {
            margin-top: var(--spacer-base);
          }
        }
      }
    }
  }
  &__aside {
    margin: var(--spacer-xl) 0 0 0;
    @include for-desktop {
      flex: 0 0 26.8125rem;
      margin: 0 0 0 var(--spacer-xl);
    }
  }
}

.sf-loader__overlay {
  flex-direction: column;
  .sf-heading {
    margin-bottom: var(--spacer-xl);
  }
}
</style>
