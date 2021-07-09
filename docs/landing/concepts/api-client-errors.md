# API specific errors & handling

Shopware-pwa provides an unified error's structure for all errors that may appear during working with Shopware 6 API.

## Shopware 6 API error structure

API throws an error in specific format. The API responds error details as an array of errors (always, even there is only one error in the response).

Default response containing errors looks like this:
```ts
{
  "errors": ShopwareError[]
}

```
where, `ShopwareError` interface is:
```ts
interface ShopwareError {
  status: string;   // HTTP Status code, like "403"
  code: string;     // internal error code, like "CHECKOUT__CUSTOMER_NOT_LOGGED_IN", or "VIOLATION::IS_BLANK_ERROR"
  title: string;    // title of an error, like "Forbidden" or "Not found"
  detail: string;   // additional information, like "Customer is not logged in."
  source?: any;      // only for HTTP 400 type errors, like `{"pointer": "/email"}`
  meta: any;        // unknown data that can be passed on backend side, like stacktrace in API's development mode
}
```

## Other API client's errors

Besides errors that may be returned by API, shopware-pwa recognize another type of errors: the Client errors itself, independent from API response:
- timeout (axios waits too long for the response, and timeout setting is reached)
- network error (there are some connection issues)

Each one is transformed into consistent format and gets appriopriate status code.

## Consisten format

`@shopware-pwa/shopware-6-client` package is responsible for connection layer between **shopware-pwa and API**. The error interceptor translates every (or almost every) type of an error into consistent one. Thanks to this, every error can be handled in the same way in the application in the next layers. 


```ts
interface ClientApiError {
  messages: ShopwareError[]; // contains array of ShopwareError objects, even if it's an issue on axios side
  statusCode: number;        // HTTP status code
}
```

## Example from the code

Here's a simple scenario of what may happen durin login and how to deal with such errors relying on `ClientApiError` & `SwErrorsList` vue component.

1. Let's say we are trying to log in. The code below show what it can look like:

    ```ts
    // somewhere in the logic

    const errors = ref([]); // errors reference that can be imported in the Vue component.

    try {
      await apiLogout();
      broadcast(INTERCEPTOR_KEYS.USER_LOGOUT);
    } catch (e) { // we expect the ClientApiError, always
      const err: ClientApiError = e;
      errors.value = err.messages; // (3) and need only array of messages to be displayed later on

      broadcast(INTERCEPTOR_KEYS.ERROR, {
        methodName: `[${contextName}][logout]`,
        inputParams: {},
        error: err,
      });
    } 

    ```

2. The customer provides the wrong data
3. `errors` object is fullfilled with `ClientApiErrors`'s `messages` array.
4. `SwErrorsList` component receives `loginErrors` (our `errors` reference from previous step).
    ```js
    import SwErrorsList from "@/components/SwErrorsList.vue"

    <SwErrorsList :list="loginErrors" />
    ```
5. Component displays the errors.

## SwErrorsList component

The component is located at `@/components/SwErrorsList.vue` and accepts only one prop: `list` and in fact that's the `ShopwareError[]` interface.

```ts
props: {
    list: {
      type: Array,
      default: [],
    },
  },
```

1. The component detects if there is only one message or more. If an amount of errors is more than 1 -> the errors are shown as a bullet list and prepended with `encountered problems` title. Otherwise the error message is only one string.

2. The error can be "field" related as well, that means the error comes together with HTTP 400 error and should display additional details like `field` that causes validation errors.