import { IDBPDatabase } from "idb";

interface UpgradeFunction {
  (
    database: IDBPDatabase,
    oldVerison: number,
    newVersion: number | null,
    transaction
  ): void;
}

export { UpgradeFunction };
