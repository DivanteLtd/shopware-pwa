<template>
  <div class="error-page">
    <SwImage
      class="error-page__image"
      :src="require('@/assets/error.svg')"
      alt="leaves"
    />
    <SfHeading
      v-for="error in error.messages"
      :key="error.code"
      class="error-page__heading"
      :level="1"
      :title="`${error.title}`"
      :description="$t(error.detail)"
    />
    <div class="error-page__actions">
      <SwButton
        class="error-page__actions-button"
        @click="$router.push($routing.getUrl('/'))"
      >
        <SfIcon
          class="error-page__actions-button-icon"
          icon="chevron_left"
          color="white"
          size="20px"
        />{{ $t("Return to homepage") }}
      </SwButton>
      <SwButton
        @click="$router.back()"
        class="sf-button--full-width sf-button--text error-page__actions-button"
      >
        Back
      </SwButton>
    </div>
  </div>
</template>
<script>
import { SfHeading, SfIcon } from "@storefront-ui/vue"
import SwButton from "@/components/atoms/SwButton.vue"
import SwImage from "@/components/atoms/SwImage.vue"

const customMessageDictionary = {
  404: "We can't find what you are looking for. Are you lost?",
  408: "The API is taking to long to respond",
  500: "Oops, something went terribly wrong :(",
  502: "Server couldn't complete your request. Please try again in few seconds.",
  503: "Server is really busy right now",
}

const getMessageForCode = (code) => customMessageDictionary[code]

export default {
  name: "ErrorPage",
  components: {
    SfHeading,
    SwButton,
    SwImage,
    SfIcon,
  },
  props: {
    error: {
      type: Object,
      default: () => ({}),
    },
  },
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/variables";
.error-page {
  box-sizing: border-box;
  text-align: center;
  padding: 0 var(--spacer-sm);
  @include for-desktop {
    margin: 0 auto;
    max-width: 1272px;
  }
  &__heading {
    --heading-title-margin: var(--spacer-sm) 0;
    --heading-title-color: var(--c-primary);
    --heading-description-color: var(--c-secondary-variant);
    --heading-description-font-size: var(--font-size--base);
    --heading-description-margin: 0 var(--spacer-base);
    --heading-description-font-family: var(--font-family--primary);
    --heading-title-font-weight: var(--font-weight--semibold);
    @include for-desktop {
      --heading-title-font-size: 5rem;
    }
  }
  &__image {
    --image-width: 10rem;
    min-height: 10rem;
    margin-top: var(--spacer-2xl);
    @include for-desktop {
      --image-width: 18rem;
      min-height: 18rem;
    }
  }
  &__actions {
    margin: var(--spacer-sm) 0 0 0;
    @include for-desktop {
      margin: var(--spacer-lg) 0 0 0;
    }
  }
  &__actions-button {
    --button-width: 100%;
    --button-height: 3.25rem;
    margin: 0 auto;
    &-icon {
      margin: 0 var(--spacer-base) 0 0;
    }
    @include for-desktop {
      --button-width: 20rem;
    }
  }
}
</style>
