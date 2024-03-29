#!/usr/bin/env bun
import { cac } from "cac";
import fs from "node:fs";
import { createServer } from "../src/create-server";
import recursive from "recursive-readdir";
import { createWebSocketServer } from "../src/dev-tools/createWebsocketServer";
import { BuildArtifact } from "bun";
import { createSlug } from "../src/utils";
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

function createBuildSlug(route: string) {
	return createSlug(route.replaceAll("src/views/", ""));
}

// Dev server
cli.command("dev").action(async () => {
	try {
		await createServer({ mode: "development" });

		async function createStaticFilesAndFetchServerFunction() {
			//  clean the dist folder before building
			fs.rmSync("./dist", { recursive: true });

			const buildResult: Array<BuildArtifact[]> = [];
			const routes = await recursive("./src/views");
			if (!fs.existsSync("./tmp")) {
				fs.mkdirSync("./tmp");
			}

			for await (const route of routes) {
				const slug = createBuildSlug(route);

				const dirTemp = `./tmp/${slug}`;
				if (!fs.existsSync(dirTemp)) {
					fs.mkdirSync(dirTemp);
				}

				await Bun.write(
					`${dirTemp}/index.jsx`,
					`
			import { Layout, clientLiveReload } from "realight";
			import { hydrateRoot } from "react-dom/client";
			import View from "../../${route}";
			
			const realightData = window.__REALIGHT_DATA__
			import("../../src/layout").then((module) => {
				const CustomLayout = module.default;
				hydrateRoot(document,<Layout meta={realightData.meta} data={realightData.data}><CustomLayout><View searchParams={new URLSearchParams(realightData.searchParams)} params={realightData.params}/></CustomLayout></Layout>);
			}).catch(() => {
				hydrateRoot(document,<Layout meta={realightData.meta} data={realightData.data}><View searchParams={new URLSearchParams(realightData.searchParams)} params={realightData.params}/></Layout>);
			});
			
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
					external: ["bun:sqlite"],
				});
				buildResult.push(result.outputs);
			}

			fs.rmSync("./tmp", { recursive: true });

			return async (req: Request) => {
				const url = new URL(req.url);

				for (const [routeIndex, route] of routes.entries()) {
					const slug = createBuildSlug(route);
					if (url.pathname === `/${slug}`) {
						const buildOutput = buildResult[routeIndex];
						let cssAppendSnippet = "";
						let jsFiles = "";
						for (const [outputIndex, output] of buildOutput.entries()) {
							if (output.type === "text/css") {
								const cssPath = output.path.split("dist/").pop();
								cssAppendSnippet += `
							const link_${outputIndex}_${routeIndex} = document.createElement('link');
							link_${outputIndex}_${routeIndex}.setAttribute('rel', 'stylesheet');
							link_${outputIndex}_${routeIndex}.setAttribute('href', 'http://localhost:${port}/${cssPath}');
							document.head.appendChild(link_${outputIndex}_${routeIndex});`;
							}
							if (output.type.startsWith("text/javascript")) {
								jsFiles = await output.text();
							}
						}
						return new Response(jsFiles + cssAppendSnippet, {
							headers: {
								"Access-Control-Allow-Origin": "*",
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
									"Access-Control-Allow-Origin": "*",
									"content-type": output.type,
								},
							});
						}
					}
				}
				return new Response("404!", {
					status: 404,
				});
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
				import View from "../../${route}";
				const realightData = window.__REALIGHT_DATA__
				
				import("../../src/layout").then((module) => {
					const CustomLayout = module.default;
					hydrateRoot(document,<Layout meta={realightData.meta} data={realightData.data} manifest={realightData.manifest}><CustomLayout><View searchParams={new URLSearchParams(realightData.searchParams)} params={realightData.params}/></CustomLayout></Layout>);
				}).catch(() => {
					hydrateRoot(document,<Layout meta={realightData.meta} data={realightData.data} manifest={realightData.manifest}><View searchParams={new URLSearchParams(realightData.searchParams)} params={realightData.params}/></Layout>);
				});
				
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
				external: ["bun:sqlite"],
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
