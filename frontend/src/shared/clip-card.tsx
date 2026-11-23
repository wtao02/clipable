"use client";

import { Clip } from "@/shared/api";
import { formatDate } from "./date-formatter";
import { formatViewsCount } from "./views-formatter";
import ClipCardImage from "./clip-card-image";
import { PlayIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

interface Props {
  video: Clip;
  progress?: number;
}

export default function ClipCard({ video, progress }: Props) {
  const href = `/clips/${video.id}`;
  return (
    <article className="group min-w-0">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-surface">
        {video.processing ? (
          <ClipCardImage video={video} progress={progress} />
        ) : (
          <Link href={href} className="block h-full w-full" aria-label={`Play ${video.title}`}>
            <ClipCardImage video={video} />
            <span className="pointer-events-none absolute inset-0 grid place-items-center bg-bg/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-bg/70 text-fg">
                <PlayIcon aria-hidden="true" className="ml-0.5 h-4 w-4" />
              </span>
            </span>
          </Link>
        )}
      </div>

      <div className="mt-3 min-w-0">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-6 text-fg">
          {video.processing ? (
            video.title
          ) : (
            <Link href={href} className="underline-offset-4 hover:underline">
              {video.title}
            </Link>
          )}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <Link
            href={`/users/${video.creator.id}`}
            className="max-w-[14rem] truncate transition-colors hover:text-fg"
          >
            {video.creator.username}
          </Link>
          <span aria-hidden="true" className="text-muted-2">
            ·
          </span>
          <span className="font-mono text-[11px]">
            {formatViewsCount(video.views)} view{video.views === 1 ? "" : "s"}
          </span>
          <span aria-hidden="true" className="text-muted-2">
            ·
          </span>
          <span className="font-mono text-[11px]">{formatDate(video.created_at)}</span>
          {video.category && (
            <>
              <span aria-hidden="true" className="text-muted-2">
                ·
              </span>
              <span className="max-w-[9rem] truncate text-muted-2">{video.category.name}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
