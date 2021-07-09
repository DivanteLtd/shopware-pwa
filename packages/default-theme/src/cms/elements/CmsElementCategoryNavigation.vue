<template>
  <div class="cms-element-category-navigation">
    <div class="cms-element-category-navigation__header">
      <SfHeading :level="3" :title="navTitle" />
    </div>
    <div class="cms-element-category-navigation__menu">
      <SfHeading
        :description="$t('No subcategories')"
        v-if="!navigation.length"
      />
      <SwAccordion :show-chevron="true">
        <SwAccordionItem
          v-for="accordion in navigation"
          :key="accordion.id"
          :header="accordion.translated.name"
        >
          <template #header="{ header, isOpen, accordionClick }">
            <div class="cms-element-category-navigation__menu-item">
              <nuxt-link :to="$routing.getUrl(getCategoryUrl(accordion))">
                <SwButton
                  :aria-pressed="isOpen.toString()"
                  :aria-expanded="isOpen.toString()"
                  :class="{ 'sf-accordion-item__header--open': isOpen }"
                  class="sf-button--pure sf-accordion-item__header"
                >
                  {{ header }}
                </SwButton>
              </nuxt-link>
              <SfChevron
                tabindex="0"
                class="sf-accordion-item__chevron"
                :class="{ 'sf-chevron--right': !isOpen }"
                @click.native="accordionClick"
              />
            </div>
          </template>
          <template v-if="accordion.children.length > 0">
            <SfList>
              <SfListItem v-for="item in accordion.children" :key="item.id">
                <nuxt-link
                  v-if="item.route && item.translated.name"
                  :to="$routing.getUrl(getCategoryUrl(item))"
                >
                  <SfMenuItem :label="item.translated.name" />
                </nuxt-link>
              </SfListItem>
            </SfList>
          </template>
          <template v-else>
            <nuxt-link
              v-if="accordion.route && accordion.translated.name"
              :to="$routing.getUrl(getCategoryUrl(accordion))"
            >
              {{ $t("See") }} {{ accordion.translated.name }}
            </nuxt-link>
          </template>
        </SwAccordionItem>
      </SwAccordion>
    </div>
  </div>
</template>

<script>
import { SfList, SfMenuItem, SfHeading, SfChevron } from "@storefront-ui/vue"
import { getStoreNavigation } from "@shopware-pwa/shopware-6-client"
import { useCms, getApplicationContext } from "@shopware-pwa/composables"
import { ref, computed, onMounted } from "@vue/composition-api"
import SwButton from "@/components/atoms/SwButton.vue"
import SwAccordion from "@/components/organisms/SwAccordion.vue"
import { getCategoryUrl } from "@shopware-pwa/helpers"

export default {
  components: {
    SwAccordion,
    SfList,
    SfMenuItem,
    SfHeading,
    SfChevron,
    SwButton,
  },
  name: "CmsElementCategoryNavigation",
  props: {
    content: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { root }) {
    const { apiInstance } = getApplicationContext(
      root,
      "CmsElementCategoryNavigation"
    )
    const { categoryId } = useCms(root)
    const navTitle = ref(root.$t("Subcategories"))
    const navigationElements = ref([])
    const navigation = computed(() => navigationElements.value)

    onMounted(async () => {
      try {
        const response = await getStoreNavigation(
          {
            requestActiveId: categoryId.value,
            requestRootId: categoryId.value,
          },
          apiInstance
        )
        navigationElements.value = response
      } catch (error) {
        console.warn(
          "CmsElementCategoryNavigation:onMounted:getStoreNavigation",
          error.messages
        )
      }
    })

    return { navTitle, navigation, getCategoryUrl }
  },
}
</script>

<style lang="scss" scoped>
@import "@/cms/settings.scss";

.cms-element-category-navigation {
  &__header {
    --heading-title-font-weight: var(--font-weight--light);
    --heading-title-font-size: var(--font-size--xl);
    flex: 0 0 15%;
    align-items: center;
    display: flex;
    height: 2.4rem;
    padding: var(--spacer-base) var(--spacer-sm);
    @include for-desktop {
      border-top: 1px solid var(--c-light);
      border-bottom: 1px solid var(--c-light);
    }
  }
  &__menu {
    flex: 0 0 15%;
    @include for-desktop {
      padding: var(--spacer-sm);
      width: 12rem;
    }

    &__aside {
      display: flex;
      align-items: center;
      flex: 0 0 15%;
      padding: var(--spacer-base) var(--spacer-xl);
      border-right: 1px solid var(--c-light);
    }
  }
  &__menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
