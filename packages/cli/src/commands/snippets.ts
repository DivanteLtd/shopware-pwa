import { GluegunToolbox } from "gluegun";

module.exports = {
  name: "snippets",
  description: `Provides snippets support for Shopware PWA
 
  shopware-pwa snippets will only import snippets from Shopware and append them to your locale file (currently in .shopware-pwa)
   adding the --export flag will also use that file to write snippets back to Shopware (in case you've added new ones)
 
  IMPORTANT: You cannot create snippets from the admin and import them into the PWA.
  First they have to be created within your locales/[iso-code].json file and exported to Shopware.

  Usage:
  1. Create PWA project with custom snippets
  2. Run shopware-pwa snippets --export --username="admin" --password="shopware"

  Full docs: https://shopware-pwa-docs.vuestorefront.io/landing/concepts/snippets.html#translations-snippets
  `,
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
    await toolbox.runtime.run(`languages`);
    const path = require("path");

    const languageConfig = path.join(
      ".shopware-pwa",
      "sw-plugins",
      "languages.json"
    );
    const languages = await toolbox.filesystem.readAsync(
      languageConfig,
      "json"
    );

    if (!languages) {
      toolbox.print.error(
        "Language config does not exist. Pleas run 'yarn shopware-pwa languages' first."
      );
      return;
    }

    const isoCodes = Object.keys(languages);

    const { username, password } = inputParameters;

    if (!username || !password) {
      toolbox.print.error(
        "Please provide your admin credentials using the --username and --password options."
      );
      return;
    }

    // Get Auth Token for API
    const authToken = await toolbox.auth.getAuthToken();
    if (!authToken) {
      return -1;
    }

    // We get all snippet sets and create a map locale => snippet set id
    const snippetSetsMap = await toolbox.snippets.getSnippetSetsByLocales(
      isoCodes,
      inputParameters.shopwareEndpoint,
      authToken
    );

    await toolbox.snippets.importSnippets({
      inputParameters,
      snippetSetsMap,
      authToken,
    });

    const doExport = inputParameters.export;

    if (!doExport) {
      toolbox.print.info(
        "Stopping after import (run with --export option to export Snippets to Shopware)"
      );
      return;
    }

    await toolbox.snippets.exportSnippets({
      inputParameters,
      snippetSetsMap,
      authToken,
    });
  },
};
