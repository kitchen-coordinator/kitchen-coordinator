'use client';

import { Card, Button } from 'react-bootstrap';
import { Trash, PencilSquare, PlusLg } from 'react-bootstrap-icons';
import { useState } from 'react';
import swal from 'sweetalert';
import { deleteProduce } from '@/lib/dbActions';
import { formatDisplayAmount, getPantryDisplayAmount } from '@/lib/displayUnits';
import { ProduceRelations } from '@/types/ProduceRelations';
import EditProduceModal from './EditProduceModal';
import AddToMultipleShoppingListsModal from '../shopping-list/AddToMultipleShoppingListsModal';

interface ProduceCardProps {
  produce: ProduceRelations;
  shoppingLists: { id: number; name: string; isCompleted?: boolean }[];
}

export default function ProduceCard({ produce, shoppingLists }: ProduceCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showAddListsModal, setShowAddListsModal] = useState(false);

  const display = getPantryDisplayAmount(produce);

  const handleDelete = async () => {
    const confirmed = await swal({
      title: 'Are you sure?',
      text: 'This will permanently delete the item.',
      icon: 'warning',
      buttons: ['Cancel', 'Delete'],
      dangerMode: true,
    });

    if (!confirmed) return;

    try {
      await deleteProduce(produce.id);
      swal('Deleted', 'Item removed successfully.', 'success');
      window.location.reload();
    } catch {
      swal('Error', 'Failed to delete item.', 'error');
    }
  };

  return (
    <>
      <Card className="shadow-sm h-100">
        <Card.Body className="d-flex flex-column">
          {produce.image && (
            <Card.Img
              variant="top"
              src={produce.image}
              style={{
                height: '150px',
                objectFit: 'cover',
                borderRadius: '6px',
                marginBottom: '10px',
              }}
            />
          )}

          <Card.Title>{produce.name}</Card.Title>

          <Card.Text>
            <strong>Quantity:</strong>
            {' '}
            {formatDisplayAmount(display)}
          </Card.Text>

          <Card.Text>
            <strong>Type:</strong>
            {produce.type}
          </Card.Text>

          <Card.Text>
            <strong>Location:</strong>
            {produce.location?.name || '—'}
          </Card.Text>

          <Card.Text>
            <strong>Storage:</strong>
            {produce.storage?.name || '—'}
          </Card.Text>

          <Card.Text>
            <strong>Expiration:</strong>
            {' '}
            {produce.expiration ? new Date(produce.expiration).toLocaleDateString() : '—'}
          </Card.Text>

          {produce.restockThreshold != null && (
            <Card.Text>
              <strong>Restock At:</strong>
              {' '}
              {formatDisplayAmount({ quantity: produce.restockThreshold, unit: display.unit })}
            </Card.Text>
          )}

          <div className="mt-auto d-flex justify-content-between gap-2">
            <Button variant="outline-primary" size="sm" onClick={() => setShowEdit(true)}>
              <PencilSquare />
              Edit
            </Button>

            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddListsModal(true)}>
              <PlusLg />
              Add
            </Button>

            <Button variant="outline-danger" size="sm" onClick={handleDelete}>
              <Trash />
              Delete
            </Button>
          </div>
        </Card.Body>
      </Card>

      <EditProduceModal show={showEdit} onHide={() => setShowEdit(false)} produce={produce} />

      <AddToMultipleShoppingListsModal
        show={showAddListsModal}
        onHide={() => setShowAddListsModal(false)}
        shoppingLists={shoppingLists}
        item={{
          name: produce.name,
          quantity: Number(produce.quantity),
          unit: produce.unit ?? null,
        }}
      />
    </>
  );
}
