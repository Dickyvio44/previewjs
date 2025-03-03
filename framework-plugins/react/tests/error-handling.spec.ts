import { test } from "@playwright/test";
import { previewTest } from "@previewjs/testing";
import path from "path";
import url from "url";
import pluginFactory from "../src/index.js";
import { reactVersions } from "./react-versions.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const testApp = (suffix: string | number) =>
  path.join(__dirname, "apps", "react" + suffix);

test.describe.parallel("react/error handling", () => {
  for (const reactVersion of reactVersions()) {
    test.describe.parallel(`v${reactVersion}`, () => {
      const test = previewTest(pluginFactory, testApp(reactVersion));

      test("handles HTML error", async (preview) => {
        await preview.fileManager.update(
          "preview.config.js",
          `
        export default {
          wrapper: {
            path: "__previewjs__/Wrapper.tsx",
            get componentName() {
              throw new Error("Expected error");
            }
          }
        };
        `
        );
        await preview.show("src/App.tsx:App").catch(() => {
          /* expected error */
        });
        await preview.expectErrors.toMatch(["Expected error"]);
      });

      test("handles syntax errors gracefully", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update("src/App.tsx", {
          replace: /<p>/g,
          with: "<p",
        });
        await preview.expectErrors.toMatch([
          "App.tsx: Unexpected token (24:15)",
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        // The component should still be shown.
        await preview.iframe.waitForSelector(".App");
      });

      test("recovers well from errors", async (preview) => {
        await preview.fileManager.update(
          "src/App.tsx",
          `export function Foo() {
          return <p className="init">Foo</p>
        }`
        );
        await preview.show("src/App.tsx:Foo");
        await preview.iframe.waitForSelector(".init");

        const append = 'return <p className="end">Bar</p>;';
        for (let i = 0; i < append.length; i++) {
          const partialAppend = append.slice(0, i);
          await preview.fileManager.update(
            "src/App.tsx",
            `export function Foo() {
              ${partialAppend}
              return <p>Foo</p>
            }`,

            {
              inMemoryOnly: false,
            }
          );
          try {
            await preview.expectErrors.toMatch(
              reactVersion < 18 && i >= 6 && i <= 8
                ? ["Nothing was returned from render"]
                : (i > 0 && i < 6) || (i > 8 && i < append.length - 1)
                ? ["App.tsx"]
                : []
            );
          } catch (e) {
            throw new Error(`Failure at index ${i}: ${e}`);
          }
        }
        await preview.iframe.waitForSelector(".end");
      });

      test("fails correctly when encountering broken module imports before update", async (preview) => {
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "some-module";

          export function App() {
            return <div>{logo}</div>;
          }`
        );
        await preview.show("src/App.tsx:App").catch(() => {
          /* expected error */
        });
        await preview.expectErrors.toMatch([
          `Failed to resolve import "some-module" from "src${path.sep}App.tsx". Does the file exist?`,
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "./logo.svg";

          export function App() {
            return <div id="recovered">{logo}</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when encountering broken module imports after update", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "some-module";

          export function App() {
            return <div>{logo}</div>;
          }`
        );
        await preview.expectErrors.toMatch([
          `Failed to resolve import "some-module" from "src${path.sep}App.tsx". Does the file exist?`,
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "./logo.svg";

          export function App() {
            return <div id="recovered">{logo}</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when encountering broken local imports before update", async (preview) => {
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "./missing.svg";

          export function App() {
            return <div>{logo}</div>;
          }`
        );
        await preview.show("src/App.tsx:App").catch(() => {
          /* expected error */
        });
        await preview.expectErrors.toMatch([
          `Failed to resolve import "./missing.svg" from "src${path.sep}App.tsx". Does the file exist?`,
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "./logo.svg";

          export function App() {
            return <div id="recovered">{logo}</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when encountering broken local imports after update", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "./missing.svg";

          export function App() {
            return <div>{logo}</div>;
          }`
        );
        await preview.expectErrors.toMatch([
          `Failed to resolve import "./missing.svg" from "src${path.sep}App.tsx". Does the file exist?`,
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update(
          "src/App.tsx",
          `import logo from "./logo.svg";

          export function App() {
            return <div id="recovered">{logo}</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when encountering broken CSS imports before update", async (preview) => {
        await preview.fileManager.update("src/App.tsx", {
          replace: "App.css",
          with: "App-missing.css",
        });
        await preview.show("src/App.tsx:App").catch(() => {
          /* expected error */
        });
        await preview.expectErrors.toMatch([
          "Failed to load url /src/App-missing.css",
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update("src/App.tsx", {
          replace: "App-missing.css",
          with: "App.css",
        });
        await preview.iframe.waitForSelector(".App");
      });

      test("fails correctly when encountering broken CSS imports after update", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update("src/App.tsx", {
          replace: "App.css",
          with: "App-missing.css",
        });
        await preview.expectErrors.toMatch([
          "Failed to load url /src/App-missing.css",
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update("src/App.tsx", {
          replace: "App-missing.css",
          with: "App.css",
        });
        await preview.iframe.waitForSelector(".App");
      });

      test("fails correctly when encountering broken syntax (case 1)", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update(
          "src/App.tsx",
          `export function App() {
            return <divBroken</div>;
          }`
        );
        await preview.expectErrors.toMatch([
          "App.tsx: Unexpected token (2:29)",
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update(
          "src/App.tsx",
          `export function App() {
            return <div id="recovered">Fixed</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when encountering broken syntax (case 2)", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update(
          "src/App.tsx",
          `export function App() {
            return <ul>
              <li id="recovered">Broken</li
            </ul>
          }`
        );
        await preview.expectErrors.toMatch([
          `App.tsx: Unexpected token, expected "jsxTagEnd"`,
        ]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update(
          "src/App.tsx",
          `export function App() {
            return <div id="recovered">Fixed</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when encountering broken logic", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update(
          "src/App.tsx",
          `export function App() {
            if (true) {
              throw new Error("Expected error");
            }
            return <div>Broken</div>;
          }`
        );
        await preview.expectErrors.toMatch(["Error: Expected error"]);
        await preview.expectLoggedMessages.toMatch([
          "React will try to recreate this component tree from scratch using the error boundary you provided",
        ]);
        await preview.fileManager.update(
          "src/App.tsx",
          `export function App() {
            return <div id="recovered">Fixed</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when encountering broken logic in imported module", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update(
          "src/Dependency.tsx",
          `export const Dependency = () => {
            throw new Error("Expected error");
            return <div>Hello, World!</div>;
          }`
        );
        await preview.expectErrors.toMatch(["Error: Expected error"]);
        await preview.expectLoggedMessages.toMatch([
          "The above error occurred in the <Dependency> component",
        ]);
        await preview.fileManager.update(
          "src/Dependency.tsx",
          `export const Dependency = () => {
            return <div id="recovered">Hello, World!</div>;
          }`
        );
        await preview.iframe.waitForSelector("#recovered");
      });

      test("fails correctly when file is missing after update", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.rename("src/App.tsx", "src/App-renamed.tsx");
        // TODO: Find a way to prevent silent failures.
        await preview.expectErrors.toMatch([]);
        await preview.expectLoggedMessages.toMatch([]);
      });

      test("fails correctly when component is missing after update", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update(
          "src/App.tsx",
          `import React from 'react';

          export const App2 = () => <div>Hello, World!</div>;`
        );
        // TODO: Find a way to prevent silent failures.
        await preview.expectErrors.toMatch([]);
        await preview.expectLoggedMessages.toMatch([]);
      });

      test("fails correctly when encountering broken CSS", async (preview) => {
        await preview.show("src/App.tsx:App");
        await preview.iframe.waitForSelector(".App");
        await preview.fileManager.update("src/App.css", {
          replace: " {",
          with: " BROKEN",
        });
        // We don't expect to see any errors for pure CSS.
        await preview.expectErrors.toMatch([]);
        await preview.expectLoggedMessages.toMatch([]);
        await preview.fileManager.update("src/App.css", {
          replace: " BROKEN",
          with: " {",
        });
        await preview.iframe.waitForSelector(".App");
      });

      test("fails correctly when encountering missing CSS", async (preview) => {
        await preview.fileManager.remove("src/App.css");
        await preview.show("src/App.tsx:App").catch(() => {
          /* expected error */
        });
        await preview.expectErrors.toMatch(["Failed to load url /src/App.css"]);
        await preview.expectLoggedMessages.toMatch([]);
      });
    });
  }

  previewTest(pluginFactory, testApp("-sass"))(
    "fails correctly when encountering broken SASS",
    async (preview) => {
      await preview.show("src/App.tsx:App");
      await preview.iframe.waitForSelector(".App");
      await preview.fileManager.update("src/App.scss", {
        replace: " {",
        with: " BROKEN",
      });
      await preview.expectErrors.toMatch(["App.scss 4:21  root stylesheet"]);
      await preview.expectLoggedMessages.toMatch([]);
      await preview.fileManager.update("src/App.scss", {
        replace: " BROKEN",
        with: " {",
      });
      await preview.iframe.waitForSelector(".App");
    }
  );
});
