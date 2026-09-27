import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  DATASEA_GAMES,
  DataseaGameWindow,
} from "../../../frontend-src/story/datasea-wave-gate";
import type { DataseaGameApi } from "../../../frontend-src/story/datasea-games-original.js";
import "../../../frontend-src/styles/app.css";

const solvedEvents: string[] = [];
const hitEvents: Array<[string, number]> = [];
function Game({ id, order }: { id: string; order: number }) {
  const [solved, setSolved] = useState(false);
  const gameIndex = DATASEA_GAMES.findIndex((game) => game[0] === id);
  if (gameIndex < 0) throw new Error(`Unknown Datasea game: ${id}`);
  const api: DataseaGameApi = {
    onProgress() {},
    onSolved() {
      setSolved((value) => {
        if (!value) solvedEvents.push(id);
        return true;
      });
    },
    hit(intensity = 1) {
      hitEvents.push([id, intensity]);
    },
  };
  return (
    <DataseaGameWindow
      gameIndex={gameIndex}
      order={order}
      solved={solved}
      api={api}
    />
  );
}
const root = createRoot(document.getElementById("root")!);
let serial = 0;
function mount(ids: string[]) {
  solvedEvents.length = 0;
  hitEvents.length = 0;
  serial++;
  root.render(
    <div className="datasea-wave-gate" data-test-wave={ids.join(",")}>
      {ids.map((id, order) => (
        <Game key={`${id}:${serial}`} id={id} order={order} />
      ))}
    </div>,
  );
}
Object.assign(window, {
  dataseaGamesProbe: {
    mount,
    solvedEvents,
    hitEvents,
    metadata: DATASEA_GAMES,
    unmount: () => root.unmount(),
  },
});
