import type { Metadata } from "next";
import { Suspense } from "react";
import BookConsultation from "@/views/BookConsultation";

export const metadata: Metadata = {
  title: "Contact Ghan Projects Melbourne",
  description:
    "Contact Ghan Projects for property development consulting, investment advisory, and joint venture opportunities in Melbourne. Schedule your free strategy call today.",
  alternates: { canonical: "/book-consultation" },
};

export default function BookConsultationPage() {
  return (
    <Suspense>
      <BookConsultation />
    </Suspense>
  );
}
