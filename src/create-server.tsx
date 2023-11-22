import { renderToReadableStream } from "react-dom/server";
import { Layout } from "./Layout";
import type { BootstrapType, MiddlewareType, ViewModuleType } from "./types";
import { createSlug } from "./utils";

const router = new Bun.FileSystemRouter({
	style: "nextjs",
	dir: "./src/views",
});

const port = process.env.PORT || 8080;

const bootstrapSrcPath = "src/bootstrap.ts";
const bootstrapFile = Bun.file(bootstrapSrcPath);
const bootstrapExists = await bootstrapFile.exists();

if (bootstrapExists) {
	const bootstrapModule = (await import(
		`${process.cwd()}/${bootstrapSrcPath}`
	)) as { default: BootstrapType };

	if (bootstrapModule.default && typeof bootstrapModule.default === "function")
		bootstrapModule.default();
}

let middleware: MiddlewareType | null = null;
const middlewareSrcPath = "src/middleware.ts";
const middlewareFile = Bun.file(middlewareSrcPath);
const middlewareExists = await middlewareFile.exists();

if (middlewareExists) {
	const middlewareModule = (await import(
		`${process.cwd()}/${middlewareSrcPath}`
	)) as { default: MiddlewareType };

	middleware = middlewareModule.default;
}

const layoutSrcPath = "src/layout.tsx";
const layoutFile = Bun.file(layoutSrcPath);
const layoutExists = await layoutFile.exists();

export function createServer({ mode }: { mode: "development" | "production" }) {
	const server = Bun.serve({
		port: process.env.PORT || 8080,
		async fetch(req) {
			const match = router.match(req.url);
			if (match) {
				let refreshKey = "";
				const searchParams = new URLSearchParams(match.query);

				if (mode === "development") {
					const timestamp = new Date().getTime();
					refreshKey = `?refresh=${timestamp}`;
				}
				const view: ViewModuleType = await import(
					`${match.filePath}${refreshKey}`
				);

				if (middleware) {
					const middlewareResponse = await middleware({
						req,
						params: match.params,
						searchParams,
					});
					if (middlewareResponse) {
						if (middlewareResponse.type === "redirect-response") {
							const { revalidate, ...options } = middlewareResponse.options;
							return new Response(null, {
								status: 302,
								headers: {
									...options.headers,
									Location: middlewareResponse.url,
								},
							});
						} else {
							return middlewareResponse as Response;
						}
					}
				}
				if (req.method === "GET") {
					const slug = createSlug(match.src);
					const manifestFile = Bun.file(`dist/${slug}/manifest.json`);
					const manifestExists = await manifestFile.exists(); // boolean;
					let manifest = null;
					if (manifestExists) manifest = JSON.parse(await manifestFile.text());
					const data = view.query
						? await view.query({ req, params: match.params, searchParams })
						: null;

					let CustomLayoutComponent = (_props?: {
						children: React.ReactNode;
					}) => <></>;
					if (layoutExists)
						CustomLayoutComponent = (
							await import(`${process.cwd()}/${layoutSrcPath}`)
						).default;

					const ViewComponent = view.default;

					const meta = view.meta;
					const metaData = typeof meta === "function" ? meta(data) : meta;

					const bootstrapScriptPath =
						mode === "development"
							? `http://localhost:3000/${slug}`
							: `/dist/${slug}/index.js`;

					const stream = await renderToReadableStream(
						<Layout meta={meta} data={data} manifest={manifest}>
							<CustomLayoutComponent>
								<ViewComponent
									searchParams={searchParams}
									params={match.params}
								/>
							</CustomLayoutComponent>
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
						? await view.mutate({ req, params: match.params, searchParams })
						: null;
					switch (response?.type) {
						case "json-response": {
							const data = response.data as Record<string, unknown>;
							if (!response.options.revalidate) return Response.json(data);
							const queryData = view.query
								? await view.query({
										req,
										params: match.params,
								  })
								: null;
							data.__QUERY_DATA__ = queryData;
							return Response.json(data, response?.options);
						}
						case "redirect-response": {
							const { url } = response;
							return Response.json({ redirect: url }, response?.options);
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

				const fileString = await file.text();
				const hasher = new Bun.CryptoHasher("md5");
				hasher.update(fileString);
				const etag = hasher.digest("hex");
				if (req.headers.get("If-None-Match") === etag) {
					return new Response(null, { status: 304 });
				}

				return new Response(file, {
					headers: {
						"Cache-control": "max-age=0 must-revalidate",
						etag,
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
