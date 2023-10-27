import { renderToReadableStream } from "react-dom/server";
import { JsonResponse } from "./responses";
import { Layout, Meta } from "./Layout";

const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: "./src/views",
});

export function createServer(devManifest?: Array<string>) {
  return Bun.serve({
    port: process.env.PORT || 8080,
    async fetch(req) {
      const manifestFile = await Bun.file("dist/manifest.json");
      const manifestExists = await manifestFile.exists(); // boolean;
      let manifest = null;
      if (manifestExists) manifest = JSON.parse(await manifestFile.text());
      else manifest = devManifest;
      const url = new URL(req.url);
      const match = router.match(url.pathname);
      if (match) {
        const filePath = match.filePath;
        const filePathInViewsFolder = filePath.split("src/views/")[1];

        const page: {
          query: () => Promise<Record<string, unknown>>;
          mutate: ({
            req,
          }: {
            req: Request;
          }) => ReturnType<typeof JsonResponse>;
          meta?: Meta<() => Promise<Record<string, unknown>>>;
          default: () => React.ReactNode;
        } = await import(filePath);

        if (req.method === "GET") {
          const data = await page.query();
          const PageComponent = page.default;
          const meta = page.meta;
          const stream = await renderToReadableStream(
            <Layout meta={meta} data={data} manifest={manifest}>
              <PageComponent />
            </Layout>,
            {
              bootstrapScripts: [
                `/dist/${filePathInViewsFolder
                  .replaceAll("/", "-")
                  .replace(".tsx", ".js")}`,
              ],
              bootstrapScriptContent: `
                        window.__INITIAL_DATA__=${JSON.stringify(data)};
                          window.__MANIFEST__=${JSON.stringify(manifest)};`,
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

        return new Response("Not Found", { status: 404 });
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

      return new Response("Not Found", { status: 404 });
    },
    error(e) {
      console.error(e);
      return new Response("Internal Server Error", { status: 500 });
    },
  });
}
