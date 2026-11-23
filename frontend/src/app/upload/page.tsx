"use client";

import Alert from "@/shared/alert";
import PageTitle from "@/shared/page-title";
import { UserContext } from "@/context/user-context";
import { Category, createCategory, getCategories } from "@/shared/api";
import { Button, Field, Input, Progress, Skeleton, Textarea, buttonStyles } from "@/shared/ui";
import { ArrowUpTrayIcon, DocumentIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragEvent, FormEvent, useContext, useEffect, useRef, useState } from "react";

enum State {
  Idle,
  ErrorUpload,
  ErrorEncoding,
  Success,
  Uploading,
  Queued,
  Encoding,
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

const statusLabel: Record<State, string> = {
  [State.Idle]: "Upload clip",
  [State.Uploading]: "Uploading",
  [State.Queued]: "Queued",
  [State.Encoding]: "Encoding",
  [State.Success]: "Uploaded",
  [State.ErrorUpload]: "Upload failed",
  [State.ErrorEncoding]: "Encoding failed",
};

export default function Upload() {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<State>(State.Idle);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File>();
  const [clipId, setClipId] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!userContext.loggedIn) return;

    let cancelled = false;

    getCategories().then((list) => {
      if (!cancelled) setCategories(list);
    });

    return () => {
      cancelled = true;
    };
  }, [userContext.loggedIn]);

  const busy =
    state === State.Uploading || state === State.Queued || state === State.Encoding;
  const failed = state === State.ErrorUpload || state === State.ErrorEncoding;

  const pickFile = (next: File | undefined) => {
    if (!next) return;

    const videoExtension =
      /\.(mp4|m4v|mov|webm|mkv|avi|wmv|flv|mpe?g|ts|m2ts|ogv|3gp|3g2)$/i;

    if (next.type && !next.type.startsWith("video/") && !videoExtension.test(next.name)) {
      setErrorDetail(
        "Choose a video file — MP4, WebM, MOV, MKV and other video formats."
      );
      setState(State.ErrorUpload);
      setFile(undefined);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFile(next);
    if (!title.trim()) {
      const parsed = next.name
        .split(".")
        .slice(0, -1)
        .join(" ")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      setTitle(parsed || next.name);
    }
  };

  const uploadVideo = async () => {
    if (!file || !title.trim()) return;

    setState(State.Uploading);
    setProgress(0);
    setErrorDetail(null);

    let categoryId = 0;
    const folder = categoryName.trim();

    if (folder) {
      const existing = categories.find(
        (category) => category.name.toLowerCase() === folder.toLowerCase()
      );

      if (existing) {
        categoryId = existing.id;
      } else {
        const created = await createCategory(folder);

        if (!created) {
          setErrorDetail("Couldn’t create that folder. Try a different name.");
          setState(State.ErrorUpload);
          return;
        }

        setCategories((current) => [...current, created]);
        categoryId = created.id;
      }
    }

    const body = new FormData();
    body.append(
      "json",
      JSON.stringify({ title: title.trim(), description, category_id: categoryId })
    );
    body.append("video", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/clips", true);
    request.withCredentials = true;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.ceil((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      if (request.status !== 200) {
        if (request.status === 400) {
          setErrorDetail(request.responseText || "Only video files are supported.");
        }
        setState(State.ErrorUpload);
        return;
      }

      try {
        const created = JSON.parse(request.responseText) as { id: string };
        setClipId(created.id);
        setProgress(0);
        setState(State.Queued);
      } catch {
        setState(State.ErrorUpload);
      }
    };

    request.onerror = () => setState(State.ErrorUpload);
    request.send(body);
  };

  useEffect(() => {
    if (state !== State.Queued && state !== State.Encoding) return;

    let cancelled = false;

    const check = async () => {
      try {
        const resp = await fetch(`/api/clips/progress?cid=${clipId}`);
        if (cancelled) return;

        if (resp.status === 204) {
          setState(State.Success);
          router.push(`/clips/${clipId}`);
          return;
        }

        if (resp.status !== 200) return;

        const json = (await resp.json()) as { clips: Record<string, number> };
        const value = json.clips[clipId];

        if (value === -2) {
          setState(State.ErrorEncoding);
          return;
        }

        if (typeof value === "number") {
          setProgress(value < 0 ? 0 : Math.min(100, value));
          setState(State.Encoding);
        }
      } catch {
        // Keep polling; a transient request failure should not stop the job.
      }
    };

    check();
    const interval = setInterval(check, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [state, clipId, router]);

  const reset = () => {
    setState(State.Idle);
    setProgress(0);
    setClipId("");
    setErrorDetail(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!busy && !failed) uploadVideo();
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    pickFile(event.dataTransfer.files?.[0]);
  };

  if (userContext.loading) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-10 sm:px-6 sm:py-14">
        <PageTitle title="Upload" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-sm" />
        <Skeleton className="mt-8 h-52 w-full" />
      </main>
    );
  }

  if (!userContext.loggedIn) {
    return (
      <main className="mx-auto w-full max-w-[480px] px-4 py-20 sm:py-28">
        <PageTitle title="Upload" />
        <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg">Sign in to upload</h1>
        <p className="mt-2 text-sm text-muted">
          Your clip library is private. Sign in to add a clip; shared links still play for anyone
          who has them.
        </p>
        <Link href="/login" className={buttonStyles({ size: "sm", className: "mt-6" })}>
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-10 sm:px-6 sm:py-14">
      <PageTitle title="Upload" />
      <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg">Upload a clip</h1>
      <p className="mt-2 text-sm text-muted">
        Drop a video, add a title, and Vitryne will transcode it for playback.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={clsx(
            "rounded-lg border border-dashed px-5 py-8 text-center transition-colors",
            dragging ? "border-fg/60 bg-surface-2" : "border-border bg-surface",
            busy && "opacity-60"
          )}
        >
          {file ? (
            <div className="flex items-center justify-between gap-4 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <DocumentIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{file.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-2">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              {!busy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(undefined);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <>
              <ArrowUpTrayIcon aria-hidden="true" className="mx-auto h-6 w-6 text-muted" />
              <p className="mt-3 text-sm text-fg">Drop a video here</p>
              <p className="mt-1 text-[13px] text-muted">
                or choose a video file from your computer
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                Choose file
              </Button>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="video/*,.mp4,.m4v,.mov,.webm,.mkv,.avi,.wmv,.flv,.mpg,.mpeg,.ts,.m2ts,.3gp,.3g2"
            aria-label="Video file"
            className="sr-only"
            onChange={(event) => pickFile(event.target.files?.[0])}
            disabled={busy}
          />
        </div>

        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={64}
            required
          />
        </Field>

        <Field label="Description" htmlFor="description" hint="Optional. Up to 1,024 characters.">
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1024}
          />
        </Field>

        <Field
          label="Folder"
          htmlFor="category"
          hint="Choose an existing folder or type a new name."
        >
          <Input
            id="category"
            name="category"
            list="category-options"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            maxLength={64}
            placeholder="e.g. Games"
            disabled={busy}
          />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category.id} value={category.name} />
            ))}
          </datalist>
        </Field>

        {state !== State.Idle && !failed && (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
              <span>{statusLabel[state]}</span>
              {(state === State.Uploading || state === State.Encoding) && (
                <span>{Math.round(progress)}%</span>
              )}
            </div>
            <Progress value={state === State.Queued ? 0 : progress} label={statusLabel[state]} />
          </div>
        )}

        {failed && (
          <Alert
            type="error"
            message={
              errorDetail ??
              (state === State.ErrorUpload
                ? "The upload failed. Check the file and try again."
                : "The server couldn’t transcode this video.")
            }
          />
        )}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={!file || !title.trim() || busy || failed}
            className="min-w-[7rem]"
          >
            {busy ? statusLabel[state] : "Upload clip"}
          </Button>
          {failed && (
            <Button variant="secondary" onClick={reset}>
              Try again
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
