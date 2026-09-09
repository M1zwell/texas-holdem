import { CareerView } from "@/app/components/career/CareerView";
import { seo } from "@/lib/seo";

export const metadata = seo({
  title: "Career",
  description:
    "What the work already knows. Live AI products as the CV. Roles that rhyme — Hong Kong, AI-native, workable life.",
  path: "/career",
});

export default function CareerPage() {
  return <CareerView locale="en" />;
}
