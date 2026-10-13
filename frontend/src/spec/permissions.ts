import type { PermissionName } from "./types";

// Badges are part of the control info, so they look the same in every theme (docs/THEMES.md).
export const PERMISSIONS: { name: PermissionName; badge: string; description: string }[] = [
  { name: "web", badge: "🌐", description: "Search and read web pages" },
  { name: "readFiles", badge: "📄", description: "Read files in this system's workspace folder" },
  { name: "writeFiles", badge: "✏️", description: "Create and edit files in this system's workspace folder" },
  { name: "runCode", badge: "💻", description: "Run code, e.g. Python for data cleaning" },
  { name: "readEmail", badge: "📥", description: "Read your inbox" },
  { name: "sendEmail", badge: "📤", description: "Send email as you" },
  { name: "postSocial", badge: "📣", description: "Publish posts to your social accounts" },
  { name: "submitForms", badge: "📝", description: "Fill in and submit online forms as you, e.g. job applications" },
  {
    name: "trade",
    badge: "💸",
    description: "Buy, sell and move money in your connected brokerage account, within the trade caps",
  },
];

export const REVIEW_MARKS = { accepted: "✓", "sent-back": "↩" } as const;
