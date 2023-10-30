import type Database from "bun:sqlite";

let db = null;
if (typeof document === "undefined") {
	const { Database } = await import("bun:sqlite");
	db = new Database("./data/mydb.sqlite", { create: true });
}

export default db as Database;
