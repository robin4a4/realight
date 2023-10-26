import dts from "bun-plugin-dts";

await Bun.build({
	entrypoints: ["./index.ts", "./cli/dev.ts", "./cli/prod.ts"],
	outdir: "./dist",
	plugins: [dts()],
	external: ["react", "react-dom"],
});
