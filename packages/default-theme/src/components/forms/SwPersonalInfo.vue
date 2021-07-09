<template>
  <div class="sw-personal-info">
    <slot :user="user">
      <slot name="message">
        <p class="message">
          {{
            $t(
              "Feel free to edit any of your details below so your account is always " +
                "up to date"
            )
          }}
        </p>
      </slot>

      <SwErrorsList :list="getErrorMessage" />

      <div class="sw-personal-info__form form">
        <slot name="sw-form">
          <div class="inputs-group">
            <SwInput
              v-model="firstName"
              :valid="!$v.firstName.$error"
              :error-message="$t('First name is required')"
              name="firstName"
              :label="$t('First name')"
              class="sw-form__input"
              @blur="$v.firstName.$touch()"
            />
            <SwInput
              v-model="lastName"
              :valid="!$v.lastName.$error"
              :error-message="$t('Last name is required')"
              name="lastName"
              :label="$t('Last name')"
              class="sw-form__input"
              @blur="$v.lastName.$touch()"
            />
          </div>
          <SwInput
            v-model="email"
            :valid="!$v.email.$error"
            :error-message="$t('Proper email is required')"
            name="email"
            :label="$t('Your email')"
            class="sw-form__input"
            @blur="$v.email.$touch()"
          />
          <SwInput
            v-if="isEmailChanging"
            v-model="emailConfirmation"
            :valid="!$v.emailConfirmation.$error"
            :error-message="$t('Must match first one')"
            type="email"
            name="emailConfirmation"
            :label="$t('Confirm e-mail')"
            class="sw-form__input"
            required
            @blur="$v.emailConfirmation.$touch()"
          />
          <SwInput
            v-if="isEmailChanging"
            v-model="password"
            :valid="!$v.password.$error"
            :error-message="$t('Password cannot be empty')"
            type="password"
            name="password"
            :label="$t('Your password')"
            class="sw-form__input"
            required
            @blur="$v.password.$touch()"
          />
          <SwButton
            class="sw-form__button"
            :disabled="$v.$invalid && !isEmailChanging && !isNameChanging"
            @click="invokeUpdate"
          >
            {{ $t("Save Changes") }}
          </SwButton>
          <SfIcon
            v-if="isUpdating"
            :color="updated ? 'green-primary' : 'gray-primary'"
            size="14px"
            icon="check"
            style="margin-left: 10px"
          />
        </slot>
      </div>
    </slot>
  </div>
</template>

<script>
import useVuelidate from "@vuelidate/core"
import {
  required,
  email,
  requiredIf,
  minLength,
  sameAs,
} from "@vuelidate/validators"
import { SfIcon } from "@storefront-ui/vue"
import { useUser } from "@shopware-pwa/composables"
import SwButton from "@/components/atoms/SwButton.vue"
import SwInput from "@/components/atoms/SwInput.vue"
import SwErrorsList from "@/components/SwErrorsList.vue"

export default {
  name: "SwPersonalInfo",
  components: {
    SwInput,
    SwButton,
    SwErrorsList,
    SfIcon,
  },
  setup(props, { root }) {
    const {
      user,
      errors: userError,
      updatePersonalInfo,
      refreshUser,
      updateEmail,
    } = useUser(root)

    return {
      refreshUser,
      updatePersonalInfo,
      user,
      updateEmail,
      userError,
      $v: useVuelidate(),
    }
  },
  data() {
    return {
      updated: false,
      isUpdating: false,
      salutation:
        this.user && this.user.salutation
          ? {
              name: this.user.salutation.displayName,
              id: this.user.salutation.id,
            }
          : {},
      firstName: this.user && this.user.firstName,
      lastName: this.user && this.user.lastName,
      email: this.user && this.user.email,
      emailConfirmation: null,
      password: null,
    }
  },
  computed: {
    getErrorMessage() {
      return this.userError.updateEmail
    },
    isEmailChanging() {
      return this.email !== (this.user && this.user.email)
    },
    isNameChanging() {
      return (
        this.firstName !== (this.user && this.user.firstName) ||
        this.lastName !== (this.user && this.user.lastName)
      )
    },
    emailConfirmationValidation() {
      return this.isEmailChanging
        ? {
            required,
            email,
            sameAsEmail: sameAs("email"),
          }
        : {}
    },
  },
  validations() {
    return {
      firstName: {
        required,
      },
      lastName: {
        required,
      },
      email: {
        email,
        required,
      },
      emailConfirmation: this.emailConfirmationValidation, // take a dynamic one
      password: {
        required: requiredIf(function (password) {
          return this.isEmailChanging
        }),
        minLength: minLength(8),
      },
    }
  },
  methods: {
    async invokeUpdate() {
      this.updated = false
      this.isUpdating = false
      this.$v.$touch()
      if (this.$v.$invalid || (!this.isNameChanging && !this.isEmailChanging)) {
        return
      }
      if (this.isNameChanging) {
        this.isUpdating = true

        const profileChanged = await this.updatePersonalInfo({
          firstName: this.firstName,
          lastName: this.lastName,
          salutationId: this.salutation.id,
        })
        this.updated = profileChanged
      }
      if (this.isEmailChanging) {
        this.isUpdating = true
        const emailChanged = await this.updateEmail({
          email: this.email,
          emailConfirmation: this.emailConfirmation,
          password: this.password,
        })
        this.updated = emailChanged
      }
      await this.refreshUser()
    },
  },
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/forms";

.message {
  margin: 0 0 var(--spacer-xl) 0;
  color: var(--c-dark-variant);
}
</style>
