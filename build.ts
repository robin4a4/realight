import dts from "bun-plugin-dts";

await Bun.build({
	entrypoints: ["./index.ts", "./cli/index.ts"],
	outdir: "./dist",
	plugins: [dts()],
	external: ["react", "react-dom"],
	splitting: true,
});
