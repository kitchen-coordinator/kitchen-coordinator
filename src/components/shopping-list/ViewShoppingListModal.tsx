/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */

'use client';

import { useEffect, useState } from 'react';
import { BagCheckFill } from 'react-bootstrap-icons';
import { Button, Col, Modal, Row, Table } from 'react-bootstrap';
import AddToShoppingListModal from './AddToShoppingListModal';
import EditShoppingListItemModal from './EditShoppingListItemModal';

interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number;
  unit?: string | null;
  price?: number | null;
  restockTrigger?: string | null;
  customThreshold?: number | null;
  purchased?: boolean;
}

interface ShoppingList {
  id: number;
  name: string;
  isCompleted?: boolean;
  completedAt?: string | null;
  items?: ShoppingListItem[];
}

type ViewShoppingListModalProps = {
  show: boolean;
  onHide: () => void;
  shoppingList?: ShoppingList;
};

export default function ViewShoppingListModal({ show, onHide, shoppingList }: ViewShoppingListModalProps) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});
  const [pendingChecks, setPendingChecks] = useState<Record<number, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const listIsCompleted = !!shoppingList?.isCompleted;
  const listId = shoppingList?.id;

  const applyItemsToLocalState = (nextItems: ShoppingListItem[]) => {
    setItems(nextItems);
    const purchasedState = nextItems.reduce((acc, item) => {
      acc[item.id] = !!item.purchased;
      return acc;
    }, {} as Record<number, boolean>);
    setCheckedState(purchasedState);
  };

  // Initialize state from passed list data (before the fetch finishes).
  useEffect(() => {
    if (shoppingList?.items) {
      applyItemsToLocalState(shoppingList.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingList?.items]);

  // Always fetch latest saved item states when modal opens.
  useEffect(() => {
    if (!show || !listId) return;

    setIsLoadingItems(true);
    fetch(`/api/shopping-list/${listId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load shopping list');
        return response.json();
      })
      .then((list) => {
        applyItemsToLocalState(list.items || []);
      })
      .catch((error) => {
        console.error('Failed to refresh shopping list items:', error);
      })
      .finally(() => setIsLoadingItems(false));
  }, [show, listId]);

  const handleRestockChange = async (itemId: number, restockTrigger: string) => {
    if (listIsCompleted) return;
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, restockTrigger } : item)));

    await fetch(`/api/shopping-list-item/${itemId}/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restockTrigger }),
    });
  };

  const handleThresholdChange = async (itemId: number, customThreshold: number) => {
    if (listIsCompleted) return;
    if (!Number.isFinite(customThreshold)) return;
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, customThreshold } : item)),
    );

    await fetch(`/api/shopping-list-item/${itemId}/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customThreshold }),
    });
  };

  const handleDeleteItem = async (itemId: number) => {
    if (listIsCompleted) return;
    setDeletingItemId(itemId);
    setSaveError(null);

    try {
      const response = await fetch(`/api/shopping-list-item/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setCheckedState((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      setSaveError(err?.message || 'Failed to delete item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const toggleCheckbox = async (itemId: number) => {
    if (listIsCompleted) return;
    if (isLoadingItems || pendingChecks[itemId]) return;

    setSaveError(null);

    const nextPurchased = !checkedState[itemId];
    setCheckedState((prev) => ({ ...prev, [itemId]: nextPurchased }));
    setPendingChecks((prev) => ({ ...prev, [itemId]: true }));

    try {
      const response = await fetch(`/api/shopping-list-item/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: nextPurchased }),
      });

      if (!response.ok) {
        throw new Error('Failed to save item purchase state.');
      }

      // Keep local state in sync with what the server persisted.
      const updated = (await response.json()) as ShoppingListItem;
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
      setCheckedState((prev) => ({ ...prev, [itemId]: !!updated.purchased }));
    } catch (error: any) {
      console.error(error);
      setSaveError(error?.message || 'Failed to save checkbox update.');
      setCheckedState((prev) => ({ ...prev, [itemId]: !nextPurchased }));
    } finally {
      setPendingChecks((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  let bodyContent;
  if (isLoadingItems) {
    bodyContent = (
      <Row>
        <Col className="text-center">
          <p className="text-muted mb-0">Loading list...</p>
        </Col>
      </Row>
    );
  } else if (items.length === 0) {
    bodyContent = (
      <Row>
        <Col className="text-center">
          <p className="text-muted mb-0">No items in this shopping list.</p>
        </Col>
      </Row>
    );
  } else {
    bodyContent = (
      <Row>
        <Col>
          <Table striped bordered hover size="sm" responsive className="text-center">
            <thead>
              <tr>
                <th>
                  <BagCheckFill color="black" size={18} />
                </th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Restock When</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!checkedState[item.id]}
                      onChange={() => toggleCheckbox(item.id)}
                      disabled={listIsCompleted || !!pendingChecks[item.id] || isLoadingItems}
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                  <td style={{ textDecoration: checkedState[item.id] ? 'line-through' : 'none' }}>
                    {item.name}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.unit || '-'}</td>
                  <td>{item.price ? `$${Number(item.price).toFixed(2)}` : 'N/A'}</td>
                  <td>
                    <select
                      value={item.restockTrigger || 'empty'}
                      onChange={(e) => handleRestockChange(item.id, e.target.value)}
                      className="form-select form-select-sm"
                      disabled={listIsCompleted}
                    >
                      <option value="empty">When empty</option>
                      <option value="half">When half gone</option>
                      <option value="custom">Custom % left</option>
                    </select>

                    {item.restockTrigger === 'custom' && (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.customThreshold ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') return;
                          const parsed = Number(raw);
                          if (!Number.isFinite(parsed)) return;
                          handleThresholdChange(item.id, parsed).catch((err) => console.error(err));
                        }}
                        className="form-control form-control-sm mt-1"
                        placeholder="% left"
                        disabled={listIsCompleted}
                      />
                    )}
                  </td>
                  <td className="d-flex gap-2 justify-content-center">
                    <Button
                      variant="edit"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                      disabled={listIsCompleted}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        handleDeleteItem(item.id).catch((err) => console.error(err));
                      }}
                      disabled={deletingItemId === item.id || listIsCompleted}
                    >
                      {deletingItemId === item.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    );
  }

  if (!shoppingList) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg">
        <Modal.Header className="justify-content-center">
          <Modal.Title>{shoppingList.name ?? 'Shopping List'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {saveError && (
            <Row className="mb-2">
              <Col className="text-center text-danger">{saveError}</Col>
            </Row>
          )}
          {bodyContent}
        </Modal.Body>

        <Modal.Body>
          <Row className="pt-4">
            <Col className="text-center">
              <Button
                variant="success"
                style={{ backgroundColor: 'var(--fern-green)' }}
                className="btn-submit"
                disabled={listIsCompleted || isLoadingItems || Object.values(pendingChecks).some(Boolean)}
                onClick={() => setShowAddModal(true)}
              >
                + Add Item
              </Button>
            </Col>
            <Col className="text-center">
              <Button
                onClick={onHide}
                variant="secondary"
                className="btn-submit"
                disabled={isLoadingItems}
              >
                Close
              </Button>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      <AddToShoppingListModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        shoppingLists={[shoppingList]}
        sidePanel={false}
        prefillName=""
      />

      {editingItem && (
        <EditShoppingListItemModal
          show={!!editingItem}
          onHide={() => setEditingItem(null)}
          item={editingItem}
        />
      )}
    </>
  );
}

ViewShoppingListModal.defaultProps = {
  shoppingList: {
    id: 0,
    name: '',
    isCompleted: false,
    completedAt: null,
    items: [],
  },
};
