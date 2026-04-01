export function getPantryDisplayAmount(produce: {
  quantity: number;
  unit: string;
  displayQuantity?: number | null;
  displayUnit?: string | null;
}) {
  return {
    quantity:
      produce.displayQuantity != null
        ? produce.displayQuantity
        : produce.quantity,

    unit:
      produce.displayUnit && produce.displayUnit.trim() !== ''
        ? produce.displayUnit
        : produce.unit,
  };
}
