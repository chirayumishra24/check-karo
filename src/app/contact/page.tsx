import type { Metadata } from "next";
import { Contact } from "@/components/info-pages";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return <Contact />;
}
