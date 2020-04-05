import { computed, reactive, watch, ref, toRefs } from '@vue/composition-api'
import cookieUniversal from 'cookie-universal'
import { required } from 'vuelidate/lib/validators'

const stepData = reactive({
  salutationId: null,
  firstName: null,
  lastName: null,
  email: null,
  isValid: null,
})

const sharedCache = reactive({
  $v: null,
})

const cookies = cookieUniversal()

export const usePersonalDetails = () => {
  // const stepData = reactive(stepData)
  const personalDetailsCache = ref(null)
  // const vuelidateValidations = ref(null)

  const validations = computed(() => sharedCache.$v)
  const isValid = computed(() => {
    console.error('RECOMPUTED perisvalid', personalDetailsCache.value)
    return validations.value
      ? !validations.value.$invalid
      : personalDetailsCache.value?.isValid
  })

  const setValidations = ($v) => {
    console.error('SET VALIDATION')
    sharedCache.$v = $v
  }

  const objectToSave = computed(() => {
    return {
      ...stepData,
      isValid: isValid.value,
    }
  })
  watch(objectToSave, (value) => {
    console.error('CHANGED OBJECT', value)
    if (validations.value) {
      // const cookies = cookieUniversal()
      cookies.set('sw-checkout-0', value, {
        maxAge: 60 * 15, // 15 min to complete checkout,
      })
      console.error('SOOKIES SET!!!')
    } else {
      if (!personalDetailsCache.value) {
        personalDetailsCache.value = cookies.get('sw-checkout-0') || {}
        console.error('COOKIE IS LOADED', personalDetailsCache.value)
        Object.assign(stepData, personalDetailsCache.value)
      }
    }
  })

  const validate = ($v) => {
    validations.value && validations.value.$touch()
  }

  return {
    validations,
    setValidations,
    validate,
    ...toRefs(stepData),
    isValid,
  }
}

export const usePersonalDetailsValidationRules = {
  salutationId: {
    required,
  },
  firstName: {
    required,
  },
  lastName: {
    required,
  },
}
