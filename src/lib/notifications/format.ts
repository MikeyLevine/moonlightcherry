import type { NotificationType } from "@prisma/client";

export function notificationText(type: NotificationType, actorLabel: string): string {
  switch (type) {
    case "LIKE":
      return `${actorLabel} liked your upload`;
    case "COMMENT":
      return `${actorLabel} commented on your upload`;
    case "REPLY":
      return `${actorLabel} replied to your comment`;
    case "MENTION":
      return `${actorLabel} mentioned you in a comment`;
    case "FOLLOW":
      return `${actorLabel} started following you`;
    case "NEW_UPLOAD":
      return `${actorLabel} uploaded something new`;
    case "MODERATION":
      return "A moderator took action on your account or content";
    case "SYSTEM":
      return "System announcement";
  }
}
