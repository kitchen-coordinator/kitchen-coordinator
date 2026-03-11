'use client';

import { useState } from 'react';
import { Button } from 'react-bootstrap';
import UseIngredientsModal, { type RecipeIngredientItem, type PantryItem } from './UseIngredientsModal';
import '../../styles/buttons.css';

type Props = {
  ingredientItems: RecipeIngredientItem[];
  pantry: PantryItem[];
  recipeTitle: string;
};

export default function UseIngredientsButton({ ingredientItems, pantry, recipeTitle }: Props) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Button
        variant="outline-success"
        className="w-100"
        style={{ fontWeight: 500 }}
        onClick={() => setShow(true)}
      >
        Use Ingredients
      </Button>

      <UseIngredientsModal
        show={show}
        onHide={() => setShow(false)}
        ingredientItems={ingredientItems}
        pantry={pantry}
        recipeTitle={recipeTitle}
      />
    </>
  );
}