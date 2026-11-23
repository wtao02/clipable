"use client";

import clsx from "clsx";

interface Props {
  type: "info" | "success" | "error";
  message: string;
}

const tones = {
  info: "border-border bg-surface text-muted",
  success: "border-success/30 bg-success/5 text-success",
  error: "border-danger/30 bg-danger/5 text-danger",
};

export default function Alert({ type, message }: Props) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={clsx("rounded-md border px-3 py-2 text-[13px]", tones[type])}
    >
      {message}
    </div>
  );
}
