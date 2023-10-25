#!/usr/bin/env bun

import { createServer } from "../src/create-server";
import fs from "node:fs";
import { path } from "../src/routes";

console.log("[realight] Launching dev server...");
const currentDirectory = process.cwd();
const routes = await import(`${currentDirectory}/src/routes.ts`);
if (!fs.existsSync("./tmp")) {
	fs.mkdirSync("./tmp");
}
routes.default?.forEach(async (route: ReturnType<typeof path>) => {
	await Bun.write(
		"./tmp/client-framework.jsx",
		`
		import { Layout } from "realight/layout";
		import { hydrateRoot } from "react-dom/client";
		import Page from "../src/views/${route.view}.tsx";
		import "../src/global.css";
		
		hydrateRoot(document,<Layout data={window.__INITIAL_DATA__} manifest={window.__MANIFEST__}><Page/></Layout>);
		`,
	);
});

console.log("Building...");
if (!fs.existsSync("./dist")) {
	fs.mkdirSync("./dist");
}
const result = await Bun.build({
	entrypoints: ["./tmp/client-framework.jsx"],
	outdir: "./dist",
	external: ["react", "react-dom"],
});
fs.rmSync("./tmp", { recursive: true });

const manifest = result.outputs.map((output) => {
	return output.path.split("/").pop();
}) as string[];
console.log(manifest);
const server = createServer(routes, manifest);

console.log(`Listening on port ${server.port}`);
