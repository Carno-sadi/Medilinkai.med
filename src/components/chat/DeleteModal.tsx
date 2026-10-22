import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useLanguageStore } from "@/stores/useLanguageStore";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useLanguageStore();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.chat.deleteTitle}>
      <p className="text-[15px] text-text-muted mb-6">
        {t.chat.deleteBody}
      </p>
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
        <Button variant="emergency" onClick={() => { onConfirm(); onClose(); }}>{t.common.delete}</Button>
      </div>
    </Modal>
  );
};
