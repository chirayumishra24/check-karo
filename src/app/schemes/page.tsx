import { Landmark } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { SchemeFinder } from "@/components/scheme-finder";

export const metadata: Metadata = {
  title: "Government scheme finder",
  description: "Find central and state government schemes you may qualify for, with documents and official links.",
};

export default function SchemesPage() {
  return (
    <>
      <PageHeader
        eyebrow="schemes.eyebrow"
        icon={<Landmark className="h-3.5 w-3.5" />}
        title="schemes.title"
        subtitle="schemes.subtitle"
      />
      {/* Reads ?q= and ?tag= from the URL, so it renders on the client. */}
      <Suspense>
        <SchemeFinder />
      </Suspense>
    </>
  );
}
