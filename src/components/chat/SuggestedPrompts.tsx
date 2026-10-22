import React from "react";
import { Sparkles } from "lucide-react";
import { Profile } from "@/types";
import { useLanguageStore } from "@/stores/useLanguageStore";

interface SuggestedPromptsProps {
  profile: Profile | null;
  onSelect: (prompt: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ profile, onSelect }) => {
  const { language } = useLanguageStore();
  const bn = language === "bn";

  // Generate context-aware prompts based on diseases. Each prompt is
  // authored per language — Bangla prompts are natural Bangla, not
  // machine-translated Banglish, so the AI receives a clean language cue.
  const getPrompts = () => {
    const basePrompts = bn
      ? [
          "জ্বর ২ দিন ধরে, সাথে মাথা ব্যথা — এখন কী করব?",
          "বুকে জ্বালাপোড়া আর টক ঢেঁকুর কেন হচ্ছে?",
          "শিশুর রাতে শুকনো কাশি — আমি কী করতে পারি?",
        ]
      : [
          "Jor 2 din dhore, matha betha. Ki khabo?",
          "বুকে জ্বালাপোড়া আর টক ঢেঁকুর কেন হচ্ছে?",
          "My child has a dry cough at night — what can I do?",
        ];

    if (!profile) return basePrompts;

    const customPrompts: string[] = [];
    const diseases = Array.isArray(profile.diseases) ? profile.diseases : [];
    if (diseases.includes("Diabetes")) {
      customPrompts.push(bn ? "ডায়াবেটিস নিয়ন্ত্রণে রাখতে আজ কী খাওয়া উচিত?" : "What should I eat to manage my blood sugar today?");
    }
    if (diseases.includes("Asthma")) {
      customPrompts.push(bn ? "ধুলার কারণে হাঁপানি বেড়ে গেছে। কী করব?" : "My asthma is acting up due to the dust. What should I do?");
    }
    if (diseases.includes("High Blood Pressure")) {
      customPrompts.push(bn ? "উচ্চ রক্তচাপের জন্য কোন খাবারগুলো খাওয়া থেকে বিরত থাকব?" : "Are there specific foods I should avoid for high blood pressure?");
    }

    // Mix custom with base, taking up to 3 total
    const combined = [...customPrompts, ...basePrompts].slice(0, 3);
    return combined;
  };

  const prompts = getPrompts();

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-[800px] mx-auto" lang={bn ? "bn" : undefined}>
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(prompt)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-soft rounded-full text-[14px] md:text-[14.5px] font-medium text-brand hover:border-brand-soft hover:bg-brand-light transition-colors text-left shadow-xs"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-[240px] sm:max-w-none">{prompt}</span>
        </button>
      ))}
    </div>
  );
};
