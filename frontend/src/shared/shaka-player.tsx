"use client";

import { useEffect, useRef } from "react";
import type shaka from "shaka-player/dist/shaka-player.ui";

export interface PlayerRefs {
  player: shaka.Player;
  ui: shaka.ui.Overlay;
  videoElement: HTMLVideoElement;
}

export interface ShakaPlayerProps {
  onLoad?: (refs: PlayerRefs) => void;
  onPlayerError?: (error: shaka.extern.Error) => void;
  // Partial Shaka UI/player configs; Shaka merges them with its defaults.
  uiConfig?: object;
  config?: object;
  autoPlay?: boolean;
}

export default function ShakaPlayer({
  onLoad,
  onPlayerError,
  uiConfig,
  config,
  autoPlay,
}: ShakaPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keep callbacks in refs so the player is created exactly once, even if the
  // parent re-renders with new function identities.
  const onLoadRef = useRef(onLoad);
  const onPlayerErrorRef = useRef(onPlayerError);
  onLoadRef.current = onLoad;
  onPlayerErrorRef.current = onPlayerError;

  useEffect(() => {
    let cancelled = false;
    let player: shaka.Player | undefined;
    let ui: shaka.ui.Overlay | undefined;
    let errorHandler: ((event: Event) => void) | undefined;

    const init = async () => {
      // Browser-only: imported lazily so nothing runs during SSR.
      const shakaModule = await import("shaka-player/dist/shaka-player.ui");
      const shaka = shakaModule.default;

      if (cancelled) {
        return;
      }

      shaka.polyfill.installAll();

      if (!shaka.Player.isBrowserSupported()) {
        console.error("Shaka Player is not supported in this browser");
        return;
      }

      // Shaka 5: the constructor no longer takes a media element.
      player = new shaka.Player();
      await player.attach(videoRef.current!);

      if (cancelled) {
        await player.destroy();
        return;
      }

      if (config) {
        player.configure(config);
      }

      ui = new shaka.ui.Overlay(player, containerRef.current!, videoRef.current!);
      if (uiConfig) {
        ui.configure(uiConfig);
      }

      errorHandler = (event: Event) => {
        const error = (event as CustomEvent<shaka.extern.Error>).detail;
        onPlayerErrorRef.current?.(error);
      };
      player.addEventListener("error", errorHandler);

      onLoadRef.current?.({ player, ui, videoElement: videoRef.current! });
    };

    init().catch((err) => {
      console.error("Failed to initialize Shaka Player", err);
    });

    return () => {
      cancelled = true;

      if (player && errorHandler) {
        player.removeEventListener("error", errorHandler);
      }

      // Destroy the overlay before the player; both return promises that we
      // intentionally don't await during unmount.
      if (ui) {
        ui.destroy().catch(() => {});
      }
      if (player) {
        player.destroy().catch(() => {});
      }
    };
    // Config is static for this app; recreating the player on every prop
    // change would interrupt playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="shaka-video-container"
      style={{ maxWidth: "100%", width: "100%" }}
    >
      <video
        ref={videoRef}
        style={{ maxWidth: "100%", width: "100%" }}
        autoPlay={autoPlay}
        playsInline
      />
    </div>
  );
}
