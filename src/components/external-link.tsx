"use client";

import { openLink } from "@/lib/open-link";

/**
 * A normal <a> (so it still works without JS, can be long-pressed and copied)
 * that opens in the in-app browser when running inside the mobile app.
 */
export function ExternalLink({
  href, className, children,
}: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        void openLink(href);
      }}
    >
      {children}
    </a>
  );
}
