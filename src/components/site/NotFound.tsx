import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

// A page of the documentation, which the router reaches through /$.
const overview: string = "/overview.html";
const library = "/books.html";

export function NotFound() {
  // A route that finds no page renders this in place of its own, whose head
  // names no title: the tab says what happened.
  useEffect(() => {
    document.title = "Page not found · Syg";
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">There is no page at this address.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to={overview}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Documentation
          </Link>
          <Link
            to={library}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Books
          </Link>
        </div>
      </div>
    </div>
  );
}
