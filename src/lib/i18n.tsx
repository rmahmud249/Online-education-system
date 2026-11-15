import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "bn" | "en";

const dict = {
  home: ["হোম", "Home"],
  catalog: ["পাঠ্যক্রম", "Catalog"],
  materials: ["স্টাডি ম্যাটেরিয়াল", "Study Materials"],
  exams: ["অনলাইন পরীক্ষা", "Online Exams"],
  boardQuestions: ["বোর্ড প্রশ্ন", "Board Questions"],
  notices: ["নোটিশ", "Notices"],
  leaderboard: ["লিডারবোর্ড", "Leaderboard"],
  about: ["আমাদের সম্পর্কে", "About"],
  contact: ["যোগাযোগ", "Contact"],
  login: ["লগইন", "Login"],
  register: ["রেজিস্টার", "Register"],
  logout: ["লগআউট", "Logout"],
  dashboard: ["ড্যাশবোর্ড", "Dashboard"],
  admin: ["অ্যাডমিন প্যানেল", "Admin Panel"],
  teacher: ["শিক্ষক প্যানেল", "Teacher Panel"],
  heroTitle: ["এসএসসি ও এইচএসসি প্রস্তুতির সম্পূর্ণ প্ল্যাটফর্ম", "The complete SSC & HSC preparation platform"],
  heroSub: ["অধ্যায়ভিত্তিক নোট, বোর্ড প্রশ্ন, সাজেশন এবং লাইভ MCQ ও সৃজনশীল পরীক্ষা — সব এক জায়গায়।", "Chapter-wise notes, board questions, suggestions and live MCQ & CQ exams — all in one place."],
  searchPlaceholder: ["নোট, অধ্যায় বা বিষয় খুঁজুন...", "Search notes, chapters or subjects..."],
  search: ["খুঁজুন", "Search"],
  startLearning: ["শেখা শুরু করুন", "Start learning"],
  takeExam: ["পরীক্ষা দিন", "Take an exam"],
  popularSubjects: ["জনপ্রিয় বিষয়", "Popular subjects"],
  latestNotes: ["সর্বশেষ নোট", "Latest notes"],
  upcomingExams: ["চলমান ও আসন্ন পরীক্ষা", "Live & upcoming exams"],
  viewAll: ["সব দেখুন", "View all"],
  chapters: ["অধ্যায়", "Chapters"],
  lessons: ["লেসন", "Lessons"],
  subjects: ["বিষয়সমূহ", "Subjects"],
  common: ["আবশ্যিক", "Compulsory"],
  minutes: ["মিনিট", "min"],
  marks: ["নম্বর", "marks"],
  start: ["শুরু করুন", "Start"],
  loading: ["লোড হচ্ছে...", "Loading..."],
  empty: ["কিছু পাওয়া যায়নি", "Nothing found"],
  error: ["কিছু ভুল হয়েছে", "Something went wrong"],
  retry: ["আবার চেষ্টা করুন", "Try again"],
  submit: ["জমা দিন", "Submit"],
  save: ["সংরক্ষণ", "Save"],
  results: ["ফলাফল", "Results"],
  myExams: ["আমার পরীক্ষা", "My exams"],
  savedNotes: ["সংরক্ষিত নোট", "Saved notes"],
  recentlyViewed: ["সম্প্রতি দেখা", "Recently viewed"],
  notifications: ["নোটিফিকেশন", "Notifications"],
  profile: ["প্রোফাইল", "Profile"],
  footerTag: ["বাংলাদেশের শিক্ষার্থীদের জন্য আধুনিক অনলাইন শিক্ষা প্ল্যাটফর্ম।", "A modern online learning platform for Bangladeshi students."],
} as const;

export type DictKey = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "bn",
  setLang: () => {},
  t: (k) => dict[k][0],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  useEffect(() => {
    const saved = localStorage.getItem("seb-lang");
    if (saved === "en" || saved === "bn") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("seb-lang", l);
  };
  const t = (k: DictKey) => dict[k][lang === "bn" ? 0 : 1];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

const bnDigits = "০১২৩৪৫৬৭৮৯";
export function toBn(n: number | string, lang: Lang = "bn") {
  if (lang === "en") return String(n);
  return String(n).replace(/\d/g, (d) => bnDigits[Number(d)] ?? d);
}
