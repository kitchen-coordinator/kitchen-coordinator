'use client';

import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import type { ProduceRelations } from '@/types/ProduceRelations';

type Props = {
  show: boolean;
  onHide: () => void;
  items: ProduceRelations[];
  action: 'edit' | 'delete';
  onConfirm: (item: ProduceRelations) => void;
};

const SelectItemModal = ({ show, onHide, items, action, onConfirm }: Props) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProduceRelations | null>(null);

  const filtered = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setSelected(null);
    setSearch('');
    onHide();
  };

  const handleHide = () => {
    setSelected(null);
    setSearch('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} centered>
      {/* Green header matching EditProduceModal */}
      <div style={{
        backgroundColor: 'var(--fern-green)',
        borderRadius: '8px 8px 0 0',
        padding: '20px 24px',
      }}
      >
        <h5 style={{ color: 'white', margin: 0, fontWeight: 700 }}>
          {action === 'edit' ? 'Edit Pantry Item' : 'Delete Pantry Item'}
        </h5>
        <small style={{ color: 'rgba(255,255,255,0.75)' }}>
          Select an item to
          {' '}
          {action}
        </small>
      </div>

      <Modal.Body style={{ padding: '0 24px 24px' }}>
        {/* Search row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0',
          borderBottom: '1px solid #f0f0f0',
        }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'var(--fern-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          >
            <Search color="white" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              background: 'transparent',
            }}
          />
        </div>

        {/* Item list */}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <p className="text-center text-muted mt-3" style={{ fontSize: '13px' }}>
              No items found
            </p>
          )}
          {filtered.map((item) => {
            const storageName = typeof item.storage === 'object'
              ? item.storage?.name : item.storage;
            const locationName = typeof item.location === 'object'
              ? item.location?.name : item.location;
            const isSelected = selected?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  width: '100%',
                  textAlign: 'left',
                  background: isSelected ? '#eaf3de' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: isSelected ? 'var(--hunter-green)' : 'var(--fern-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 700,
                  color: 'white',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                }}
                >
                  {item.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 2 }}>
                    {item.type}
                    {storageName ? ` · ${storageName}` : ''}
                    {locationName ? ` at ${locationName}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2 mt-4">
          <Button
            type="button"
            disabled={!selected}
            className={action === 'delete' ? 'btn-submit btn-danger flex-fill' : 'btn-submit flex-fill'}
            onClick={handleConfirm}
          >
            {action === 'edit' ? 'Edit Selected' : 'Delete Selected'}
          </Button>
          <Button
            type="button"
            onClick={handleHide}
            className="btn-reset flex-fill"
          >
            Cancel
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SelectItemModal;
