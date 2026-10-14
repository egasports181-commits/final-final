"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

export default function FloatingContact() {
  const whatsappNumber = "8801776768082"; // apnar number din
  const message = encodeURIComponent("Hi, I want to discuss a project with you!");

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <a
        href={`https://wa.me/${whatsappNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300 group relative"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-16 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Let's Chat!
        </span>
      </a>
    </div>
  );
}