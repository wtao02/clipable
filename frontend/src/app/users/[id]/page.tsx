"use client";

import {
  Category,
  Clip,
  Progress,
  ProgressObject,
  User,
  createCategory,
  getUserById,
  getUserCategories,
  getUsersClips,
} from "@/shared/api";
import { UserContext } from "@/context/user-context";
import Alert from "@/shared/alert";
import ClipGrid, { ClipGridSkeleton } from "@/shared/clip-grid";
import { formatAbsoluteDate } from "@/shared/date-formatter";
import { FolderChips, FolderItem, FolderRail } from "@/shared/folder-filter";
import PageTitle from "@/shared/page-title";
import { Button, Input, buttonStyles } from "@/shared/ui";
import Link from "next/link";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";

export default function Profile({ params }: { params: { id: string } }) {
  const userContext = useContext(UserContext);

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [videos, setVideos] = useState<Clip[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videoProgresses, setVideoProgresses] = useState<ProgressObject>({});
  const [selectedCategory, setSelectedCategory] = useState<number | "all" | "none">("all");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (creatingFolder) {
      formRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [creatingFolder]);

  useEffect(() => {
    if (userContext.loading) return;

    if (!userContext.user || userContext.user.id !== params.id) {
      setPrivateProfile(true);
      setUser(null);
      setVideos([]);
      setCategories([]);
      setError(false);
      return;
    }

    setPrivateProfile(false);

    let cancelled = false;

    setUser(undefined);
    setVideos(null);
    setCategories([]);
    setSelectedCategory("all");
    setError(false);

    Promise.all([getUserById(params.id), getUsersClips(params.id), getUserCategories(params.id)])
      .then(([profile, clips, folders]) => {
        if (cancelled) return;
        setUser(profile);
        setVideos(clips);
        setCategories(folders);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setVideos([]);
        setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id, reloadKey, userContext.loading, userContext.user?.id]);

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

  if (privateProfile) {
    return (
      <main className="mx-auto w-full max-w-page px-4 py-8 sm:px-6 sm:py-10">
        <PageTitle title="Private profile" />
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <p className="text-sm text-muted">This library is private.</p>
          <p className="max-w-sm text-sm text-muted">Only its owner can open this profile.</p>
          <Link href="/" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Back to your clips
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-page px-4 py-8 sm:px-6 sm:py-10">
        <PageTitle title="Profile" />
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border px-6 py-20 text-center">
          <Alert type="error" message="Couldn’t load this profile." />
          <Button variant="secondary" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  if (user === null) {
    return (
      <main className="mx-auto w-full max-w-page px-4 py-8 sm:px-6 sm:py-10">
        <PageTitle title="Profile" />
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <p className="text-sm text-muted">That user doesn’t exist.</p>
          <Link href="/" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Back to clips
          </Link>
        </div>
      </main>
    );
  }

  const isSelf = user && userContext.user?.id === user.id;
  const pageTitle = <PageTitle title={user?.username ?? "Profile"} />;

  const visibleVideos =
    videos?.filter((video) => {
      if (selectedCategory === "all") return true;
      if (selectedCategory === "none") return video.category_id == null;
      return video.category_id === selectedCategory;
    }) ?? [];

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

  const submitFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newFolderName.trim();

    if (!name) return;

    setFolderError(null);

    const created = await createCategory(name);

    if (!created) {
      setFolderError("Couldn’t create that folder. The name may already be in use.");
      return;
    }

    setCategories((current) =>
      [...current, created].sort((a, b) => a.name.localeCompare(b.name))
    );
    setSelectedCategory(created.id);
    setNewFolderName("");
    setCreatingFolder(false);
  };

  return (
    <main className="mx-auto w-full max-w-page px-4 py-8 sm:px-6 sm:py-10">
      {pageTitle}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {user === undefined ? (
            <>
              <div className="h-7 w-40 animate-pulse rounded bg-surface-2" />
              <div className="mt-2 h-4 w-56 animate-pulse rounded bg-surface-2" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg sm:text-[28px]">
                {user.username}
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                Joined{" "}
                <span className="font-mono text-[12px]">{formatAbsoluteDate(user.joined_at)}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono text-[12px]">{videos?.length ?? 0}</span> clips
              </p>
            </>
          )}
        </div>
        {isSelf && (
          <Link href="/upload" className={buttonStyles({ size: "sm" })}>
            Upload a clip
          </Link>
        )}
      </div>

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
              onCreate={isSelf && !creatingFolder ? () => setCreatingFolder(true) : undefined}
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
                  isSelf && !creatingFolder ? (
                    <Button variant="ghost" size="sm" onClick={() => setCreatingFolder(true)}>
                      New folder
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}

          {isSelf && creatingFolder && (
            <form
              ref={formRef}
              onSubmit={submitFolder}
              className="mb-6 flex max-w-md flex-wrap items-center gap-2"
            >
              <Input
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="Folder name"
                aria-label="Folder name"
                maxLength={64}
                autoFocus
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={!newFolderName.trim()}>
                Create
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName("");
                  setFolderError(null);
                }}
              >
                Cancel
              </Button>
            </form>
          )}

          {folderError && (
            <div className="mb-6">
              <Alert type="error" message={folderError} />
            </div>
          )}

          {videos === null ? (
            <ClipGridSkeleton />
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
              <p className="text-sm text-muted">No clips yet.</p>
              {isSelf && (
                <Link href="/upload" className={buttonStyles({ size: "sm" })}>
                  Upload your first clip
                </Link>
              )}
            </div>
          ) : visibleVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
              <p className="text-sm text-muted">No clips in this folder.</p>
              <Button variant="secondary" size="sm" onClick={() => setSelectedCategory("all")}>
                Show all clips
              </Button>
            </div>
          ) : (
            <ClipGrid videos={visibleVideos} progresses={videoProgresses} />
          )}
        </div>
      </div>
    </main>
  );
}
