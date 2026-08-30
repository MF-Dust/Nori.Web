import { Fragment, type ReactNode } from "react";

export interface MarkdownBodyProps {
  markdown: string;
  className?: string;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const token = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = token.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(
        <code key={key++} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
          {match[4]}
        </code>,
      );
    } else if (match[5]) {
      nodes.push(<strong key={key++}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={key++}>{match[6]}</em>);
    }
    cursor = token.lastIndex;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function MarkdownBody({ markdown, className }: MarkdownBodyProps) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: Array<{ ordered: boolean; text: string }> = [];
  let code: string[] | null = null;
  let codeLanguage = "";
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={key++} className="my-2 leading-relaxed">
        {paragraph.map((line, index) => (
          <Fragment key={index}>
            {index ? <br /> : null}
            {renderInline(line)}
          </Fragment>
        ))}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    const ordered = list[0].ordered;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={key++}
        className={ordered ? "my-2 list-decimal pl-6" : "my-2 list-disc pl-6"}
      >
        {list.map((item, index) => (
          <li key={index}>{renderInline(item.text)}</li>
        ))}
      </Tag>,
    );
    list = [];
  };

  for (const line of lines) {
    const fence = line.match(/^```\s*([^\s]*)/);
    if (fence) {
      flushParagraph();
      flushList();
      if (code) {
        blocks.push(
          <pre key={key++} className="my-3 overflow-auto rounded-md bg-muted p-3 text-xs">
            <code data-language={codeLanguage || undefined}>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
        codeLanguage = "";
      } else {
        code = [];
        codeLanguage = fence[1] ?? "";
      }
      continue;
    }

    if (code) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const headingClass =
        level === 1
          ? "mt-4 mb-2 text-xl font-semibold"
          : level === 2
            ? "mt-4 mb-2 text-lg font-semibold"
            : "mt-3 mb-1 font-semibold";
      blocks.push(
        <div key={key++} role="heading" aria-level={level} className={headingClass}>
          {renderInline(heading[2])}
        </div>,
      );
      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet || ordered) {
      flushParagraph();
      const item = { ordered: Boolean(ordered), text: (bullet?.[1] ?? ordered?.[1])! };
      if (list.length && list[0].ordered !== item.ordered) flushList();
      list.push(item);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote key={key++} className="my-2 border-l-2 pl-3 text-muted-foreground">
          {renderInline(quote[1])}
        </blockquote>,
      );
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  if (code) {
    blocks.push(
      <pre key={key++} className="my-3 overflow-auto rounded-md bg-muted p-3 text-xs">
        <code data-language={codeLanguage || undefined}>{code.join("\n")}</code>
      </pre>,
    );
  }

  return <div className={className}>{blocks}</div>;
}
