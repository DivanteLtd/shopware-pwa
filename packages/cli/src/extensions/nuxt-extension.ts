import { GluegunToolbox } from "gluegun";
import { join } from "path";
const path = require("path");

module.exports = (toolbox: GluegunToolbox) => {
  const {
    print: { spin },
    filesystem: { exists },
  } = toolbox;

  /**
   * Generates new project using `create-nuxt-app`.
   * Not invoked if nuxt.config.js file already exist.
   * TODO:
   * - provide force flag
   * - provide params, which can be used in answers JSON
   */
  toolbox.generateNuxtProject = async () => {
    const spinner = spin("Preparing Nuxt project");
    const isNuxtGenerated = exists("nuxt.config.js");
    if (!isNuxtGenerated) {
      const baseDirectory = toolbox.plugin && toolbox.plugin.directory;
      let templateDirectory = `${baseDirectory}/templates`;

      if (!toolbox.filesystem.isDirectory(templateDirectory)) {
        templateDirectory = `${baseDirectory}/build/templates`;
      }
      const projectTemplatePath = join(templateDirectory, "project-template");
      await toolbox.filesystem.copyAsync(projectTemplatePath, ".", {
        overwrite: true,
      });

      // Rename missed .gitignore file
      const gitIgnoreExists = await toolbox.filesystem.existsAsync("gitignore");
      if (gitIgnoreExists) {
        await toolbox.filesystem.moveAsync("gitignore", ".gitignore");
      }
      spinner.succeed();
      return true;
    } else {
      spinner.succeed(
        "Preparing Nuxt project: project is already created. Remove `nuxt.config.js` to regenerate whole project."
      );
      return false;
    }
  };

  /**
   * Generates template files using ejs.
   */
  toolbox.generateTemplateFiles = async (
    { shopwareEndpoint, shopwareAccessToken, pwaHost } = toolbox.inputParameters
  ) => {
    const isConfigGenerated = exists("shopware-pwa.config.js");
    if (!isConfigGenerated) {
      await toolbox.template.generate({
        template: "shopware-pwa.config.js",
        target: `shopware-pwa.config.js`,
        props: {
          shopwareEndpoint,
          shopwareAccessToken,
          pwaHost,
        },
      });
    }
    const isEnvFileCreated = exists(".env");
    const isTemplateEnvFile = exists(".env.template");
    if (!isEnvFileCreated && isTemplateEnvFile) {
      await toolbox.filesystem.copyAsync(".env.template", ".env");
    }
  };

  toolbox.copyThemeFolder = async (folderName, destination) => {
    const dest = destination ? destination : folderName;
    const destinationExist = toolbox.filesystem.existsAsync(dest);
    if (destinationExist) return;
    return toolbox.filesystem.copyAsync(
      path.join(toolbox.getThemePath(), folderName),
      dest,
      { overwrite: true }
    );
  };
};
