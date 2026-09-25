import type { Metadata } from "next";
import { TextPage } from "@/components/page-header";

export const metadata: Metadata = { title: "Terms of use" };

export default function Page() {
  return <TextPage title="terms.title" body="terms.body" />;
}
