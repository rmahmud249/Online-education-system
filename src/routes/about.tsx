import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Container } from "@/components/page";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "আমাদের সম্পর্কে | Smart Education BD" }, { name: "description", content: "Smart Education BD — SSC ও HSC শিক্ষার্থীদের জন্য অনলাইন প্ল্যাটফর্ম।" }, { property: "og:title", content: "আমাদের সম্পর্কে" }, { property: "og:description", content: "আমাদের লক্ষ্য ও উদ্দেশ্য" }] }),
  component: () => (<><PageHeader title="আমাদের সম্পর্কে" /><Container className="max-w-3xl space-y-4 text-lg leading-relaxed"><p>Smart Education BD বাংলাদেশের এসএসসি ও এইচএসসি শিক্ষার্থীদের জন্য একটি আধুনিক অনলাইন শিক্ষা প্ল্যাটফর্ম। অধ্যায়ভিত্তিক নোট, বোর্ড প্রশ্ন, সাজেশন এবং লাইভ MCQ ও সৃজনশীল পরীক্ষার মাধ্যমে আমরা শিক্ষার্থীদের প্রস্তুতি সহজ করতে চাই।</p><p>অভিজ্ঞ শিক্ষকরা প্রশ্ন তৈরি ও খাতা মূল্যায়ন করেন, আর শিক্ষার্থীরা নিজের অগ্রগতি চার্টে দেখতে পায়।</p></Container></>),
});
