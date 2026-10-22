/**
 * Language-aware composable words for things the dictionary can't hold:
 * counts, times and durations ("twice a day", "8:30 AM" ↔ "দিনে ২ বার",
 * "রাত ১০:০০"). Every user-visible sentence still lives in i18n.ts — this
 * module only combines numbers with period/duration words.
 *
 * "Modern Bangla" rule: conversational, no Sanskritised vocabulary
 * ("দিনে ২ বার", not "প্রতিদিন দ্বিবার").
 */

export type TimeLang = "en" | "bn";

const BN_DIGITS: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
};

export function toBnDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[d]);
}

/** "1 day" ↔ num already language-shaped */
function dayWord(lang: TimeLang): string {
  return lang === "bn" ? "দিন" : "day";
}

/** "once a day" / "twice a day" / "3 times a day" ↔ "দিনে ১ বার" … */
export function frequencyPhrase(count: number, lang: TimeLang): string {
  if (count <= 0) return "";
  if (lang === "bn") {
    const n = toBnDigits(count);
    if (count === 1) return `দিনে ${n} বার`;
    return `দিনে ${n} বার`;
  }
  if (count === 1) return "once a day";
  if (count === 2) return "twice a day";
  return `${count} times a day`;
}

/** "for 3 days" / "until you stop it" ↔ "৩ দিনের জন্য" / "ওষুধ বন্ধ করা পর্যন্ত" */
export function durationPhrase(days: number | undefined, lang: TimeLang): string {
  if (!days || days <= 0) {
    return lang === "bn" ? "ওষুধ বন্ধ করা পর্যন্ত" : "until you stop it";
  }
  if (lang === "bn") {
    return `${toBnDigits(days)} ${dayWord(lang)}ের জন্য`;
  }
  return days === 1 ? "for 1 day" : `for ${days} days`;
}

/** "8:30 AM" ↔ Bangla hour words with period prefix ("সকাল ৮:৩০"). */
export function clockLabel(hhmm: string, lang: TimeLang): string {
  const [h , m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;

  if (lang === "bn") {
    const period =
      h >= 5 && h < 12 ? "সকাল" :
      h >= 12 && h < 16 ? "দুপুর" :
      h >= 16 && h < 19 ? "বিকাল" : "রাত";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${period} ${toBnDigits(hour)}:${toBnDigits(String(m).padStart(2, "0"))}`;
  }

  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
