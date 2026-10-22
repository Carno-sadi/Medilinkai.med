"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  HelpCircle,
  Crown,
  Sparkles,
  Bell,
  Globe,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useProfileStore } from "@/stores/useProfileStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useMedicationStore } from "@/stores/useMedicationStore";
import { useChatStore } from "@/stores/useChatStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface MobileChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  dailyUsage: { count: number };
  maxUsage: number;
}

interface SidebarRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  desc?: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
}

/** Shared 48px row — link variant navigates and closes the drawer. */
const SidebarRow: React.FC<SidebarRowProps> = ({
  icon,
  iconBg,
  label,
  desc,
  trailing,
  danger,
  href,
  onClick,
}) => {
  const shared = `w-full flex items-center gap-3 min-h-[48px] px-3 py-2.5 rounded-xl text-left transition-all touch-manipulation active:scale-[0.99] ${
    danger
      ? "text-emergency hover:bg-emergency-soft"
      : "bg-white border border-border-soft text-text-primary hover:bg-brand-light/40 hover:border-brand-light"
  }`;
  const body = (
    <>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">{label}</div>
        {desc && <div className="text-[12px] text-text-muted truncate">{desc}</div>}
      </div>
      {trailing}
    </>
  );
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={shared}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={shared}>
      {body}
    </button>
  );
};

const SidebarSectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">
    {children}
  </h3>
);

/* Design note (mobile organisation pass):
   Every conversation tool (history, summarize, health log, PDF, memory
   prompts) moved to the ChatToolsSheet behind the header's ⋯ button — this
   drawer is about the ACCOUNT, not the chat. Rows duplicating the always
   visible bottom nav (Home / Chat / Pharmacy / Doctors / SOS) were removed,
   which also removes the old "Chat" label that navigated to the homepage.
   New on this screen: medicine reminders entry (always visible) and a
   language switcher (previously only in the desktop footer). */

export const MobileChatSidebar: React.FC<MobileChatSidebarProps> = ({
  isOpen,
  onClose,
  dailyUsage,
  maxUsage,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const profile = useProfileStore((s) => s.profile);
  const scheduleCount = useMedicationStore(
    (s) => s.schedules.filter((schedule) => schedule.status === "active").length,
  );
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const { t, language, setLanguage } = useLanguageStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activePremium = mounted && isPremium;

  const handleUpgrade = () => {
    router.push("/subscription");
    onClose();
  };

  const handleLogout = () => {
    useProfileStore.getState().clearProfile();
    useChatStore.getState().clearAllSessions();
    router.push("/");
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t.sidebar.title}
      width="max-w-[340px] w-full"
    >
      <div className="flex flex-col h-full bg-bg-main space-y-5">
        {/* ── Profile ── */}
        <div className="flex items-center gap-4 p-4 bg-brand-light/50 rounded-xl border border-brand/15">
          <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shrink-0 font-bold text-lg">
            {mounted && profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-heading font-bold text-[16px] text-text-primary truncate">
              {mounted && profile?.name ? profile.name : t.sidebar.guest}
            </div>
            <div className="text-[13px] text-text-muted truncate">
              {mounted && profile?.area ? profile.area : t.sidebar.areaNotSet}
            </div>
          </div>
          {activePremium && (
            <Badge variant="warn" className="shrink-0">
              <Crown className="w-3 h-3 mr-1" />
              {t.sidebar.premium}
            </Badge>
          )}
        </div>

        {/* ── Plan & today's usage ── */}
        <div className="p-4 bg-bg-soft rounded-xl border border-border-soft">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] font-bold text-text-primary">
              {activePremium ? t.sidebar.unlimited : `${dailyUsage.count} / ${maxUsage}`}
            </div>
            <div className="text-[12px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
              {activePremium ? t.sidebar.premiumPlan : t.sidebar.freePlan}
            </div>
          </div>
          {!activePremium && (
            <div className="h-2 w-full bg-border-soft rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-brand transition-all duration-300"
                style={{ width: `${Math.min(100, (dailyUsage.count / maxUsage) * 100)}%` }}
              />
            </div>
          )}
          {!activePremium && (
            <Button size="s" variant="secondary" fullWidth onClick={handleUpgrade}>
              {t.sidebar.upgradePremium}
            </Button>
          )}
        </div>

        {/* ── Medicine reminders (always visible — discoverability beat) ── */}
        <SidebarRow
          icon={<Bell className="w-5 h-5 text-brand" />}
          iconBg="bg-brand-light"
          label={t.sidebar.medications}
          desc={
            scheduleCount > 0
              ? `${scheduleCount} ${scheduleCount === 1 ? t.sidebar.reminder : t.sidebar.reminders}`
              : t.sidebar.noReminders
          }
          trailing={
            scheduleCount > 0 ? (
              <Badge variant="info" className="shrink-0">
                {scheduleCount}
              </Badge>
            ) : undefined
          }
          href="/medications"
          onClick={onClose}
        />

        {/* ── Language (was footer-only; unreachable inside the chat on mobile) ── */}
        <div className="p-4 bg-bg-soft rounded-xl border border-border-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-border-soft flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] text-text-primary">{t.sidebar.language}</div>
              <div className="text-[12px] text-text-muted">{t.sidebar.languageHint}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              className={`min-h-[40px] rounded-lg text-[14px] font-bold border transition-all touch-manipulation ${
                language === "en"
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-text-primary border-border-soft"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("bn")}
              aria-pressed={language === "bn"}
              lang="bn"
              className={`min-h-[40px] rounded-lg font-bold border transition-all touch-manipulation ${
                language === "bn"
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-text-primary border-border-soft"
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="space-y-2">
          <SidebarSectionLabel>{t.sidebar.settings}</SidebarSectionLabel>
          <SidebarRow
            icon={<User className="w-5 h-5 text-brand" />}
            iconBg="bg-bg-soft"
            label={t.sidebar.profile}
            href="/register"
          />
          <SidebarRow
            icon={<HelpCircle className="w-5 h-5 text-brand" />}
            iconBg="bg-bg-soft"
            label={t.sidebar.help}
            href="/about"
          />
          {activePremium && (
            <SidebarRow
              icon={<Sparkles className="w-5 h-5 text-accent" />}
              iconBg="bg-bg-soft"
              label={t.sidebar.subscription}
              href="/subscription"
            />
          )}
          <SidebarRow
            icon={<LogOut className="w-5 h-5 text-emergency" />}
            iconBg="bg-emergency-soft"
            label={t.sidebar.logout}
            danger
            onClick={handleLogout}
          />
        </div>

        {/* ── Emergency (pinned) ── */}
        <div className="mt-auto pt-2">
          <a
            href="tel:999"
            className="w-full flex items-center gap-3 min-h-[52px] px-3 py-2.5 rounded-xl bg-emergency-soft text-emergency hover:bg-emergency/10 transition-colors touch-manipulation active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-lg bg-emergency text-white flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-[15px]">Emergency</div>
              <div className="text-[12px] text-emergency/80">Call 999</div>
            </div>
          </a>
        </div>
      </div>
    </Drawer>
  );
};

export default MobileChatSidebar;
