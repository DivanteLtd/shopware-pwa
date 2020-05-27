export const state = () => ({
  cart: null,
  page: null,
  user: null,
  sessionContext: null,
  locales: ['en-GB', 'de-DE'],
  locale: 'en-GB',
  isGridView: true,
})

export const mutations = {
  SET_CART(state, cart) {
    state.cart = cart
  },
  SET_PAGE(state, page) {
    state.page = page
  },
  SET_USER(state, user) {
    state.user = user
  },
  SET_SESSION_CONTEXT(state, sessionContext) {
    state.sessionContext = sessionContext
  },
  SET_LANG(state, locale) {
    if (state.locales.includes(locale)) {
      state.locale = locale
    }
  },
  SET_IS_GRID_VIEW(state, flag) {
    state.isGridView = flag
  },
}

export const getters = {
  getCart: (state) => state.cart,
  getPage: (state) => state.page,
  getUser: (state) => state.user,
  getSessionContext: (state) => state.sessionContext
}
