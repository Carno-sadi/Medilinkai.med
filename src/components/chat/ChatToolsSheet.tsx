"use client";

import React from "react";
import {
  Plus,
  FileClock,
  Stethoscope,
  Activity,
  Download,
  Brain,
  Crown,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { useLanguageStore } from "@/stores/useLanguageStore";

interface ChatToolsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Every action closes the sheet first so the opened surface is unobstructed. */
  onNewChat: () => void;
  onOpenHistory: () => void;
  onSummarize: () => void;
  onOpenHealthLog: () => void;
  onOpenMemoryPrompts: () => void;
  onSavePdf: () => void;
  onUpgrade: () => void;
  canSummarize: boolean;
  isPremium: boolean;
  sessionCount: number;
  /** Free replies remaining today — shown so the daily limit is never a surprise. */
  repliesLeft: number;
}

interface ToolRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  desc?: string;
  badge?: string;
  badgeVariant?: "info" | "warn";
  disabled?: boolean;
  onClick: () => void;
}

/** Uniform 48px-tall action row — the building block of the tools sheet. */
const ToolRow: React.FC<ToolRowProps> = ({
  icon,
  iconBg,
  label,
  desc,
  badge,
  badgeVariant = "info",
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 min-h-[48px] px-3 py-2.5 rounded-xl text-left transition-all touch-manipulation active:scale-[0.99] ${
      disabled
        ? "bg-bg-soft border border-border-soft text-text-muted/50 cursor-not-allowed"
        : "bg-white border border-border-soft text-text-primary hover:bg-brand-light/40 hover:border-brand-light"
    }`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-[15px] truncate">{label}</div>
      {desc && <div className="text-[12px] text-text-muted truncate">{desc}</div>}
    </div>
    {badge && (
      <Badge variant={badgeVariant} className="shrink-0">
        {badge}
      </Badge>
    )}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2 mt-1 first:mt-0">
    {children}
  </h4>
);

export const ChatToolsSheet: React.FC<ChatToolsSheetProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onOpenHistory,
  onSummarize,
  onOpenHealthLog,
  onOpenMemoryPrompts,
  onSavePdf,
  onUpgrade,
  canSummarize,
  isPremium,
  sessionCount,
  repliesLeft,
}) => {
  const { t } = useLanguageStore();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={t.chatHeader.moreTitle}>
      <div className="space-y-4">
        {/* ── Group 1: conversations ── */}
        <section aria-label={t.chatHeader.groupChats}>
          <SectionLabel>{t.chatHeader.groupChats}</SectionLabel>
          <div className="space-y-2">
            <ToolRow
              icon={<Plus className="w-5 h-5 text-brand" strokeWidth={2.5} />}
              iconBg="bg-brand-light"
              label={t.chatHeader.newChat}
              desc={t.chatHeader.newChatDesc}
              onClick={() => {
                onClose();
                onNewChat();
              }}
            />
            <ToolRow
              icon={<FileClock className="w-5 h-5 text-text-primary" />}
              iconBg="bg-bg-soft"
              label={t.sidebar.chatHistory}
              desc={`${sessionCount} ${t.sidebar.conversations}`}
              onClick={() => {
                onClose();
                onOpenHistory();
              }}
            />
          </div>
        </section>

        {/* ── Group 2: this conversation's tools ── */}
        <section aria-label={t.chatHeader.groupThisChat}>
          <SectionLabel>{t.chatHeader.groupThisChat}</SectionLabel>
          <div className="space-y-2">
            <ToolRow
              icon={<Stethoscope className="w-5 h-5 text-brand" />}
              iconBg="bg-brand-light"
              label={t.sidebar.summarize}
              desc={t.sidebar.summarizeDesc}
              badge={canSummarize ? undefined : t.sidebar.needsMoreChat}
              disabled={!canSummarize}
              onClick={() => {
                onClose();
                onSummarize();
              }}
            />
            <ToolRow
              icon={<Activity className="w-5 h-5 text-success" />}
              iconBg="bg-success-soft"
              label={t.sidebar.healthLog}
              desc={t.sidebar.healthLogDesc}
              onClick={() => {
                onClose();
                onOpenHealthLog();
              }}
            />
            <ToolRow
              icon={<Download className="w-5 h-5 text-brand" />}
              iconBg="bg-brand-light"
              label={t.chatHeader.savePdf}
              desc={t.chatHeader.savePdfDesc}
              badge={isPremium ? undefined : t.chatHeader.pdfLocked}
              badgeVariant="warn"
              onClick={() => {
                onClose();
                onSavePdf();
              }}
            />
            <ToolRow
              icon={<Brain className="w-5 h-5 text-accent" />}
              iconBg="bg-accent-soft"
              label={t.sidebar.memoryPrompts}
              desc={t.sidebar.memoryPromptsDesc}
              onClick={() => {
                onClose();
                onOpenMemoryPrompts();
              }}
            />
          </div>
        </section>

        {/* ── Footer: never let the daily limit hit as a surprise ── */}
        {!isPremium && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-accent-soft border border-accent/20">
            <div className="text-[13px] font-semibold text-text-primary">
              {repliesLeft} {t.chatHeader.repliesLeft}
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="h-9 px-3 shrink-0 flex items-center gap-1.5 rounded-full bg-accent text-white text-[13px] font-bold hover:brightness-90 transition-[filter,transform] touch-manipulation active:scale-[0.98]"
            >
              <Crown className="w-3.5 h-3.5" aria-hidden="true" />
              {t.chatHeader.upgradeCta}
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default ChatToolsSheet;
