<template>
  <div>
    <form
      v-if="!formSent"
      action=""
      class="cms-element-contact-form"
      @submit.prevent="submit"
    >
      <SfSelect
        v-if="getMappedSalutations && getMappedSalutations.length > 0"
        class="select sf-select--underlined"
        v-model="salutationId"
        :label="$t('Salutation')"
        :valid="!$v.salutationId.$error"
        :error-message="$t('Salutation must be selected')"
        data-cy="salutation-select"
      >
        <SfSelectOption
          v-for="salutationOption in getMappedSalutations"
          :key="salutationOption.id"
          :value="salutationOption.id"
          data-cy="salutation-option"
        >
          {{ salutationOption.name }}
        </SfSelectOption>
      </SfSelect>

      <div class="input-group">
        <SfInput
          v-model="firstName"
          type="text"
          :label="$t('First name')"
          name="firstname"
          :error-message="$t('First name is required')"
          :disabled="false"
          :valid="!$v.firstName.$error"
          class="small input"
          @blur="$v.firstName.$touch()"
        />

        <SfInput
          v-model="lastName"
          type="text"
          :label="$t('Last name')"
          name="lastname"
          :error-message="$t('Last name is required')"
          :disabled="false"
          :valid="!$v.lastName.$error"
          class="small input"
          @blur="$v.lastName.$touch()"
        />
      </div>

      <div class="input-group">
        <SfInput
          v-model="email"
          type="text"
          :label="$t('Your email')"
          name="email"
          :error-message="$t('Proper email is required')"
          :disabled="false"
          :valid="!$v.email.$error"
          class="small input"
          @blur="$v.email.$touch()"
        />
        <SfInput
          v-model="phone"
          type="text"
          :label="$t('Phone number')"
          name="phone"
          :error-message="$t('Wrong phone number')"
          :disabled="false"
          :valid="!$v.phone.$error"
          @blur="$v.phone.$touch()"
        />
      </div>

      <div class="input-group">
        <SfInput
          v-model="subject"
          type="text"
          :label="$t('Subject')"
          name="subject"
          :error-message="$t('This field is required')"
          :disabled="false"
          :valid="!$v.subject.$error"
          @blur="$v.subject.$touch()"
        />
      </div>
      <div class="input-group">
        <SfInput
          v-model="comment"
          type="text"
          :label="$t('Your message')"
          name="message"
          :error-message="$t('This field is required')"
          :disabled="false"
          :valid="!$v.comment.$error"
          @blur="$v.comment.$touch()"
        />
      </div>

      <div class="input-group">
        <SwCheckbox
          v-model="checkbox"
          name="checkbox"
          :label="getConfirmationText"
          :valid="!$v.checkbox.$error"
          :error-message="$t('This field is required')"
          @blur="$v.checkbox.$touch()"
        />
      </div>

      <SwErrorsList :list="errorMessages" />

      <SwButton class="send button">
        {{ $t("send") }}
      </SwButton>
    </form>

    <div v-if="formSent" class="thanks-message">
      <SfIcon size="21px" icon="heart_fill" />
      <SfHeading
        :title="$t('Thanks!')"
        :description="$t('We\'ll contact you as soon as possible!')"
      />
    </div>
  </div>
</template>

<script>
import { SfSelect, SfInput, SfIcon, SfHeading } from "@storefront-ui/vue"
import useVuelidate from "@vuelidate/core"
import { required, email, minLength } from "@vuelidate/validators"
import { mapSalutations } from "@shopware-pwa/helpers"
import {
  useSalutations,
  getApplicationContext,
  useCms,
} from "@shopware-pwa/composables"
import { computed, reactive, ref, toRefs } from "@vue/composition-api"
import SwButton from "@/components/atoms/SwButton.vue"
import { sendContactForm } from "@shopware-pwa/shopware-6-client"
import SwErrorsList from "@/components/SwErrorsList.vue"
import SwCheckbox from "@/components/atoms/SwCheckbox.vue"

export default {
  name: "CmsElementContactForm",
  components: {
    SfSelect,
    SfInput,
    SwCheckbox,
    SwButton,
    SwErrorsList,
    SfIcon,
    SfHeading,
  },
  props: {
    content: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { root }) {
    const { apiInstance } = getApplicationContext(root, "SwFooter")
    const { getSalutations, error: salutationsError } = useSalutations(root)
    const { categoryId } = useCms(root)
    const getMappedSalutations = computed(() =>
      mapSalutations(getSalutations.value)
    )

    const getConfirmationText = computed(
      () =>
        props?.content?.config?.confirmationText?.value ||
        root.$t("I have read and agree with the data protection regulations.")
    )

    const state = reactive({
      salutationId: "",
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      comment: "",
      phone: "",
      checkbox: false,
    })

    const errorMessages = ref([])
    const formSent = ref(false)
    const sendForm = async () => {
      try {
        await sendContactForm(
          {
            ...state,
            navigationId: categoryId.value,
          },
          apiInstance
        )
        formSent.value = true
      } catch (e) {
        errorMessages.value = e.messages
      }
    }

    const rules = {
      email: {
        required,
        email,
      },
      firstName: {
        required,
        minLength: minLength(3),
      },
      lastName: {
        required,
        minLength: minLength(3),
      },
      salutationId: {
        required,
      },
      phone: {
        required,
        minLength: minLength(3),
      },
      subject: {
        required,
        minLength: minLength(3),
      },
      comment: {
        required,
        minLength: minLength(10),
      },
      checkbox: {
        required,
        isTrue: (value) => value === true,
      },
    }

    const $v = useVuelidate(rules, state)

    return {
      getMappedSalutations,
      salutationsError,
      getConfirmationText,
      sendForm,
      errorMessages,
      categoryId,
      formSent,
      $v,
      ...toRefs(state),
    }
  },
  methods: {
    async submit() {
      this.errorMessages = []
      this.$v.$touch()
      if (this.$v.$invalid) {
        this.errorMessages = [
          {
            detail: this.$t(
              "Please fill form data and check regulations acceptance."
            ),
          },
        ]
        return
      }

      await this.sendForm()
    },
  },
}
</script>

<style lang="scss" scoped>
.cms-element-contact-form {
  max-width: 1024px;
  margin: 0 auto;

  .input {
    &-group {
      display: flex;
      margin-bottom: var(--spacer-xl);

      > * {
        margin-right: var(--spacer-sm);
        width: 100%;
      }
    }
  }

  .sf-checkbox {
    margin-top: var(--spacer-sm);
    margin-bottom: var(--spacer-sm);
  }

  .button {
    &.send {
      margin-left: auto;
    }
  }
}
.thanks-message {
  --icon-color: var(--_c-blue-primary);
  --heading-title-color: var(--_c-green-primary);

  margin-top: var(--spacer-sm);
  margin-bottom: var(--spacer-sm);
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.select {
  margin-right: var(--spacer-sm);
  ::v-deep .sf-select__dropdown {
    font-size: var(--font-size--lg);
    font-family: var(--font-family--secondary);
    color: var(--c-text);
  }
}
</style>
