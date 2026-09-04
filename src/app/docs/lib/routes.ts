import { useLocation } from "react-router-dom";

/**
 * Where the Documents section lives for whoever is signed in.
 *
 * Owners are under `/owner-home/mydocs`, drivers under `/driver-home/mydocs`.
 * The detail page previously hard-coded the owner path, so a driver clicking
 * an older version was thrown into the owner area and bounced by the route
 * guard.
 *
 * Derived from the URL rather than from the stored role, because the URL is
 * the thing that is actually true right now.
 */
export function useDocsPaths() {
  const { pathname } = useLocation();
  const root = `${pathname.split("/mydocs")[0]}/mydocs`;

  return {
    root,
    document: (id: string) => `${root}/documents/${id}`,
  };
}
