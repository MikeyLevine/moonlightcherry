const MENTION_PATTERN = /@([a-z0-9-]{3,30})/gi;

export function extractMentionedUsernames(content: string): string[] {
  const usernames = new Set<string>();
  for (const match of content.matchAll(MENTION_PATTERN)) {
    usernames.add(match[1].toLowerCase());
  }
  return Array.from(usernames);
}
