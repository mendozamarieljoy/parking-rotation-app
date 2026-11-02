import type { ReactNode } from "react";

export default function Modal({
  isOpen,
  title,
  body,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  confirmDisabled = false,
  cancelDisabled = false,
  footer,
}: {
  isOpen: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  footer?: ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-md"
      >
        <h2 id="modal-title" className="mb-4 text-lg font-bold">{title}</h2>
        <div>{body}</div>
        {footer !== undefined ? footer : confirmLabel && onConfirm && cancelLabel && onCancel ? (
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelDisabled}
              className="min-w-20 rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="min-w-20 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
