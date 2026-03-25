/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */

'use client';

import { useState, useEffect } from 'react';
import { Button, Col, Modal, Row, Table } from 'react-bootstrap';
import { BagCheckFill } from 'react-bootstrap-icons';
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

interface ViewShoppingListModalProps {
  show: boolean;
  onHide: () => void;
  shoppingList?: ShoppingList; // optional for safety
}

const ViewShoppingListModal = ({ show, onHide, shoppingList }: ViewShoppingListModalProps) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});
<<<<<<< Updated upstream
  const [pendingChecks, setPendingChecks] = useState<Record<number, boolean>>({});
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
=======
  const [initialCheckedState, setInitialCheckedState] = useState<Record<number, boolean>>({});
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [isSavingChecks, setIsSavingChecks] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const listIsCompleted = !!shoppingList?.isCompleted;
  let closeButtonText = 'Close';
  if (isSavingChecks) {
    closeButtonText = 'Saving...';
  } else if (isClosing) {
    closeButtonText = 'Closing...';
  }
>>>>>>> Stashed changes

  const applyItemsToLocalState = (nextItems: ShoppingListItem[]) => {
    setItems(nextItems);
    const purchasedState = nextItems.reduce((acc, item) => {
      acc[item.id] = !!item.purchased;
      return acc;
    }, {} as Record<number, boolean>);
    setCheckedState(purchasedState);
  };

  // Initialize state from passed list data
  useEffect(() => {
    if (shoppingList?.items) {
<<<<<<< Updated upstream
      applyItemsToLocalState(shoppingList.items);
=======
      setItems(shoppingList.items);
      const purchasedMap = shoppingList.items.reduce((acc, item) => {
        acc[item.id] = !!(item as ShoppingListItem & { purchased?: boolean }).purchased;
        return acc;
      }, {} as Record<number, boolean>);
      setCheckedState(purchasedMap);
      setInitialCheckedState(purchasedMap);
>>>>>>> Stashed changes
    }
  }, [shoppingList]);

  // Always fetch latest saved item states when modal opens.
  useEffect(() => {
    const shoppingListId = shoppingList?.id;
    if (!show || !shoppingListId) return;

    setIsLoadingItems(true);
    fetch(`/api/shopping-list/${shoppingListId}`)
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
      .finally(() => {
        setIsLoadingItems(false);
      });
  }, [show, shoppingList?.id]);

  const handleRestockChange = async (itemId: number, restockTrigger: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, restockTrigger } : item)),
    );

    await fetch(`/api/shopping-list-item/${itemId}/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restockTrigger }),
    });
  };

  const handleThresholdChange = async (itemId: number, customThreshold: number) => {
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
    try {
      setDeletingItemId(itemId);
      await fetch(`/api/shopping-list-item/${itemId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setDeletingItemId(null);
    }
  };

  const toggleCheckbox = (itemId: number) => {
<<<<<<< Updated upstream
    if (isLoadingItems || pendingChecks[itemId]) return;
    setSaveError(null);

    const nextPurchased = !checkedState[itemId];
    setCheckedState((prev) => ({ ...prev, [itemId]: nextPurchased }));
    setPendingChecks((prev) => ({ ...prev, [itemId]: true }));

    fetch(`/api/shopping-list-item/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchased: nextPurchased }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Failed to save item purchase state.');
      }
      setItems((prev) => prev.map((item) => (
        item.id === itemId ? { ...item, purchased: nextPurchased } : item
      )));
    }).catch((error) => {
      console.error(error);
      setSaveError(error?.message || 'Failed to save checkbox update.');
      setCheckedState((prev) => ({ ...prev, [itemId]: !nextPurchased }));
    }).finally(() => {
      setPendingChecks((prev) => ({ ...prev, [itemId]: false }));
=======
    const nextValue = !checkedState[itemId];
    setCheckedState((prev) => ({ ...prev, [itemId]: nextValue }));
  };

  const persistCheckboxChanges = async () => {
    const changedItemIds = items
      .map((item) => item.id)
      .filter((id) => (checkedState[id] ?? false) !== (initialCheckedState[id] ?? false));

    if (changedItemIds.length === 0) return true;

    setIsSavingChecks(true);
    try {
      const responses = await Promise.all(changedItemIds.map((itemId) => fetch(`/api/shopping-list-item/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: !!checkedState[itemId] }),
      })));

      if (responses.some((response) => !response.ok)) {
        throw new Error('Failed saving one or more purchased states.');
      }

      setInitialCheckedState({ ...checkedState });
      setItems((prev) => prev.map((item) => ({ ...item, purchased: !!checkedState[item.id] })));
      return true;
    } catch (err) {
      console.error('Failed to save checkbox updates:', err);
      return false;
    } finally {
      setIsSavingChecks(false);
    }
  };

  const handleCloseModal = async (): Promise<void> => {
    if (isClosing) return;
    setIsClosing(true);
    onHide();
    await persistCheckboxChanges();
    setIsClosing(false);
  };

  const requestClose = () => {
    handleCloseModal().catch((err) => {
      console.error('Failed to close modal:', err);
>>>>>>> Stashed changes
    });
  };

  if (!shoppingList) return null;

  let bodyContent;
  if (isLoadingItems) {
    bodyContent = (
      <Row>
        <Col className="text-center">
          <p className="text-muted mb-0">Loading list...</p>
        </Col>
      </Row>
    );
  } else if (items.length > 0) {
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
                      disabled={isLoadingItems || !!pendingChecks[item.id]}
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
                        value={item.customThreshold || ''}
                        onChange={(e) =>
                          handleThresholdChange(item.id, parseFloat(e.target.value))}
                        className="form-control form-control-sm mt-1"
                        placeholder="% left"
                      />
                    )}
                  </td>
                  <td className="d-flex gap-2 justify-content-center">
                    <Button
                      variant="edit"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingItemId === item.id}
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
  } else {
    bodyContent = (
      <Row>
        <Col className="text-center">
          <p className="text-muted mb-0">No items in this shopping list.</p>
        </Col>
      </Row>
    );
  }

  return (
    <>
      <Modal show={show} onHide={requestClose} centered size="lg">
        <Modal.Header className="justify-content-center">
          <Modal.Title>{shoppingList?.name ?? 'Shopping List'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
<<<<<<< Updated upstream
          {saveError && (
            <Row className="mb-2">
              <Col className="text-center text-danger">{saveError}</Col>
=======
          {items.length > 0 ? (
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
                            onChange={() => {
                              toggleCheckbox(item.id);
                            }}
                            disabled={listIsCompleted}
                            aria-label={`Select ${item.name}`}
                          />
                        </td>
                        <td>
                          <span style={{ textDecoration: checkedState[item.id] ? 'line-through' : 'none' }}>
                            {item.name}
                          </span>
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
                              value={item.customThreshold || ''}
                              onChange={(e) =>
                                handleThresholdChange(item.id, parseFloat(e.target.value))}
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
                            onClick={() => handleDeleteItem(item.id)}
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
          ) : (
            <Row>
              <Col className="text-center">
                <p className="text-muted mb-0">No items in this shopping list.</p>
              </Col>
>>>>>>> Stashed changes
            </Row>
          )}
          {bodyContent}

          <Row className="pt-4">
            <Col className="text-center">
              <Button
                variant="success"
                style={{ backgroundColor: 'var(--fern-green)' }}
                className="btn-submit"
<<<<<<< Updated upstream
                disabled={isLoadingItems || Object.values(pendingChecks).some(Boolean)}
                onClick={() => {
                  onHide();
=======
                disabled={listIsCompleted || isSavingChecks || isClosing}
                onClick={async () => {
                  await handleCloseModal();
>>>>>>> Stashed changes
                  setShowAddModal(true);
                }}
              >
                + Add Item
              </Button>
            </Col>
            <Col className="text-center">
              <Button
<<<<<<< Updated upstream
                onClick={onHide}
                variant="secondary"
                className="btn-submit"
                disabled={isLoadingItems || Object.values(pendingChecks).some(Boolean)}
              >
                {isLoadingItems || Object.values(pendingChecks).some(Boolean) ? 'Saving...' : 'Close'}
=======
                onClick={requestClose}
                variant="secondary"
                className="btn-submit"
                disabled={isClosing}
              >
                {closeButtonText}
>>>>>>> Stashed changes
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
};

ViewShoppingListModal.defaultProps = {
  shoppingList: {
    id: 0,
    name: '',
    isCompleted: false,
    completedAt: null,
    items: [],
  },
};

export default ViewShoppingListModal;
