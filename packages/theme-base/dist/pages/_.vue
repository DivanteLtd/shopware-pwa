<template>
  <div :key="$route.path">
    <component :is="getComponent" :cms-page="cmsPage" :page="page" />
  </div>
</template>
<script>
import {
  useCms,
  useIntercept,
  useNotifications,
  INTERCEPTOR_KEYS,
} from "@shopware-pwa/composables";

export default {
  name: "DynamicRoute",
  components: {},
  watchQuery(newQuery, oldQuery) {
    // Only execute component methods if currency changed
    return newQuery.currencyId !== oldQuery.currencyId;
  },
  asyncData: async ({ params, app, error: errorView, query, redirect }) => {
    const { search, page, error } = useCms(app);
    const { pushError } = useNotifications(app);
    const { broadcast } = useIntercept(app);

    const searchResult = await search(params.pathMatch, query);

    // direct user to the error page (keep http status code - so do not redirect)
    if (error.value) {
      if (error.value.statusCode === 404) {
        errorView(error.value);
      } else {
        // broadcast the error other than 404 in SwNotifications
        broadcast(INTERCEPTOR_KEYS.error, error.value);
      }
    }

    const unwrappedPage = page && page.value ? page.value : searchResult;
    const name =
      unwrappedPage && unwrappedPage.cmsPage && unwrappedPage.cmsPage.name;
    const cmsPage = unwrappedPage && unwrappedPage.cmsPage;

    // redirect to the cannnical URL if current path does not match the canonical one
    if (params.pathMatch && unwrappedPage && unwrappedPage.canonicalPathInfo) {
      if (unwrappedPage.canonicalPathInfo !== params.pathMatch) {
        redirect(301, app.$routing.getUrl(unwrappedPage.canonicalPathInfo));
      }
    }

    return {
      cmsPageName: name,
      page: unwrappedPage,
      cmsPage,
    };
  },
  computed: {
    getComponent() {
      if (this.page) {
        return () =>
          import("@/components/views/" + this.page.resourceType + ".vue");
      }
    },
  },
  methods: {},
};
</script>
