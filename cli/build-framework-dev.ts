#!/usr/bin/env node

// import { createServer } from "../src/create-server";
// import { unlink } from "node:fs/promises";
// import fs from "node:fs";

console.log("client...");

// if (!fs.existsSync("./tmp")) {
// 	fs.mkdirSync("./tmp");
// }

// routes.forEach(async (route) => {
// 	const path = "./tmp/client-framework.jsx";
// 	await Bun.write(
// 		path,
// 		`
//     import { Layout } from "../framework/Layout";
//     import { hydrateRoot } from "react-dom/client";
//     import Page from "../src/views/${route.view}.tsx";
//     import "../src/global.css";

//     hydrateRoot(document,<Layout data={window.__INITIAL_DATA__} manifest={window.__MANIFEST__}><Page/></Layout>);
//   `,
// 	);
// });

// console.log("Building...");
// const result = await Bun.build({
// 	entrypoints: ["./tmp/client-framework.jsx"],
// 	outdir: "./dist",
// });
// console.log("Cleaning up...");
// await unlink("./tmp/client-framework.jsx");

// const manifest = result.outputs.map((output) => {
// 	return output.path.split("/").pop();
// }) as string[];
// console.log(manifest);
// const server = createServer(manifest);

// console.log(`Listening on port ${server.port}`);
