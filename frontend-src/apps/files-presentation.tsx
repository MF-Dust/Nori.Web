import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowComponentProps } from "../state/window-types";
import {
  FilesScreen,
  createFilesIntentStore,
  type FilesIntentPayload,
  type FilesIntentStore,
  type FilesScreenRuntime,
} from "../screens/files-screen";

export interface FilesPresentationRuntime extends Omit<FilesScreenRuntime, "intent"> {
  intent?: FilesIntentStore;
}

export function createFilesProductionWindowBinding(
  runtime: FilesPresentationRuntime,
  intent = runtime.intent ?? createFilesIntentStore(),
): ProductionWindowBinding {
  function FilesProductionWindow(props: WindowComponentProps) {
    const folderPath = typeof props.folderPath === "string" ? props.folderPath : "";
    const selectKey = typeof props.selectKey === "string" ? props.selectKey : undefined;
    return (
      <FilesScreen
        runtime={{ ...runtime, intent }}
        initialIntent={{ folderPath, selectKey }}
      />
    );
  }
  return { component: FilesProductionWindow };
}

export type OpenFilesIntent = (payload: FilesIntentPayload) => Promise<void>;
