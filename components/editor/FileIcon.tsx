"use client";

import React from "react";
import { FileText } from "lucide-react";

type FileIconProps = {
  name: string;
  size?: number;
  className?: string;
};

export function FileIcon({ name, size = 14, className }: FileIconProps) {
  const lowercaseName = name.toLowerCase();
  const ext = lowercaseName.split(".").pop();

  // 1. Specific file name matches
  if (lowercaseName === "package.json") {
    // Red NPM logo
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
        <path fill="#cb3837" d="M0 0v24h24V0H0zm18 18h-3V9h-3v9H6V6h12v12z" />
      </svg>
    );
  }

  if (lowercaseName === ".gitignore" || lowercaseName === ".gitattributes" || lowercaseName === ".gitconfig") {
    // Orange Git branch icon
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
        <path
          fill="#f05032"
          d="M21.9 11.5L12.5 2.1c-.4-.4-1.1-.4-1.5 0L8.6 4.5l2.8 2.8c.3-.1.6-.2.9-.2.8 0 1.5.7 1.5 1.5 0 .3-.1.6-.2.9l2.8 2.8c.3-.1.6-.2.9-.2.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5c0-.3.1-.6.2-.9L12.7 11c-.3.1-.6.2-.9.2-.8 0-1.5-.7-1.5-1.5 0-.4.1-.7.4-1L7.9 5.9 2.1 11.7c-.4.4-.4 1.1 0 1.5l9.4 9.4c.4.4 1.1.4 1.5 0l8.9-8.9c.4-.6.4-1.2 0-1.6z"
        />
      </svg>
    );
  }

  if (lowercaseName.startsWith(".env")) {
    // Grey/slate gears/config icon
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
        <path
          fill="#6b7280"
          d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
        />
      </svg>
    );
  }

  // 2. Extension matches
  switch (ext) {
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      // Yellow JavaScript logo
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path fill="#f7df1e" d="M3 3h18v18H3V3z" />
          <path
            fill="#000000"
            d="M11.956 16.7c.074.896.536 1.488 1.488 1.488.948 0 1.472-.464 1.472-1.328v-4.832h1.56v4.808c0 1.776-1.072 2.76-2.984 2.76-1.896 0-2.96-.92-3.08-2.896h1.544zm-4.32-.2c.112.72.632 1.288 1.528 1.288.768 0 1.288-.384 1.288-1.016 0-.728-.528-1.024-1.424-1.408l-.488-.208c-1.424-.592-2.184-1.296-2.184-2.696 0-1.48 1.224-2.512 2.824-2.512 1.6 0 2.656.88 2.808 2.376h-1.504c-.08-.72-.512-1.088-1.28-1.088-.704 0-1.248.336-1.248.976 0 .616.4.88 1.208 1.232l.52.224c1.64.696 2.392 1.344 2.392 2.872 0 1.624-1.232 2.728-3.032 2.728-1.928 0-3.024-.96-3.144-2.736h1.496z"
          />
        </svg>
      );

    case "ts":
    case "tsx":
      // Blue TypeScript logo
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path fill="#3178c6" d="M3 3h18v18H3V3z" />
          <path
            fill="#ffffff"
            d="M9.13 18.06c0-.85-.02-1.81-.05-2.87H6.96v-1.45h5.59v1.45h-2.12v2.87H9.13zm5.77-1.39c.07.6.43 1.01 1.05 1.01.62 0 .97-.33.97-.89 0-.52-.39-.75-1.09-1.04l-.39-.16c-1.05-.43-1.63-.94-1.63-1.93 0-1.09.91-1.84 2.14-1.84 1.26 0 2.03.65 2.15 1.74h-1.43c-.06-.51-.38-.79-.87-.79-.47 0-.79.23-.79.66 0 .43.27.6.86.85l.39.16c1.19.49 1.76.96 1.76 2.06 0 1.19-.94 1.99-2.29 1.99-1.45 0-2.31-.7-2.42-1.99h1.56z"
          />
        </svg>
      );

    case "html":
    case "htm":
      // Orange HTML5 logo
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path fill="#e34f26" d="M3 21l2-18h14l2 18-9 5z" />
          <path fill="#f06529" d="M12 22.1l7.2-4.1 1.6-15H12z" />
          <path fill="#ebebeb" d="M12 10.5H8.7l-.2-2.5H12V5.5H5.8l.6 7.5H12zM12 16.5l-.1.03-3.1-.8-.2-2.2H6.1l.4 4.5 5.5 1.5z" />
          <path fill="#ffffff" d="M12 10.5V13h3.1l-.3 3.2-2.8.8v2.6l5.5-1.5.8-9.1zm0-5v2.5h5.9l.2-2.5z" />
        </svg>
      );

    case "css":
      // Blue CSS3 logo
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path fill="#1572b6" d="M3 21l2-18h14l2 18-9 5z" />
          <path fill="#33a9dc" d="M12 22.1l7.2-4.1 1.6-15H12z" />
          <path fill="#ebebeb" d="M12 10.5H8.7l-.2-2.5H12V5.5H5.8l.6 7.5H12zM12 16.5l-.1.03-3.1-.8-.2-2.2H6.1l.4 4.5 5.5 1.5z" />
          <path fill="#ffffff" d="M12 10.5V13h3.1l-.3 3.2-2.8.8v2.6l5.5-1.5.8-9.1zm0-5v2.5h5.9l.2-2.5z" />
        </svg>
      );

    case "py":
    case "pyw":
      // Python blue/yellow snakes
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path
            fill="#3776ab"
            d="M12 2c-3.7 0-4.8.4-5.3 1.1-.7.9-.7 2.1-.7 3.3v1.6H12v.6H6c-2.3 0-4 1.5-4 4.4v.8c0 2.2.8 3.8 2.7 4.1l1-.3.1-2c.1-1.6.8-2.6 2.3-2.6h3.9c1 0 1.9-.9 1.9-1.9V6.4c0-2.3-1.6-4.4-3.9-4.4zm.5 1.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z"
          />
          <path
            fill="#ffd43b"
            d="M12 22c3.7 0 4.8-.4 5.3-1.1.7-.9.7-2.1.7-3.3v-1.6H12v-.6h6c2.3 0 4-1.5 4-4.4v-.8c0-2.2-.8-3.8-2.7-4.1l-1 .3-.1 2c-.1 1.6-.8 2.6-2.3 2.6h-3.9c-1 0-1.9.9-1.9 1.9v4.7c0 2.3 1.6 4.4 3.9 4.4zm-.5-1.5c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"
          />
        </svg>
      );

    case "java":
    case "class":
    case "jar":
      // Steaming coffee cup Java logo
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path
            fill="#ea2d12"
            d="M16 11.2c-.3-.2-.5-.3-.7-.4l.2-.2c1-.9 1.6-2.2 1.6-3.6 0-.8-.2-1.6-.7-2.3.2.1.3.1.5.2 1 .3 1.6 1.1 1.6 2.1 0 1.7-1.1 3.2-2.5 4.2zm-2.4-2.5c-.4-.3-.6-.5-.9-.7l.2-.2c1.3-1.1 2-2.8 2-4.5 0-1.1-.3-2.1-.9-3 .3.1.6.2.8.4 1.2.6 2 1.8 2 3.2-.1 2.2-1.5 4.1-3.2 4.8zm-2.4-1.8c-.3-.2-.5-.4-.7-.6l.2-.2c1.3-1.1 2-2.8 2-4.5 0-1.1-.3-2.1-.9-3 .3.1.6.2.8.4 1.2.6 2 1.8 2 3.2-.1 2.2-1.5 4.1-3.2 4.8z"
          />
          <path
            fill="#5382a1"
            d="M18.8 15.2c-.9.2-1.8.3-2.8.4-.7 1.4-2.2 2.3-3.9 2.5-3.3.4-6.4-.3-8-.9-.9-.3-1.5-.7-1.5-1 0-.3.5-.7 1.5-1 1.6-.5 4.3-.8 7.3-.8 1.4 0 2.8.1 4.1.2 1.5.2 2.8.5 3.3.6l.4.1-.4.1zM3.4 18c0 .2.4.5 1.1.7 1.5.5 4.3.8 7.3.8 2.6 0 5.1-.3 7-.8.8-.2 1.2-.5 1.2-.7l-.4-.1c-.9.2-1.8.3-2.8.4-.7 1.4-2.2 2.3-3.9 2.5-3.3.4-6.4-.3-8-.9-.9-.3-1.5-.7-1.5-1v.1z"
          />
        </svg>
      );

    case "c":
      // C hexagon
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path fill="#659ad2" d="M21.5 12l-4.5 7.8H7L2.5 12 7 4.2h10l4.5 7.8z" />
          <text x="50%" y="60%" fill="#ffffff" fontSize="10.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
            C
          </text>
        </svg>
      );

    case "cpp":
    case "cc":
    case "cxx":
      // C++ hexagon
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path fill="#00599c" d="M21.5 12l-4.5 7.8H7L2.5 12 7 4.2h10l4.5 7.8z" />
          <text x="50%" y="58%" fill="#ffffff" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
            C++
          </text>
        </svg>
      );

    case "h":
    case "hpp":
      // C/C++ Header file (purple/blue hexagon with H)
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <path fill="#9c27b0" d="M21.5 12l-4.5 7.8H7L2.5 12 7 4.2h10l4.5 7.8z" />
          <text x="50%" y="59%" fill="#ffffff" fontSize="9.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
            H
          </text>
        </svg>
      );

    case "json":
      // Yellow curly braces JSON icon
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <rect width="20" height="20" x="2" y="2" rx="3" fill="#cbcb41" />
          <text x="50%" y="66%" fill="#000000" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">
            {"{}"}
          </text>
        </svg>
      );

    case "md":
    case "markdown":
      // Markdown logo
      return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} className={className}>
          <rect width="22" height="16" x="1" y="4" rx="2" fill="#083fa6" />
          <path d="M6 15v-6l2.5 3L11 9v6h-1.5v-3.5L8.25 13l-1.25-1.5V15H6zm9.5-3.5V9h-2v2.5h-1.5L14 15l2-3.5h-1.5z" fill="#ffffff" />
        </svg>
      );

    default:
      // Generic fallback for other text or unknown extensions
      return <FileText size={size} className={className} />;
  }
}
