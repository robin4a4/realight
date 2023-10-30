import Database from "bun:sqlite";

export let db: Database | null = null;
if (typeof document === "undefined") {
	const { Database } = await import("bun:sqlite");
	db = new Database("./data/mydb.sqlite", { create: true });
}
