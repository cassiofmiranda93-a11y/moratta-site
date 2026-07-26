import type { MetadataRoute } from "next";
import { PROJECTS } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://morattaimoveis.com.br";
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/empreendimentos`, changeFrequency: "daily", priority: 0.9 },
    ...PROJECTS.map((development) => ({
      url: `${baseUrl}/empreendimentos/${development.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
