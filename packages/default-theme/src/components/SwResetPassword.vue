<template>
  <div class="sw-reset-password" @keyup.enter="invokeResetPassword">
    <SwErrorsList :list="resetPasswordErrors" />
    <div v-if="!emailSent" class="form sw-reset-password__form">
      <SfAlert
        v-if="userError"
        class="sw-reset-password__alert"
        type="danger"
        :message="userError.message"
        data-cy="reset-alert"
      />
      <SwInput
        v-model="email"
        name="email"
        :label="$t('Your email')"
        class="sw-form__input"
        :valid="!$v.email.$error"
        :error-message="$t('Valid email is required')"
        data-cy="email-input"
        @blur="$v.email.$touch()"
      />
      <SwButton
        class="sf-button--full-width sw-form__button"
        data-cy="submit-reset-button"
        @click="invokeResetPassword"
      >
        {{ $t("Resend password") }}
      </SwButton>
    </div>
    <SfHeading
      v-if="emailSent"
      :title="
        $t(
          'You should receive a link in a few moments. Please open that link to reset your password.'
        )
      "
      :level="5"
      class="bottom__heading"
    />
  </div>
</template>

<script>
import { SfAlert, SfHeading } from "@storefront-ui/vue"
import useVuelidate from "@vuelidate/core"
import { required, email } from "@vuelidate/validators"
import { useUser } from "@shopware-pwa/composables"
import SwButton from "@/components/atoms/SwButton.vue"
import SwInput from "@/components/atoms/SwInput.vue"
import SwErrorsList from "@/components/SwErrorsList.vue"
import { computed } from "@vue/composition-api"

export default {
  name: "SwResetPassword",
  components: { SwButton, SwInput, SfAlert, SfHeading, SwErrorsList },
  data() {
    return {
      email: "",
      emailSent: false,
    }
  },
  setup(props, { root }) {
    const { resetPassword, errors } = useUser(root)
    return {
      resetPassword,
      $v: useVuelidate(),
      resetPasswordErrors: computed(() => errors.resetPassword || []),
    }
  },
  validations: {
    email: {
      required,
      email,
    },
  },
  methods: {
    async invokeResetPassword() {
      this.$v.$touch()

      if (this.$v.$invalid) {
        return
      }

      this.emailSent = await this.resetPassword({
        email: this.email,
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/forms";

.sw-reset-password {
  &__alert {
    margin-bottom: var(--spacer-2xs);
  }
  &__header {
    margin-bottom: var(--spacer-base);
  }
}
</style>
