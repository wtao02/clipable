import UserContext from "@/context/user-context";
import "@/styles/globals.scss";
import { Suspense } from "react";
import Header from "./header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <div id="app-shell" className="flex min-h-[100dvh] flex-col">
          <UserContext>
            <Suspense fallback={<div className="h-[104px] border-b border-border sm:h-16" />}>
              <Header />
            </Suspense>
            <div className="flex-1">{children}</div>
          </UserContext>
        </div>
      </body>
    </html>
  );
}
