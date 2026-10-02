import assert from "node:assert/strict";
import test from "node:test";
import { Children, isValidElement, type ReactNode } from "react";
import { MarkdownBody } from "../../frontend-src/components/markdown-body";

function elements(node: ReactNode): Array<{ type: unknown; props: any }> {
  const result: Array<{ type: unknown; props: any }> = [];
  Children.forEach(node, (child) => {
    if (isValidElement<{ children?: ReactNode }>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

test("MarkdownBody keeps normal inline formatting across block types", () => {
  const rendered = elements(MarkdownBody({ markdown: [
    "# [Heading](https://example.test/heading)",
    "",
    "[Link](https://example.test/) **bold** *italic* `code` ~~deleted~~ ~also deleted~",
    "www.example.test, user@example.test [local](/notes)",
    "",
    "- [x] [Task](https://example.test/task)",
    "> [Quote](https://example.test/quote)",
  ].join("\n") }));
  for (const [tag, text] of [["strong", "bold"], ["em", "italic"], ["code", "code"], ["del", "deleted"], ["del", "also deleted"]]) {
    assert.ok(rendered.some(({ type, props }) => type === tag && props.children === text), text);
  }
  assert.deepEqual(rendered.filter(({ props }) => props.role === "link").map(({ props }) => [props.children, props.title]), [
    ["Heading", "https://example.test/heading"],
    ["Link", "https://example.test/"],
    ["www.example.test", "http://www.example.test"],
    ["Task", "https://example.test/task"],
    ["Quote", "https://example.test/quote"],
  ]);
  assert.ok(rendered.some(({ type, props }) => type === "span" && props.title === "mailto:user@example.test"));
  assert.ok(rendered.some(({ type, props }) => type === "span" && props.title === "/notes" && !props.role));
  assert.ok(rendered.some(({ type, props }) => type === "input" && props.checked && props.disabled));
});

test("MarkdownBody renders long unmatched opening brackets without quadratic scanning", () => {
  const markdown = "[".repeat(100_000);
  const started = performance.now();
  const body = MarkdownBody({ markdown });
  const elapsed = performance.now() - started;
  // A generous bound: the fixed scan takes milliseconds, the old regex seconds.
  assert.ok(elapsed < 1000, `unmatched brackets took ${elapsed.toFixed(0)}ms`);
  const fragments = elements(body).filter(({ props }) => Array.isArray(props.children) && props.children[1]?.[0] === markdown);
  assert.equal(fragments.length, 1, "the input remains literal paragraph text");
});
