'use client';

import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { CameraFill } from 'react-bootstrap-icons';
import { isFirebaseConfigured } from '@/lib/firebase';
import DishImageUploadModal from './DishImageUploadModal';
import '../../styles/buttons.css';

type Props = {
  recipeId: number;
  recipeTitle: string;
  userEmail: string | null;
};

export default function UploadDishButton({ recipeId, recipeTitle, userEmail }: Props) {
  const [showModal, setShowModal] = useState(false);
  const firebaseConfigured = isFirebaseConfigured();
  const canUpload = !!userEmail && firebaseConfigured;

  return (
    <>
      <Button
        size="lg"
        className="w-100 d-flex align-items-center justify-content-center gap-2 dish-btn-primary"
        style={{
          fontWeight: 600,
          padding: '0.75rem 1.5rem',
          fontSize: '1.05rem',
        }}
        onClick={() => setShowModal(true)}
        disabled={!canUpload}
      >
        <CameraFill size={20} />
        Made this dish? Show us!
      </Button>

      {!userEmail && (
        <small className="text-muted d-block text-center mt-2">
          Sign in to upload your dish photos
        </small>
      )}

      <DishImageUploadModal
        show={showModal}
        onHide={() => setShowModal(false)}
        recipeId={recipeId}
        recipeTitle={recipeTitle}
        userEmail={userEmail}
      />
    </>
  );
}
