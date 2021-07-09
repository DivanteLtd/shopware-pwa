import {
  config,
  setup,
  update,
  onConfigChange,
} from "@shopware-pwa/shopware-6-client";
import { defaultInstance, _createInstance } from "../src/apiService";
import { ConfigChangedArgs } from "../src";
import { datatype } from "faker";
import { defaultPwaConfigFile } from "@shopware-pwa/commons";
const consoleWarnSpy = jest.spyOn(console, "warn");

const DEFAULT_ENDPOINT = defaultPwaConfigFile.shopwareEndpoint;
const DEFAULT_TIMEOUT = 10000;

describe("Settings", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setup(); // we need to clean settings to default values before every test
    consoleWarnSpy.mockImplementationOnce(() => {});
  });

  describe("setup", () => {
    it("should have default timeout config", () => {
      expect(config.timeout).toEqual(DEFAULT_TIMEOUT);
    });

    it("should have default endpoint config", () => {
      expect(config.endpoint).toEqual(DEFAULT_ENDPOINT);
    });

    it("should change default endpoint after setup invocation", () => {
      setup({
        endpoint: "https://my-new-endpoint.com",
      });
      expect(config.endpoint).toEqual("https://my-new-endpoint.com");
    });

    it("should keep default endpoint between tests", () => {
      expect(config.endpoint).toEqual(DEFAULT_ENDPOINT);
    });

    it("should clean contextToken on setup without it", () => {
      update({ contextToken: "xxx" });
      setup();

      expect(config.contextToken).toBeFalsy();
    });
  });

  describe("update", () => {
    it("should have contextToken after update", () => {
      update({ contextToken: "xxx" });

      expect(config.contextToken).toEqual("xxx");
    });

    it("should have contextToken in axios defaults after update", () => {
      update({ contextToken: "xxx" });

      expect(
        defaultInstance.defaults.headers.common["sw-context-token"]
      ).toEqual("xxx");
    });

    it("should clean contextToken from axios detault headers after reset", () => {
      update({ contextToken: "xxx" });
      setup();

      expect(
        defaultInstance.defaults.headers.common["sw-context-token"]
      ).toBeUndefined();
    });

    it("should have languageId in axios defaults after update", () => {
      update({ languageId: "someLanguageId" });

      expect(defaultInstance.defaults.headers.common["sw-language-id"]).toEqual(
        "someLanguageId"
      );
    });

    it("should clean languageId from axios detault headers after reset", () => {
      update({ languageId: "someLanguageId" });
      setup();

      expect(
        defaultInstance.defaults.headers.common["sw-language-id"]
      ).toBeUndefined();
    });

    it("should have default config with empty invocation", () => {
      update();
      expect(config.accessToken).toEqual("SWSC40-LJTNO6COUEN7CJMXKLA");
      expect(config.contextToken).toEqual("");
    });

    it("should change defaultPaginationLimit", () => {
      update({ defaultPaginationLimit: 50 });
      expect(config.accessToken).toEqual("SWSC40-LJTNO6COUEN7CJMXKLA");
      expect(config.defaultPaginationLimit).toEqual(50);
    });

    it("should change default timeout", () => {
      update({ timeout: 50 });
      expect(config.timeout).toEqual(50);
      expect(defaultInstance.defaults.timeout).toBe(50);
    });
    it("should not change default timeout if it's falsy", () => {
      update({ timeout: undefined });
      expect(config.timeout).toBeUndefined();
    });
    it("should cast timeout to number if it's a string type", () => {
      update({ timeout: "12345" as any });
      expect(defaultInstance.defaults.timeout).toBe(12345);
    });
    it("should set the 0 timeout if casting does not work", () => {
      update({ timeout: "-----------" as any });
      expect(defaultInstance.defaults.timeout).toBe(0);
    });
  });

  describe("onConfigChange", () => {
    it("should notify, when update method has been called", () => {
      const contextToken = datatype.uuid();
      onConfigChange((configChangedArgs: ConfigChangedArgs) => {
        expect(configChangedArgs.config.contextToken).toEqual(contextToken);
      });
      update({ contextToken: contextToken });
    });

    it("should show console warning when no callback methods are connected", () => {
      const apiInstance = _createInstance();
      apiInstance.update({ contextToken: "xxx" }, { url: "/some-url" });
      expect(consoleWarnSpy).toBeCalledWith(
        '[shopware-6-api] After calling API method /some-url there is no "onConfigChange" listener. See https://shopware-pwa-docs.vuestorefront.io/landing/fundamentals/security.html#context-awareness'
      );
    });
  });
});
