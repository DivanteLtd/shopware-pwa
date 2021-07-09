<template>
  <div class="sw-reset-password-confirm">
    <SfHeading :level="2" :title="$t('Reset password')" />
    <div class="sw-reset-password-confirm__form">
      <SwErrorsList :list="errors" />
      <SwResetPasswordForm v-if="!success" @reset="sendNewPassword" />
      <SfHeading
        v-else
        :level="3"
        :title="$t('Great! Your new password has been set.')"
      />
    </div>
    <SwButton
      @click="$router.push($routing.getUrl('/'))"
      class="sw-reset-password-confirm__home-btn"
    >
      <SfIcon icon="chevron_left" color="white" size="20px" />
      {{ $t("Return to homepage") }}
    </SwButton>
  </div>
</template>
<script>
import { ref } from "@vue/composition-api"
import { confirmPasswordReset } from "@shopware-pwa/shopware-6-client"
import {
  getApplicationContext,
  useBreadcrumbs,
} from "@shopware-pwa/composables"
import { SfLoader, SfHeading, SfNotification, SfIcon } from "@storefront-ui/vue"
import SwResetPasswordForm from "@/components/forms/SwResetPasswordForm.vue"

export default {
  name: "ResetPassword",
  components: {
    SfLoader,
    SfHeading,
    SfNotification,
    SfIcon,
    SwButton: () => import("@/components/atoms/SwButton.vue"),
    SwResetPasswordForm,
    SwErrorsList: () => import("@/components/SwErrorsList.vue"),
  },
  setup(props, { root }) {
    const { setBreadcrumbs } = useBreadcrumbs(root)
    setBreadcrumbs([
      {
        name: root.$t("Reset password"),
        path: "/reset-password",
      },
    ])
    const { apiInstance } = getApplicationContext(root, "NewsletterConfirm")
    const {
      context: {
        query: { hash },
      },
    } = root
    const showNotification = ref(true)
    const success = ref(false)
    const errors = ref([])

    const sendNewPassword = async ({ newPassword }) => {
      try {
        await confirmPasswordReset(
          {
            newPassword,
            hash,
          },
          apiInstance
        )
        success.value = true
      } catch (error) {
        errors.value = error.messages
      }
    }

    return {
      success,
      showNotification,
      sendNewPassword,
      errors,
    }
  },
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/variables";

.sw-reset-password-confirm {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 var(--spacer-sm);

  &__form {
    margin-bottom: var(--spacer-2xl);

    .errors-list-component {
      margin: 0 auto;
      max-width: 30vw;
      padding: var(--spacer-sm);
    }
  }

  &__home-btn {
    margin: 0 auto;
  }

  .sf-notification {
    max-width: inherit;
    margin: var(--spacer-xl) 0;
  }
}
</style>
