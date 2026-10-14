"use client";

import React from "react";
import { Calendar } from "lucide-react";

export default function BookingButton() {
  const calLink = "https://cal.com/upflit/30minute";

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
      <a
        href={calLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Book a Discovery Call"
        className="flex items-center justify-center w-14 h-14 bg-[#7357FF] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300 group relative"
      >
        <Calendar className="w-7 h-7" />
        <span className="absolute right-16 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Book a Call
        </span>
      </a>
    </div>
  );
}