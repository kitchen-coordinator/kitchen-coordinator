'use client';

import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { Images } from 'react-bootstrap-icons';
import { isFirebaseConfigured } from '@/lib/firebase';
import DishImagesModal from './DishImagesModal';
import '../../styles/buttons.css';

type Props = {
  recipeId: number;
  recipeTitle: string;
};

export default function ViewDishImagesButton({ recipeId, recipeTitle }: Props) {
  const [showModal, setShowModal] = useState(false);
  const firebaseConfigured = isFirebaseConfigured();

  return (
    <>
      <Button
        size="lg"
        className="w-100 d-flex align-items-center justify-content-center gap-2 dish-btn-secondary"
        style={{
          fontWeight: 600,
          padding: '0.75rem 1.5rem',
          fontSize: '1.05rem',
        }}
        onClick={() => setShowModal(true)}
        disabled={!firebaseConfigured}
      >
        <Images size={20} />
        View Community Photos
      </Button>

      <DishImagesModal
        show={showModal}
        onHide={() => setShowModal(false)}
        recipeId={recipeId}
        recipeTitle={recipeTitle}
      />
    </>
  );
}
