import { useState } from "react";
import { renderToReadableStream } from "react-dom/server";
import { path } from "../src/routes";
import { JsonResponse } from "./responses";
import { Layout } from "./Layout";

const currentDirectory = process.cwd();
function Page() {
  //   const { title, todos } = useQueryData<typeof query>();
  const [count, setCount] = useState(0);
  //   const { test, bonjour } = useMutationData<typeof mutate>();
  //   const form = useForm();
  return <div>{count}</div>;
}
export function createServer(
  routes: { default: Array<ReturnType<typeof path>> },
  devManifest?: Array<string>
) {
  return Bun.serve({
    port: process.env.PORT || 8080,
    async fetch(req) {
      const manifestFile = await Bun.file("dist/manifest.json");
      const manifestExists = await manifestFile.exists(); // boolean;
      let manifest = null;
      if (manifestExists) manifest = JSON.parse(await manifestFile.text());
      else manifest = devManifest;
      const url = new URL(req.url);
      for (const route of routes.default) {
        if (route.path === url.pathname) {
          const view = route.view;
          const page: {
            query: () => Promise<Record<string, unknown>>;
            mutate: ({
              req,
            }: {
              req: Request;
            }) => ReturnType<typeof JsonResponse>;
            default: () => React.ReactNode;
          } = await import(`${currentDirectory}/src/views/${view}.tsx`);
          if (req.method === "GET") {
            const data = await page.query();
            const PageComponent = page.default;
            const stream = await renderToReadableStream(
              <Layout data={data} manifest={manifest}>
                <PageComponent />
              </Layout>
              // {
              //   bootstrapScripts: ["/dist/client-framework.js"],
              //   bootstrapScriptContent: `
              //           window.__INITIAL_DATA__=${JSON.stringify(data)};
              //             window.__MANIFEST__=${JSON.stringify(manifest)};`,
              // }
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
      }

      // return dist files
      if (url.pathname.startsWith("/dist")) {
        console.log(url.pathname);
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
