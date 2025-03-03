import type { Reader, Writer } from "@previewjs/vfs";
import { createMemoryReader } from "@previewjs/vfs";
import path from "path";
import { beforeEach, describe, expect, it } from "vitest";
import { createVueTypeScriptReader } from "./vue-reader.js";

describe("createVueTypeScriptReader", () => {
  let memoryReader: Reader & Writer;
  let reader: Reader;

  beforeEach(() => {
    memoryReader = createMemoryReader();
    reader = createVueTypeScriptReader(memoryReader);
  });

  it("extracts from setup script", async () => {
    memoryReader.updateFile(
      path.join(__dirname, "virtual", "App.vue"),
      `
<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>
</template>
    `
    );
    const virtualFile = await reader.read(
      path.join(__dirname, "virtual", "App.vue.ts")
    );
    if (virtualFile?.kind !== "file") {
      throw new Error();
    }
    expect(await virtualFile.read()).toMatchInlineSnapshot(`
        "import { defineProps } from '@vue/runtime-core';

        import { ref } from 'vue';

        defineProps<{ msg: string }>()

        const count = ref(0)

        export default {};type PJS_Slots = [];"
      `);
  });

  it("extracts from normal script", async () => {
    memoryReader.updateFile(
      path.join(__dirname, "virtual", "App.vue"),
      `
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<template>
  <h1>{{ msg }}</h1>
</template>
    `
    );
    const virtualFile = await reader.read(
      path.join(__dirname, "virtual", "App.vue.ts")
    );
    if (virtualFile?.kind !== "file") {
      throw new Error();
    }
    expect(await virtualFile.read()).toMatchInlineSnapshot(`
      "

      import { defineComponent } from 'vue'

      export default defineComponent({
        name: 'App'
      })

      const pjs_component = {
          name: \\"App\\"
      } as const;


      import type { PropType as PJS_PropType } from \\"@vue/runtime-core\\";

      type PJS_TypeOrUnion<T> = PJS_PropType<T> | ReadonlyArray<PJS_PropType<T>>;
      type PJS_OptionalPropType<T> = PJS_TypeOrUnion<T> | {type: PJS_TypeOrUnion<T>; required?: false};
      type PJS_RequiredPropType<T> = {type: PJS_TypeOrUnion<T>; required: true};
      type PJS_OptionalPropsKeys<T> = {
        [K in keyof T]: T[K] extends PJS_OptionalPropType<any> ? K : never;
      }[keyof T];
      type PJS_RequiredPropsKeys<T> = {
        [K in keyof T]: T[K] extends PJS_RequiredPropType<any> ? K : never;
      }[keyof T];
      type PJS_CombinedProps<T> = T extends readonly [...any] ? {
        [K in T[number]]: unknown
      } : ({
        [K in PJS_OptionalPropsKeys<T>]?: T[K] extends PJS_OptionalPropType<infer S> ? S : never;
      } & {
        [K in PJS_RequiredPropsKeys<T>]: T[K] extends PJS_RequiredPropType<infer S> ? S : never;
      });
      type PJS_ExtractProps<T> = T extends { props: any } ? PJS_CombinedProps<T['props']> : {}
      type PJS_Props = PJS_ExtractProps<typeof pjs_component>;
      type PJS_Slots = [];
      "
    `);
  });

  it("ignores incompatible script lang", async () => {
    memoryReader.updateFile(
      path.join(__dirname, "virtual", "App.vue"),
      `
<script lang="coffee">
foo
</script>

<template>
  <h1>{{ msg }}</h1>
</template>
    `
    );
    const virtualFile = await reader.read(
      path.join(__dirname, "virtual", "App.vue.ts")
    );
    if (virtualFile?.kind !== "file") {
      throw new Error();
    }
    expect(await virtualFile.read()).toMatchInlineSnapshot(
      '"export default {}"'
    );
  });
});
