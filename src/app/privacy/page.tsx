import type { Metadata } from "next";
import { TextPage } from "@/components/page-header";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return <TextPage title="privacy.title" body="privacy.body" />;
}
