import { computed } from "@vue/composition-api"
import {
  getApplicationContext,
  useCms,
  useNotifications,
} from "@shopware-pwa/composables"
import { getSeoUrls } from "@shopware-pwa/shopware-6-client"
import { getCmsTechnicalPath } from "@shopware-pwa/helpers"

// the "last-chance route always has a name starting with `all_` - nuxt default"
const PAGE_RESOLVER_ROUTE_PREFIX = "all_"

export const useDomains = (rootContext) => {
  const { router, routing, route, apiInstance } = getApplicationContext(
    rootContext,
    "useDomains"
  )

  const availableDomains = computed(() => routing.availableDomains || [])
  const currentDomainId = computed(() => routing.getCurrentDomain().domainId)
  const trimDomain = (url) => url.replace(routing.getCurrentDomain().url, "")
  const getCurrentPathWithoutDomain = () =>
    trimDomain(rootContext.$route.fullPath)

  const isRouteStatic = () =>
    !rootContext.$route.name.startsWith(PAGE_RESOLVER_ROUTE_PREFIX)
  const getNewDomainUrl = async (domain) => {
    let url = `${domain.url !== "/" ? `${domain.url}` : ""}`
    let path = ""
    if (isRouteStatic()) {
      path += getCurrentPathWithoutDomain()
    } else {
      const { categoryId, page } = useCms(rootContext)
      try {
        // find the correspoding URL for current page if it comes from page resolver - dynamically generated
        const seoResponse = await getSeoUrls(
          categoryId.value,
          domain.languageId,
          apiInstance
        )
        if (seoResponse.length && seoResponse[0].seoPathInfo) {
          path += seoResponse[0].seoPathInfo
        } else {
          path += getCmsTechnicalPath(page.value)
        }
      } catch (error) {
        const { pushWarning } = useNotifications(rootContext)
        pushWarning(
          rootContext.$t(
            "An error occured during changing the current language."
          )
        )
        return
      }
    }

    return `${url}/${path}`.replace(/\/\/+/, "/")
  }

  const changeDomain = async (domainId) => {
    if (domainId === currentDomainId.value) return

    const domainFound = availableDomains.value.find(
      (domain) => domain.domainId == domainId
    )

    if (!domainFound) {
      return
    }

    router.push(await getNewDomainUrl(domainFound))
  }

  return {
    availableDomains,
    currentDomainId,
    changeDomain,
  }
}