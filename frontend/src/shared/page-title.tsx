"use client";

import { useEffect } from "react";

export default function PageTitle({ title }: { title?: string }) {
  useEffect(() => {
    document.title = title ? `${title} · Vitryne` : "Vitryne";
  }, [title]);

  return null;
}
