import type { Reader, Writer } from "@previewjs/vfs";
import { createMemoryReader } from "@previewjs/vfs";
import path from "path";
import pino from "pino";
import PinoPretty from "pino-pretty";
import { beforeEach, describe, expect, it } from "vitest";
import { createVueTypeScriptReader } from "./vue-reader.js";
const { pino: createLogger } = pino;
const { default: prettyLogger } = PinoPretty;

describe("createVueTypeScriptReader", () => {
  let memoryReader: Reader & Writer;
  let reader: Reader;

  beforeEach(() => {
    memoryReader = createMemoryReader();
    reader = createVueTypeScriptReader(
      createLogger({ level: "debug" }, prettyLogger({ colorize: true })),
      memoryReader
    );
  });

  it("extracts from script", async () => {
    memoryReader.updateFile(
      path.join(__dirname, "virtual", "App.vue"),
      `
<template>
  <h1>{{ msg }}</h1>
</template>
<script lang="ts">
export default {
  name: 'App',
  props: {}
}
</script>

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

      export default {
        name: 'App',
        props: {}
      }

      const pjs_component = {
          name: \\"App\\",
          props: {}
      } as const;


      import type {Prop as PJS_Prop} from 'vue/types/options';

      type PJS_TypeOrUnion<T> = PJS_Prop<T> | ReadonlyArray<PJS_Prop<T>>;
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
<template>
  <h1>{{ msg }}</h1>
</template>
<script lang="coffee">
foo
</script>
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
      foo
      "
    `);
  });
});
