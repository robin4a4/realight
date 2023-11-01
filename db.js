import fs from "node:fs";

/**
 * @typedef {import("bun:sqlite").Database} Database
 */
export let db;
if (typeof document === "undefined") {
  const { Database } = await import("bun:sqlite");
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }
  db = new Database("./data/mydb.sqlite", { create: true });
}
