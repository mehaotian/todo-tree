import { defineConfig } from "vite";
import { resolve } from "node:path";
import ignore from "rollup-plugin-ignore";
import copy from "rollup-plugin-copy";

export default defineConfig({
  plugins: [
    ignore(["hbuilderx"]),
    copy({
      targets: [
        {
          src: "src/style",
          dest: "dist",
        },{
          src: "plugin/*.js",
          dest: "dist/plugin",
        },{
          src: "package.json",
          dest: "dist",
        },{
					src:"syntaxes",
					dest:"dist"
				}
      ],
      hook: "writeBundle",
    }),
  ],
  build: {
    // lib: {
    //   entry: resolve(__dirname, "src/main.js"),
    //   name: "main",
    //   fileName: (format) => `main.${format}.js`,
    // },
    // lib: {
    //   entry: resolve(__dirname, "extension.js"),
    //   name: "extension",
    //   fileName: (format) => `extension.${format}.js`,
    // },
    rollupOptions: {
      input: {
        mainIndex: resolve(__dirname, "src/main.js"),
        extension: resolve(__dirname, "extension.js"),
      },
      output: {
        entryFileNames: "[name].js",
        // es5
        format: "cjs",
      }
    },
    sourcemap: false,
  },
});
