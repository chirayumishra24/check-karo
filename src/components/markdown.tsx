"use client";

import Link from "next/link";
import { Fragment } from "react";
import { ExternalLink } from "./external-link";

// Small renderer for assistant replies: paragraphs, bullet/numbered lists,
// **bold**, [links](url) and bare URLs. Builds React nodes, never raw HTML.

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)/g;

function linkNode(label: string, href: string, key: number) {
  if (href.startsWith("/")) {
    return <Link key={key} href={href} className="text-primary underline underline-offset-2">{label}</Link>;
  }
  if (!/^https?:\/\//i.test(href)) return <Fragment key={key}>{label}</Fragment>;
  return <ExternalLink key={key} href={href} className="text-primary underline underline-offset-2 break-words">{label}</ExternalLink>;
}

function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2]) out.push(linkNode(m[2], m[3], k++));
    else if (m[4]) out.push(linkNode(m[4], m[4], k++));
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          const ordered = /^\s*\d/.test(lines[0]);
          const items = lines.map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
          const List = ordered ? "ol" : "ul";
          return (
            <List key={i} className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
              {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
            </List>
          );
        }
        const heading = /^#{1,4}\s+(.*)$/.exec(block.trim());
        if (heading && lines.length === 1) return <p key={i} className="font-semibold">{inline(heading[1])}</p>;
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {inline(l.replace(/^#{1,4}\s+/, ""))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
