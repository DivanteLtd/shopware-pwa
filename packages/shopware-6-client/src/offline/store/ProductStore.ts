import { UpgradeFunction } from "./StoreInterface";

/**
 * Name of the product store
 */
const name: string = "product";

/**
 * Abstraction for creation of product store
 */
const upgrade: UpgradeFunction = function (
  database,
  oldVersion,
  newVersion,
  transaction
) {
  if (oldVersion < 1) {
    database.createObjectStore(name, {
      keyPath: "id",
    });
  }
};

export { name, upgrade };
