import { ShopwareError } from "@shopware-pwa/commons/interfaces/errors/ApiError";

/**
 * Get the messages from the API response (array of ShopwareErrors)
 * @deprecated there is no need to parse errors - it's better to open errors API that may have some crucial data included
 * @alpha
 */
export function getMessagesFromErrorsArray(errors: ShopwareError[]): string[] {
  if (!errors?.length || !Array.isArray(errors)) {
    return [];
  }
  // return a message only if detail and pointer property is provided in upcoming ShopwareError
  return errors
    .map(
      ({ detail, source }) =>
        detail &&
        source &&
        source.pointer &&
        `${source.pointer.substring(1)}: ${detail}`
    )
    .filter((message) => message);
}
