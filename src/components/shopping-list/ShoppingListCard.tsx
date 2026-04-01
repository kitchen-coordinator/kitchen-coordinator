'use client';

import { useState } from 'react';
import { Card, Badge, Form, ProgressBar, Button } from 'react-bootstrap';
import { Trash, Check, Exclamation } from 'react-bootstrap-icons';
import { FaPencilAlt, FaCheck, FaTimes } from 'react-icons/fa';
import styles from '@/styles/shopping-list.module.css';
import ViewShoppingListModal from './ViewShoppingListModal';
import DeleteShoppingListModal from './DeleteShoppingListModal';

type ShoppingListCardProps = {
  shoppingList: any;
};

const formatDate = (d?: Date | string | null) => {
  if (!d) return 'Not Available';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return 'Not Available';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function ShoppingListCard({ shoppingList }: ShoppingListCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(shoppingList.name);
  const [tempName, setTempName] = useState(shoppingList.name);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isCompleted = !!shoppingList.isCompleted;

  const handleCancel = () => {
    setTempName(name);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!tempName.trim() || isCompleted) return;
    await fetch(`/api/shopping-list/${shoppingList.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tempName }),
    });
    setName(tempName);
    setEditing(false);
  };

  const totalItems = shoppingList.items?.length || 0;
  const purchasedItems = shoppingList.items?.filter((item: any) => item.purchased).length || 0;
  const progressPercent = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  const totalCost = shoppingList.items?.reduce((sum: number, item: any) => {
    const price = item.price ? parseFloat(item.price.toString()) : 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  const budgetLimit = shoppingList.budgetLimit ? parseFloat(shoppingList.budgetLimit.toString()) : null;
  const overBudget = budgetLimit !== null && totalCost > budgetLimit;
  const withinBudget = budgetLimit !== null && totalCost <= budgetLimit;

  const costColor = (() => {
    if (overBudget) return 'red';
    if (withinBudget) return 'green';
    return 'inherit';
  });
  return (
    <>
      <Card className="h-100 mb-3 image-shadow">

        {/* Header */}
        <Card.Header
          className="d-flex align-items-center justify-content-between"
          style={{ height: '52px', paddingTop: '0px', paddingBottom: '0px' }}
        >
          <Card.Title className="d-flex align-items-center mb-0" style={{ gap: '6px' }}>
            {!editing ? (
              <>
                <span>{name}</span>
                {!isCompleted && (
                  <FaPencilAlt
                    style={{ cursor: 'pointer', fontSize: '0.85rem', position: 'relative', top: '-1px' }}
                    onClick={() => setEditing(true)}
                  />
                )}
              </>
            ) : (
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <Form.Control
                  size="sm"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  style={{ height: '28px', padding: '2px 6px' }}
                  autoFocus
                />
                <FaCheck
                  style={{
                    cursor: 'pointer',
                    color: 'green',
                    position: 'relative',
                    top: '-1px',
                  }}
                  onClick={handleSave}
                />
                <FaTimes
                  style={{
                    cursor: 'pointer',
                    color: 'red',
                    position: 'relative',
                    top: '-1px',
                  }}
                  onClick={handleCancel}
                />
              </div>
            )}
          </Card.Title>
          <Badge bg={isCompleted ? 'success' : 'secondary'}>
            {isCompleted ? 'Completed' : 'Open'}
          </Badge>
        </Card.Header>

        <Card.Body className="bg-light">

          {/* Date Created */}
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
            Created
            {' '}
            {formatDate(shoppingList.createdAt)}
          </p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontSize: '0.85rem', color: '#555' }}>Items purchased</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                {`${purchasedItems} of ${totalItems}`}
              </span>
            </div>
            <ProgressBar
              now={progressPercent}
              variant={progressPercent === 100 ? 'success' : 'primary'}
              style={{ height: '8px', borderRadius: '999px' }}
            />
          </div>

          {/* Metric Tiles */}
          <div className={`${styles.shoppingListCardGridLayout}`}>

            <div className={`${styles.shoppingListCardGridTile} rounded`}>
              <div className={`${styles.shoppingListCardGridTileLabel}`}>Estimated cost</div>
              <div
                className={`${styles.shoppingListCardGridTileValue}`}
                style={{ color: costColor() }}
              >
                $
                {totalCost.toFixed(2)}

                {/* Show badge for relationship to budget */}
                {overBudget && (
                  <Badge bg="danger" className="ms-1" style={{ fontSize: '9px' }}>
                    <Exclamation color="white" size={10} />
                  </Badge>
                )}
                {withinBudget && (
                  <Badge bg="success" className="ms-1" style={{ fontSize: '9px' }}>
                    <Check color="white" size={10} />
                  </Badge>
                )}
              </div>
            </div>

            <div
              className={`${styles.shoppingListCardGridTile}`}
              /* Highlight budget tile if budget not set */
              style={{
                backgroundColor: budgetLimit !== null
                  ? 'var(--light-gray, #c8cdd2)'
                  : 'var(--muted-gold, #D7C28A)',
              }}
            >
              <div
                className={`${styles.shoppingListCardGridTileLabel}`}
                style={{
                  fontWeight: budgetLimit !== null
                    ? 'inherit'
                    : '600',
                }}
              >
                Budget Limit
              </div>
              <div className={`${styles.shoppingListCardGridTileValue}`}>
                {budgetLimit !== null ? `$${budgetLimit.toFixed(2)}` : 'Not Set'}
              </div>
            </div>

            <div className={`${styles.shoppingListCardGridTile}`}>
              <div className={`${styles.shoppingListCardGridTileLabel}`}>Total items</div>
              <div className={`${styles.shoppingListCardGridTileValue}`}>{totalItems}</div>
            </div>

            <div className={`${styles.shoppingListCardGridTile}`}>
              <div className={`${styles.shoppingListCardGridTileLabel}`}>Deadline</div>
              <div className={`${styles.shoppingListCardGridTileValue}`}>{formatDate(shoppingList.deadline)}</div>
            </div>
          </div>

        </Card.Body>

        {/* Footer Buttons */}
        <Card.Footer className="d-flex gap-2 bg-light">
          <Button
            className="btn-edit flex-grow-1"
            onClick={() => setShowViewModal(true)}
          >
            View / Edit
          </Button>
          <Button
            variant="danger"
            className="btn-tiny sd-flex align-items-center justify-content-center"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash color="white" size={18} />
          </Button>
        </Card.Footer>
      </Card>

      <ViewShoppingListModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        shoppingList={shoppingList}
      />

      <DeleteShoppingListModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        shoppingList={shoppingList}
      />
    </>
  );
}
