import Database from "bun:sqlite";

const db: { db: Database | null } = { db: null };
if (typeof document === "undefined") {
	const { Database } = await import("bun:sqlite");
	db.db = new Database("./data/mydb.sqlite", { create: true });
}

export default db;
