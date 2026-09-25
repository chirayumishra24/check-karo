import { Home } from "@/components/home";
import { getAllSchemes } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const count = await getAllSchemes().then((l) => l.length).catch(() => null);
  return <Home schemeCount={count} />;
}
