'use client';

import swal from 'sweetalert';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

type ShoppingList = {
  id: number;
  name: string;
  isCompleted?: boolean;
};

type Props = {
  show: boolean;
  onHide: () => void;
  shoppingLists: ShoppingList[];
  item: {
    name: string;
    quantity: number;
    unit: string | null;
  };
};

export default function AddToMultipleShoppingListsModal({
  show,
  onHide,
  shoppingLists,
  item,
}: Props) {
  const router = useRouter();
  const editableLists = useMemo(
    () => shoppingLists.filter((l) => !l.isCompleted),
    [shoppingLists],
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [createMode, setCreateMode] = useState<boolean>(false);
  const [createName, setCreateName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    setError(null);
    setIsSubmitting(false);
    setSelectedIds([]);
    setCreateMode(editableLists.length === 0);
    setCreateName('');
  }, [show, editableLists.length]);

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    setError(null);

    const trimmedCreateName = createName.trim();
    const wantsCreate = createMode && trimmedCreateName.length > 0;

    if (selectedIds.length === 0 && !wantsCreate) {
      setError('Select at least one shopping list, or create a new one.');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/shopping-list-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          shoppingListIds: selectedIds.length ? selectedIds : undefined,
          createShoppingListName: wantsCreate ? trimmedCreateName : undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error || data?.message || 'Failed to add item';
        throw new Error(msg);
      }

      const totalCreated = (data?.createdByList ?? [])
        .reduce((acc: number, g: any) => acc + ((g.created ?? []).length || 0), 0);

      if (totalCreated === 0) {
        swal('Not added', 'This item already exists in all selected lists.', 'info', {
          timer: 2000,
        });
      } else {
        swal('Added', `Added "${item.name}" to your selected list(s).`, 'success', {
          timer: 2000,
        });
      }

      onHide();
      router.refresh();
    } catch (e: any) {
      const msg = e?.message || 'Failed to add item.';
      if (msg.toLowerCase().includes('already exists')) {
        setError(
          'A shopping list with this name already exists. Select the existing list above, or choose a different name.',
        );
      } else {
        setError(
          msg
          || 'Failed to add item. If creating a list failed, try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeGuarded = () => {
    if (isSubmitting) return;
    setError(null);
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={closeGuarded}
      centered
      size="lg"
      backdrop={isSubmitting ? 'static' : true}
      keyboard={!isSubmitting}
    >
      <Modal.Header closeButton>
        <Modal.Title>Add to Shopping List</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="mb-3">
          <Col>
            <div className="text-muted small">
              Item:
              {' '}
              <strong>{item.name}</strong>
            </div>
          </Col>
        </Row>

        <Row className="mb-2">
          <Col>
            <div className="mb-2">
              <strong>Choose one or more lists</strong>
            </div>

            {editableLists.length === 0 ? (
              <div className="text-muted">No open shopping lists yet.</div>
            ) : (
              <div className="d-grid gap-2">
                {editableLists.map((list) => (
                  <Form.Check
                    key={list.id}
                    type="checkbox"
                    id={`sl-${list.id}`}
                    label={list.name}
                    checked={selectedIds.includes(list.id)}
                    disabled={isSubmitting}
                    onChange={() => toggleSelected(list.id)}
                  />
                ))}
              </div>
            )}
          </Col>
        </Row>

        <hr />

        <Row className="align-items-center">
          <Col xs="12" md="4" className="mb-2 mb-md-0">
            <Form.Check
              type="checkbox"
              id="create-new-list"
              label="Create a new list"
              checked={createMode}
              disabled={isSubmitting}
              onChange={(e) => setCreateMode(e.target.checked)}
            />
          </Col>

          <Col xs="12" md="8">
            <Form.Control
              value={createName}
              disabled={!createMode || isSubmitting}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="New list name (will include this item)"
            />
            <div className="text-muted small mt-1">
              If the name already exists, you will be prompted to choose a different one.
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={closeGuarded} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ backgroundColor: 'var(--fern-green)' }}
          className="btn-submit"
        >
          {isSubmitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Adding...
            </>
          ) : (
            'Add'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
