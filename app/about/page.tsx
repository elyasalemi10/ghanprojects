import type { Metadata } from "next";
import About from "@/views/About";

export const metadata: Metadata = {
  title: "About Ghan Projects - Property Development Experts",
  description:
    "Learn about Ghan Projects - Melbourne's trusted property development and investment consulting firm. Our mission, values, and expert approach to delivering exceptional property outcomes.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <About />;
}
