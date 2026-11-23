import { buttonStyles } from "@/shared/ui";
import PageTitle from "@/shared/page-title";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-page px-4 py-24 sm:px-6">
      <PageTitle title="Page not found" />
      <h1 className="text-2xl font-medium tracking-[-0.01em] text-fg">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-6" })}>
        Back to clips
      </Link>
    </main>
  );
}
