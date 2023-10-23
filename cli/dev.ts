#!/usr/bin/env bun

import { createServer } from "../src/create-server";
import { unlink } from "node:fs/promises";
import fs from "node:fs";
import { path } from "../src/routes";

const currentDirectory = process.cwd();

const routes = await import(`${currentDirectory}/routes.ts`);

if (!fs.existsSync("./tmp")) {
	fs.mkdirSync("./tmp");
}

routes?.forEach(async (route: ReturnType<typeof path>) => {
	const path = "./tmp/client-framework.jsx";
	await Bun.write(
		path,
		`
    import { Layout } from "../framework/Layout";
    import { hydrateRoot } from "react-dom/client";
    import Page from "${currentDirectory}/src/views/${route.view}.tsx";
    import "${currentDirectory}/src/global.css";

    hydrateRoot(document,<Layout data={window.__INITIAL_DATA__} manifest={window.__MANIFEST__}><Page/></Layout>);
  `,
	);
});

console.log("Building...");
const result = await Bun.build({
	entrypoints: ["./tmp/client-framework.jsx"],
	outdir: `${currentDirectory}/dist`,
});
await unlink("./tmp/client-framework.jsx");

const manifest = result.outputs.map((output) => {
	return output.path.split("/").pop();
}) as string[];
console.log(manifest);
const server = createServer(routes, manifest);

console.log(`Listening on port ${server.port}`);
