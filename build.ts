import dts from "bun-plugin-dts";

await Bun.build({
	entrypoints: ["./src/index.ts", "./cli/build-framework-dev.ts"],
	outdir: "./dist",
	plugins: [dts()],
});
