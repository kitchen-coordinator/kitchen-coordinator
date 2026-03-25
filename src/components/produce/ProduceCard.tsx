/* eslint-disable react/jsx-one-expression-per-line */

'use client';

import { Card, ListGroup, Image, Button } from 'react-bootstrap/';
import Link from 'next/link';
import type { ProduceRelations } from '@/types/ProduceRelations';
import { useState } from 'react';
import { CartPlus, PencilSquare, Trash } from 'react-bootstrap-icons';
import EditProduceModal from './EditProduceModal';
import DeleteProduceModal from './DeleteProduceModal';
import AddToMultipleShoppingListsModal from '../shopping-list/AddToMultipleShoppingListsModal';

type Props = {
  produce: ProduceRelations;
  shoppingLists: { id: number; name: string; isCompleted?: boolean }[];
};

const formatDate = (d?: Date | string | null) => {
  if (!d) return 'Not Available';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return 'Not Available';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ProduceCard({ produce, shoppingLists }: Props) {
  const imageSrc = produce.image || '/no-image.png';
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddListsModal, setShowAddListsModal] = useState(false);

  return (
    <Card className="h-100 mb-3 image-shadow">
      <Card.Header>
        <Link href={`/produce/${produce.id}`} className="link-dark">
          <Card.Title className="mb-1">{produce.name}</Card.Title>
        </Link>
        <Card.Subtitle className="text-muted">{produce.type || 'Type Not Available'}</Card.Subtitle>
      </Card.Header>

      <Card.Body>
        <Image
          src={imageSrc}
          alt={produce.name || 'No image'}
          height="200px"
          width="100%"
          className="mb-2 cardimage"
          style={{ objectFit: 'cover' }}
        />

        <ListGroup variant="flush">
          <ListGroup.Item>
            <strong>Location: </strong>
            {produce.storage?.name || 'Not Available'} at {produce.location?.name || 'Not Available'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Quantity:</strong> {typeof produce.quantity === 'number' ? produce.quantity : 'Not Available'}
            {produce.unit ? ` ${produce.unit}` : ''}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Expiration:</strong> {formatDate(produce.expiration)}
          </ListGroup.Item>
        </ListGroup>
        <Card.Footer className="d-flex">
          <Button className="me-2 btn-edit" onClick={() => setShowEditModal(true)}>
            <PencilSquare color="white" size={18} />
          </Button>
          <Button
            variant="danger"
            className="btn-delete"
            // style={{ width: '100px' }}
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash color="white" size={18} />
          </Button>
          <Button
            className="btn-shopping flex-fill"
            onClick={() => setShowAddListsModal(true)}
          >
            <CartPlus color="white" size={18} />
          </Button>
        </Card.Footer>
      </Card.Body>

      {/* Modal component for editing produce item */}
      <EditProduceModal show={showEditModal} onHide={() => setShowEditModal(false)} produce={produce} />

      {/* Modal component for deleting produce item */}
      <DeleteProduceModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} produce={produce} />

      <AddToMultipleShoppingListsModal
        show={showAddListsModal}
        onHide={() => setShowAddListsModal(false)}
        shoppingLists={shoppingLists}
        item={{ name: produce.name, quantity: Number(produce.quantity), unit: produce.unit ?? null }}
      />
    </Card>
  );
}
