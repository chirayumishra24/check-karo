import { ScanSearch } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Verifier } from "@/components/verifier";

export const metadata: Metadata = {
  title: "Verify information",
  description: "Check a WhatsApp forward, news link or screenshot against trusted sources.",
};

export default function VerifyPage() {
  return (
    <>
      <PageHeader
        narrow
        eyebrow="verify.eyebrow"
        icon={<ScanSearch className="h-3.5 w-3.5" />}
        title="verify.title"
        subtitle="verify.subtitle"
      />
      <Verifier />
    </>
  );
}
