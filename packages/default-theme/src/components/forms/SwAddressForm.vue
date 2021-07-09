<template>
  <div class="sw-address">
    <p class="message">
      {{ $t("Keep your addresses and contact details updated.") }}
    </p>
    <SwErrorsList :list="formErrors" />
    <div class="sw-form" v-if="address">
      <div class="inputs-group">
        <SwInput
          v-model="address.firstName"
          name="firstName"
          :label="$t('First name')"
          :error-message="$t('First name is required')"
          :valid="!$v.address.firstName.$error"
          required
          class="sw-form__input"
          @blur="$v.address.firstName.$touch()"
        />
        <SwInput
          v-model="address.lastName"
          name="lastName"
          :label="$t('Last name')"
          :error-message="$t('Last name is required')"
          :valid="!$v.address.lastName.$error"
          required
          class="sw-form__input"
          @blur="$v.address.lastName.$touch()"
        />
      </div>
      <div class="inputs-group">
        <SfComponentSelect
          v-model="address.salutation.value"
          :label="$t('Salutation')"
          :error-message="$t('Salutation must be selected')"
          required
          :valid="!$v.address.salutation.$error"
          class="
            sf-select--underlined
            sw-form__input
            sf-input--has-text
            sf-component-select--underlined
          "
          @blur="$v.address.salutation.$touch()"
        >
          <SfComponentSelectOption
            v-for="salutationOption in getMappedSalutations"
            :key="salutationOption.id"
            :value="salutationOption"
          >
            {{ salutationOption.name }}
          </SfComponentSelectOption>
        </SfComponentSelect>
        <SwInput
          v-model="address.street"
          name="street"
          :label="$t('Street and house number')"
          :error-message="$t('Street is required')"
          :valid="!$v.address.street.$error"
          required
          class="sw-form__input"
          @blur="$v.address.street.$touch()"
        />
      </div>

      <div class="inputs-group">
        <SwInput
          v-model="address.city"
          name="city"
          :label="$t('City')"
          :error-message="$t('City is required')"
          :valid="!$v.address.city.$error"
          required
          class="sw-form__input"
          @blur="$v.address.city.$touch()"
        />
        <SwInput
          v-if="displayState"
          v-model="address.state"
          name="state"
          :label="$t('State/Province')"
          :error-message="$t('State is required')"
          :valid="!$v.address.state.$error"
          class="sw-form__input"
          :required="forceState"
          @blur="$v.address.state.$touch()"
        />
      </div>
      <div class="inputs-group">
        <SwInput
          v-model="address.zipcode"
          name="zipcode"
          :label="$t('Zip code')"
          :error-message="$t('Zip code is required')"
          :valid="!$v.address.zipcode.$error"
          required
          class="sw-form__input"
          @blur="$v.address.zipcode.$touch()"
        />

        <SfComponentSelect
          v-model="address.country.value"
          :label="$t('Country')"
          :error-message="$t('Country must be selected')"
          :valid="!$v.address.country.$error"
          required
          class="
            sf-select--underlined
            sw-form__input
            sf-component-select--underlined
          "
          @blur="$v.address.country.$touch()"
        >
          <SfComponentSelectOption
            v-for="countryOption in getMappedCountries"
            :key="countryOption.id"
            :value="countryOption"
          >
            {{ countryOption.name }}
          </SfComponentSelectOption>
        </SfComponentSelect>
      </div>
      <SwInput
        v-model="address.phoneNumber"
        name="phoneNumber"
        :label="$t('Phone number')"
        :error-message="$t('Wrong phone number')"
        :valid="!$v.address.phoneNumber.$error"
        required
        class="sw-form__input"
        @blur="$v.address.phoneNumber.$touch()"
      />

      <SwButton class="sw-form__button" @click="updateAddress">
        {{ existingAddress ? $t("Update the address") : $t("Add the address") }}
      </SwButton>
      <SwButton
        class="sf-button--outline sw-form__button sw-form__button--back"
        @click="$emit('cancel')"
      >
        {{ $t("Back") }}
      </SwButton>
    </div>
  </div>
</template>

