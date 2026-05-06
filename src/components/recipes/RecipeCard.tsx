'use client';

/* eslint-disable react/require-default-props */
/* eslint-disable no-alert */

import Link from 'next/link';
import { Card, Image, Badge, Button, Row, Col } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import EditRecipeModal from '@/components/recipes/EditRecipeModal';
import { PencilSquare, Trash } from 'react-bootstrap-icons';

export type IngredientItemCard = {
  id?: number;
  name: string;
  quantity: number | null;
  unit: string | null;
};

export type RecipeCardProps = {
  id: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  cuisine: string;
  dietary: string[];
  ingredientItems: IngredientItemCard[]; // ← REQUIRED NOW
  owner: string | string[];
  canEdit: boolean;
  editMode: boolean;
  instructions?: string | null;
  servings?: number | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  sourceUrl?: string | null;
  pantryNames: Set<string>;
};

export default function RecipeCard({
  id,
  title,
  description = null,
  imageUrl = null,
  cuisine,
  dietary,
  ingredientItems,
  owner,
  canEdit,
  editMode,
  instructions = null,
  servings = null,
  prepMinutes = null,
  cookMinutes = null,
  sourceUrl = null,
  pantryNames,
}: RecipeCardProps) {
  const dietTags = Array.isArray(dietary) ? dietary.filter(Boolean) : [];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    if (!canEdit) return;

    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete recipe');

      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Something went wrong while deleting the recipe.');
    } finally {
      setLoading(false);
    }
  };

  const isAdminOwner = Array.isArray(owner)
    ? owner.includes('admin@foo.com')
    : owner === 'admin@foo.com';

  const ownerLabel = Array.isArray(owner) ? owner.join(', ') : owner;
  const displayOwner = isAdminOwner ? 'Kitchen Coordinator Team' : ownerLabel;

  return (
    <>
      <Card
        className={`recipe-card h-100 d-flex flex-column shadow-sm position-relative ${
          !editMode ? 'clickable-card' : ''
        }`}
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/recipes/${id}`)}
        onKeyDown={(e) => {
          if (!editMode && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            router.push(`/recipes/${id}`);
          }
        }}
      >
        <div className="position-relative">
          <Image
            src={imageUrl || 'https://placehold.co/800x450?text=Recipe'}
            alt={title}
            className="w-100 recipe-card-img"
          />
        </div>

        <Card.Body className="d-flex flex-column">
          <div className="flex-grow-1">
            <Card.Title className="recipe-title line-clamp-2">
              <Link
                href={`/recipes/${id}`}
                className="text-decoration-none text-reset"
                onClick={(e) => e.stopPropagation()}
              >
                {title}
              </Link>
            </Card.Title>

            {/* Cuisine + Dietary badges */}
            <div>
              <Badge bg="secondary" pill className="me-2 mb-2">
                {cuisine}
              </Badge>
              {dietTags.map((tag) => (
                <Badge key={tag} bg="secondary" pill className="me-2 mb-2">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mb-2">
              <Badge bg="light" text="dark">
                {'Made By: '}
                {displayOwner}
              </Badge>
            </div>

            {description && (
              <Card.Text className="text-muted line-clamp-3 mb-2">
                {description}
              </Card.Text>
            )}

            {/* INGREDIENT ITEMS */}
            {ingredientItems.length > 0 && (
              <div className="mt-2">
                <span className="fw-semibold">Ingredients:</span>

                <div className="mt-1 d-flex flex-wrap gap-2">
                  {ingredientItems.map((item) => {
                    const hasItem = pantryNames.has(item.name.toLowerCase());

                    return (
                      <Badge
                        key={`${id}-${item.id ?? item.name}`}
                        pill
                        bg={hasItem ? 'success' : 'danger'}
                        className="px-2 py-1"
                      >
                        {item.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 d-flex flex-column gap-2">
            {editMode && canEdit && (
              <Row>
                <Col xs={6}>
                  <Button
                    variant="primary"
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEdit(true);
                    }}
                  >
                    <PencilSquare color="white" size={18} />
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={loading}
                    className="btn-delete"
                  >
                    {loading ? 'Deleting…' : <Trash color="white" size={18} />}
                  </Button>
                </Col>
              </Row>
            )}
          </div>
        </Card.Body>
      </Card>

      {canEdit && (
        <EditRecipeModal
          show={showEdit}
          onHide={() => setShowEdit(false)}
          recipe={{
            id,
            title,
            cuisine,
            description: description ?? '',
            imageUrl: imageUrl ?? '',
            dietary,
            ingredientItems,
            instructions: instructions ?? '',
            servings: servings ?? undefined,
            prepMinutes: prepMinutes ?? undefined,
            cookMinutes: cookMinutes ?? undefined,
            sourceUrl: sourceUrl ?? '',
          }}
        />
      )}
    </>
  );
}
