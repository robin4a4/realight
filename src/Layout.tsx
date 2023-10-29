import { MutationProvider } from "./mutation-data-context";
import { QueryProvider } from "./query-data-context";
import type { Meta, QueryDefaultType } from "./types";

export function Layout({
  children,
  data,
  meta,
  manifest,
}: {
  children: React.ReactNode;
  data: QueryDefaultType;
  meta?: Meta<() => Promise<QueryDefaultType>>;
  manifest: string[];
}) {
  const metaData = typeof meta === "function" ? meta(data) : meta;
  const metaTags = (
    <>
      <title>{metaData?.title ?? "My app"}</title>
      <meta name="description" content={metaData?.description} />
      {metaData?.icon ? (
        <link rel="icon" href={`./public/${metaData?.icon}`} />
      ) : null}
    </>
  );
  return (
    <html lang="en">
      <head>
        {metaTags}
        {manifest?.map((filename) => {
          if (filename.endsWith(".css")) {
            return (
              <link
                key={filename}
                rel="stylesheet"
                href={`/dist/${filename}`}
              />
            );
          }
        })}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body>
        <QueryProvider initialData={data}>
          <MutationProvider>{children}</MutationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
