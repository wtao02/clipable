"use client";

import { Clip } from "@/shared/api";
import { Progress } from "./ui";

interface Props {
  video: Clip;
  progress?: number;
}

/**
 * Renders the thumbnail of a clip, or its processing progress.
 */
export default function ClipCardImage({ progress, video }: Props) {
  if (!video.processing) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/clips/${video.id}/thumbnail.jpg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }

  const value = typeof progress === "number" && progress > 0 ? Math.min(100, progress) : 0;
  const queued = progress === undefined || progress < 0;

  return (
    <div className="flex h-full w-full flex-col justify-end bg-surface-2 p-3">
      <div className="mb-2 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
        <span>{queued ? "Queued" : "Processing"}</span>
        {!queued && <span>{Math.round(value)}%</span>}
      </div>
      <Progress value={value} label="Processing progress" />
    </div>
  );
}
