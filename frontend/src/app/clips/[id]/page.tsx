"use client";

import { Category, Clip, deleteCip, getClip, getCategories, updateClipDetails } from "@/shared/api";
import { UserContext } from "@/context/user-context";
import Alert from "@/shared/alert";
import { formatDate } from "@/shared/date-formatter";
import Modal from "@/shared/modal";
import PageTitle from "@/shared/page-title";
import { Badge, Button, Field, Input, Select, Skeleton, Textarea, buttonStyles } from "@/shared/ui";
import { formatViewsCount } from "@/shared/views-formatter";
import {
  ArrowLeftIcon,
  CheckIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "shaka-player/dist/controls.css";
import type shaka from "shaka-player/dist/shaka-player.ui";
import type { PlayerRefs } from "@/shared/shaka-player";

// shaka.util.Error.Category.MEDIA
const SHAKA_MEDIA_ERROR_CATEGORY = 3;

const ReactShakaPlayer = dynamic(() => import("@/shared/shaka-player"), {
  ssr: false,
});

type CopyState = "idle" | "copied" | "error";

export default function Page({ params }: { params: { id: string } }) {
  const userContext = useContext(UserContext);
  const router = useRouter();

  const [videoDetails, setVideoDetails] = useState<Clip | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mainPlayer, setMainPlayer] = useState<PlayerRefs | null>(null);
  const recoveryAttempts = useRef(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const fetchVideo = useCallback(async () => {
    try {
      const clip = await getClip(params.id);

      if (!clip) {
        setVideoDetails(null);
        setNotFound(true);
        return;
      }

      setNotFound(false);
      setVideoDetails(clip);
      setVideoTitle(clip.title);
      setVideoDescription(clip.description ?? "");
      setSelectedCategory(clip.category_id ?? 0);
    } catch {
      setVideoDetails(null);
      setNotFound(true);
    }
  }, [params.id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const isOwner = videoDetails?.creator.id === userContext.user?.id;

  useEffect(() => {
    if (!isOwner) return;

    let cancelled = false;

    getCategories().then((list) => {
      if (!cancelled) setCategories(list);
    });

    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  useEffect(() => {
    if (!mainPlayer) return;

    const { player, videoElement } = mainPlayer;

    const play = async () => {
      videoElement.onvolumechange = () => {
        localStorage.setItem("volume", videoElement.volume.toString());
      };
      await player.load(`/api/clips/${params.id}/dash.mpd`);
      recoveryAttempts.current = 0;
      videoElement.volume = parseFloat(localStorage.getItem("volume") || "1");
      await videoElement.play();
    };

    play().catch((err) => {
      console.error("Failed to play clip", err);
    });

    return () => {
      videoElement.onvolumechange = null;
    };
  }, [mainPlayer, params.id]);

  // Runtime safety net for browsers that over-report decoding support. It
  // follows the normal resolution-first order: drop frame rate at the current
  // resolution (240 -> 120 -> 60 -> 30), then drop to the next resolution.
  const handlePlayerError = (error: shaka.extern.Error): void => {
    if (!mainPlayer || error?.category !== SHAKA_MEDIA_ERROR_CATEGORY) return;
    if (recoveryAttempts.current >= 3) return;

    const { player } = mainPlayer;
    const tracks = player.getVariantTracks();
    const active = tracks.find((track) => track.active);

    if (!active) return;

    const height = active.height ?? 0;
    const frameRate = active.frameRate ?? 0;
    const restrictions = player.getConfiguration().abr.restrictions;

    const lowerFrameRate = tracks
      .filter((track) => (track.height ?? 0) === height && (track.frameRate ?? 0) < frameRate)
      .reduce((max, track) => Math.max(max, track.frameRate ?? 0), 0);

    const lowerHeight = tracks
      .filter((track) => (track.height ?? 0) < height)
      .reduce((max, track) => Math.max(max, track.height ?? 0), 0);

    let nextRestrictions;
    if (lowerFrameRate > 0) {
      nextRestrictions = { ...restrictions, maxFrameRate: lowerFrameRate };
    } else if (lowerHeight > 0) {
      nextRestrictions = {
        ...restrictions,
        maxHeight: lowerHeight,
        maxFrameRate: Infinity,
      };
    } else {
      return;
    }

    recoveryAttempts.current += 1;
    player.configure({ abr: { restrictions: nextRestrictions } });

    const currentTime = player.getMediaElement()?.currentTime ?? 0;

    player
      .load(`/api/clips/${params.id}/dash.mpd`, currentTime)
      .then(() => player.getMediaElement()?.play())
      .catch(() => {
        // Player is already in an error state; nothing else to recover here.
      });
  };

  const copyLink = async () => {
    const url = window.location.href;
    let copied = true;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
      area.remove();
    }

    setCopyState(copied ? "copied" : "error");
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  const saveEdit = async () => {
    if (!videoDetails || !videoTitle.trim()) return;

    setSaving(true);
    setEditError(null);

    let ok = false;
    try {
      ok = await updateClipDetails(videoDetails.id, {
        title: videoTitle.trim(),
        description: videoDescription,
        categoryId: selectedCategory,
      });
    } catch {
      ok = false;
    }

    setSaving(false);

    if (!ok) {
      setEditError("Couldn’t save the changes. Try again.");
      return;
    }

    setEditModalOpen(false);
    fetchVideo();
  };

  const openEdit = () => {
    setEditError(null);
    setSelectedCategory(videoDetails?.category_id ?? 0);
    setEditModalOpen(true);
  };

  const removeClip = async () => {
    if (!videoDetails) return;

    setDeleting(true);
    setDeleteError(null);

    let ok = false;
    try {
      ok = await deleteCip(videoDetails.id);
    } catch {
      ok = false;
    }

    setDeleting(false);

    if (!ok) {
      setDeleteError("Couldn’t delete this clip. Try again.");
      return;
    }

    router.push("/");
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageTitle
        title={notFound ? "Clip not found" : (videoDetails?.title ?? "Clip")}
      />
      {isOwner && (
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg"
        >
          <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
          All clips
        </Link>
      )}

      {notFound ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <p className="text-sm text-muted">That clip doesn’t exist or was removed.</p>
          <Link href="/" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Back to clips
          </Link>
        </div>
      ) : (
        <>
          {videoDetails?.processing ? (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface">
              <p className="text-sm text-muted">This clip is still processing.</p>
              <Button variant="secondary" size="sm" onClick={fetchVideo}>
                Check again
              </Button>
            </div>
          ) : videoDetails ? (
            <div className="overflow-hidden rounded-lg border border-border bg-black">
              <ReactShakaPlayer
                onLoad={(refs) => setMainPlayer(refs)}
                onPlayerError={handlePlayerError}
                uiConfig={{
                  overflowMenuButtons: ["picture_in_picture", "playback_rate", "quality"],
                  controlPanelElements: [
                    "play_pause",
                    "time_and_duration",
                    "mute",
                    "volume",
                    "spacer",
                    "overflow_menu",
                    "fullscreen",
                  ],
                }}
                autoPlay
              />
            </div>
          ) : (
            <Skeleton className="aspect-video w-full" />
          )}

          {videoDetails ? (
            <>
              <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-xl font-medium tracking-[-0.01em] text-fg sm:text-2xl">
                      {videoDetails.title}
                    </h1>
                    {isOwner && videoDetails.category && <Badge>{videoDetails.category.name}</Badge>}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                    {isOwner ? (
                      <Link
                        href={`/users/${videoDetails.creator.id}`}
                        className="text-fg underline-offset-4 hover:underline"
                      >
                        {videoDetails.creator.username}
                      </Link>
                    ) : (
                      <span className="text-fg">{videoDetails.creator.username}</span>
                    )}
                    <span aria-hidden="true" className="text-muted-2">
                      ·
                    </span>
                    <span className="font-mono text-[12px]">
                      {formatViewsCount(videoDetails.views)} view
                      {videoDetails.views === 1 ? "" : "s"}
                    </span>
                    <span aria-hidden="true" className="text-muted-2">
                      ·
                    </span>
                    <span className="font-mono text-[12px]">
                      {formatDate(videoDetails.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={copyLink}>
                    {copyState === "copied" ? (
                      <CheckIcon aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <LinkIcon aria-hidden="true" className="h-4 w-4" />
                    )}
                    {copyState === "copied"
                      ? "Copied"
                      : copyState === "error"
                        ? "Copy failed"
                        : "Copy link"}
                  </Button>
                  <span role="status" className="sr-only">
                    {copyState === "copied" ? "Link copied to clipboard" : ""}
                  </span>

                  {isOwner && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openEdit}
                        aria-label="Edit clip"
                        title="Edit clip"
                        className="w-8 px-0"
                      >
                        <PencilSquareIcon aria-hidden="true" className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteModalOpen(true)}
                        aria-label="Delete clip"
                        title="Delete clip"
                        className="w-8 px-0 text-danger hover:bg-danger/10 hover:text-danger"
                      >
                        <TrashIcon aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {videoDetails.description && (
                <p className="mt-4 max-w-prose whitespace-pre-wrap text-sm leading-6 text-muted">
                  {videoDetails.description}
                </p>
              )}
            </>
          ) : (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          )}
        </>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteError(null);
        }}
        title="Delete clip"
        content={
          <div className="space-y-4">
            <p className="text-sm text-muted">
              This removes the clip and its files permanently. This can’t be undone.
            </p>
            {deleteError && <Alert type="error" message={deleteError} />}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={removeClip} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete clip"}
              </Button>
            </div>
          </div>
        }
      />

      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditError(null);
        }}
        title="Edit clip"
        content={
          <div className="space-y-4">
            <Field label="Title" htmlFor="edit-title">
              <Input
                id="edit-title"
                value={videoTitle}
                onChange={(event) => setVideoTitle(event.target.value)}
                maxLength={64}
              />
            </Field>

            <Field label="Description" htmlFor="edit-description">
              <Textarea
                id="edit-description"
                value={videoDescription}
                onChange={(event) => setVideoDescription(event.target.value)}
                maxLength={1024}
              />
            </Field>

            <Field label="Folder" htmlFor="edit-category">
              <Select
                id="edit-category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(Number(event.target.value))}
              >
                <option value={0}>No folder</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            {editError && <Alert type="error" message={editError} />}

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                disabled={saving || !videoTitle.trim()}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        }
      />
    </main>
  );
}
