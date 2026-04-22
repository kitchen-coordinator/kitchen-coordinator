'use client';

import { useMemo, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';
import AddToShoppingList, { type MissingItem } from '@/components/recipes/AddToShoppingList';
import UseIngredientsButton from '@/components/recipes/UseIngredientsButton';
import styles from './RecipeIngredientsPanel.module.css';

export type IngredientItemDisplay = {
  id?: number | null;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  hasItem: boolean;
};

export type PantryItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
};

type Props = {
  baseServings: number; // caller-normalized to >= 1
  ingredientItems: IngredientItemDisplay[];
  missingItems: MissingItem[];
  pantryFull: PantryItem[];
  recipeTitle: string;
  showUseIngredients: boolean;
};

function roundToDisplay(n: number) {
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace(/\.?0+$/, '');
}

function formatIngredientLabel(item: { quantity?: number | null; unit?: string | null; name: string }) {
  const parts: string[] = [];
  if (item.quantity != null) parts.push(roundToDisplay(item.quantity));
  if (item.unit) parts.push(item.unit);
  parts.push(item.name);
  return parts.join(' ');
}

function scaleHint(baseServings: number, scale: number) {
  const servingWord = baseServings === 1 ? 'serving' : 'servings';
  return `Based on ${baseServings} ${servingWord} (${roundToDisplay(scale)}x)`;
}

export default function RecipeIngredientsPanel({
  baseServings,
  ingredientItems,
  missingItems,
  pantryFull,
  recipeTitle,
  showUseIngredients,
}: Props) {
  const [servings, setServings] = useState<number>(baseServings);

  const minServings = 1;
  const maxServings = 5;

  const scale = servings / baseServings;

  const scaledIngredientItems = useMemo(
    () => ingredientItems.map((item) => {
      if (item.quantity == null) return item;
      return { ...item, quantity: item.quantity * scale };
    }),
    [ingredientItems, scale],
  );

  const scaledMissingItems = useMemo(
    () => missingItems.map((item) => {
      if (item.quantity == null) return item;
      return { ...item, quantity: item.quantity * scale };
    }),
    [missingItems, scale],
  );

  // Pass scaled quantities into "Use Ingredients" flow too
  const scaledUseItems = useMemo(
    () => ingredientItems.map((item) => ({
      id: item.id ?? null,
      name: item.name,
      quantity: item.quantity == null ? null : item.quantity * scale,
      unit: item.unit ?? null,
    })),
    [ingredientItems, scale],
  );

  return (
    <div className={`card border-0 shadow-sm mb-4 ${styles.card}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <h5 className={`mb-0 fw-bold ${styles.title}`}>Ingredients</h5>

          <div className={styles.portionControls}>
            <div className="d-flex align-items-center justify-content-between gap-2">
              <span className={styles.portionLabel}>Servings</span>
              <span className={styles.portionValue} aria-live="polite">
                {servings}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 mt-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className={styles.stepBtn}
                onClick={() => setServings((s) => Math.max(minServings, s - 1))}
                aria-label="Decrease servings"
              >
                −
              </Button>

              <Form.Range
                min={minServings}
                max={maxServings}
                step={0.25}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                aria-label="Servings slider"
                className={styles.slider}
              />

              <Button
                variant="outline-secondary"
                size="sm"
                className={styles.stepBtn}
                onClick={() => setServings((s) => Math.min(maxServings, s + 1))}
                aria-label="Increase servings"
              >
                +
              </Button>
            </div>

            <div className={styles.scaleHint}>
              <small className="text-muted">{scaleHint(baseServings, scale)}</small>
            </div>
          </div>
        </div>

        <ul className={styles.list}>
          {scaledIngredientItems.map((item) => {
            const label = formatIngredientLabel(item);
            return (
              <li key={item.id ?? `${item.name}-${item.unit ?? ''}`} className={styles.listItem}>
                <div className="d-flex align-items-center gap-2">
                  <span>{label}</span>
                  {item.hasItem ? (
                    <CheckCircleFill className={styles.iconHave} size={16} title="You have this in your pantry" />
                  ) : (
                    <XCircleFill className={styles.iconMissing} size={16} title="You don't have this in your pantry" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <AddToShoppingList missingItems={scaledMissingItems} />

        {showUseIngredients && (
          <div className="mt-3">
            <UseIngredientsButton ingredientItems={scaledUseItems} pantry={pantryFull} recipeTitle={recipeTitle} />
          </div>
        )}
      </div>
    </div>
  );
}

