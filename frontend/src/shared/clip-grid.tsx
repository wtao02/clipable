"use client";

import { Clip, ProgressObject } from "@/shared/api";
import ClipCard from "./clip-card";
import { Skeleton } from "./ui";

interface Props {
  videos: Clip[];
  progresses: ProgressObject;
}

export default function ClipGrid({ videos, progresses }: Props) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <ClipCard key={video.id} video={video} progress={progresses[video.id]} />
      ))}
    </div>
  );
}

export function ClipGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
