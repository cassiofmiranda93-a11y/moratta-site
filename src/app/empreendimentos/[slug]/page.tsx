import DevelopmentDetail from "@/components/catalog/DevelopmentDetail";

export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DevelopmentDetail slug={slug} />;
}
