import { CareerGate } from "@/app/components/career/CareerGate";
import { seo } from "@/lib/seo";

export const metadata = {
  ...seo({
    title: "Career",
    description: "Private desk. Continue with Google.",
    path: "/career",
  }),
  robots: { index: false, follow: false },
};

export default function CareerPage() {
  return <CareerGate locale="en" />;
}
