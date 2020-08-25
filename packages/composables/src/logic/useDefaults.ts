import { ApplicationVueContext, getApplicationContext } from "../appContext";
import { Includes } from "@shopware-pwa/commons/interfaces/search/SearchCriteria";
import { Association } from "@shopware-pwa/commons/interfaces/search/Association";
import { warning } from "@shopware-pwa/commons";

/**
 * Returns default config depending on config key.
 *
 * @beta
 */
export const useDefaults = (
  rootContext: ApplicationVueContext,
  defaultsKey: string
): {
  getIncludesConfig: () => Includes;
  getAssociationsConfig: () => Association[];
} => {
  const { shopwareDefaults } = getApplicationContext(
    rootContext,
    "useDefaults"
  );
  if (!shopwareDefaults) {
    throw new Error(
      "[composables][useDefaults]: applicationContext does not have shopwareDefaults!"
    );
  }

  const getDefaultsFor = (keyName: string) => {
    if (!shopwareDefaults[keyName]) {
      warning({
        packageName: "composables",
        methodName: "useDefaults",
        notes: `there is no defaults configuration for key: ${keyName}`,
      });
      return;
    }
    return shopwareDefaults[keyName];
  };

  const getIncludesConfig = () => getDefaultsFor(defaultsKey)?.includes || {};
  const getAssociationsConfig = () =>
    getDefaultsFor(defaultsKey)?.associations || [];

  return {
    getIncludesConfig,
    getAssociationsConfig,
  };
};
