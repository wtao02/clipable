"use client";

import {
  Category,
  Clip,
  Progress,
  ProgressObject,
  getCategories,
  getClips,
  searchClips,
} from "@/shared/api";
import { UserContext } from "@/context/user-context";
import ClipGrid, { ClipGridSkeleton } from "@/shared/clip-grid";
import Alert from "@/shared/alert";
import { FolderChips, FolderItem, FolderRail } from "@/shared/folder-filter";
import PageTitle from "@/shared/page-title";
import { Button, buttonStyles } from "@/shared/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

export default function Home() {
  const params = useSearchParams();
  const [query, setQuery] = useState<string | null>(null);
  const isSearch = (query ?? "").length > 0;
  const userContext = useContext(UserContext);

  const [videos, setVideos] = useState<Clip[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "all" | "none">("all");
  const [videoProgresses, setVideoProgresses] = useState<ProgressObject>({});
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setQuery((new URLSearchParams(window.location.search).get("search") ?? "").trim());
  }, [params]);

  useEffect(() => {
    setSelectedCategory("all");
  }, [userContext.user?.id]);

  useEffect(() => {
    if (userContext.loading || query === null) return;

    if (!userContext.loggedIn) {
      setVideos([]);
      setCategories([]);
      setError(false);
      return;
    }

    let cancelled = false;

    setVideos(null);
    setError(false);

    const load = async () => {
      try {
        const [vids, folders] = await Promise.all([
          isSearch ? searchClips(query) : getClips(),
          getCategories(),
        ]);

        if (!cancelled) {
          setVideos(vids);
          setCategories(folders);
        }
      } catch {
        if (!cancelled) {
          setVideos([]);
          setCategories([]);
          setError(true);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isSearch, query, reloadKey, userContext.loading, userContext.loggedIn]);

  useEffect(() => {
    if (
      selectedCategory !== "all" &&
      selectedCategory !== "none" &&
      !categories.some((category) => category.id === selectedCategory)
    ) {
      setSelectedCategory("all");
    }
  }, [categories, selectedCategory]);

  const processingKey =
    videos
      ?.filter((video) => video.processing)
      .map((video) => video.id)
      .join(",") ?? "";

  useEffect(() => {
    if (!processingKey) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const resp = await fetch(`/api/clips/progress?cid=${processingKey}`);
        if (cancelled) return;

        if (resp.status === 204) {
          setVideos((current) =>
            current?.map((video) => ({ ...video, processing: false })) ?? current
          );
          return;
        }

        if (!resp.ok) return;

        const { clips } = (await resp.json()) as Progress;
        setVideos((current) =>
          current
            ?.filter((video) => clips[video.id] !== -2)
            .map((video) => ({
              ...video,
              processing: video.processing && clips[video.id] !== undefined,
            })) ?? current
        );
        setVideoProgresses((current) => ({ ...current, ...clips }));
      } catch {
        // Keep polling; a transient request failure should not stop progress.
      }
    };

    tick();
    const interval = setInterval(tick, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [processingKey]);

  const categoryCount = (categoryID: number) =>
    videos?.filter((video) => video.category_id === categoryID).length ?? 0;

  const uncategorizedCount = videos?.filter((video) => video.category_id == null).length ?? 0;

  const folderItems: FolderItem[] = [
    { id: "all", label: "All clips", count: videos?.length ?? 0 },
    ...categories.map((category) => ({
      id: category.id,
      label: category.name,
      count: categoryCount(category.id),
    })),
    ...(categories.length > 0 || uncategorizedCount > 0
      ? [{ id: "none" as const, label: "Uncategorized", count: uncategorizedCount }]
      : []),
  ];

  const filteredVideos =
    videos?.filter((video) => {
      if (selectedCategory === "all") return true;
      if (selectedCategory === "none") return video.category_id == null;
      return video.category_id === selectedCategory;
    }) ?? [];

  const hasFolders = categories.length > 0;
  const folderEmpty = videos !== null && videos.length > 0 && filteredVideos.length === 0;
  const selectedFolderLabel =
    selectedCategory === "none"
      ? "Uncategorized"
      : selectedCategory === "all"
        ? null
        : categories.find((category) => category.id === selectedCategory)?.name ?? null;

  const manageFolders = userContext.user ? (
    <Link
      href={`/users/${userContext.user.id}`}
      className="mt-3 flex h-8 w-full items-center rounded-md px-3 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      Manage folders
    </Link>
  ) : null;

  const library =
    videos === null ? (
      <ClipGridSkeleton />
    ) : videos.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
        <p className="text-sm text-muted">
          {isSearch ? `No clips match “${query}”.` : "No clips yet."}
        </p>
        {isSearch ? (
          <a href="/" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Clear search
          </a>
        ) : (
          <Link href="/upload" className={buttonStyles({ size: "sm" })}>
            Upload the first clip
          </Link>
        )}
      </div>
    ) : folderEmpty ? (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
        <p className="text-sm text-muted">
          {isSearch
            ? `No clips in this folder match “${query}”.`
            : "No clips in this folder."}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setSelectedCategory("all")}>
          Show all clips
        </Button>
      </div>
    ) : (
      <ClipGrid videos={filteredVideos} progresses={videoProgresses} />
    );

  return (
    <main className="mx-auto w-full max-w-page px-4 py-8 sm:px-6 sm:py-10">
      <PageTitle title={isSearch ? `Search: ${query}` : "Clips"} />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg sm:text-[28px]">
            {isSearch ? "Search" : "Clips"}
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            {!userContext.loading && !userContext.loggedIn ? (
              "Private library"
            ) : isSearch ? (
              <>
                Results for <span className="text-fg">“{query}”</span>
                {selectedFolderLabel && (
                  <>
                    {" "}
                    in <span className="text-fg">{selectedFolderLabel}</span>
                  </>
                )}
                {videos && (
                  <span className="font-mono text-[12px] text-muted-2">
                    {" "}
                    · {filteredVideos.length}
                  </span>
                )}
              </>
            ) : selectedFolderLabel ? (
              <>
                Folder <span className="text-fg">“{selectedFolderLabel}”</span>
                {videos && (
                  <span className="font-mono text-[12px] text-muted-2">
                    {" "}
                    · {filteredVideos.length}
                  </span>
                )}
              </>
            ) : (
              <>
                Recent uploads
                {videos && (
                  <span className="font-mono text-[12px] text-muted-2">
                    {" "}
                    · {filteredVideos.length}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        {isSearch && (
          <a href="/" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Clear search
          </a>
        )}
      </div>

      {!userContext.loading && !userContext.loggedIn ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <p className="text-sm text-muted">Your clip library is private.</p>
          <p className="max-w-sm text-sm text-muted">
            Sign in to see your clips. A shared clip link still plays for anyone who has it.
          </p>
          <Link href="/login" className={buttonStyles({ size: "sm" })}>
            Sign in
          </Link>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border px-6 py-20 text-center">
          <Alert type="error" message="Couldn’t load clips. Check the connection and try again." />
          <Button variant="secondary" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </Button>
        </div>
      ) : hasFolders ? (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            {videos === null ? (
              <div className="sticky top-20 space-y-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-8 animate-pulse rounded-md bg-surface-2" />
                ))}
              </div>
            ) : (
              <FolderRail
                items={folderItems}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                footer={manageFolders}
              />
            )}
          </aside>

          <div className="min-w-0">
            {videos !== null && (
              <div className="mb-6 xl:hidden">
                <FolderChips
                  items={folderItems}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                  trailing={
                    userContext.user ? (
                      <Link
                        href={`/users/${userContext.user.id}`}
                        className={buttonStyles({ variant: "ghost", size: "sm" })}
                      >
                        Manage folders
                      </Link>
                    ) : undefined
                  }
                />
              </div>
            )}
            {library}
          </div>
        </div>
      ) : (
        library
      )}
    </main>
  );
}
