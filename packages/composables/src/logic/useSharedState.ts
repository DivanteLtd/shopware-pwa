import { getApplicationContext } from "@shopware-pwa/composables";
import {
  computed,
  onServerPrefetch,
  Ref,
  ref,
  toRef,
  WritableComputedRef,
} from "@vue/composition-api";
import { ApplicationVueContext } from "../appContext";

const localSharedState: {
  [key: string]: Ref<any>;
} = {};

/**
 * Replacement for Vuex. Composable, which enables you to use shared state in your application.
 * State is shared both on server and client side.
 *
 * @alpha
 */
export function useSharedState(rootContext: ApplicationVueContext) {
  const { sharedStore, isServer } = getApplicationContext(
    rootContext,
    "useSharedState"
  );

  /**
   * Extends Ref type to share it server->client and globally in client side.
   *
   * `uniqueKey` is used to identify value after sending it from the server.
   * You can use the same key to reach this value, but setting the same keys on different values will cause values override.
   *
   * @alpha
   */
  function sharedRef<T>(uniqueKey: string): WritableComputedRef<T> {
    if (!isServer && !localSharedState[uniqueKey]) {
      localSharedState[uniqueKey] = ref(sharedStore[uniqueKey]);
    }

    const sharedRef: Ref<T> = isServer
      ? toRef(sharedStore, uniqueKey)
      : localSharedState[uniqueKey];

    return computed({
      get: () => {
        return sharedRef.value;
      },
      set: (val) => {
        sharedRef.value = val;
      },
    });
  }

  /**
   * If provided Ref is empty we can preload its value on server/client side.
   *
   * You can use it to fetch data on server side, then store value inside `sharedRef`. This way data fetching will not be invoked again on client side.
   * But it will also be invoked on client side if the value was not previously set on server side.
   *
   * @example
   * ```
   * // use inside setup method
   * const { sharedRef, preloadRef } = useSharedState( root )
   * // create shared Ref value
   * const gitHubStarsCount = sharedRef('our-gh-stars')
   * // preload Ref value if it is empty
   * preloadRef(gitHubStarsCount, async () => {
   *   // call the API only once
   *   gitHubStarsCount.value = await getStarsFromAPI()
   * })
   * ```
   *
   * @alpha
   */
  function preloadRef(refObject: Ref<unknown>, callback: () => Promise<void>) {
    if (!refObject.value) {
      if (isServer) {
        onServerPrefetch(async () => {
          await callback();
        });
      } else {
        callback();
      }
    }
  }

  return {
    sharedRef,
    preloadRef,
  };
}
