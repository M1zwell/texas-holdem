import { FundingGate } from "@/app/components/funding/FundingGate";
import { seo } from "@/lib/seo";

export const metadata = {
  ...seo({
    title: "Funding",
    description: "Private desk. Continue with Google.",
    path: "/funding",
  }),
  robots: { index: false, follow: false },
};

export default function FundingPage() {
  return <FundingGate locale="en" />;
}
