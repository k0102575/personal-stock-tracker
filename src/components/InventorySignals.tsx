import { Badge } from "@/components/ui/badge";

interface InventorySignalsProps {
  lowStock: boolean;
  expired: boolean;
  expiringSoon: boolean;
}

export function InventorySignals({
  lowStock,
  expired,
  expiringSoon
}: InventorySignalsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {lowStock && <Badge variant="warning">재고 부족</Badge>}
      {expired && <Badge variant="danger">우선 유통기한 경과</Badge>}
      {!expired && expiringSoon && <Badge variant="neutral">우선 유통기한 임박</Badge>}
    </div>
  );
}
