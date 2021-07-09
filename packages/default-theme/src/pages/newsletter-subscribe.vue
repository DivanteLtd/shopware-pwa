<template>
  <div class="sw-newsletter-subscribe">
    <SfHeading :level="2" :title="$t('Newsletter subscription')" />
    <SfLoader :loading="isLoading">
      <div>
        <SfNotification
          visible
          :message="
            success
              ? $t('Congratulations! Your email has been confirmed.')
              : $t('Your email hasn\'t been confirmed. Please try again.')
          "
          :type="success ? 'success' : 'danger'"
        />
      </div>
    </SfLoader>
    <SwButton
      @click="$router.push($routing.getUrl('/'))"
      class="sw-newsletter-subscribe__home-btn"
    >
      <SfIcon icon="chevron_left" color="white" size="20px" />
      {{ $t("Return to homepage") }}
    </SwButton>
  </div>
</template>
<script>
import { ref, onMounted } from "@vue/composition-api"
import {
  invokePost,
  getStoreNewsletterConfirmEndpoint,
} from "@shopware-pwa/shopware-6-client"
import {
  getApplicationContext,
  useBreadcrumbs,
} from "@shopware-pwa/composables"
import { SfLoader, SfHeading, SfNotification, SfIcon } from "@storefront-ui/vue"
export default {
  name: "NewsletterConfirm",
  components: {
    SfLoader,
    SfHeading,
    SfNotification,
    SfIcon,
    SwButton: () => import("@/components/atoms/SwButton.vue"),
  },
  setup(props, { root }) {
    const { setBreadcrumbs } = useBreadcrumbs(root)
    setBreadcrumbs([
      {
        name: root.$t("Newsletter subscription"),
        path: "/newsletter-subscribe",
      },
    ])
    const { apiInstance } = getApplicationContext(root, "NewsletterConfirm")
    const {
      context: {
        query: { em, hash },
      },
    } = root
    const isLoading = ref(true)
    const success = ref(false)

    onMounted(async () => {
      try {
        const result = await invokePost(
          {
            address: getStoreNewsletterConfirmEndpoint(),
            payload: {
              em,
              hash,
              option: "confirm",
            },
          },
          apiInstance
        )
        success.value = true
      } catch (error) {
        // to do sth with that error
        console.error("[newsletter-subscribe][onMounted]", error.messages)
      } finally {
        isLoading.value = false
      }
    })

    return {
      isLoading,
      success,
    }
  },
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/variables";

.sw-newsletter-subscribe {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 var(--spacer-sm);

  &__home-btn {
    margin: 0 auto;
  }

  .sf-notification {
    max-width: inherit;
    margin: var(--spacer-xl) 0;
  }

  ::v-deep .sf-notification__close {
    display: none;
  }
}
</style>
