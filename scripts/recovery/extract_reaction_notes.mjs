import fs from "node:fs";

/**
 * Dumps the shipped reaction catalog (id / label / note / spec) from the
 * historical bundle so the source Debug reactions tab can be compared against it.
 */
const source = fs.readFileSync("public/assets/NormalApp-Cn6agT0F.js", "utf8");
const entry =
  /id: "([a-z]+)\.([a-z_0-9]+)",\s*\r?\n\s*label: "((?:[^"\\]|\\.)*)",\s*\r?\n(\s*note: "((?:[^"\\]|\\.)*)",\s*\r?\n)?\s*spec: (\{[\s\S]*?\r?\n {6}\}),/g;

let match;
let count = 0;
while ((match = entry.exec(source))) {
  count++;
  console.log(
    `${match[1]}.${match[2]}\n  label: ${match[3]}\n  note:  ${match[5] ?? "(none)"}`,
  );
}
console.log("entries:", count);
