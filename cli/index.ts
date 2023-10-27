#!/usr/bin/env bun
import { cac } from "cac";
import fs from "node:fs";
import { createServer } from "../src/create-server";
import recursive from "recursive-readdir";

const cli = cac("realight");

// Start server
cli.command("serve").action(async () => {
	try {
		const server = createServer();
		console.log(`Listening on port ${server.port}`);
	} catch (e: any) {
		console.log(`error when starting dev server:\n${e.stack}`);
		process.exit(1);
	}
});

// Build client
cli.command("build").action(async () => {
	try {
		const routes = await recursive("./src/views");

		if (!fs.existsSync("./tmp")) {
			fs.mkdirSync("./tmp");
		}

		const writeClientFilePromises: Array<Promise<number>> = [];
		const filesToBuild: string[] = [];
		routes.forEach((route) => {
			const path = `./tmp/${route
				.replaceAll("/", "-")
				.replaceAll("src-views", "")
				.replace("-", "")}`;
			writeClientFilePromises.push(
				Bun.write(
					path,
					`
			import { Layout } from "realight";
			import { hydrateRoot } from "react-dom/client";
			import Page from "../${route}";
			import "../src/global.css";

			hydrateRoot(document,<Layout data={window.__INITIAL_DATA__} manifest={window.__MANIFEST__}><Page/></Layout>);
		`,
				),
			);
			filesToBuild.push(path);
		});

		console.log("Building...");
		if (!fs.existsSync("./dist")) {
			fs.mkdirSync("./dist");
		}
		await Promise.all(writeClientFilePromises);
		const result = await Bun.build({
			entrypoints: filesToBuild,
			outdir: "./dist",
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
