export let db;
if (typeof document === "undefined") {
	const { Database } = await import("bun:sqlite");
	db = new Database("./data/mydb.sqlite", { create: true });
}
