import { z } from "zod";

export const commentContentSchema = z.string().trim().min(1, "Comment can't be empty.").max(2000, "Comment is too long.");

export const messageContentSchema = z.string().trim().min(1, "Message can't be empty.").max(4000, "Message is too long.");

export const reportDetailsSchema = z.string().trim().max(1000, "Details are too long.");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/, "Username must be 3-30 characters: lowercase letters, numbers, and hyphens only.");

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  bio: z.string().trim().max(500, "Bio must be 500 characters or fewer.").default(""),
  websiteUrl: z
    .string()
    .trim()
    .max(300, "URL is too long.")
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Website URL must start with http:// or https://.")
    .default(""),
  twitterHandle: z.string().trim().max(50, "Handle is too long.").default(""),
  nsfwEnabled: z.boolean(),
});

export const uploadMetadataSchema = z.object({
  title: z.string().trim().max(200, "Title must be 200 characters or fewer.").default(""),
  description: z.string().trim().max(2000, "Description must be 2000 characters or fewer.").default(""),
});

export const taxonomyNameSchema = z.string().trim().max(80, "Name is too long.");
