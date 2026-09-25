import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchemeDetail } from "@/components/scheme-detail";
import { getScheme } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/schemes/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const scheme = await getScheme(id);
  if (!scheme) return { title: "Scheme not found" };
  return { title: scheme.name.en, description: `${scheme.desc.en} ${scheme.benefits.en}` };
}

export default async function SchemePage(props: PageProps<"/schemes/[id]">) {
  const { id } = await props.params;
  const scheme = await getScheme(id);
  if (!scheme) notFound();
  return <SchemeDetail scheme={scheme} />;
}
