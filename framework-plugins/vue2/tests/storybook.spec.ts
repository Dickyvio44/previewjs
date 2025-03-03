import { test } from "@playwright/test";
import { previewTest } from "@previewjs/testing";
import path from "path";
import url from "url";
import pluginFactory from "../src/index.js";

const buttonVueSource = `
<template>
  <button id="button" v-bind:disabled="disabled">
    {{ label }}
  </button>
</template>
<script>
export default {
  name: "Button",
  props: {
    label: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>
`;

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const testApp = path.join(__dirname, "apps", "vue2");

test.describe.parallel("vue2/storybook", () => {
  const test = previewTest(pluginFactory, testApp);

  test("renders basic CSF2 story", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      }

      export const Primary = () => ({
        components: { Button },
        template: '<Button label="Button" />'
      })`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'Button')]"
    );
  });

  test("renders templated CSF2 story with different props", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      }

      const Template = (args, { argTypes }) => ({
        props: Object.keys(argTypes),
        components: { Button },
        template: '<Button :label="different" />',
      });

      export const Primary = Template.bind({});
      Primary.args = {
        different: "Hello, World!",
      };`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'Hello, World!')]"
    );
  });

  test("renders templated CSF2 story", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      }

      const Template = (args, { argTypes }) => ({
        props: Object.keys(argTypes),
        components: { Button },
        template: '<Button v-bind="$props" />',
      });

      export const Primary = Template.bind({});
      Primary.args = {
        label: "Hello, World!",
      };`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'Hello, World!')]"
    );
  });

  test("renders templated CSF2 story with assignment source referring local variable", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      }

      const baseArgs = {
        label: "local value"
      };

      const Template = (args, { argTypes }) => ({
        props: Object.keys(argTypes),
        components: { Button },
        template: '<Button v-bind="$props" />',
      });

      export const Primary = Template.bind({});
      Primary.args = {
        label: "label",
      };`
    );
    await preview.show(
      "src/Button.stories.js:Primary",
      `properties = {
        ...baseArgs
      }`
    );
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'local value')]"
    );
  });

  test("renders CSF2 story with implicit template", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      };

      const Template = (args, { argTypes }) => ({
        props: Object.keys(argTypes),
        components: { Button },
      });

      export const Primary = Template.bind({});
      Primary.args = {
        label: "Hello, World!",
      };`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'Hello, World!')]"
    );
  });

  test("renders CSF2 story with default args", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button,
        args: {
          label: "default"
        }
      }

      const Template = (args, { argTypes }) => ({
        props: Object.keys(argTypes),
        components: { Button },
      });

      export const Primary = Template.bind({});
      Primary.args = {};`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'default')]"
    );
  });

  test("renders CSF2 story with explicit args over default args", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button,
        args: {
          label: "default"
        }
      }

      const Template = (args, { argTypes }) => ({
        props: Object.keys(argTypes),
        components: { Button },
      });

      export const Primary = Template.bind({});
      Primary.args = {
        label: "explicit"
      };`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'explicit')]"
    );
  });

  test("renders CSF3 story with explicit args", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      };

      export const Primary = {
        args: {
          label: "explicit"
        }
      };`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'explicit')]"
    );
  });

  test("renders CSF3 story with assignment source referring local variable", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      };

      const baseArgs = {
        label: "local value"
      };

      export const Primary = {
        args: {
          label: "label"
        }
      };`
    );
    await preview.show(
      "src/Button.stories.js:Primary",
      `properties = {
        ...baseArgs
      }`
    );
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'local value')]"
    );
  });

  test("renders CSF3 story with default args", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button,
        args: {
          label: "default"
        }
      };

      export const Primary = {};`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'default')]"
    );
  });

  test("renders CSF3 story with explicit args over default args", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button,
        args: {
          label: "default"
        }
      };

      export const Primary = {
        args: {
          label: "explicit"
        }
      };`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'explicit')]"
    );
  });

  test("detects when CSF2 story no longer available", async (preview) => {
    await preview.fileManager.update("src/Button.vue", buttonVueSource);
    await preview.fileManager.update(
      "src/Button.stories.js",
      `import Button from './Button.vue';

      export default {
        component: Button
      }

      export const Primary = () => ({
        components: { Button },
        template: '<Button label="Button" />'
      });`
    );
    await preview.show("src/Button.stories.js:Primary");
    await preview.iframe.waitForSelector(
      "xpath=//button[contains(., 'Button')]"
    );
    await preview.fileManager.update("src/Button.stories.js", {
      replace: "Primary",
      with: "Renamed",
    });
    await preview.expectErrors.toMatch([
      "No component or story named 'Primary'",
    ]);
  });
});
