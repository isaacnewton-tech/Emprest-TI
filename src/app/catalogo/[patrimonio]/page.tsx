import { notFound } from "next/navigation";
import { EquipmentScreen } from "@/components/catalogo-screen";
import { equipmentPatrimonio } from "@/shared/loans";

export default async function EquipmentPage({ params }: { params: Promise<{ patrimonio: string }> }) {
  const { patrimonio } = await params;
  if (!equipmentPatrimonio.safeParse(patrimonio).success) notFound();
  return <EquipmentScreen patrimonio={patrimonio} />;
}
