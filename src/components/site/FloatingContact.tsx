"use client";

import React from "react";

export default function FloatingContact() {
  const whatsappNumber = "8801776768082"; // আপনার হোয়াটসঅ্যাপ নম্বরটি দিন
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
        {/* Official WhatsApp SVG Icon with Phone inside */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-8 h-8 fill-current text-white"
        >
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.85.83 5.5 2.28 7.74L2.5 29.5l6.01-1.74A13.9 13.9 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.46c-2.31 0-4.47-.64-6.32-1.75l-.45-.27-4.22 1.22 1.24-4.1-.29-.47A11.45 11.45 0 1 1 16 27.46zm6.3-8.56c-.35-.18-2.06-1.02-2.38-1.14-.32-.12-.55-.18-.78.18-.23.35-.9 1.14-1.1 1.37-.2.23-.4.25-.75.08-.35-.18-1.48-.55-2.82-1.74-1.04-.93-1.74-2.08-1.95-2.43-.2-.35-.02-.54.15-.71.16-.16.35-.4.53-.6.18-.2.23-.35.35-.58.12-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.58-.28-.68-.57-.59-.78-.6l-.67-.01c-.23 0-.6.08-.91.41-.32.33-1.22 1.19-1.22 2.91 0 1.72 1.25 3.38 1.42 3.62.18.23 2.45 3.74 5.95 5.24.83.36 1.48.58 1.99.74.84.27 1.6.23 2.21.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.15-.32-.24-.67-.42z" />
        </svg>

        <span className="absolute right-16 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Let's Chat!
        </span>
      </a>
    </div>
  );
}