import type { ProjectImage } from "./image";

export type Category = {
  id: number;
  name: string;
  slug: string;
  preset: string;
  sortOrder: number;
  visible: boolean;
};

export type Project = {
  id: number;
  title: string;
  slug: string;
  categoryId: number | null;
  summary: string;
  description: string;
  details: { label: string; value: string }[];
  tags: string[];
  cover: ProjectImage | null;
  gallery: ProjectImage[];
  featured: boolean;
  published: boolean;
  isDemo: boolean;
  sortOrder: number;
};

export type ItemKind = "service" | "pricing" | "faq" | "testimonial";

export type ServiceData = { title: string; description: string; icon: string };
export type PricingData = {
  name: string;
  price: string;
  currency: "BDT" | "USD";
  description: string;
  deliverables: string[];
  revisions: string;
  delivery: string;
  addons: string[];
  ctaText: string;
  featured: boolean;
};
export type FaqData = { question: string; answer: string };
export type TestimonialData = { name: string; role: string; quote: string; avatarUrl: string };

export type Item<T = Record<string, unknown>> = {
  id: number;
  kind: ItemKind;
  data: T;
  sortOrder: number;
  visible: boolean;
};

export type Inquiry = {
  id: number;
  name: string;
  email: string;
  packageName: string;
  service: string;
  budget: string;
  message: string;
  status: string;
  createdAt: string;
};

export type MediaInfo = { id: number; filename: string; mime: string; size: number; createdAt: string; url: string };
