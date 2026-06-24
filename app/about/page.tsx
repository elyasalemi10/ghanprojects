import type { Metadata } from "next";
import About from "@/views/About";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Ghan Projects, Property Development Experts",
  description:
    "Learn about Ghan Projects, Melbourne's trusted property development and investment consulting firm. Our mission, values, and expert approach to delivering exceptional property outcomes.",
  path: "/about",
  image: "/images/hero-about.webp",
});

export default function AboutPage() {
  return <About />;
}
