'use client';

import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import {
  PencilSquare,
  Trash,
  Calendar,
  GeoAlt,
  CurrencyDollar,
} from 'react-bootstrap-icons';
import styles from '@/styles/shopping-list.module.css';
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
      className={styles.saveBtn}
    >
      {savingDetails ? '...' : 'Save'}
    </button>
  );

  return (
    <>
      <Modal show={show} onHide={onHide} centered>

        <div className={styles.modalHeader}>
          <p className={styles.modalHeaderTitle}>
            {shoppingList.name ?? 'Shopping List'}
          </p>
          <p className={styles.modalHeaderSubtitle}>
            {`${items.length} items · $${totalCost.toFixed(2)} estimated`}
          </p>
        </div>

        <Modal.Body className={styles.modalBody}>
          {saveError && (
            <p className={styles.saveError}>{saveError}</p>
          )}

          {/* Deadline Row */}
          <div className={styles.detailRow}>
            <div className={styles.iconBox}>
              <Calendar size={20} color="white" />
            </div>
            <div className={styles.detailRowContent}>
              <p className={styles.detailLabel}>Deadline</p>
              {editingDeadline ? (
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={styles.detailInput}
                />
              ) : (
                <p className={styles.detailSubText}>{deadline || 'Not set'}</p>
              )}
            </div>
            {!listIsCompleted && (
              editingDeadline
                ? renderSaveBtn()
                : (
                  <button
                    type="button"
                    onClick={() => setEditingDeadline(true)}
                    className={styles.iconBtn}
                  >
                    <PencilSquare size={18} color="var(--bs-secondary)" />
                  </button>
                )
            )}
          </div>

          {/* Location Row */}
          <div className={styles.detailRow}>
            <div className={styles.iconBox}>
              <GeoAlt size={20} color="white" />
            </div>
            <div className={styles.detailRowContent}>
              <p className={styles.detailLabel}>Store / Location</p>
              {editingLocation ? (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Costco"
                  className={styles.detailInputFull}
                />
              ) : (
                <p className={styles.detailSubText}>{location || 'Not set'}</p>
              )}
            </div>
            {!listIsCompleted && (
              editingLocation
                ? renderSaveBtn()
                : (
                  <button
                    type="button"
                    onClick={() => setEditingLocation(true)}
                    className={styles.iconBtn}
                  >
                    <PencilSquare size={18} color="var(--bs-secondary)" />
                  </button>
                )
            )}
          </div>

          {/* Budget Row */}
          <div className={styles.detailRow}>
            <div className={styles.iconBox}>
              <CurrencyDollar size={20} color="white" />
            </div>
            <div className={styles.detailRowContent}>
              <p className={styles.detailLabel}>Budget</p>
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
                  className={styles.detailInputBudget}
                />
              ) : (
                <p className={styles.detailSubText}>
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
                    className={styles.iconBtn}
                  >
                    <PencilSquare size={18} color="var(--bs-secondary)" />
                  </button>
                )
            )}
          </div>

          {/* Items Section */}
          <div className={styles.itemsSectionHeader}>
            <p className={styles.itemsSectionLabel}>Items</p>
          </div>

          {isLoadingItems && (
            <p className={styles.loadingText}>Loading...</p>
          )}

          {!isLoadingItems && items.length === 0 && (
            <p className={styles.loadingText}>No items in this list.</p>
          )}

          {!isLoadingItems && items.map((item) => {
            const itemSubText = [
              `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`,
              item.price ? `$${Number(item.price).toFixed(2)}` : null,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <div key={item.id} className={styles.itemRow}>
                <input
                  type="checkbox"
                  checked={!!checkedState[item.id]}
                  onChange={() => toggleCheckbox(item.id)}
                  disabled={listIsCompleted || !!pendingChecks[item.id] || isLoadingItems}
                  className={styles.itemCheckbox}
                />
                <div className={styles.itemContent}>
                  <p className={
                    checkedState[item.id]
                      ? styles.itemNamePurchased
                      : styles.itemName
                  }
                  >
                    {item.name}
                  </p>
                  <p className={styles.itemSubText}>{itemSubText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => !listIsCompleted && setEditingItem(item)}
                  disabled={listIsCompleted}
                  className={styles.iconBtn}
                >
                  <PencilSquare size={18} color="var(--bs-secondary)" />
                </button>
                <button
                  type="button"
                  onClick={() => !listIsCompleted && handleDeleteItem(item.id)}
                  disabled={listIsCompleted || deletingItemId === item.id}
                  className={styles.iconBtn}
                  style={{ opacity: deletingItemId === item.id ? 0.5 : 1 }}
                >
                  <Trash size={18} color="#dc3545" />
                </button>
              </div>
            );
          })}
        </Modal.Body>

        <Modal.Footer className={styles.modalFooter}>
          <Button
            onClick={() => setShowAddModal(true)}
            disabled={listIsCompleted || isLoadingItems}
            className={styles.addItemBtn}
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
