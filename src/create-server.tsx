import { renderToReadableStream } from "react-dom/server";
import { Layout } from "./Layout";
import type { ViewModuleType } from "./types";

const router = new Bun.FileSystemRouter({
	style: "nextjs",
	dir: "./src/views",
});

const port = process.env.PORT || 8080;

const middlewaresFile = await Bun.file("src/middlewares.ts");
const middlewaresExists = await middlewaresFile.exists();

if (middlewaresExists) {
	const middlewareModule = (await import(
		`${process.cwd()}/src/middlewares.ts`
	)) as { middlewares: Array<() => void> };

	for (const middlewareFn of middlewareModule.middlewares) {
		middlewareFn();
	}
}

export function createServer({ mode }: { mode: "development" | "production" }) {
	const server = Bun.serve({
		port: process.env.PORT || 8080,
		async fetch(req) {
			const match = router.match(req.url);
			if (match) {
				const routeName = match.name.replace(/^\/|\/$/g, "");
				let refreshKey = "";
				if (mode === "development") {
					const timestamp = new Date().getTime();
					refreshKey = `?refresh=${timestamp}`;
				}
				const view: ViewModuleType = await import(
					`${match.filePath}${refreshKey}`
				);

				if (req.method === "GET") {
					const slug =
						match.name === "/" ? "index" : routeName.replaceAll("/", "-");
					const manifestFile = await Bun.file(`dist/${slug}/manifest.json`);
					const manifestExists = await manifestFile.exists(); // boolean;
					let manifest = null;
					if (manifestExists) manifest = JSON.parse(await manifestFile.text());

					const data = view.query
						? await view.query({ req, params: match.params })
						: null;
					const ViewComponent = view.default;

					const meta = view.meta;
					const metaData = typeof meta === "function" ? meta(data) : meta;

					const bootstrapScriptPath =
						mode === "development"
							? `http://localhost:3000/${slug}`
							: `/dist/${slug}/index.js`;

					const stream = await renderToReadableStream(
						<Layout meta={meta} data={data} manifest={manifest}>
							<ViewComponent
								searchParams={new URLSearchParams(match.query)}
								params={match.params}
							/>
						</Layout>,
						{
							bootstrapModules: [bootstrapScriptPath],
							bootstrapScriptContent: `
              window.__REALIGHT_DATA__=${JSON.stringify({
								data,
								meta: metaData,
								manifest,
								searchParams: match.query,
								params: match.params,
							})};`,
						},
					);
					return new Response(stream, {
						headers: {
							"Content-Type": "text/html",
						},
					});
				}
				if (req.method === "POST") {
					const response = view.mutate
						? await view.mutate({ req, params: match.params })
						: null;
					switch (response?.type) {
						case "json-response": {
							const data = response.data as Record<string, unknown>;
							if (response.revalidate) {
								const queryData = view.query
									? await view.query({
											req,
											params: match.params,
									  })
									: null;
								data.__QUERY_DATA__ = queryData;
							}
							return Response.json(data);
						}
						default:
							return new Response("Not Found", { status: 404 });
					}
				}
			}

			// return dist files
			const url = new URL(req.url);
			if (url.pathname.startsWith("/dist")) {
				const file = Bun.file(url.pathname.replace(/^\/+/, ""));
				if (!file) return new Response("Not Found", { status: 404 });
				return new Response(file, {
					headers: {
						"Content-Type": file.type,
					},
				});
			}

			// return public files
			if (url.pathname.startsWith("/public")) {
				const file = Bun.file(url.pathname.replace(/^\/+/, ""));
				if (!file) return new Response("Not Found", { status: 404 });
				return new Response(file, {
					headers: {
						"Content-Type": file.type,
					},
				});
			}

			return new Response("Not Found", { status: 404 });
		},
		error(e) {
			console.error(e);
			return new Response("Internal Server Error", { status: 500 });
		},
	});
	console.log(`[Realight] - Listening on port ${port}`);
	return server;
}
