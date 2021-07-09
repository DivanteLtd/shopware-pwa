import {
  createResponseInterceptor,
  errorInterceptor,
} from "../src/interceptors";
import { datatype } from "faker";

describe("apiInterceptors", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe("createResponseInterceptor", () => {
    it("should update contextToken after any request", async () => {
      const contextToken = datatype.uuid();
      const updateMethod = jest.fn();
      const responseInterceptor = createResponseInterceptor(updateMethod);
      responseInterceptor({
        data: { data: { id: "044a190a54ab4f06803909c3ee8063ef" } },
        headers: { "sw-context-token": contextToken },
        status: 200,
        statusText: "OK",
        config: {},
      });
      expect(updateMethod).toHaveBeenCalledWith({ contextToken }, {});
    });

    it("should get contextToken from response, not header, if there is one", () => {
      const contextToken = datatype.uuid();
      const updateMethod = jest.fn();
      const responseInterceptor = createResponseInterceptor(updateMethod);
      responseInterceptor({
        data: { contextToken: "044a190a54ab4f06803909c3ee8063ef" },
        headers: { "sw-context-token": contextToken },
        status: 200,
        statusText: "OK",
        config: {},
      });
      expect(updateMethod).toHaveBeenCalledWith(
        {
          contextToken: "044a190a54ab4f06803909c3ee8063ef",
        },
        {}
      );
    });
  });

  describe("errorInterceptor", () => {
    it("error should have undefined statusCode and message if no data exist in response", async () => {
      try {
        await errorInterceptor({ response: {} } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(500);
        expect(e.messages).toEqual([]);
      }
    });
    it("should throw an error with no message if errors array is null", async () => {
      try {
        await errorInterceptor({
          response: { status: 404, data: { errors: null } },
        } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(404);
        expect(e.messages).toStrictEqual([]);
      }
    });
    it("should have error with no message when the error has no detail property", async () => {
      try {
        await errorInterceptor({
          response: { status: 404, data: null },
        } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(404);
        expect(e.messages).toStrictEqual([]);
      }
    });

    it("should error message should be an empty string when no error", async () => {
      try {
        await errorInterceptor({
          response: {
            status: 404,
            data: { errors: [{ detail: "Resource not found" }] },
          },
        } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        // expect(e.statusCode).toEqual(404);
        //expect(e.message).toBe("Resource not found")
      }
    });
    it("should throw an error from parameters", async () => {
      try {
        await errorInterceptor({
          response: {
            status: 404,
            data: { errors: [{ detail: "Resource not found" }] },
          },
        } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(404);
        expect(e.messages).toStrictEqual([{ detail: "Resource not found" }]);
      }
    });
    it("should return object with error message taken from array's first element", async () => {
      try {
        await errorInterceptor({
          response: {
            status: 403,
            data: {
              errors: [
                { detail: "Customer is not logged in." },
                { detail: "" },
              ],
            },
          },
        } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(403);
        expect(e.messages).toStrictEqual([
          { detail: "Customer is not logged in." },
          { detail: "" },
        ]);
      }
    });
    it("should return origin errors array in case of 400", async () => {
      try {
        await errorInterceptor({
          response: {
            status: 400,
            data: {
              errors: [
                { detail: "Param X is required." },
                { detail: "Param Y should not be blank." },
              ],
            },
          },
        } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(400);
        expect(e.messages).toStrictEqual([
          { detail: "Param X is required." },
          { detail: "Param Y should not be blank." },
        ]);
      }
    });
    it("should return empty array in case of 400 and no errors in the content", async () => {
      try {
        await errorInterceptor({ response: { status: 400 } } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(400);
        expect(e.messages).toStrictEqual([]);
      }
    });
    it("should return general message in case of 500", async () => {
      try {
        await errorInterceptor({
          response: {
            status: 500,
            data: {
              errors: [
                { detail: "Param X is required." },
                { detail: "Param Y should not be blank." },
              ],
            },
          },
        } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(500);
        expect(e.messages).toStrictEqual([
          { detail: "Param X is required." },
          { detail: "Param Y should not be blank." },
        ]);
      }
    });
    it("should recognize the timeout rejection in axios specific case (timeout in config reached)", async () => {
      try {
        await errorInterceptor({ message: "timeout of 5ms" } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(408);
        expect(e.messages).toStrictEqual([
          {
            code: "",
            detail: "timeout of 5ms",
            meta: {},
            source: {},
            status: "",
            title: "",
          },
        ]);
      }
    });
    it("should recognize the Network error rejection in axios specific case (there is no internet connection - offline mode is on)", async () => {
      try {
        await errorInterceptor({ message: "Network Error" } as any);
        // Fail test if above expression doesn't throw anything.
        expect("didn't throw an error").toEqual("should throw an error");
      } catch (e) {
        expect(e.statusCode).toEqual(0);
        expect(e.messages).toStrictEqual([
          {
            code: "",
            detail: "Network Error",
            meta: {},
            source: {},
            status: "",
            title: "",
          },
        ]);
      }
    });
  });
});
