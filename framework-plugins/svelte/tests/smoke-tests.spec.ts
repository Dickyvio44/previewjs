import { test } from "@playwright/test";
import { smokeTests } from "@previewjs/testing";
import path from "path";
import url from "url";
import pluginFactory from "../src/index.js";

test.describe.parallel("smoke tests", () => {
  const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
  smokeTests({
    projectsDir: path.join(__dirname, "apps"),
    pluginFactory,
    ids: {
      svelte3: ["src/App.svelte:App"],
      svelte4: ["src/App.svelte:App"],
      ...(parseInt(process.versions.node.split(".")[0]!) >= 16
        ? {
            // SvelteKit requires Node 16.
            // See https://github.com/sveltejs/kit/issues/2412
            "sveltekit-app": ["src/routes/+page.svelte:+page"],
            "sveltekit-demo": [
              "src/routes/+page.svelte:+page",
              "src/routes/Header.svelte:Header",
            ],
            "vite-storybook-js": [
              "src/stories/Button.stories.js:Primary",
              "src/stories/Page.stories.js:LoggedOut",
              "src/stories/Page.stories.js:LoggedIn",
            ],
            "vite-storybook-ts": [
              "src/stories/Button.stories.ts:Primary",
              "src/stories/Page.stories.ts:LoggedOut",
              "src/stories/Page.stories.ts:LoggedIn",
            ],
          }
        : {}),
    },
  });
});
