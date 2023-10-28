import { renderToReadableStream } from "react-dom/server";
import { JsonResponse } from "./responses";
import { Layout, Meta } from "./Layout";

const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: "./src/views",
});

const port = process.env.PORT || 8080;

export function createServer({ mode }: { mode: "development" | "production" }) {
  const server = Bun.serve({
    port: process.env.PORT || 8080,
    async fetch(req) {
      const url = new URL(req.url);
      const match = router.match(url.pathname);
      if (match) {
        const routeName = match.name.replace(/^\/|\/$/g, "");
        const page: {
          query: () => Promise<Record<string, unknown>>;
          mutate: ({
            req,
          }: {
            req: Request;
          }) => ReturnType<typeof JsonResponse>;
          meta?: Meta<() => Promise<Record<string, unknown>>>;
          default: () => React.ReactNode;
        } = await import(match.filePath);

        if (req.method === "GET") {
          const slug = routeName.replaceAll("/", "-");
          const manifestFile = await Bun.file(`dist/${slug}/manifest.json`);
          const manifestExists = await manifestFile.exists(); // boolean;
          let manifest = null;
          if (manifestExists) manifest = JSON.parse(await manifestFile.text());

          const data = await page.query();
          const PageComponent = page.default;
          const meta = page.meta;
          const bootstrapScriptPath =
            mode === "development"
              ? `http://localhost:3000/${slug}`
              : `/dist/${slug}/index.js`;

          const stream = await renderToReadableStream(
            <Layout meta={meta} data={data} manifest={manifest}>
              <PageComponent />
            </Layout>,
            {
              bootstrapScripts: [bootstrapScriptPath],
              bootstrapScriptContent: `window.__REALIGHT_DATA__=${JSON.stringify(
                { data, manifest }
              )};`,
            }
          );
          return new Response(stream, {
            headers: {
              "Content-Type": "text/html",
            },
          });
        }
        if (req.method === "POST") {
          const response = await page.mutate({ req });
          switch (response.type) {
            case "json-response": {
              const data = response.data as Record<string, unknown>;
              if (response.revalidate) {
                // const queryData = await page.query();
                const queryData = { title: "New Title", todos: [] };
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
