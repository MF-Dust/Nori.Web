import { Fragment, type ReactNode } from "react";

export interface MarkdownBodyProps {
  markdown: string;
  className?: string;
}

type NoriBrowserApi = Window & {
  NoriAPI?: {
    openUrlInBrowser?: (url: string) => void;
  };
};

type MarkdownListItem = {
  ordered: boolean;
  text: string;
  checked?: boolean;
};

function openUrlInBrowser(url: string): void {
  (window as NoriBrowserApi).NoriAPI?.openUrlInBrowser?.(url);
}

function renderMarkdownLink(label: ReactNode, href: string, key: number): ReactNode {
  return /^https?:\/\//i.test(href) ? (
    <span
      key={key}
      role="link"
      tabIndex={0}
      title={href}
      onClick={() => openUrlInBrowser(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openUrlInBrowser(href);
        }
      }}
      className="cursor-pointer underline underline-offset-2 hover:opacity-80"
    >
      {label}
    </span>
  ) : (
    <span key={key} className="underline underline-offset-2" title={href || undefined}>
      {label}
    </span>
  );
}

function splitAutolinkTrailingPunctuation(value: string): [string, string] {
  const match = value.match(/^(.*?)([.,!?;:]*)$/);
  return [match?.[1] ?? value, match?.[2] ?? ""];
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const token = /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|(~{1,2})(\S(?:[^~]*?\S)?)\6|\*([^*]+)\*|((?:https?:\/\/|www(?=\.))[-.\w]+[^\s<]*)|(\b[-.\w+]+@[-\w]+(?:\.[-\w]+)+))/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = token.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[2] && match[3]) {
      nodes.push(renderMarkdownLink(match[2], match[3], key++));
    } else if (match[4]) {
      nodes.push(<code key={key++}>{match[4]}</code>);
    } else if (match[5]) {
      nodes.push(<strong key={key++}>{match[5]}</strong>);
    } else if (match[7]) {
      nodes.push(<del key={key++}>{match[7]}</del>);
    } else if (match[8]) {
      nodes.push(<em key={key++}>{match[8]}</em>);
    } else if (match[9]) {
      const [label, trailing] = splitAutolinkTrailingPunctuation(match[9]);
      const href = /^www\./i.test(label) ? `http://${label}` : label;
      nodes.push(renderMarkdownLink(label, href, key++));
      if (trailing) nodes.push(trailing);
    } else if (match[10]) {
      const label = match[10];
      nodes.push(renderMarkdownLink(label, `mailto:${label}`, key++));
    }
    cursor = token.lastIndex;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function parseTaskListItem(text: string): Pick<MarkdownListItem, "text" | "checked"> {
  const task = text.match(/^\[([ xX])\](?:[ \t]+(.*))?$/);
  if (!task) return { text };
  return {
    text: task[2] ?? "",
    checked: task[1].toLowerCase() === "x",
  };
}

export function MarkdownBody({ markdown, className }: MarkdownBodyProps) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: MarkdownListItem[] = [];
  let code: string[] | null = null;
  let codeLanguage = "";
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={key++} className="mb-2 last:mb-0">
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
    const taskList = list.some((item) => item.checked !== undefined);
    const Tag = ordered ? "ol" : "ul";
    const baseClass = ordered ? "my-2 list-decimal pl-6" : "my-2 list-disc pl-6";
    blocks.push(
      <Tag
        key={key++}
        className={taskList ? `${baseClass} contains-task-list` : baseClass}
      >
        {list.map((item, index) => (
          <li
            key={index}
            className={item.checked !== undefined ? "task-list-item" : undefined}
          >
            {item.checked !== undefined ? (
              <>
                <input type="checkbox" checked={item.checked} disabled />{" "}
              </>
            ) : null}
            {renderInline(item.text)}
          </li>
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
      const rawText = (bullet?.[1] ?? ordered?.[1])!;
      const task = parseTaskListItem(rawText);
      const item: MarkdownListItem = {
        ordered: Boolean(ordered),
        text: task.text,
        checked: task.checked,
      };
      if (list.length && list[0].ordered !== item.ordered) flushList();
      list.push(item);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote
          key={key++}
          className="my-2 border-l-2 border-current pl-3 not-italic opacity-80 last:mb-0"
        >
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

  const content = <>{blocks}</>;
  return className ? <div className={className}>{content}</div> : content;
}