# Vitryne

A private, self-hosted video library. Upload a video, it is transcoded into adaptive-quality renditions, and you watch or share it from a clean dark interface.

## Features

- **Private by default.** Each account sees only its own clips. The home feed, search, profiles and folders are owner-only. A direct clip link is the only way to share a video with someone else.
- **Folders.** Create folders, assign a clip at upload or later, and filter by folder on the home library and your profile.
- **Video files only.** Uploads are checked by content with `ffprobe`. Images, audio, documents and renamed non-video files are rejected before a clip is created.
- **Adaptive playback.** DASH streaming with Shaka Player. Quality tiers go up to 8K and 240 fps, and only tiers at or below the source are produced.
- **Your own storage.** Videos live in any S3-compatible bucket (MinIO is bundled); metadata lives in Postgres.
- **Accounts.** Register users, then turn registration off.
- **Optional GPU encoding** with NVIDIA NVENC.

## Self-hosting

### Requirements

- Docker with the Compose plugin
- A domain and a reverse proxy for TLS (recommended for anything beyond a local trial)
- Disk for the database and for every rendition, which is several times the upload size
- About 2 to 4 CPU cores per concurrent transcode

### 1. Get the code and secrets

```sh
git clone <your-repo-url> vitryne
cd vitryne
cp .env.example .env
```

Generate each secret with `openssl rand -hex 32` and fill in `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `DB_IDHASHKEY` and `COOKIE_KEY`. Set `COOKIE_DOMAIN` to the hostname you will browse to, or leave it empty.

`DB_IDHASHKEY` is permanent: changing it later changes every clip URL and breaks shared links.

### 2. Start the stack

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

The app listens on `127.0.0.1:8080`. Postgres and MinIO stay on the internal network and are not published.

### 3. Put TLS in front

Point a reverse proxy at `127.0.0.1:8080` and serve only HTTPS. For uploads, turn off request buffering and raise timeouts. Caddy:

```caddy
clips.example.com {
    request_body {
        max_size 5GB
    }
    reverse_proxy 127.0.0.1:8080 {
        flush_interval -1
    }
}
```

### 4. Create an account

Open the site, register your account, then set `ALLOW_REGISTRATION=false` in `.env` and run the compose command again.

For a local trial only, `docker compose up -d --build` uses placeholder passwords and serves on http://localhost:8080. Do not expose that to a network.

### Prebuilt images

Published images are built from `master` and from `v*` tags:

```
ghcr.io/wtao02/vitryne:latest
ghcr.io/wtao02/vitryne:<version>
```

GPU images (`:gpu-latest`, `:gpu-<version>`) are built only when the repository variable `PUBLISH_GPU` is `true`, because the CUDA base image is not publicly pullable.

To pull instead of build, use the bundled `docker-compose.remote.yml`:

```sh
docker compose -f docker-compose.remote.yml pull
docker compose -f docker-compose.remote.yml up -d
```

Or write a minimal `docker-compose.yml` yourself. This is a complete stack using the published image:

```yaml
# docker-compose.yml
services:
  vitryne:
    image: ghcr.io/wtao02/vitryne:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      DB_NAME: postgres
      DB_IDHASHKEY: ${DB_IDHASHKEY:?set DB_IDHASHKEY}
      COOKIE_KEY: ${COOKIE_KEY:?set COOKIE_KEY}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN:-}
      MAX_UPLOAD_SIZE: ${MAX_UPLOAD_SIZE:-5GB}
      ALLOW_REGISTRATION: ${ALLOW_REGISTRATION:-true}
      S3_ADDRESS: minio:9000
      S3_BUCKET: clips
      S3_ACCESS: ${MINIO_ROOT_USER:-vitryne}
      S3_SECRET: ${MINIO_ROOT_PASSWORD:?set MINIO_ROOT_PASSWORD}
      S3_SECURE: "false"
    depends_on:
      postgres:
        condition: service_healthy
      createbuckets:
        condition: service_completed_successfully

  postgres:
    image: postgres:14
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  minio:
    image: elestio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-vitryne}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data

  createbuckets:
    image: bitnamilegacy/minio-client:latest
    depends_on:
      - minio
    restart: "no"
    entrypoint: >
      /bin/sh -c "
      until /opt/bitnami/minio-client/bin/mc alias set vitryne http://minio:9000 $${MINIO_ROOT_USER} $${MINIO_ROOT_PASSWORD}; do sleep 1; done;
      /opt/bitnami/minio-client/bin/mc mb -p vitryne/clips;
      exit 0;
      "
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-vitryne}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}

volumes:
  pg_data: {}
  minio_data: {}
```

Then `docker compose up -d` with the same `.env` values from above. Pin a version by replacing `:latest` with a tag such as `:v0.1.0`.

If you already run Postgres and an S3 bucket, use only the `vitryne` service and point `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` and `S3_ADDRESS`, `S3_BUCKET`, `S3_ACCESS`, `S3_SECRET`, `S3_SECURE` at them. The package is public, so anonymous pulls work; for a private package, run `docker login ghcr.io -u <user>` first.

### Notes

- **Configuration:** `.env.example` holds the required secrets and host settings. FFmpeg, the database name/user and the S3 connection are set in `docker-compose.prod.yml`.
- **Tuning:** fewer or lower `FFMPEG_QUALITY_PRESETS` means faster encodes and less storage, for example `640x360-30@1,1280x720-30@5,1920x1080-30@8`.
- **External S3:** point `S3_ADDRESS`, `S3_ACCESS`, `S3_SECRET` and `S3_BUCKET` at your provider and remove the `minio` and `createbuckets` services.
- **GPU:** use `gpu.docker-compose.yml` with the NVIDIA Container Toolkit; it encodes with `h264_nvenc`.
- **Backups:** back up the Postgres database and the `clips` bucket. Both are required to restore a working instance.
- **Upgrades:** `git pull`, then rebuild with the same compose command. Database migrations run on start; back up first.

## License

Source-available under the [Business Source License 1.1](./LICENSE), converting to GPL v2 or later on 2027-01-01. Third-party licenses are in [`LICENSE-3RD-PARTY.md`](./LICENSE-3RD-PARTY.md).

BSL 1.1 grants non-production use. For production or commercial use before the change date, review the license first.
