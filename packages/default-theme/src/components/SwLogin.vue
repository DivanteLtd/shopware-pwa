<template>
  <div class="sw-login" @keyup.enter="invokeLogin">
    <SwPluginSlot name="login-form-before" />
    <div class="form sw-login__form">
      <SwErrorsList :list="loginErrors" />
      <SwInput
        v-model="email"
        name="loginEmail"
        :label="$t('Your email')"
        class="sw-form__input"
        type="email"
        :valid="!$v.email.$error"
        :disabled="isLoading"
        :error-message="$t('Email is required')"
        data-cy="email-input"
        @blur="$v.email.$touch()"
      />
      <SwInput
        v-model="password"
        name="loginPassword"
        :label="$t('Password')"
        type="password"
        class="sw-form__input"
        :valid="!$v.password.$error"
        :disabled="isLoading"
        :error-message="$t('Password is required')"
        data-cy="password-input"
        @blur="$v.password.$touch()"
      />
      <SwPluginSlot name="login-form-button">
        <SwButton
          class="sf-button--full-width sw-form__button"
          :disabled="isLoading"
          data-cy="submit-login-button"
          @click="invokeLogin"
        >
          {{ $t("Log in") }}
        </SwButton>
      </SwPluginSlot>
    </div>
  </div>
</template>

<script>
import { SfAlert } from "@storefront-ui/vue"
import useVuelidate from "@vuelidate/core"
import { required, email } from "@vuelidate/validators"
import { useUser, useSessionContext } from "@shopware-pwa/composables"
import SwPluginSlot from "sw-plugins/SwPluginSlot.vue"
import SwButton from "@/components/atoms/SwButton.vue"
import SwInput from "@/components/atoms/SwInput.vue"
import { computed, reactive, toRefs } from "@vue/composition-api"
import SwErrorsList from "@/components/SwErrorsList.vue"

export default {
  name: "SwLogin",
  components: { SwButton, SwInput, SfAlert, SwPluginSlot, SwErrorsList },
  setup(props, { root }) {
    const { login, loading, errors } = useUser(root)
    const { refreshSessionContext } = useSessionContext(root)
    const loginErrors = computed(() => errors.login || [])
    const state = reactive({
      email: "",
      password: "",
    })

    const rules = {
      email: {
        required,
        email,
      },
      password: {
        required,
      },
    }

    const $v = useVuelidate(rules, state)

    return {
      clientLogin: login,
      isLoading: loading,
      loginErrors,
      refreshSessionContext,
      $v,
      ...toRefs(state),
    }
  },
  methods: {
    async invokeLogin() {
      this.$v.$touch()
      if (this.$v.$invalid) {
        return
      }
      const loggedIn = await this.clientLogin({
        username: this.email,
        password: this.password,
      })
      if (loggedIn) {
        this.$emit("success")
        this.refreshSessionContext()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/forms";

.sw-login {
  &__alert {
    margin-bottom: var(--spacer-base);
  }
}
</style>
