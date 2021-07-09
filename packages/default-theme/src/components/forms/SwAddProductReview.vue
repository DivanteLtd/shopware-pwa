<template>
  <div class="sw-add-product-review">
    <div v-if="!wasReviewSent">
      <SfHeading :title="$t('Leave a review!')" :level="3" />
      <SfHeading
        :title="$t('Share your experiences with other customers.')"
        :level="4"
      />
      <form
        v-if="isLoggedIn"
        action=""
        class="add-review-form"
        @submit.prevent="submitForm"
      >
        <div class="input-group">
          <SwRating
            :score="Number.parseInt(reviewRating)"
            :max="5"
            :hover-effect="true"
            @click="setCurrentRating"
          />
          <SwInput
            v-model="reviewTitle"
            type="text"
            :label="$t('Subject')"
            name="title"
            :error-message="$t('This field is required')"
            class="small input"
          />

          <textarea
            v-model="reviewContent"
            name="desc"
            class="description-field"
            :placeholder="$t('Write review')"
          >
          </textarea>
        </div>

        <SwErrorsList :list="errorMessages" />

        <SwButton class="send button">
          {{ !isSending ? $t("Add review") : $t("Sending...") }}
        </SwButton>
      </form>

      <SwButton
        v-if="!isLoggedIn"
        class="login button color"
        @click="switchLoginModalState"
      >
        {{ $t("Log in") }}
      </SwButton>
    </div>
    <div v-else>
      <SfHeading
        :title="$t('Your review has been sent. Thank you!')"
        :level="3"
      />
    </div>
    <SfDivider />
  </div>
</template>

<script>
import { SfHeading, SfDivider } from "@storefront-ui/vue"
import { addProductReview } from "@shopware-pwa/shopware-6-client"
import { ref, computed } from "@vue/composition-api"
import {
  useUser,
  useUIState,
  getApplicationContext,
} from "@shopware-pwa/composables"

export default {
  name: "SwAddProductReview",
  components: {
    SfHeading,
    SfDivider,
    SwInput: () => import("@/components/atoms/SwInput.vue"),
    SwButton: () => import("@/components/atoms/SwButton.vue"),
    SwErrorsList: () => import("@/components/SwErrorsList.vue"),
    SwRating: () => import("@/components/atoms/SwRating.vue"),
  },
  props: {
    productId: {
      type: String,
      required: true,
    },
  },
  setup(props, { root }) {
    const { isLoggedIn } = useUser(root)
    const { apiInstance } = getApplicationContext(root, "SwAddProductReview")
    const { switchState: switchLoginModalState } = useUIState(
      root,
      "LOGIN_MODAL_STATE"
    )

    const errorMessages = ref([])
    const reviewTitle = ref(null)
    const reviewContent = ref(null)
    const reviewRating = ref(0)
    const wasReviewSent = ref(false)
    const isSending = ref(false)
    const reviewRequestData = computed(() => ({
      title: reviewTitle.value,
      content: reviewContent.value,
      points: reviewRating.value,
    }))
    const setCurrentRating = (rating) => {
      reviewRating.value = rating
    }
    const submitForm = async () => {
      isSending.value = true
      try {
        await addProductReview(
          props.productId,
          reviewRequestData.value,
          apiInstance
        )
        wasReviewSent.value = true
      } catch (error) {
        console.error("[SwAddProductReview][submitForm]: ", error)
        errorMessages.value = error.messages
      }
      isSending.value = false
    }

    return {
      isLoggedIn,
      switchLoginModalState,
      reviewTitle,
      reviewContent,
      reviewRating,
      errorMessages,
      submitForm,
      setCurrentRating,
      wasReviewSent,
      isSending,
    }
  },
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/forms";

.sw-add-product-review {
  width: 100%;
}

.add-review-form {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .button {
    &.send {
      width: 100%;
      margin-top: var(--spacer-xl);
      background-color: var(--_c-gray-primary);
    }
  }

  .input-group {
    width: 100%;
  }

  .description-field {
    border: 1px solid var(--c-light);
    box-sizing: border-box;
    font-size: var(--font-size--lg);
    margin-top: var(--spacer-base);
    min-height: 200px;
    padding: var(--spacer-base);
    width: 100%;

    &:focus {
      outline-color: var(--_c-green-primary);
    }
  }
}

.login.button {
  background-color: var(--_c-gray-primary);
  width: 100%;
  margin-top: var(--spacer-base);
  &:active {
    background: var(--c-link);
  }
}

.sw-rating {
  margin-bottom: var(--spacer-base);
  margin-top: var(--spacer-base);
}
</style>
