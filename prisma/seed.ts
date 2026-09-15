import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  "Female Characters",
  "Male Characters",
  "Anime Series",
  "Manga Series",
  "Fan Art",
  "Official Art",
  "GIFs",
  "Wallpapers",
  "Cosplay",
  "Memes",
  "Other",
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SITE_SETTINGS: { key: string; value: unknown }[] = [
  { key: "upload.maxImageBytes", value: 20 * 1024 * 1024 },
  { key: "upload.maxGifBytes", value: 50 * 1024 * 1024 },
  { key: "upload.maxDimensionPx", value: 8000 },
  { key: "storage.warnThresholdPercent", value: 80 },
  { key: "storage.blockThresholdPercent", value: 90 },
  { key: "retention.softDeletePurgeDays", value: 30 },
];

async function main() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  for (const setting of SITE_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value as never },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories and ${SITE_SETTINGS.length} site settings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
