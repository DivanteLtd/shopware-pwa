import { GluegunToolbox } from "gluegun";
import axios from "axios";

/**
 * Provides snippets support for Shopware PWA
 *
 * shopware-pwa snippets will only import snippets from Shopware and append them to your locale file (currently in .shopware-pwa)
 *  adding the --export flag will also use that file to write snippets back to Shopware (in case you've added new ones)
 *
 * IMPORTANT: You cannot create snippets from the admin and import them into the PWA.
 * First they have to be created within your locales/[iso-code].json file and exported to Shopware.
 *
 * 1. Create PWA project with custom snippets
 * 2. Run shopware-pwa languages
 * 3. Run shopware-pwa snippets --export --username="admin" --password="shopware"
 */

module.exports = {
  name: "snippets",
  hidden: "true",
  run: async (toolbox: GluegunToolbox) => {
    const inputParameters = toolbox.inputParameters;
    Object.assign(inputParameters, toolbox.parameters.options);

    // when --ci parameter is provided, then we skip questions for default values
    const isCIrun = inputParameters.ci;

    if (!isCIrun) {
      const shopwareUsernameQuestion = !inputParameters.username && {
        type: "input",
        name: "username",
        message: "Shopware admin username:",
      };

      const shopwarePasswordQuestion = !inputParameters.password && {
        type: "password",
        name: "password",
        message: "Shopware admin password:",
      };

      const keepLocalQuestion = !inputParameters["keep-local"] && {
        type: "confirm",
        name: "keepLocal",
        initial: false,
        message: "Keep local Snippets (will not apply changes from Shopware)?",
      };

      const exportQuestion = !inputParameters["export"] && {
        type: "confirm",
        name: "export",
        initial: false,
        message: "Export Snippets to Shopware?",
      };

      const answers = await toolbox.prompt.ask([
        shopwareUsernameQuestion,
        shopwarePasswordQuestion,
        keepLocalQuestion,
        exportQuestion,
      ]);

      Object.assign(inputParameters, answers);
    }

    // Get languages from configuration file
    const path = require("path");

    const languageConfig = path.join(
      ".shopware-pwa",
      "sw-plugins",
      "languages.json"
    );
    const languages = require(languageConfig);

    const isoCodes = Object.keys(languages);

    const { username, password } = inputParameters;

    if (typeof username === "undefined" || typeof password === "undefined") {
      toolbox.print.error(
        "Please provide your admin credentials using the --username and --password options."
      );
      return;
    }

    // Get Auth Token for API
    const fetchAuthToken = async ({ shopwareEndpoint, username, password }) => {
      let authTokenResponse = null;

      try {
        authTokenResponse = await axios.post(
          `${shopwareEndpoint}/api/oauth/token`,
          {
            client_id: "administration",
            grant_type: "password",
            scopes: "write",
            username,
            password,
          }
        );
      } catch (error) {
        if (error.response.status == 401) {
          toolbox.print.error("Invalid credentials, aborting snippet import.");
          return -1;
        }
        toolbox.print.error(
          `Error during API authentication: ${error.response.status} (${error.response.statusText})`
        );
        return -1;
      }

      return authTokenResponse?.data?.access_token;
    };

    const authToken = await fetchAuthToken(inputParameters);

    if (authToken == -1) {
      return;
    }

    // We get all snippet sets and create a map locale => snippet set id
    const snippetSetsMap = await toolbox.snippets.getSnippetSetsByLocales(
      isoCodes,
      inputParameters.shopwareEndpoint,
      authToken
    );

    // Import all snippets through the API and recursively merge them with our local snippets
    const importSnippets = async () => {
      toolbox.print.info("Importing Snippets from Shopware");

      const { keepLocal } = inputParameters;

      if (!keepLocal) {
        toolbox.print.warning(
          "Local Snippets will be overridden (run with --keep-local to keep local changes)"
        );
      }

      // For every locale
      for (let [locale, snippetSetIdentifier] of Object.entries(
        snippetSetsMap
      )) {
        // Fetch snippets from API
        let flatRemoteSnippets = [];
        try {
          flatRemoteSnippets = await toolbox.snippets.fetchFromApi(
            inputParameters.shopwareEndpoint,
            authToken,
            snippetSetIdentifier
          );
        } catch (error) {
          toolbox.print.error(`Fetch from API error: ${error}`);
        }

        // Make them objects that we can write to locale files
        const remoteSnippets = toolbox.snippets.inflateSnippetObject(
          flatRemoteSnippets,
          {}
        );

        // Generate locale file path
        const localSnippetsPath = path.join("locales", `${locale}.json`);

        if (!toolbox.filesystem.exists(localSnippetsPath)) {
          toolbox.print.warning(
            `Creating '${localSnippetsPath}, have you deleted your local snippets?`
          );
          toolbox.filesystem.write(localSnippetsPath, {});
        }
        const localSnippets = require(localSnippetsPath);

        var mergedSnippets = {};
        const { merge } = require("lodash");

        if (keepLocal) {
          // First apply remote ones and then apply local ones
          mergedSnippets = merge(remoteSnippets.pwa, localSnippets);
        } else {
          mergedSnippets = merge(localSnippets, remoteSnippets.pwa);
        }

        // Merge old and new and write them into the local snippets file
        await toolbox.filesystem.writeAsync(localSnippetsPath, mergedSnippets);

        toolbox.print.success(
          `Wrote ${flatRemoteSnippets.length} snippets to '${localSnippetsPath}'.`
        );
      }
    };

    await importSnippets();

    const doExport = inputParameters.export;

    if (!doExport) {
      toolbox.print.info(
        "Stopping after import (run with --export option to export Snippets to Shopware)"
      );
      return;
    }

    // Export snippets from locales files and send them to the API
    const exportSnippets = async () => {
      toolbox.print.info("Exporting Snippets to Shopware");

      const localesPath = "locales";
      const files = await toolbox.filesystem.listAsync(localesPath);

      for (let i = 0; i < files.length; i++) {
        const snippetSet = require(path.join(localesPath, files[i]));

        const flatSnippets = toolbox.snippets.flattenSnippetObject(
          snippetSet,
          "pwa"
        );

        // Get locale from file name
        let locale = files[i].split(".")[0];

        // Get correct snippet set id for that locale
        try {
          toolbox.snippets.writeToApi(
            flatSnippets,
            snippetSetsMap[locale],
            inputParameters.shopwareEndpoint,
            authToken
          );
        } catch (error) {
          toolbox.print.error(`Export to API error: ${error}`);
        }
      }
    };

    await exportSnippets();
  },
};