<script>
import useVuelidate from "@vuelidate/core"
import { required, requiredIf } from "@vuelidate/validators"
import { computed, reactive, ref } from "@vue/composition-api"
import { SfAlert, SfComponentSelect } from "@storefront-ui/vue"
import {
  useCountries,
  useCountry,
  useUser,
  useSalutations,
  useNotifications,
} from "@shopware-pwa/composables"
import { mapCountries, mapSalutations } from "@shopware-pwa/helpers"
import SwButton from "@/components/atoms/SwButton.vue"
import SwInput from "@/components/atoms/SwInput.vue"
import SwErrorsList from "@/components/SwErrorsList.vue"

export default {
  name: "SwAddressForm",
  components: {
    SfAlert,
    SwInput,
    SwButton,
    SfComponentSelect,
    SwErrorsList,
  },
  props: {
    address: {
      type: Object,
      default: () => ({
        firstName: "",
        lastName: "",
        salutation: null,
        country: null,
        zipcode: "",
        street: "",
        city: "",
        phoneNumber: "",
      }),
    },
  },
  setup(props, { root }) {
    const { pushError, pushSuccess } = useNotifications(root)
    const { getSalutations } = useSalutations(root)
    const { addAddress, updateAddress, error: userError } = useUser(root)
    const { getCountries, error: countriesError } = useCountries(root)
    // simplify entities
    const getMappedCountries = computed(() => mapCountries(getCountries.value))
    const getMappedSalutations = computed(() =>
      mapSalutations(getSalutations.value)
    )
    // append a model
    props.address.salutation = ref(
      getMappedSalutations.value.find(
        (salutation) => salutation.id === props.address.salutationId
      )
    )
    props.address.country = ref(
      getMappedCountries.value.find(
        (country) => country.id === props.address.countryId
      )
    )
    const existingAddress = computed(() => !!props.address?.id)
    // compute selected id
    const selectedCountryId = computed(
      () =>
        (props.address.country.value && props.address.country.value.id) ||
        props.address.countryId
    )
    const selectedSalutationId = computed(
      () =>
        (props.address.salutation.value && props.address.salutation.value.id) ||
        props.address.salutationId
    )
    // check whether state is required
    const { displayState, forceState } = useCountry(
      selectedCountryId,
      getCountries
    )

    // address model ready to be sent to API
    const getAddressModel = computed(() => ({
      id: props.address._uniqueIdentifier,
      firstName: props.address.firstName,
      lastName: props.address.lastName,
      zipcode: props.address.zipcode,
      street: props.address.street,
      city: props.address.city,
      phoneNumber: props.address.phoneNumber,
      countryId: selectedCountryId.value,
      salutationId: selectedSalutationId.value,
    }))

    // try to save an address
    const saveAddress = () =>
      existingAddress.value
        ? updateAddress(getAddressModel.value)
        : addAddress(getAddressModel.value)

    return {
      addAddress,
      userError,
      countriesError,
      getMappedCountries,
      getMappedSalutations,
      displayState,
      forceState,
      saveAddress,
      pushError,
      pushSuccess,
      formErrors: userError,
      existingAddress,
      $v: useVuelidate({ $scope: "addressForm", $stopPropagation: true }),
    }
  },
  methods: {
    async updateAddress() {
      this.$v.$reset()
      const isFormCorrect = await this.$v.$validate()
      if (!isFormCorrect) {
        return
      }
      const addressId = await this.saveAddress()
      if (this.userError) {
        return this.pushError(
          this.$t("Your address couldn't be updated due to some errors")
        )
      }

      this.pushSuccess(this.$t("Your address has been updated"))
      this.$emit("success", addressId)
    },
  },
  validations: {
    address: {
      lastName: {
        required,
      },
      firstName: {
        required,
      },
      salutation: {
        required,
      },
      street: {
        required,
      },
      city: {
        required,
      },
      // state: {
      //   required: requiredIf(function () {
      //     return this.forceState
      //   }),
      // },
      zipcode: {
        required,
      },
      country: {
        required,
      },
      phoneNumber: {
        required,
      },
    },
  },
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/forms";
</style>
