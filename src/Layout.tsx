import { MutationProvider } from "./mutation-data-context";
import { QueryProvider } from "./query-data-context";

export function Layout({
  children,
  data,
  manifest,
}: {
  children: React.ReactNode;
  data: Record<string, unknown>;
  manifest: string[];
}) {
  console.log("CHILDREN", children);
  return (
    <html lang="en">
      <head>
        <title>My App</title>
        {manifest.map((filename) => {
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
      </head>
      <body>
        <QueryProvider initialData={data}>
          <MutationProvider>{children}</MutationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
