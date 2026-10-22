import React from "react";
import { FileClock, Plus, Menu, Stethoscope, Activity, Brain, MoreVertical } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { MemoryPromptsModal } from "./MemoryPromptsModal";
import { ChatToolsSheet } from "./ChatToolsSheet";
import { useLanguageStore } from "@/stores/useLanguageStore";

interface ChatHeaderProps {
  modelValue: "med1-flash" | "med1-pro";
  onModelChange: (val: "med1-flash" | "med1-pro") => void;
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenMobileMenu?: () => void;
  onOpenSidebar: () => void;
  routeInfo?: { model: string; language: string; task: string } | null;
  /** Turns the conversation into a doctor handover summary. */
  onSummarize?: () => void;
  /** Disabled when the conversation is too short to summarise. */
  canSummarize?: boolean;
  onOpenHealthLog?: () => void;
  /** Toggles the organized "⋯" tools sheet (button + sheet backdrop/Escape). */
  onToggleMore: () => void;
  /** Reflects the sheet state for aria-expanded only. */
  isMoreOpen?: boolean;
  /** Number of saved conversations (shown inside the tools sheet). */
  sessionCount?: number;
  /** Free replies remaining today (shown inside the tools sheet). */
  repliesLeft?: number;
  /** Premium-aware "Save as PDF" action — routes free users to /subscription. */
  onSavePdf?: () => void;
  /** 🧠 memory prompts sheet override hook (used by the tools sheet). */
  onOpenMemoryPrompts?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  modelValue,
  onModelChange,
  onNewChat,
  onOpenHistory,
  onOpenMobileMenu,
  onOpenSidebar,
  routeInfo,
  onSummarize,
  canSummarize,
  onOpenHealthLog,
  onToggleMore,
  isMoreOpen = false,
  sessionCount = 0,
  repliesLeft = 0,
  onSavePdf,
  onOpenMemoryPrompts,
}) => {
  // localStorage is unavailable during SSR, so the server renders the free
  // state. Gate on mount to keep hydration consistent, then reveal Premium.
  const [mounted, setMounted] = React.useState(false);
  const [isMemoryPromptsOpen, setIsMemoryPromptsOpen] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const premiumActive = mounted && isPremium;
  const { t } = useLanguageStore();
  // The tools sheet re-uses either a parent-provided hook or the local modal.
  const openMemoryPrompts =
    onOpenMemoryPrompts ?? (() => setIsMemoryPromptsOpen(true));

  return (
    <>
      {/* Mobile Header: one row, four thumb-sized controls.
          ☰ account drawer · Flash/Pro model · + New chat · ⋯ tools sheet.
          Summarize / Health log / History / PDF / Memory prompts live INSIDE
          the ⋯ sheet (see ChatToolsSheet) — previously they were buried in a
          packed side drawer, and New chat did not exist on mobile at all. */}
      <div className="lg:hidden h-16 border-b border-border-soft bg-white px-2 flex items-center gap-1 shrink-0 sticky top-0 z-10">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label={t.chatHeader.openMenu}
          className="w-11 h-11 flex items-center justify-center text-text-primary rounded-md hover:bg-bg-soft transition-colors touch-manipulation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center: Model Selector */}
        <div className="flex-1 min-w-0 flex items-center justify-center px-1">
          <SegmentedControl
            value={modelValue}
            onChange={(val) => onModelChange(val as "med1-flash" | "med1-pro")}
            options={[
              { label: t.chatHeader.flash, value: "med1-flash" },
              { label: t.chatHeader.pro, value: "med1-pro", disabled: !premiumActive },
            ]}
            className="w-full max-w-[150px]"
          />
        </div>

        {/* New chat — previously desktop-only */}
        <button
          type="button"
          onClick={onNewChat}
          aria-label={t.chatHeader.newChat}
          className="w-11 h-11 flex items-center justify-center rounded-md text-brand hover:bg-brand-light transition-colors touch-manipulation"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* ⋯ tools sheet */}
        <button
          type="button"
          onClick={onToggleMore}
          aria-label={t.chatHeader.more}
          aria-haspopup="dialog"
          aria-expanded={isMoreOpen}
          className="w-11 h-11 flex items-center justify-center rounded-md text-text-primary hover:bg-bg-soft transition-colors touch-manipulation"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Header: Full featured */}
      <div className="hidden lg:flex h-16 border-b border-border-soft bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        {/* Left: Doctor Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold">
              Dr
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="text-[15.5px] font-bold text-text-primary leading-tight">Dr MediLink</div>
            <div
              className="text-[13px] text-text-muted font-medium"
              title={
                routeInfo
                  ? `Routed to ${routeInfo.model} · ${routeInfo.language} · ${routeInfo.task}`
                  : undefined
              }
            >
              AI Assistant
              {routeInfo && (
                <span className="text-text-muted/80"> · {routeInfo.language} · {routeInfo.model}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <SegmentedControl
            value={modelValue}
            onChange={(val) => onModelChange(val as "med1-flash" | "med1-pro")}
            options={[
              { label: t.chatHeader.flash, value: "med1-flash" },
              { label: t.chatHeader.pro, value: "med1-pro", disabled: !premiumActive },
            ]}
          />

          {/* Memory Prompts Button */}
          <button
            onClick={() => setIsMemoryPromptsOpen(true)}
            title={t.chatHeader.memoryPromptsTitle}
            className="w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:bg-bg-soft hover:text-text-primary transition-colors"
            aria-label={t.chatHeader.memoryPrompts}
          >
            <Brain className="w-5 h-5" />
          </button>

          {onSummarize && (
            <button
              onClick={onSummarize}
              disabled={!canSummarize}
              title={
                canSummarize
                  ? t.chatHeader.summarizeTooltip
                  : t.chatHeader.summarizeDisabledTooltip
              }
              className="h-9 px-3 flex items-center gap-1.5 rounded-full border-[1.5px] border-brand text-brand hover:bg-brand-light disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label={t.chatHeader.summarize}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden md:inline text-[14px] font-bold">{t.chatHeader.summarize}</span>
            </button>
          )}

          {onOpenHealthLog && (
            <button
              onClick={onOpenHealthLog}
              title="স্বাস্থ্য লগ / Vitals (BP, Sugar, Temp)"
              className="h-9 px-3 flex items-center gap-1.5 rounded-full border border-border-soft text-text-primary hover:border-brand-light hover:bg-bg-soft transition-colors"
              aria-label={t.chatHeader.healthLog}
            >
              <Activity className="w-4 h-4 text-brand" />
              <span className="hidden sm:inline text-[14px] font-semibold">স্বাস্থ্য লগ</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:bg-bg-soft hover:text-text-primary transition-colors"
            aria-label={t.chatHeader.chatHistory}
          >
            <FileClock className="w-5 h-5" />
          </button>

          <button
            onClick={onNewChat}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark transition-colors shadow-sm"
            aria-label={t.chatHeader.newChat}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MemoryPromptsModal
        isOpen={isMemoryPromptsOpen}
        onClose={() => setIsMemoryPromptsOpen(false)}
      />

      {/* Mobile "⋯" tools sheet — one organized bottom sheet for every
          conversation tool (chats, summarize, health log, PDF, memory). */}
      <ChatToolsSheet
        isOpen={isMoreOpen}
        onClose={onToggleMore}
        onNewChat={onNewChat}
        onOpenHistory={onOpenHistory}
        onSummarize={onSummarize ?? (() => undefined)}
        onOpenHealthLog={onOpenHealthLog ?? (() => undefined)}
        onOpenMemoryPrompts={openMemoryPrompts}
        onSavePdf={onSavePdf ?? (() => undefined)}
        onUpgrade={onSavePdf ?? (() => undefined)}
        canSummarize={canSummarize ?? false}
        isPremium={premiumActive}
        sessionCount={sessionCount}
        repliesLeft={repliesLeft}
      />
    </>
  );
};

export default ChatHeader;