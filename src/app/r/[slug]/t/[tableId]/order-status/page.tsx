import { OrderStatusClient } from "@/components/customer/order-status-client";

interface Props {
  params: Promise<{ slug: string; tableId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `Order Status — ${slug.toUpperCase()}`,
    description: "Track your active table session orders",
  };
}

export default async function OrderStatusPage({ params }: Props) {
  const { slug, tableId } = await params;
  return <OrderStatusClient slug={slug} tableId={tableId} />;
}
