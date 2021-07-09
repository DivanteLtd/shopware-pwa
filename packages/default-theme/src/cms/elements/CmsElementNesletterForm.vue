<template>
  <div>
    <form
      action=""
      class="cms-element-sign-to-newsletter"
      @submit.prevent="submit"
    >
      <SfHeading
        :title="
          !formSent
            ? $t('Subscribe to Newsletter')
            : $t('Subscribed to Newsletter!')
        "
        :description="
          !formSent
            ? $t(
                'Be aware of upcoming sales and events. Receive gifts and special offers!'
              )
            : ''
        "
      />
      <div
        v-if="!formSent"
        class="form-actions"
        :class="{ bg: newsletterForm }"
      >
        <SwButton
          v-if="!newsletterForm"
          class="send button toggle-input"
          @click="
            {
              {
                newsletterForm = !newsletterForm
              }
            }
          "
        >
          {{ $t("Subscribe") }}
        </SwButton>

        <transition name="sf-fade" mode="out-in">
          <SfInput
            v-if="newsletterForm"
            v-model="email"
            type="email"
            name="email"
            :label="$t('Email address')"
            :error-message="$t('Please enter a valid email address')"
            :valid="!$v.email.$error"
            class="email small input"
            @blur="$v.email.$touch()"
          />
        </transition>

        <SwErrorsList :list="errorMessages" />

        <span>
          <SwButton
            v-if="newsletterForm"
            class="send button sf-button--full-width"
          >
            {{ $t("Subscribe") }}
          </SwButton>
        </span>
      </div>
    </form>
  </div>
</template>

<script>
import { SfInput, SfHeading } from "@storefront-ui/vue"
import useVuelidate from "@vuelidate/core"
import { required, email } from "@vuelidate/validators"
import SwButton from "@/components/atoms/SwButton.vue"
import { newsletterSubscribe } from "@shopware-pwa/shopware-6-client"
import { ref } from "@vue/composition-api"
import { getApplicationContext } from "@shopware-pwa/composables"
import SwErrorsList from "@/components/SwErrorsList.vue"

export default {
  name: "CmsElementNewsletterForm",
  components: {
    SfInput,
    SwButton,
    SfHeading,
    SwErrorsList,
  },
  props: {
    content: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      newsletterForm: false,
    }
  },
  setup(props, { root }) {
    const { apiInstance } = getApplicationContext(root, "SwFooter")
    const errorMessages = ref([])
    const email = ref(null)
    const formSent = ref(false)
    const sendForm = async () => {
      try {
        await newsletterSubscribe(
          {
            email: email.value,
            option: "subscribe",
            storefrontUrl:
              window &&
              window.location &&
              `${window.location.protocol}//${window.location.hostname}`,
          },
          apiInstance
        )
        formSent.value = true
      } catch (e) {
        errorMessages.value = e.messages
      }
    }

    return {
      email,
      sendForm,
      errorMessages,
      formSent,
      $v: useVuelidate(),
    }
  },
  methods: {
    async submit() {
      this.errorMessages = []
      this.$v.$touch()
      if (this.$v.$invalid) {
        return
      }

      await this.sendForm()
    },
  },
  validations: {
    email: {
      required,
      email,
    },
  },
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/variables";

.cms-element-sign-to-newsletter {
  --heading-title-color: var(--c-white);
  --heading-description-color: var(--c-white);

  align-items: center;
  background-color: rgba($color: #000000, $alpha: 0.7);
  display: flex;
  flex-direction: column;
  min-height: 231px;
  justify-content: space-around;
  padding-bottom: var(--spacer-sm);
  padding-left: var(--spacer-sm);
  padding-right: var(--spacer-sm);
  padding-top: var(--spacer-sm);

  .error-alert {
    margin-bottom: var(--spacer-sm);
  }

  .email {
    --input-color: var(--c-black);
    --input-border-color: var(--c-black);

    margin-bottom: var(--spacer-sm);
  }

  .email ::v-deep input:-webkit-autofill,
  input:-internal-autofill-selected {
    box-shadow: 0 0 0 1000px var(--c-white) inset;
    background-color: transparent;
    text-indent: var(--spacer-sm);
  }

  .toggle-input {
    --button-width: 218px;
  }

  @include for-desktop {
    flex-direction: row;
  }

  .form-actions {
    padding: var(--spacer-sm);

    &.bg {
      background-color: rgba($color: #ffffff, $alpha: 0.8);
    }
  }
}
</style>
