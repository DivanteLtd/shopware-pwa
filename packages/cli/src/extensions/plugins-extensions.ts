import { GluegunToolbox } from "gluegun";
import axios from "axios";
import { join } from "path";

module.exports = (toolbox: GluegunToolbox) => {
  toolbox.plugins = {};

  let runningRefreshPlugins: boolean = false;
  toolbox.plugins.invokeRefreshPlugins = async (devMode: boolean = false) => {
    if (runningRefreshPlugins) {
      return;
    }
    runningRefreshPlugins = true;
    await toolbox?.runtime?.run(`plugins`, { ci: true, devMode });
    runningRefreshPlugins = false;
  };

  toolbox.plugins.getPluginsConfig = async (
    options: {
      localPlugins?: boolean;
    } = {}
  ) => {
    if (options.localPlugins) {
      return toolbox.filesystem.readAsync(
        `sw-plugins/local-plugins.json`,
        "json"
      );
    }
    return toolbox.filesystem.readAsync(
      `.shopware-pwa/pwa-bundles.json`,
      "json"
    );
  };

  toolbox.fetchPluginsBuildArtifact = async ({
    shopwareEndpoint,
    authToken,
  }: {
    shopwareEndpoint: string;
    authToken: string;
  }) => {
    const pluginsConfigRsponse = await axios.post(
      `${toolbox.normalizeBaseUrl(
        shopwareEndpoint
      )}/api/_action/pwa/dump-bundles`,
      null,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return pluginsConfigRsponse.data.buildArtifact;
  };

  toolbox.fetchPluginsConfig = async ({ config }: { config: string }) => {
    const endpoint = toolbox.normalizeBaseUrl(
      toolbox.inputParameters.shopwareEndpoint
    );
    const url =
      config.indexOf(endpoint) >= 0
        ? config
        : `${toolbox.normalizeBaseUrl(
            toolbox.inputParameters.shopwareEndpoint
          )}/${config}`;
    const pluginsConfigResponse = await axios.get(url);
    return pluginsConfigResponse.data;
  };

  toolbox.loadPluginsAssetFile = async ({ asset }: { asset: string }) => {
    const endpoint = toolbox.normalizeBaseUrl(
      toolbox.inputParameters.shopwareEndpoint
    );
    const fileUrl =
      asset.indexOf(endpoint) >= 0
        ? asset
        : `${toolbox.normalizeBaseUrl(
            toolbox.inputParameters.shopwareEndpoint
          )}/${asset}`;

    const request = require("request");
    const loadFile = function () {
      return new Promise((resolve, reject) => {
        request(
          {
            url: fileUrl,
            encoding: null,
          },
          function (err: unknown, resp: unknown, body: any) {
            if (err) reject(err);
            toolbox.filesystem.write(
              ".shopware-pwa/pwa-bundles-assets.zip",
              body
            );
            resolve(true);
          }
        );
      });
    };
    await loadFile();
  };

  toolbox.unzipPluginsAssetsFile = async () => {
    const unzipper = require("unzipper");
    const assetsFile = await unzipper.Open.file(
      ".shopware-pwa/pwa-bundles-assets.zip"
    );
    await assetsFile.extract({
      path: ".shopware-pwa/pwa-bundles-assets",
    });
  };

  interface PluginConfig {
    slots: Array<{ name: string; file: string }>;
    layouts: Array<{ name: string; file: string }>;
    pages: Array<{ path: string; file: string }>;
    settings: unknown;
  }

  toolbox.buildPluginsTrace = async ({
    pluginsConfig,
    rootDirectory,
    pluginsTrace,
  }: any = {}) => {
    const pluginsRootDirectory =
      rootDirectory || ".shopware-pwa/pwa-bundles-assets";
    const pluginsMap = Object.assign({}, pluginsTrace);
    if (pluginsConfig) {
      const pluginNames = Object.keys(pluginsConfig);
      pluginNames.forEach((pluginName) => {
        if (!pluginsConfig[pluginName]) return;
        const pluginDirectory = `${pluginsRootDirectory}/${pluginName}`;
        const pluginDirExist = toolbox.filesystem.exists(pluginDirectory);
        if (pluginDirExist) {
          const pluginConfig: PluginConfig = toolbox.filesystem.read(
            `${pluginDirectory}/config.json`,
            "json"
          );
          if (pluginConfig) {
            pluginConfig?.slots?.forEach(
              async (slot: { name: string; file: string }) => {
                if (!pluginsMap[slot.name]) pluginsMap[slot.name] = [];
                pluginsMap[slot.name].push(
                  `~~/${pluginDirectory}/${slot.file}`
                );
              }
            );
            // Custom layouts
            if (pluginConfig?.layouts?.length) {
              pluginConfig.layouts.forEach(async (layoutConfig) => {
                const slotName = `sw-layouts-${layoutConfig.name}`;
                if (!pluginsMap[slotName]) pluginsMap[slotName] = [];
                pluginsMap[slotName].push(
                  `~~/${pluginDirectory}/${layoutConfig.file}`
                );
                const runtimeLayoutExist = toolbox.filesystem.exists(
                  `.shopware-pwa/source/layouts/${layoutConfig.name}.vue`
                );
                if (!runtimeLayoutExist) {
                  await toolbox.template.generate({
                    template: `/plugins/PluginSlotTemplate.vue`,
                    target: `.shopware-pwa/source/layouts/${layoutConfig.name}.vue`,
                    props: {
                      slotName,
                    },
                  });
                }
                await toolbox.template.generate({
                  template: `/plugins/PluginSlotTemplate.vue`,
                  target: `.shopware-pwa/sw-plugins/layouts/${layoutConfig.name}.vue`,
                  props: {
                    slotName,
                  },
                });
              });
            }
            // Custom pages
            if (pluginConfig?.pages?.length) {
              pluginConfig.pages.forEach(async (pageConfig) => {
                const { file, path, ...params } = pageConfig;
                const slotName = `sw-pages-${pageConfig.path}`;
                if (!pluginsMap[slotName]) pluginsMap[slotName] = [];
                pluginsMap[slotName].push(
                  `~~/${pluginDirectory}/${pageConfig.file}`
                );
                const runtimePageExist = toolbox.filesystem.exists(
                  `.shopware-pwa/source/pages/${pageConfig.path}.vue`
                );
                if (!runtimePageExist) {
                  await toolbox.template.generate({
                    template: `/plugins/PluginSlotTemplate.vue`,
                    target: `.shopware-pwa/source/pages/${pageConfig.path}.vue`,
                    props: {
                      slotName,
                      params,
                    },
                  });
                }
                await toolbox.template.generate({
                  template: `/plugins/PluginSlotTemplate.vue`,
                  target: `.shopware-pwa/sw-plugins/pages/${pageConfig.path}.vue`,
                  props: {
                    slotName,
                    params,
                  },
                });
              });
            }
          } else {
            toolbox.print.error(`Plugin ${pluginName} has no config file!`);
          }
        }
      });
    }
    return pluginsMap;
  };

  toolbox.buildPluginsMap = async (pluginsTrace: any) => {
    const finalMap: any = {};
    const pluginSlotNames = Object.keys(pluginsTrace);
    for (let index = 0; index < pluginSlotNames.length; index++) {
      const pluginSlotName = pluginSlotNames[index];
      const slotComponents = pluginsTrace[pluginSlotName];

      if (slotComponents.length === 1) {
        finalMap[pluginSlotName] = slotComponents[0];
      } else {
        const componentNames = slotComponents.map(
          (component: any, index: number) => {
            const arr = `${pluginSlotName}-${index + 1}`.split("-");
            let capital = arr.map((item, index) =>
              index
                ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()
                : item
            );
            return capital.join("");
          }
        );
        const bodyStart = "--> ";
        const bodyEnd = " <!--";
        const startingTags = [...componentNames]
          .reverse()
          .reduce((prev: string, current: string) => {
            return `${prev}<${current}>`;
          }, "");
        const endingTags = componentNames.reduce(
          (prev: string, current: string) => {
            return `${prev}</${current}>`;
          },
          ""
        );
        const body = bodyStart + startingTags + endingTags + bodyEnd;

        const componentImports = slotComponents.reduce(
          (prev: string, current: string, index: number) => {
            return `${prev}\nimport ${componentNames[index]} from '${current}'`;
          },
          ""
        );
        const components = slotComponents.reduce(
          (prev: string, current: string, index: number) => {
            return `${prev}\n    ${componentNames[index]},`;
          },
          ""
        );
        await toolbox.template.generate({
          template: `/plugins/GenericPlugin.vue`,
          target: `.shopware-pwa/sw-plugins/${pluginSlotName}.vue`,
          props: {
            body,
            componentImports,
            components,
          },
        });
        finalMap[pluginSlotName] = `sw-plugins/${pluginSlotName}.vue`;
      }
    }
    return finalMap;
  };

  toolbox.loadPluginsAssets = async () => {
    const FETCH_ERROR_MESSAGE =
      "Plugin settings are not fetched from shopware instance.";

    if (
      !toolbox.inputParameters.username ||
      !toolbox.inputParameters.password
    ) {
      toolbox.print.warning(FETCH_ERROR_MESSAGE);
      return;
    }
    try {
      const authToken = await toolbox.auth.getAuthToken();
      if (!authToken) {
        toolbox.print.error(FETCH_ERROR_MESSAGE);
        return;
      }

      const buildArtifact = await toolbox.fetchPluginsBuildArtifact({
        ...toolbox.inputParameters,
        authToken,
      });

      const pluginsConfig = await toolbox.fetchPluginsConfig(buildArtifact);

      await toolbox.filesystem.removeAsync(`.shopware-pwa/pwa-bundles.json`);
      await toolbox.filesystem.removeAsync(`.shopware-pwa/pwa-bundles-assets`);
      await toolbox.filesystem.removeAsync(
        `.shopware-pwa/pwa-bundles-assets.zip`
      );
      await toolbox.filesystem.writeAsync(
        ".shopware-pwa/pwa-bundles.json",
        pluginsConfig
      );

      await toolbox.loadPluginsAssetFile(buildArtifact);
      await toolbox.unzipPluginsAssetsFile();
    } catch (e) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        toolbox.print.error(
          `You provided bad cridentials for your shopware instance: ${toolbox.inputParameters.shopwareEndpoint} - plugins will not be added`
        );
      } else {
        toolbox.print.error(`UNEXPECTED ERROR ${e?.response ? e.response : e}`);
        console.error(e);
      }
      return;
    }
  };

  toolbox.createPluginsTemplate = async () => {
    const localPluginsDirName = "sw-plugins";
    const localPluginsConfigFilename = "local-plugins.json";

    const examplePluginDirectoryPath = join(
      localPluginsDirName,
      "my-local-plugin"
    );
    // create folders structure
    await toolbox.filesystem.dirAsync(localPluginsDirName);
    await toolbox.filesystem.dirAsync(examplePluginDirectoryPath);
    const localPluginsConfigExists = await toolbox.filesystem.existsAsync(
      join(localPluginsDirName, localPluginsConfigFilename)
    );
    if (!localPluginsConfigExists) {
      await toolbox.template.generate({
        template: "/plugins/" + localPluginsConfigFilename,
        target: "sw-plugins/" + localPluginsConfigFilename,
        props: {},
      });
    }
    const localPluginConfigExists = await toolbox.filesystem.existsAsync(
      join(examplePluginDirectoryPath, "config.json")
    );
    if (!localPluginConfigExists) {
      await toolbox.template.generate({
        template: "/plugins/my-local-plugin/config.json",
        target: "sw-plugins/my-local-plugin/config.json",
        props: {},
      });
    }
    const localPluginVueFileExists = await toolbox.filesystem.existsAsync(
      join(examplePluginDirectoryPath, "myLocalPlugin.vue")
    );
    if (!localPluginVueFileExists) {
      await toolbox.template.generate({
        template: "/plugins/my-local-plugin/myLocalPlugin.vue",
        target: "sw-plugins/my-local-plugin/myLocalPlugin.vue",
        props: {},
      });
    }
    const cmsReadmeExists = await toolbox.filesystem.existsAsync(
      join(localPluginsDirName, "readme.md")
    );
    if (!cmsReadmeExists) {
      await toolbox.template.generate({
        template: "/plugins/readme.md",
        target: "sw-plugins/readme.md",
        props: {},
      });
    }
  };
};
