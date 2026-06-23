import { MenuPageClient } from "@/components/customer/menu-page-client";

interface Props {
  params: Promise<{ slug: string; tableId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `Menu — QR Dine`,
    description: `Scan, browse, and order from your table.`,
  };
}

/**
 * /r/[slug]/t/[tableId]
 *
 * This is a lean server page — it just passes the URL params down to
 * MenuPageClient which handles the full session bootstrap + menu render.
 * No server-side DB calls here so the page loads instantly (no auth needed
 * for customers — session token is the authentication).
 */
export default async function TableMenuPage({ params }: Props) {
  const { slug, tableId } = await params;
  return <MenuPageClient slug={slug} tableId={tableId} />;
}
