import { GluegunToolbox } from "gluegun";
import axios from "axios";
import {
  defaultPwaConfigFile,
  ShopwarePwaConfigFile,
} from "@shopware-pwa/commons";

/**
 * read keys for contribution purposes - it's being used during the project initialization
 */
const INSTANCE_READ_API_KEY = "SWIACLLVSWNJQZKYRUDJYJHIWA";
const INSTANCE_READ_API_SECRET =
  "S0FMSjU4R3VFZ1Bkdjc1RGlhcE52MkNZbU1LVkhENHRFU1NxNjE";

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  toolbox.shopware = {};

  toolbox.defaultInitConfig = {
    ...defaultPwaConfigFile,
    INSTANCE_READ_API_KEY,
    INSTANCE_READ_API_SECRET,
  };
  toolbox.themeFolders = [".eslintrc.js"];

  /**
   * Project theme can be placed in one of the places
   * 1. direct relative path to project root folder ex. `./my-theme` directory and `theme: "my-theme"` setting in shopware-pwa.config.js
   * 2. in node_modules directory, like base theme ex. `theme: "@shopware-pwa/default-theme"` setting in shopware-pwa.config.js
   */
  toolbox.getThemePath = (themeName = toolbox.config.theme) => {
    const path = require("path");

    const directDistPath = path.join(themeName, "dist");
    const directDistPathExist = require("fs").existsSync(directDistPath);
    if (directDistPathExist) return directDistPath;

    const directPath = themeName;
    const directPathExist = require("fs").existsSync(directPath);
    if (directPathExist) return directPath;

    const nodePackageDistPath = path.join("node_modules", themeName, "dist");
    const nodePackageDistPathExist =
      require("fs").existsSync(nodePackageDistPath);
    if (nodePackageDistPathExist) return nodePackageDistPath;

    const nodePackagePath = path.join("node_modules", themeName);
    const nodePackagePathExist = require("fs").existsSync(nodePackagePath);
    if (nodePackagePathExist) return nodePackagePath;

    throw new Error(
      `No theme found for "${directPath}". Please make sure that path is correct or theme is installed from NPM.`
    );
  };

  toolbox.checkThemePath = () => {
    try {
      toolbox.getThemePath();
    } catch (e) {
      toolbox.print.error(e);
      process.exit(1);
    }
  };

  // enable this if you want to read configuration in from
  // the current folder's package.json (in a "shopware-pwa" property),
  // shopware-pwa.config.json, etc.
  toolbox.config = {
    ...toolbox.config,
    // load default config
    ...defaultPwaConfigFile,
    // load config file from generated project
    ...toolbox.config.loadConfig("shopware-pwa", process.cwd()),
  };

  /**
   * isProduction returns information if process is running from npm package.
   * Locally can be forced with flag `--compiled-build`
   */
  const devMode = require("fs").existsSync(`${__dirname}/../../src`);
  toolbox.isProduction = !devMode || process.argv.includes("--compiled-build");

  toolbox.isDefaultDemoData = () =>
    toolbox.normalizeBaseUrl(toolbox.defaultInitConfig.shopwareEndpoint) ===
    toolbox.normalizeBaseUrl(toolbox.config.shopwareEndpoint);

  /**
   * inputs for commands
   * - most important are params passed to CLI
   * - fallback is shopware-pwa.config.js file
   * - next fallback are default values
   */
  toolbox.inputParameters = {
    shopwareEndpoint:
      toolbox.parameters.options.shopwareEndpoint ||
      toolbox.config.shopwareEndpoint,
    shopwareAccessToken:
      toolbox.parameters.options.shopwareAccessToken ||
      toolbox.config.shopwareAccessToken,
    pwaHost: toolbox.parameters.options.pwaHost || toolbox.config.pwaHost,
    username:
      toolbox.parameters.options.username ||
      toolbox.parameters.options.u ||
      process.env.ADMIN_USER,
    password:
      toolbox.parameters.options.password ||
      toolbox.parameters.options.p ||
      process.env.ADMIN_PASSWORD,
    devMode: toolbox.parameters.options.devMode,
    ci: toolbox.parameters.options.ci,
    stage: toolbox.parameters.options.stage,
  };

  toolbox.reloadInputParameters = function ({
    shopwareEndpoint,
    shopwareAccessToken,
  }: Partial<ShopwarePwaConfigFile> = {}) {
    toolbox.inputParameters.shopwareEndpoint =
      toolbox.parameters.options.shopwareEndpoint ||
      toolbox.config.shopwareEndpoint ||
      shopwareEndpoint;
    toolbox.inputParameters.shopwareAccessToken =
      toolbox.parameters.options.shopwareAccessToken ||
      toolbox.config.shopwareAccessToken ||
      shopwareAccessToken;
    toolbox.inputParameters.pwaHost =
      toolbox.parameters.options.pwaHost ||
      toolbox.config.pwaHost ||
      shopwareEndpoint;
  };

  /**
   * Returns normalized base URL
   *
   * - trims ending slash
   * @param { string } baseUrl
   * @returns { string }
   */
  toolbox.normalizeBaseUrl = (baseUrl: string): string => {
    return toolbox.strings.trimEnd(baseUrl, "/");
  };

  /**
   * Checks if provided API has PWA extension installed
   * by making a request to the page resolver
   */

  toolbox.checkApiCompatibility = async () => {
    const checkingSpinner = toolbox.print.spin("Checking the provided API...");

    try {
      await axios.post(
        `${toolbox.normalizeBaseUrl(
          toolbox.config.shopwareEndpoint
        )}/store-api/pwa/page`,
        {
          path: "/",
        },
        {
          headers: {
            "sw-access-key": toolbox.config.shopwareAccessToken,
          },
        }
      );
      checkingSpinner.succeed("PWA plugin is installed");
      return;
    } catch (error) {
      checkingSpinner.stop();
      toolbox.print.error(
        "✘ PWA plugin is probably not installed yet on your Shopware 6 instance.\n- Check if your Shopware6 API is reachable\n- Visit https://github.com/elkmod/SwagShopwarePwa for more information."
      );
    }
  };

  toolbox.auth ??= {};

  let authTokenCache: string = "";
  toolbox.auth.getAuthToken = async (
    { shopwareEndpoint, username, password } = toolbox.inputParameters
  ) => {
    if (authTokenCache) return authTokenCache;

    try {
      const normalizedShopwareEndpoint =
        toolbox.normalizeBaseUrl(shopwareEndpoint);
      const authTokenResponse = await axios.post(
        `${normalizedShopwareEndpoint}/api/oauth/token`,
        {
          client_id: "administration",
          grant_type: "password",
          scopes: "write",
          username,
          password,
        }
      );

      authTokenCache = authTokenResponse?.data?.access_token;
      return authTokenCache;
    } catch (error) {
      if (!toolbox.isDefaultDemoData()) {
        if (error.response.status === 401) {
          toolbox.print.error(
            "Invalid credentials, aborting domain import. Please try again. This synchronization is required."
          );
        }
        toolbox.print.error(
          `Error during API authentication: ${error.response.status} (${error.response.statusText}).`
        );
      }
    }
  };
};
