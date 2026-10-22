import React, { useRef, useEffect } from "react";
import { Send, Mic, MicOff, Square, Paperclip, X, FileText } from "lucide-react";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useLanguageStore } from "@/stores/useLanguageStore";
import type { AttachmentKind } from "@/types";

/** A document waiting to be sent with the next message. */
export interface PendingAttachment {
  id: string;
  url: string;
  kind: AttachmentKind;
  fileName?: string;
  isScanning?: boolean;
  errorMessage?: string | null;
}

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  pendingAttachment?: PendingAttachment | null;
  onAttach?: (file: File) => void;
  onRemoveAttachment?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  pendingAttachment,
  onAttach,
  onRemoveAttachment,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguageStore();

  const kindLabel = (kind: AttachmentKind): string =>
    kind === "prescription"
      ? t.chat.kindPrescription
      : kind === "report"
        ? t.chat.kindReport
        : t.chat.kindPhoto;

  const {
    isListening,
    isSupported,
    error,
    toggle,
    stop,
    clearError,
  } = useSpeechRecognition({ value, onChange, lang: "bn-BD" });

  // Auto-grow the composer up to 120px.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Stop the microphone when the component unmounts.
  useEffect(() => () => stop(), [stop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || pendingAttachment) && !isLoading) {
        // Flush any pending interim transcript before sending.
        stop();
        onSend();
      }
    }
  };

  const handleSendClick = () => {
    if (isLoading && onStop) {
      onStop();
      return;
    }
    stop();
    onSend();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAttach) {
      onAttach(file);
    }
    // Reset so the same file can be picked again after a removal.
    event.target.value = "";
  };

  return (
    <div className="p-4 bg-white border-t border-border-soft shrink-0">
      <div className="max-w-[800px] mx-auto">
        {/* Listening banner */}
        {isListening && (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" aria-hidden="true" />
              <span className="font-medium">{t.chat.listeningBanner}</span>
            </div>
            <button
              type="button"
              onClick={stop}
              className="text-[11px] underline hover:text-red-900 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emergency rounded-sm"
            >
              {t.chat.bannerStop}
            </button>
          </div>
        )}

        {/* Voice input error — announced, never logged to the console only */}
        {error && (
          <div
            role="alert"
            className="mb-2 flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-accent-soft border border-accent/30 text-[12px] text-text-primary"
          >
            <span className="leading-relaxed">{error}</span>
            <button
              type="button"
              onClick={clearError}
              aria-label={t.chat.voiceErrorDismiss}
              className="shrink-0 text-[11px] underline font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded-sm"
            >
              {t.chat.voiceErrorDismiss}
            </button>
          </div>
        )}

        {/* Pending document chip */}
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-2.5 px-3 py-2 rounded-[12px] bg-bg-soft border border-border-soft animate-fadeIn">
            {pendingAttachment.url && pendingAttachment.url.startsWith("blob:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingAttachment.url}
                alt={t.chat.attachedDoc}
                className="w-9 h-9 rounded-[8px] object-cover border border-border-soft shrink-0"
              />
            ) : (
              <span className="w-9 h-9 rounded-[8px] bg-white border border-border-soft flex items-center justify-center text-text-muted shrink-0">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold text-text-primary truncate">
                {kindLabel(pendingAttachment.kind)}
                {pendingAttachment.fileName && (
                  <span className="text-text-muted font-medium">
                    {" "}
                    · {pendingAttachment.fileName}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-text-muted">
                {pendingAttachment.errorMessage
                  ? pendingAttachment.errorMessage
                  : pendingAttachment.isScanning
                    ? t.chat.pendingScanning
                    : t.chat.pendingReady}
              </div>
            </div>

            {onRemoveAttachment && (
              <button
                type="button"
                onClick={onRemoveAttachment}
                aria-label={t.chat.pendingRemove}
                className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:bg-emergency-soft hover:text-emergency transition-colors shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div
          className={`relative flex items-end gap-2 bg-bg-soft rounded-[18px] border p-1 transition-all shadow-sm ${
            isListening
              ? "border-red-400 ring-2 ring-red-100"
              : "border-border-soft focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent"
          }`}
        >
          {/* Microphone toggle button */}
          <button
            onClick={toggle}
            disabled={isLoading || !isSupported}
            className={`w-11 h-11 shrink-0 mb-1 ml-1 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? "bg-red-500 text-white shadow-sm hover:bg-red-600 animate-pulse"
                : "text-text-muted hover:text-brand hover:bg-brand-light"
            }`}
            title={isListening ? t.chat.micStop : t.chat.micStart}
            type="button"
            aria-label={isListening ? t.chat.micStop : t.chat.micStart}
            aria-pressed={isListening}
          >
            {isListening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
          </button>

          {/* Attach a prescription or test report */}
          {onAttach && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-11 h-11 shrink-0 mb-1 rounded-full flex items-center justify-center text-text-muted hover:text-brand hover:bg-brand-light transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={t.chat.kindPrescription}
                type="button"
                aria-label={t.chat.kindPrescription}
              >
                <Paperclip className="w-5 h-5" aria-hidden="true" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
            </>
          )}

          {/* Message input */}
          <label htmlFor="chat-composer" className="sr-only">
            {t.chat.srComposerLabel}
          </label>
          <textarea
            id="chat-composer"
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? t.chat.composerPlaceholderVoice : t.chat.composerPlaceholder}
            className="w-full bg-transparent border-none focus:outline-none resize-none py-3 px-2 text-[16px] md:text-[17px] leading-relaxed max-h-[120px] text-text-primary placeholder:text-text-muted/70"
            rows={1}
            disabled={isLoading}
          />

          {/* Action button: Send or Stop Generating */}
          {isLoading ? (
            <button
              onClick={handleSendClick}
              className="w-11 h-11 shrink-0 mb-1 mr-1 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-xs"
              aria-label={t.chat.stopGenerating}
              title={t.chat.stopGenerating}
            >
              <Square className="w-4 h-4 fill-white" aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={handleSendClick}
              disabled={!value.trim() && !pendingAttachment}
              className="w-11 h-11 shrink-0 mb-1 mr-1 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-50 disabled:bg-border-soft disabled:text-text-muted hover:bg-brand-dark transition-colors shadow-xs"
              aria-label={t.chat.send}
              title={t.chat.send}
            >
              <Send className="w-5 h-5 -ml-0.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="text-center mt-2.5 text-[13px] text-text-muted">
          {t.chat.disclaimer}
        </div>
      </div>
    </div>
  );
};
