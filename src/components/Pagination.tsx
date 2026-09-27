"use client";

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  queryParams?: Record<string, string | undefined>;
  onPageChange?: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = "/",
  queryParams = {},
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val && key !== "page") params.set(key, val);
    });
    if (page > 1) {
      params.set("page", String(page));
    }
    const queryStr = params.toString();
    return queryStr ? `${basePath}?${queryStr}` : basePath;
  };

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2.5 pb-0.5"
    >
      {currentPage > 1 &&
        (onPageChange ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-7 sm:h-8 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider border border-line bg-white text-navy hover:border-orange hover:text-orange transition rounded-[2px] disabled:opacity-50 cursor-pointer"
          >
            <span className="inline-flex items-center justify-center leading-none text-[17px] sm:text-[18px] font-sans">←</span>
            <span>PREV</span>
          </button>
        ) : (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="h-7 sm:h-8 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider border border-line bg-white text-navy hover:border-orange hover:text-orange transition rounded-[2px]"
          >
            <span className="inline-flex items-center justify-center leading-none text-[17px] sm:text-[18px] font-sans">←</span>
            <span>PREV</span>
          </Link>
        ))}

      {pages.map((p) => {
        const isActive = p === currentPage;
        return onPageChange ? (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onPageChange(p)}
            className={`min-w-[30px] sm:min-w-[34px] h-7 sm:h-8 px-2 flex items-center justify-center text-[12px] sm:text-[13px] font-bold transition rounded-[2px] cursor-pointer disabled:opacity-50 ${
              isActive
                ? "bg-navy text-white border border-navy shadow-xs"
                : "bg-white text-navy border border-line hover:border-orange hover:text-orange"
            }`}
          >
            {p}
          </button>
        ) : (
          <Link
            key={p}
            href={createPageUrl(p)}
            className={`min-w-[30px] sm:min-w-[34px] h-7 sm:h-8 px-2 flex items-center justify-center text-[12px] sm:text-[13px] font-bold transition rounded-[2px] ${
              isActive
                ? "bg-navy text-white border border-navy shadow-xs"
                : "bg-white text-navy border border-line hover:border-orange hover:text-orange"
            }`}
          >
            {p}
          </Link>
        );
      })}

      {currentPage < totalPages &&
        (onPageChange ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-7 sm:h-8 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider border border-line bg-white text-navy hover:border-orange hover:text-orange transition rounded-[2px] disabled:opacity-50 cursor-pointer"
          >
            <span>NEXT</span>
            <span className="inline-flex items-center justify-center leading-none text-[17px] sm:text-[18px] font-sans">→</span>
          </button>
        ) : (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="h-7 sm:h-8 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider border border-line bg-white text-navy hover:border-orange hover:text-orange transition rounded-[2px]"
          >
            <span>NEXT</span>
            <span className="inline-flex items-center justify-center leading-none text-[17px] sm:text-[18px] font-sans">→</span>
          </Link>
        ))}
    </nav>
  );
}

