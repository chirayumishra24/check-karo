import {
  Accessibility, Briefcase, Building2, GraduationCap, HandCoins, HeartPulse, House, Landmark,
  PiggyBank, Rocket, Tractor, Umbrella, UserRound, Users, Wallet, Wrench, type LucideIcon,
} from "lucide-react";

/** Icon and tint for each scheme topic, used on tiles, chips and card avatars. */
export const TAG_STYLE: Record<string, { icon: LucideIcon; tint: string }> = {
  farmer: { icon: Tractor, tint: "bg-[#e8f5e1] text-[#2f7a1f] dark:bg-[#18301a] dark:text-[#8fdc78]" },
  agriculture: { icon: Tractor, tint: "bg-[#e8f5e1] text-[#2f7a1f] dark:bg-[#18301a] dark:text-[#8fdc78]" },
  student: { icon: GraduationCap, tint: "bg-[#e7efff] text-[#2952cc] dark:bg-[#172447] dark:text-[#8fb0ff]" },
  education: { icon: GraduationCap, tint: "bg-[#e7efff] text-[#2952cc] dark:bg-[#172447] dark:text-[#8fb0ff]" },
  scholarship: { icon: GraduationCap, tint: "bg-[#e7efff] text-[#2952cc] dark:bg-[#172447] dark:text-[#8fb0ff]" },
  women: { icon: Users, tint: "bg-[#fde8f1] text-[#b0306b] dark:bg-[#3a1528] dark:text-[#ff96c4]" },
  senior: { icon: UserRound, tint: "bg-[#f1ebff] text-[#6a3fd0] dark:bg-[#271a45] dark:text-[#bca3ff]" },
  health: { icon: HeartPulse, tint: "bg-[#ffe9e7] text-[#c7362c] dark:bg-[#3a1715] dark:text-[#ff8f86]" },
  housing: { icon: House, tint: "bg-[#fff1dc] text-[#b86200] dark:bg-[#33230f] dark:text-[#ffb95c]" },
  employment: { icon: Briefcase, tint: "bg-[#e3f4f7] text-[#127083] dark:bg-[#10292f] dark:text-[#71d3e6]" },
  skill: { icon: Wrench, tint: "bg-[#e3f4f7] text-[#127083] dark:bg-[#10292f] dark:text-[#71d3e6]" },
  business: { icon: HandCoins, tint: "bg-[#fff6d6] text-[#8a6500] dark:bg-[#302810] dark:text-[#ffd35c]" },
  startup: { icon: Rocket, tint: "bg-[#fff6d6] text-[#8a6500] dark:bg-[#302810] dark:text-[#ffd35c]" },
  pension: { icon: PiggyBank, tint: "bg-[#f1ebff] text-[#6a3fd0] dark:bg-[#271a45] dark:text-[#bca3ff]" },
  disabled: { icon: Accessibility, tint: "bg-[#e6f0ff] text-[#1f5fbf] dark:bg-[#15243f] dark:text-[#86b4ff]" },
  insurance: { icon: Umbrella, tint: "bg-[#e4f6ee] text-[#0c8a5c] dark:bg-[#11291f] dark:text-[#3fd49a]" },
  income: { icon: Wallet, tint: "bg-[#e4f6ee] text-[#0c8a5c] dark:bg-[#11291f] dark:text-[#3fd49a]" },
  central: { icon: Landmark, tint: "bg-primary-soft text-primary" },
  state: { icon: Building2, tint: "bg-primary-soft text-primary" },
};

const PRIORITY = [
  "farmer", "student", "women", "senior", "health", "housing", "pension", "disabled",
  "business", "startup", "employment", "skill", "insurance", "education", "income",
];

/** Picks the most telling topic of a scheme for its avatar. */
export function schemeTopic(tags: string[]): string {
  return PRIORITY.find((p) => tags.includes(p)) ?? (tags.includes("state") ? "state" : "central");
}

export function TopicIcon({ tag, size = "md" }: { tag: string; size?: "sm" | "md" | "lg" }) {
  const style = TAG_STYLE[tag] ?? TAG_STYLE.central;
  const Icon = style.icon;
  const box = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11";
  const glyph = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className={`icon-tile ${box} ${style.tint}`}>
      <Icon className={glyph} strokeWidth={2} aria-hidden />
    </span>
  );
}
