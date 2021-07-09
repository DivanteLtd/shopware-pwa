import { AxiosError } from "axios";
import {
  ShopwareError,
  ShopwareApiError,
  ClientApiError,
} from "@shopware-pwa/commons/interfaces/errors/ApiError";

/**
 * http status codes thrown by API
 */
const API_ERROR_CODES = [400, 401, 403, 404, 409, 410, 412, 424, 500];

/**
 * @param {ShopwareApiError} error
 */
const extractApiErrorStatusCode = (error: ShopwareApiError): number => {
  return (
    (error.response && error.response.status) ||
    guessTheStatusCodeFromTheMessage(error.message)
  );
};

const guessTheStatusCodeFromTheMessage = (message: string): number => {
  // catch the specific timeout rejection from axios
  if (typeof message === "string" && message.startsWith("timeout of")) {
    return 408;
  }

  // offline mode exception
  if (typeof message === "string" && message.startsWith("Network Error")) {
    return 0;
  }

  return 500;
};

/**
 * Extract error message
 * Keep the original errors[] format if 400 Bad Request for validation purposes.
 * 400 responses always points to the specific field/param/option, thus should be kept entirely.
 *
 * @param {ShopwareApiError} error
 * @returns {(string|ShopwareError[])} single message if statusCode !== 400, array of native errors otherwise
 */
const extractApiErrorMessage = (error: ShopwareApiError): ShopwareError[] => {
  return error.response.data?.errors || [];
};

/**
 * Extract message from AxiosError which comes from somewhere else.
 * @param {AxiosError} error
 * @returns {string}
 */
const extractNotApiErrorMessage = (error: AxiosError): ShopwareError[] => [
  {
    detail: error.message,
    status: "",
    code: "",
    title: "",
    meta: {},
    source: {},
  },
];

/**
 * Extracts and create the consistent error object
 * Error message depends on:
 * 1. type of error (API or other network layer)
 * 2. status code
 *
 * @param {ShopwareApiError} error
 * @returns {Promise<ClientApiError>}
 */
export async function errorInterceptor(
  error: ShopwareApiError
): Promise<ClientApiError> {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  const statusCode = extractApiErrorStatusCode(error);
  const clientApiError: ClientApiError = {
    messages: API_ERROR_CODES.includes(statusCode)
      ? extractApiErrorMessage(error)
      : extractNotApiErrorMessage(error),
    statusCode: statusCode,
  };
  return Promise.reject(clientApiError);
}
