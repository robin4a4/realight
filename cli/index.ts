#!/usr/bin/env bun
import { cac } from "cac";
import fs from "node:fs";
import { path } from "../src/routes";
import { createServer } from "../src/create-server";
const currentDirectory = process.cwd();
const routes = await import(`${currentDirectory}/src/routes.ts`);

const cli = cac("realight");

// Start server
cli.command("serve").action(async () => {
	try {
		const server = createServer(routes);
		console.log(`Listening on port ${server.port}`);
	} catch (e: any) {
		console.log(`error when starting dev server:\n${e.stack}`);
		process.exit(1);
	}
});

// Build client
cli.command("build").action(async () => {
	try {
		if (!fs.existsSync("./tmp")) {
			fs.mkdirSync("./tmp");
		}
		routes.default?.forEach(async (route: ReturnType<typeof path>) => {
			await Bun.write(
				"./tmp/client-framework.jsx",
				`
		import { Layout } from "realight";
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
			minify: true,
		});
		fs.rmSync("./tmp", { recursive: true });

		const manifest = result.outputs.map((output) => {
			return output.path.split("/").pop();
		}) as string[];
		console.log(manifest);
		Bun.write("./dist/manifest.json", JSON.stringify(manifest));
	} catch (e: any) {
		console.log(`error when starting dev server:\n${e.stack}`);
		process.exit(1);
	}
});

cli.help();
cli.version("0.0.15");

cli.parse();
