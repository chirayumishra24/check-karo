// Shared option lists used by the filter UI, the eligibility matcher and the AI
// extraction schema. Keep the keys stable: they are stored in the database.

export const STATES = [
  { key: "andaman", en: "Andaman & Nicobar Islands", hi: "अंडमान और निकोबार द्वीपसमूह" },
  { key: "andhra", en: "Andhra Pradesh", hi: "आंध्र प्रदेश" },
  { key: "arunachal", en: "Arunachal Pradesh", hi: "अरुणाचल प्रदेश" },
  { key: "assam", en: "Assam", hi: "असम" },
  { key: "bihar", en: "Bihar", hi: "बिहार" },
  { key: "chandigarh", en: "Chandigarh", hi: "चंडीगढ़" },
  { key: "chhattisgarh", en: "Chhattisgarh", hi: "छत्तीसगढ़" },
  { key: "dnhdd", en: "Dadra & Nagar Haveli and Daman & Diu", hi: "दादरा और नगर हवेली और दमन और दीव" },
  { key: "delhi", en: "Delhi", hi: "दिल्ली" },
  { key: "goa", en: "Goa", hi: "गोवा" },
  { key: "gujarat", en: "Gujarat", hi: "गुजरात" },
  { key: "haryana", en: "Haryana", hi: "हरियाणा" },
  { key: "himachal", en: "Himachal Pradesh", hi: "हिमाचल प्रदेश" },
  { key: "jk", en: "Jammu & Kashmir", hi: "जम्मू और कश्मीर" },
  { key: "jharkhand", en: "Jharkhand", hi: "झारखंड" },
  { key: "karnataka", en: "Karnataka", hi: "कर्नाटक" },
  { key: "kerala", en: "Kerala", hi: "केरल" },
  { key: "ladakh", en: "Ladakh", hi: "लद्दाख" },
  { key: "lakshadweep", en: "Lakshadweep", hi: "लक्षद्वीप" },
  { key: "mp", en: "Madhya Pradesh", hi: "मध्य प्रदेश" },
  { key: "maharashtra", en: "Maharashtra", hi: "महाराष्ट्र" },
  { key: "manipur", en: "Manipur", hi: "मणिपुर" },
  { key: "meghalaya", en: "Meghalaya", hi: "मेघालय" },
  { key: "mizoram", en: "Mizoram", hi: "मिज़ोरम" },
  { key: "nagaland", en: "Nagaland", hi: "नागालैंड" },
  { key: "odisha", en: "Odisha", hi: "ओडिशा" },
  { key: "puducherry", en: "Puducherry", hi: "पुडुचेरी" },
  { key: "punjab", en: "Punjab", hi: "पंजाब" },
  { key: "rajasthan", en: "Rajasthan", hi: "राजस्थान" },
  { key: "sikkim", en: "Sikkim", hi: "सिक्किम" },
  { key: "tamilnadu", en: "Tamil Nadu", hi: "तमिलनाडु" },
  { key: "telangana", en: "Telangana", hi: "तेलंगाना" },
  { key: "tripura", en: "Tripura", hi: "त्रिपुरा" },
  { key: "up", en: "Uttar Pradesh", hi: "उत्तर प्रदेश" },
  { key: "uttarakhand", en: "Uttarakhand", hi: "उत्तराखंड" },
  { key: "westbengal", en: "West Bengal", hi: "पश्चिम बंगाल" },
] as const;

export type StateKey = (typeof STATES)[number]["key"];
export const STATE_KEYS = STATES.map((s) => s.key) as [StateKey, ...StateKey[]];

export const GENDERS = ["male", "female", "other"] as const;
export const OCCUPATIONS = ["student", "farmer", "business", "employee", "unemployed", "homemaker"] as const;
export const INCOMES = ["bpl", "apl"] as const;
export const EDUCATIONS = ["none", "school", "graduate", "postgraduate"] as const;
export const CATEGORIES = ["general", "sc", "st", "obc", "minority"] as const;
export const AREAS = ["rural", "urban"] as const;
export const GROUPS = ["senior", "women", "disabled"] as const;

export const TAGS = [
  "central", "state", "education", "scholarship", "agriculture", "farmer", "women",
  "health", "business", "employment", "housing", "insurance", "pension", "skill",
  "startup", "student", "senior", "disabled", "sc", "st", "obc", "minority",
  "rural", "urban", "income",
] as const;

export type Gender = (typeof GENDERS)[number];
export type Occupation = (typeof OCCUPATIONS)[number];
export type Income = (typeof INCOMES)[number];
export type Education = (typeof EDUCATIONS)[number];
export type Category = (typeof CATEGORIES)[number];
export type Area = (typeof AREAS)[number];
export type Group = (typeof GROUPS)[number];
export type Tag = (typeof TAGS)[number];

export function stateName(key: string | null | undefined, lang: "en" | "hi"): string {
  if (!key) return "";
  return STATES.find((s) => s.key === key)?.[lang] ?? "";
}
