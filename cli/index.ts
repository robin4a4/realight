#!/usr/bin/env bun
import { cac } from "cac";
import fs from "node:fs";
import { createServer } from "../src/create-server";
import recursive from "recursive-readdir";
import { createWebSocketServer } from "../src/dev-tools/createWebsocketServer";
import { BuildArtifact } from "bun";
const port = 3000;

const cli = cac("realight");

// Start server
cli.command("serve").action(async () => {
	try {
		const server = createServer({ mode: "production" });
		console.log(`Listening on port ${server.port}`);
	} catch (e: any) {
		console.log(`error when starting dev server:\n${e.stack}`);
		process.exit(1);
	}
});

// Dev server
cli.command("dev").action(async () => {
	try {
		await createServer({ mode: "development" });

		async function createStaticFilesAndFetchServerFunction() {
			const buildResult: Array<BuildArtifact[]> = [];
			const routes = await recursive("./src/views");
			if (!fs.existsSync("./tmp")) {
				fs.mkdirSync("./tmp");
			}

			for await (const route of routes) {
				const slug = route
					.replaceAll("src/views/", "")
					.replaceAll(".tsx", "")
					.replaceAll("/", "-");
				const dirTemp = `./tmp/${slug}`;
				if (!fs.existsSync(dirTemp)) {
					fs.mkdirSync(dirTemp);
				}

				await Bun.write(
					`${dirTemp}/index.jsx`,
					`
			import { Layout, clientLiveReload } from "realight";
			import { hydrateRoot } from "react-dom/client";
			import View, {meta} from "../../${route}";
			import "../../src/global.css";
	
			const realightData = window.__REALIGHT_DATA__
			hydrateRoot(document,<Layout meta={meta} data={realightData.data}><View searchParams={new URLSearchParams(realightData.searchParams)} params={realightData.params}/></Layout>);

			clientLiveReload();
		  `,
				);
				const dirDist = `./dist/${slug}`;
				if (!fs.existsSync("./dist")) {
					fs.mkdirSync("./dist");
				}

				if (!fs.existsSync(dirDist)) {
					fs.mkdirSync(dirDist);
				}

				const result = await Bun.build({
					entrypoints: [`${dirTemp}/index.jsx`],
					outdir: dirDist, // can't dot an in memory build (see: https://github.com/oven-sh/bun/issues/3064)
				});
				buildResult.push(result.outputs);
			}

			fs.rmSync("./tmp", { recursive: true });

			return async (req: Request) => {
				const url = new URL(req.url);

				for (const [index, route] of routes.entries()) {
					const slug = route
						.replaceAll("src/views/", "")
						.replaceAll(".tsx", "")
						.replaceAll("/", "-");
					if (url.pathname === `/${slug}`) {
						const buildOutput = buildResult[index];
						let cssAppendSnippet = "";
						let jsFiles = "";
						for (const [i, output] of buildOutput.entries()) {
							if (output.type === "text/css") {
								const cssPath = output.path.split("dist/").pop();
								cssAppendSnippet += `
							const link_${i} = document.createElement('link');
							link_${i}.setAttribute('rel', 'stylesheet');
							link_${i}.setAttribute('href', 'http://localhost:${port}/${cssPath}');
							document.head.appendChild(link_${i});`;
							}
							if (output.type.startsWith("text/javascript")) {
								jsFiles = await output.text();
							}
						}
						return new Response(jsFiles + cssAppendSnippet, {
							headers: {
								"content-type": "text/javascript;charset=utf-8",
							},
						});
					}
				}

				for (const outputs of buildResult) {
					for (const output of outputs) {
						const path = output.path.split("dist").pop();
						if (url.pathname === path) {
							const text = await output.text();
							return new Response(text, {
								headers: {
									"content-type": output.type,
								},
							});
						}
					}
				}
				return new Response("404!");
			};
		}

		const sockets = createWebSocketServer();

		const fetchServerFunction = await createStaticFilesAndFetchServerFunction();
		const devServer = Bun.serve({ port, fetch: fetchServerFunction });

		fs.watch("./src", { recursive: true }, async (event, filename) => {
			const fetchServerFunction =
				await createStaticFilesAndFetchServerFunction();
			devServer.reload({ fetch: fetchServerFunction });
			for (const socket of sockets) {
				socket.send("refresh");
			}
			console.log(`[Realight] - Detected ${event} in ${filename}`);
		});
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

		for await (const route of routes) {
			const slug = route
				.replaceAll("src/views/", "")
				.replaceAll(".tsx", "")
				.replaceAll("/", "-");
			const dirTemp = `./tmp/${slug}`;
			if (!fs.existsSync(dirTemp)) {
				fs.mkdirSync(dirTemp);
			}

			await Bun.write(
				`${dirTemp}/index.jsx`,
				`
				import { Layout } from "realight";
				import { hydrateRoot } from "react-dom/client";
				import View, {meta} from "../../${route}";
				import "../../src/global.css";
				const realightData = window.__REALIGHT_DATA__
				hydrateRoot(document,<Layout meta={meta} data={realightData.data} manifest={realightData.manifest}><View searchParams={new URLSearchParams(realightData.searchParams)} params={realightData.params}/></Layout>);
			  `,
			);
			const dirDist = `./dist/${slug}`;
			if (!fs.existsSync("./dist")) {
				fs.mkdirSync("./dist");
			}

			if (!fs.existsSync(dirDist)) {
				fs.mkdirSync(dirDist);
			}

			const result = await Bun.build({
				entrypoints: [`${dirTemp}/index.jsx`],
				outdir: dirDist, // can't dot an in memory build (see: https://github.com/oven-sh/bun/issues/3064)
			});
			const manifest = result.outputs.map((output) => {
				return output.path.split("dist/").pop();
			}) as string[];
			Bun.write(`${dirDist}/manifest.json`, JSON.stringify(manifest));
		}

		fs.rmSync("./tmp", { recursive: true });
	} catch (e: any) {
		console.log(`error when starting dev server:\n${e.stack}`);
		process.exit(1);
	}
});

cli.help();
cli.version("0.0.15");

cli.parse();
