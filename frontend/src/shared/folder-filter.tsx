"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

export type FolderSelection = number | "all" | "none";

export interface FolderItem {
  id: FolderSelection;
  label: string;
  count: number;
}

export function FolderRail({
  items,
  selected,
  onSelect,
  onCreate,
  createLabel = "New folder",
  footer,
}: {
  items: FolderItem[];
  selected: FolderSelection;
  onSelect: (id: FolderSelection) => void;
  onCreate?: () => void;
  createLabel?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="sticky top-20">
      <p className="mb-2 px-3 text-[12px] text-muted-2">Folders</p>
      <nav aria-label="Folders" className="space-y-0.5">
        {items.map((item) => (
          <button
            key={String(item.id)}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={selected === item.id}
            className={clsx(
              "flex h-8 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-[13px] transition-colors",
              selected === item.id
                ? "bg-surface-2 text-fg"
                : "text-muted hover:bg-surface-2 hover:text-fg"
            )}
          >
            <span className="truncate">{item.label}</span>
            <span className="font-mono text-[11px] text-muted-2">{item.count}</span>
          </button>
        ))}
      </nav>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-2 flex h-8 w-full items-center rounded-md px-3 text-left text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {createLabel}
        </button>
      )}
      {footer}
    </div>
  );
}

export function FolderChips({
  items,
  selected,
  onSelect,
  trailing,
}: {
  items: FolderItem[];
  selected: FolderSelection;
  onSelect: (id: FolderSelection) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <button
          key={String(item.id)}
          type="button"
          onClick={() => onSelect(item.id)}
          aria-pressed={selected === item.id}
          className={clsx(
            "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-[13px] transition-colors",
            selected === item.id
              ? "border-fg/40 bg-surface-2 text-fg"
              : "border-border text-muted hover:border-border-strong hover:text-fg"
          )}
        >
          {item.label}
          <span className="font-mono text-[11px] text-muted-2">{item.count}</span>
        </button>
      ))}
      {trailing}
    </div>
  );
}
