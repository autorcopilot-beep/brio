"use client";

import Image from "next/image";

export const assistantAvatarIds = Array.from(
  { length: 8 },
  (_, index) => `avatar-${index + 1}`,
);

export function AssistantAvatar({
  id = "avatar-5",
  size = 40,
  className = "",
}: {
  id?: string;
  size?: number;
  className?: string;
}) {
  const safeId = assistantAvatarIds.includes(id) ? id : "avatar-5";
  return (
    <span
      role="img"
      aria-label="Avatar do assistente"
      className={`inline-block shrink-0 overflow-hidden rounded-full bg-[#eee8eb] shadow-sm ring-2 ring-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={`/assets/assistant/${safeId}.svg`}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  );
}
