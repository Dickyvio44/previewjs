import { overrideCopyCutPaste } from "./copy-cut-paste";
import { setUpLinkInterception } from "./links";
import {
  AppToPreviewMessage,
  RenderMessage,
  sendMessageFromPreview,
} from "./messages";
import { detach, load as rendererLoad } from "./renderer/index";
import { setState } from "./state";
import { updateComponent } from "./update-component";

// setUpLogInterception();
setUpLinkInterception();
overrideCopyCutPaste();

// TODO: Remove, just for testing.
async function test() {
  const wrapperModule = await import(
    // @ts-ignore
    "../__previewjs__/Wrapper.tsx"
  );
  const componentModule = await import(
    // @ts-ignore
    "../design/HeroHeader/HeroHeader.tsx"
  );
  setState({
    filePath: "design/HeroHeader/HeroHeader.tsx",
    componentName: "HeroHeader",
    defaultPropsSource: "{}",
    customVariantPropsSource: "properties = {}",
    variantKey: "example",
  });
  await updateComponent({
    wrapperModule,
    wrapperName: "Wrapper",
    componentModule,
    componentFilePath: "design/HeroHeader/HeroHeader.tsx",
    componentName: "HeroHeader",
    loadingError: null,
    load: rendererLoad,
  });
}
test().catch(console.error);

async function load({
  filePath,
  componentName,
  variantKey,
  defaultPropsSource,
  customVariantPropsSource,
}: RenderMessage) {
  try {
    const componentLoaderModuleId = `/@component-loader.js?p=${encodeURIComponent(
      filePath
    )}&c=${encodeURIComponent(componentName)}`;
    setState({
      filePath,
      componentName,
      defaultPropsSource,
      customVariantPropsSource,
      variantKey,
    });
    const { refresh } = await import(
      /* @vite-ignore */
      `/preview${componentLoaderModuleId}`
    );
    await refresh();
  } catch (error: any) {
    sendMessageFromPreview({
      kind: "rendering-error",
      message: error.stack || error.message,
    });
  }
}

const root = document.getElementById("root");
window.addEventListener(
  "message",
  (event: MessageEvent<AppToPreviewMessage>) => {
    const data = event.data;
    switch (data.kind) {
      case "show-loading":
        detach().catch(console.error);
        root.innerHTML = `<div class="previewjs-loader">
          <img src="../loading.svg" />
        </div>`;
        break;
      case "render":
        load(data).catch(console.error);
        break;
    }
  }
);

sendMessageFromPreview({
  kind: "bootstrapped",
});
