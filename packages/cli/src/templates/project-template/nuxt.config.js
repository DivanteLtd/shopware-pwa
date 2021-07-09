import extendNuxtConfig from "@shopware-pwa/nuxt-module/config"

export default extendNuxtConfig({
  head: {
    title: "Shopware PWA",
    meta: [{ hid: "description", name: "description", content: "" }],
  },
})
