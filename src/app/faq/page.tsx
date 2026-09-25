import type { Metadata } from "next";
import { Faq } from "@/components/info-pages";

export const metadata: Metadata = { title: "FAQ" };

export default function Page() {
  return <Faq />;
}
