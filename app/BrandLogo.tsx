"use client";

import Image from "next/image";

export function BrandLogo({
  showWordmark = true,
  compact = false,
}: {
  showWordmark?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className={`relative overflow-hidden rounded-xl ${compact ? "h-9 w-9" : "h-10 w-10"}`}>
        <Image
          src="/alyn-logo.svg"
          alt="ALYN AI"
          fill
          priority
          sizes={compact ? "36px" : "40px"}
          className="object-contain"
        />
      </span>
      {showWordmark ? <span className="text-lg font-bold tracking-wide">ALYN AI</span> : null}
    </span>
  );
}
