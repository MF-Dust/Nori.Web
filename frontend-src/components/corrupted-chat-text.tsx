import { useEffect, useState } from "react";

const glyphs = "█▓▒░▚╳#@%?*ｷﾉﾝ";
export function corruptChatText(text: string, random = Math.random) {
  return Array.from(text, (character) =>
    character === " " || character === "\n" || random() > 0.12
      ? character
      : glyphs.charAt(Math.floor(random() * glyphs.length)),
  ).join("");
}
/** Keep assistive text stable while the shipped visual corruption refreshes every 110 ms. */
export function CorruptedChatText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
      setDisplay(text);
      if (reduced.matches) return;
      const scramble = () => setDisplay(corruptChatText(text));
      scramble();
      timer = setInterval(scramble, 110);
    };
    update();
    reduced.addEventListener("change", update);
    return () => {
      clearInterval(timer);
      reduced.removeEventListener("change", update);
    };
  }, [text]);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </>
  );
}
