'use client';

import { useState, useMemo } from 'react';
import { Modal, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

export type RecipeIngredientItem = {
  id?: number | null;
  name: string;
  quantity?: number | null;
  unit?: string | null;
};

export type PantryItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
};

type IngredientStatus = 'ready' | 'low' | 'mismatch' | 'missing' | 'no-quantity';

type IngredientRow = {
  ingredient: RecipeIngredientItem;
  pantryItem: PantryItem | null;
  status: IngredientStatus;
  defaultChecked: boolean;
  deductAmount: number;
};

type Props = {
  show: boolean;
  onHide: () => void;
  ingredientItems: RecipeIngredientItem[];
  pantry: PantryItem[];
  recipeTitle: string;
};

const normalizeUnit = (unit: string | null | undefined) => (unit ?? '').trim().toLowerCase();

function computeRows(ingredientItems: RecipeIngredientItem[], pantry: PantryItem[]): IngredientRow[] {
  const pantryMap = new Map(pantry.map((p) => [p.name.toLowerCase(), p]));

  return ingredientItems.map((ingredient) => {
    const pantryItem = pantryMap.get(ingredient.name.toLowerCase()) ?? null;

    if (ingredient.quantity == null) {
      return { ingredient, pantryItem, status: 'no-quantity', defaultChecked: false, deductAmount: 0 };
    }

    if (!pantryItem) {
      return { ingredient, pantryItem: null, status: 'missing', defaultChecked: false, deductAmount: 0 };
    }

    const recipeUnit = normalizeUnit(ingredient.unit);
    const pantryUnit = normalizeUnit(pantryItem.unit);

    if (recipeUnit !== pantryUnit) {
      return { ingredient, pantryItem, status: 'mismatch', defaultChecked: false, deductAmount: 0 };
    }

    const deductAmount = Math.min(ingredient.quantity, pantryItem.quantity);
    const status: IngredientStatus = pantryItem.quantity >= ingredient.quantity ? 'ready' : 'low';

    return { ingredient, pantryItem, status, defaultChecked: true, deductAmount };
  });
}

const statusBadge = (status: IngredientStatus) => {
  switch (status) {
    case 'ready': return <Badge bg="success">Ready</Badge>;
    case 'low': return <Badge bg="warning" text="dark">Low stock</Badge>;
    case 'mismatch': return <Badge bg="secondary">Unit mismatch</Badge>;
    case 'missing': return <Badge bg="danger">Not in pantry</Badge>;
    case 'no-quantity':
      return (
        <Badge bg="light" text="dark" style={{ border: '1px solid #dee2e6' }}>
          No quantity
        </Badge>
      );
    default: return null;
  }
};

export default function UseIngredientsModal({ show, onHide, ingredientItems, pantry, recipeTitle }: Props) {
  const router = useRouter();
  const rows = useMemo(() => computeRows(ingredientItems, pantry), [ingredientItems, pantry]);

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    rows.forEach((row) => {
      init[row.ingredient.name.toLowerCase()] = row.defaultChecked;
    });
    return init;
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null);

  const toggleChecked = (name: string) => {
    const key = name.toLowerCase();
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const actionableRows = rows.filter((r) => r.status === 'ready' || r.status === 'low');
  const selectedCount = actionableRows.filter((r) => checked[r.ingredient.name.toLowerCase()]).length;

  const handleConfirm = async () => {
    const items = actionableRows
      .filter((r) => checked[r.ingredient.name.toLowerCase()])
      .map((r) => ({ name: r.ingredient.name, deductAmount: r.deductAmount }));

    if (!items.length) {
      setMessage({ text: 'No items selected.', variant: 'danger' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/pantry/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update pantry');

      setMessage({ text: `Updated ${data.updated?.length ?? 0} item(s) in your pantry.`, variant: 'success' });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err?.message ?? 'Something went wrong.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{`Use Ingredients — ${recipeTitle}`}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message && (
          <Alert variant={message.variant} className="mb-3">
            {message.text}
          </Alert>
        )}

        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
          Select ingredients to deduct from your pantry. Only items with matching units can be auto-deducted.
        </p>

        <div className="table-responsive">
          <table className="table table-sm align-middle mb-2">
            <thead>
              <tr>
                <th style={{ width: 40 }} aria-label="Select" />
                <th>Ingredient</th>
                <th>Needed</th>
                <th>In Pantry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = row.ingredient.name.toLowerCase();
                const isActionable = row.status === 'ready' || row.status === 'low';

                const neededLabel = row.ingredient.quantity != null
                  ? `${row.ingredient.quantity}${row.ingredient.unit ? ` ${row.ingredient.unit}` : ''}`
                  : '—';

                const pantryLabel = row.pantryItem
                  ? `${row.pantryItem.quantity} ${row.pantryItem.unit}`
                  : '—';

                return (
                  <tr key={key} style={{ opacity: isActionable ? 1 : 0.5 }}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={isActionable && !!checked[key]}
                        disabled={!isActionable}
                        onChange={() => toggleChecked(row.ingredient.name)}
                      />
                    </td>
                    <td>{row.ingredient.name}</td>
                    <td>{neededLabel}</td>
                    <td>{pantryLabel}</td>
                    <td>{statusBadge(row.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.some((r) => r.status === 'mismatch') && (
          <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
            Unit mismatch items must be adjusted manually in your pantry.
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          className="btn-submit"
          onClick={handleConfirm}
          disabled={loading || selectedCount === 0}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            `Use ${selectedCount} ingredient${selectedCount !== 1 ? 's' : ''}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
