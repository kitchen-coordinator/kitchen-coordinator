'use client';

import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
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
      <Modal.Header closeButton>
        <Modal.Title>
          Select item to
          {action}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.length === 0 && (
            <p className="text-center text-muted" style={{ fontSize: '13px' }}>
              No items found
            </p>
          )}
          {filtered.map((item) => {
            const storageName = typeof item.storage === 'object'
              ? item.storage?.name
              : item.storage;
            const locationName = typeof item.location === 'object'
              ? item.location?.name
              : item.location;
            const isSelected = selected?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #534AB7' : '0.5px solid #ccc',
                  background: isSelected ? '#EEEDFE' : 'white',
                  transition: 'background 0.1s',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {item.type}
                  {storageName ? ` · ${storageName}` : ''}
                  {locationName ? ` at ${locationName}` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide}>
          Cancel
        </Button>
        <Button
          className={action === 'delete' ? 'btn-delete' : 'btn-edit'}
          disabled={!selected}
          onClick={handleConfirm}
        >
          {action === 'edit' ? 'Edit selected' : 'Delete selected'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelectItemModal;
