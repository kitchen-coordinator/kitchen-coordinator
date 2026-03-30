'use client';

import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
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
  deadline?: string | null;
  location?: string | null;
  budgetLimit?: number | null;
  items?: ShoppingListItem[];
}

type ViewShoppingListModalProps = {
  show: boolean;
  onHide: () => void;
  shoppingList?: ShoppingList;
};

const iconStyle: React.CSSProperties = {
  color: 'var(--bs-secondary)',
  cursor: 'pointer',
  flexShrink: 0,
};

const EditIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={iconStyle}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#dc3545"
    strokeWidth="2"
    style={{ cursor: 'pointer', flexShrink: 0 }}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '14px 20px',
  borderBottom: '1px solid #f0f0f0',
};

const iconBoxStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  background: '#4a7c59',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const saveBtnStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid #4a7c59',
  background: '#4a7c59',
  color: 'white',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '500',
  margin: 0,
};

const subTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: '2px 0 0',
};

const inputStyle: React.CSSProperties = {
  fontSize: '13px',
  marginTop: '4px',
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

export default function ViewShoppingListModal({
  show,
  onHide,
  shoppingList,
}: ViewShoppingListModalProps) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});
  const [pendingChecks, setPendingChecks] = useState<Record<number, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const listIsCompleted = !!shoppingList?.isCompleted;
  const listId = shoppingList?.id;

  const totalCost = items.reduce((sum, item) => {
    const price = item.price ? parseFloat(item.price.toString()) : 0;
    return sum + price * item.quantity;
  }, 0);

  const applyItemsToLocalState = (nextItems: ShoppingListItem[]) => {
    setItems(nextItems);
    const purchasedState = nextItems.reduce(
      (acc, item) => {
        acc[item.id] = !!item.purchased;
        return acc;
      },
      {} as Record<number, boolean>,
    );
    setCheckedState(purchasedState);
  };

  useEffect(() => {
    if (shoppingList) {
       setDeadline(
        shoppingList.deadline
          ? new Date(shoppingList.deadline).toISOString().slice(0, 10)
          : '',
      );
      setLocation(shoppingList.location ?? '');
      setBudgetLimit(shoppingList.budgetLimit?.toString() ?? '');
    }
    if (shoppingList?.items) {
      applyItemsToLocalState(shoppingList.items);
    }
  }, [shoppingList]);

  useEffect(() => {
    if (!show || !listId) return;
    setIsLoadingItems(true);
    fetch(`/api/shopping-list/${listId}`)
      .then((r) => r.json())
      .then((list) => {
        applyItemsToLocalState(list.items || []);
        setDeadline(list.deadline?.slice(0, 10) ?? '');
        setLocation(list.location ?? '');
        setBudgetLimit(list.budgetLimit?.toString() ?? '');
      })
      .catch(console.error)
      .finally(() => setIsLoadingItems(false));
  }, [show, listId]);

  const handleSaveDetails = async () => {
    if (!listId || listIsCompleted) return;
    setSavingDetails(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/shopping-list/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deadline: deadline || null,
          location: location || null,
          budgetLimit: budgetLimit ? Number(budgetLimit) : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save details');
      setEditingDeadline(false);
      setEditingLocation(false);
      setEditingBudget(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save details');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (listIsCompleted) return;
    setDeletingItemId(itemId);
    try {
      const res = await fetch(`/api/shopping-list-item/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setCheckedState((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to delete item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const toggleCheckbox = async (itemId: number) => {
    if (listIsCompleted || isLoadingItems || pendingChecks[itemId]) return;
    setSaveError(null);
    const nextPurchased = !checkedState[itemId];
    setCheckedState((prev) => ({ ...prev, [itemId]: nextPurchased }));
    setPendingChecks((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await fetch(`/api/shopping-list-item/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: nextPurchased }),
      });
      if (!res.ok) throw new Error('Failed to save item purchase state.');
      const updated = await res.json() as ShoppingListItem;
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
      setCheckedState((prev) => ({ ...prev, [itemId]: !!updated.purchased }));
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to save checkbox update.');
      setCheckedState((prev) => ({ ...prev, [itemId]: !nextPurchased }));
    } finally {
      setPendingChecks((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  if (!shoppingList) return null;

  const renderSaveBtn = () => (
    <button
      type="button"
      onClick={handleSaveDetails}
      disabled={savingDetails}
      style={saveBtnStyle}
    >
      {savingDetails ? '...' : 'Save'}
    </button>
  );

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg">
        <div
          style={{
            background: '#4a7c59',
            padding: '20px 24px',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'white' }}>
            {shoppingList.name ?? 'Shopping List'}
          </p>
          <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'rgba(255,255,255,0.75)' }}>
            {`${items.length} items · $${totalCost.toFixed(2)} estimated`}
          </p>
        </div>

        <Modal.Body style={{ padding: 0 }}>
          {saveError && (
            <p style={{ color: '#dc3545', textAlign: 'center', padding: '8px 20px', margin: 0, fontSize: '13px' }}>
              {saveError}
            </p>
          )}

          {/* Deadline Row */}
          <div style={rowStyle}>
            <div style={iconBoxStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Deadline</p>
              {editingDeadline ? (
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={inputStyle}
                />
              ) : (
                <p style={subTextStyle}>{deadline || 'Not set'}</p>
              )}
            </div>
            {!listIsCompleted && (
              editingDeadline
                ? renderSaveBtn()
                : (
                  <button
                    type="button"
                    onClick={() => setEditingDeadline(true)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <EditIcon />
                  </button>
                )
            )}
          </div>

          {/* Location Row */}
          <div style={rowStyle}>
            <div style={iconBoxStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Store / Location</p>
              {editingLocation ? (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Costco"
                  style={{ ...inputStyle, width: '100%' }}
                />
              ) : (
                <p style={subTextStyle}>{location || 'Not set'}</p>
              )}
            </div>
            {!listIsCompleted && (
              editingLocation
                ? renderSaveBtn()
                : (
                  <button
                    type="button"
                    onClick={() => setEditingLocation(true)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <EditIcon />
                  </button>
                )
            )}
          </div>

          {/* Budget Row */}
          <div style={rowStyle}>
            <div style={iconBoxStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Budget</p>
              {editingBudget ? (
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0) setBudgetLimit(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-') e.preventDefault();
                  }}
                  placeholder="e.g. 100.00"
                  min="0"
                  step="0.01"
                  style={{ ...inputStyle, width: '120px' }}
                />
              ) : (
                <p style={subTextStyle}>
                  {budgetLimit ? `$${Number(budgetLimit).toFixed(2)}` : 'Not set'}
                </p>
              )}
            </div>
            {!listIsCompleted && (
              editingBudget
                ? renderSaveBtn()
                : (
                  <button
                    type="button"
                    onClick={() => setEditingBudget(true)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <EditIcon />
                  </button>
                )
            )}
          </div>

          {/* Items Section */}
          <div style={{ padding: '12px 20px 4px' }}>
            <p style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#888',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
            >
              Items
            </p>
          </div>

          {isLoadingItems && (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Loading...</p>
          )}

          {!isLoadingItems && items.length === 0 && (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              No items in this list.
            </p>
          )}

          {!isLoadingItems && items.map((item) => {
            const itemSubText = [
              `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`,
              item.price ? `$${Number(item.price).toFixed(2)}` : null,
            ]
              .filter(Boolean)
              .join(' · ');

            const itemNameStyle: React.CSSProperties = {
              fontSize: '14px',
              fontWeight: '500',
              margin: 0,
              textDecoration: checkedState[item.id] ? 'line-through' : 'none',
              color: checkedState[item.id] ? '#999' : 'inherit',
            };

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 20px',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checkedState[item.id]}
                  onChange={() => toggleCheckbox(item.id)}
                  disabled={listIsCompleted || !!pendingChecks[item.id] || isLoadingItems}
                  style={{
                    width: '18px',
                    height: '18px',
                    flexShrink: 0,
                    accentColor: '#4a7c59',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={itemNameStyle}>{item.name}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>
                    {itemSubText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !listIsCompleted && setEditingItem(item)}
                  disabled={listIsCompleted}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: listIsCompleted ? 'default' : 'pointer',
                  }}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => !listIsCompleted && handleDeleteItem(item.id)}
                  disabled={listIsCompleted || deletingItemId === item.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: listIsCompleted ? 'default' : 'pointer',
                    opacity: deletingItemId === item.id ? 0.5 : 1,
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </Modal.Body>

        <Modal.Footer
          style={{
            padding: '16px 20px',
            display: 'flex',
            gap: '8px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Button
            onClick={() => setShowAddModal(true)}
            disabled={listIsCompleted || isLoadingItems}
            style={{ flex: 1, background: '#4a7c59', border: 'none', fontWeight: '500' }}
          >
            + Add Item
          </Button>
          <Button
            onClick={onHide}
            variant="secondary"
            disabled={isLoadingItems}
          >
            Close
          </Button>
        </Modal.Footer>
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
    deadline: null,
    location: null,
    budgetLimit: null,
    items: [],
  },
};
