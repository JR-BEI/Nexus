import Link from "next/link";
import type { ReactNode } from "react";

interface PageShellProps {
  icon?: ReactNode;
  titlePrefix: string;
  titleAccent: string;
  subtitle: string;
  status: string;
  backHref?: string;
  backLabel?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function PageShell({
  icon,
  titlePrefix,
  titleAccent,
  subtitle,
  status,
  backHref = "/",
  backLabel = "Back",
  headerAction,
  children,
}: PageShellProps) {
  return (
    <main className="container-shell">
      <header className="page-header">
        <Link href={backHref} className="back-link">
          ← {backLabel}
        </Link>

        <div className="page-header-top">
          <div className="page-header-text">
            <div className="status-pill">
              <span className="status-dot" />
              {status}
            </div>
            <h1 className="page-title">
              {icon && <span className="page-title-icon">{icon}</span>}
              {titlePrefix}{" "}
              <span className="gradient-text">{titleAccent}</span>
            </h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          {headerAction && (
            <div className="page-header-action">{headerAction}</div>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}
