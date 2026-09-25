import type { Metadata } from "next";
import { Assistant } from "@/components/assistant";

export const metadata: Metadata = {
  title: "Assistant",
  description: "Ask about suspicious messages, scams, or which government scheme may suit you.",
};

export default function AssistantPage() {
  return <Assistant />;
}
