"use client";

import { UserContext } from "@/context/user-context";
import { logout } from "@/shared/api";
import { Button, Skeleton, buttonStyles } from "@/shared/ui";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

export default function Header() {
  const userContext = useContext(UserContext);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/setup";
  const isPrivateHome = pathname === "/" && !userContext.loggedIn;
  const isPrivateUpload = pathname === "/upload" && !userContext.loggedIn;
  const hideAccount = isAuthPage || isPrivateHome || isPrivateUpload;
  const [query, setQuery] = useState(searchParam);

  useEffect(() => {
    setQuery(searchParam);
  }, [searchParam]);

  const signOut = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <div className="mx-auto flex w-full max-w-page flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
        <a
          href="/"
          aria-label="Vitryne home"
          className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-fg"
        >
          <span className="grid h-6 w-6 place-items-center rounded-[5px] border border-border-strong">
            <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 fill-current">
              <path d="M3 1.5 10 6 3 10.5Z" />
            </svg>
          </span>
          Vitryne
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-5 text-[13px] text-muted md:flex">
          <a href="/" className="transition-colors hover:text-fg">
            Browse
          </a>
        </nav>

        <form
          role="search"
          action="/"
          method="get"
          className={
            isAuthPage
              ? "hidden"
              : "order-last w-full sm:order-none sm:ml-auto sm:w-auto sm:max-w-xs sm:flex-1"
          }
        >
          <div className="relative">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2"
            />
            <input
              type="text"
              name="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clips"
              aria-label="Search clips"
              enterKeyHint="search"
              className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-muted-2 transition-colors hover:border-border-strong focus:border-border-strong"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {!hideAccount &&
            (userContext.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : userContext.loggedIn ? (
              <>
                <Link href="/upload" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                  Upload
                </Link>
                <Link
                  href={`/users/${userContext.user?.id}`}
                  className="hidden text-[13px] text-muted transition-colors hover:text-fg sm:inline"
                >
                  {userContext.user?.username}
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link href="/login" className={buttonStyles({ size: "sm" })}>
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
