'use client';

import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useMemo, useState } from 'react';
import swal from 'sweetalert';

type EditModalProps = {
  show: boolean;
  onHide: () => void;
  item: {
    id: number;
    name: string;
    quantity: number;
    unit?: string | null;
    price?: number | null;
    restockTrigger?: string | null;
    customThreshold?: number | null;
  };
};

export default function EditShoppingListItemModal({
  show,
  onHide,
  item,
}: EditModalProps) {
  const unitOptions = useMemo(
    () => ['kg', 'g', 'lb', 'oz', 'pcs', 'ml', 'l', 'Other'],
    [],
  );

  const initialUnitChoice = (() => {
    const u = item.unit?.trim() ?? '';
    if (!u) return '';
    return unitOptions.includes(u) ? u : 'Other';
  })();

  const [form, setForm] = useState({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit ?? '',
    price: item.price ?? '',
    restockTrigger: item.restockTrigger ?? 'empty',
    customThreshold: item.customThreshold ?? '',
  });

  const [unitChoice, setUnitChoice] = useState<string>(initialUnitChoice);

  // FIXED — works for all React-Bootstrap inputs
  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const name = String(form.name ?? '').trim();
    const quantityNum = Number(form.quantity);
    const priceNumRaw = form.price === '' || form.price === null || typeof form.price === 'undefined'
      ? null
      : Number(form.price);

    if (!name) {
      await swal('Error', 'Item name is required.', 'error');
      return;
    }
    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      await swal('Error', 'Quantity must be greater than 0.', 'error');
      return;
    }
    if (priceNumRaw !== null && (!Number.isFinite(priceNumRaw) || priceNumRaw < 0)) {
      await swal('Error', 'Price must be a valid non-negative number (or left blank).', 'error');
      return;
    }

    await fetch(`/api/shopping-list-item/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        name,
        quantity: quantityNum,
        unit: String(form.unit ?? '').trim() || null,
        price: priceNumRaw,
        customThreshold:
          form.restockTrigger === 'custom'
            ? Number(form.customThreshold)
            : null,
      }),
    });

    onHide();
    window.location.reload();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Item</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* NAME */}
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </Form.Group>

          {/* QTY + UNIT */}
          <Row className="mt-3">
            <Col>
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
              />
            </Col>

            <Col>
              <Form.Label>Unit</Form.Label>
              <Form.Select
                value={unitChoice}
                onChange={(e) => {
                  const { value } = e.target;
                  setUnitChoice(value);
                  setForm((prev) => ({ ...prev, unit: value === 'Other' ? '' : value }));
                }}
              >
                <option value="">—</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Form.Select>
              {unitChoice === 'Other' && (
                <Form.Control
                  className="mt-2"
                  name="unit"
                  placeholder="Enter custom unit"
                  value={form.unit}
                  onChange={handleChange}
                />
              )}
            </Col>
          </Row>

          {/* PRICE */}
          <Form.Group className="mt-3">
            <Form.Label>Price</Form.Label>
            <Form.Control
              name="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="(optional)"
              value={form.price}
              onChange={handleChange}
            />
          </Form.Group>

          {/* RESTOCK DROPDOWN */}
          <Form.Group className="mt-3">
            <Form.Label>Restock When</Form.Label>
            <Form.Select
              name="restockTrigger"
              value={form.restockTrigger}
              onChange={handleChange}
            >
              <option value="empty">When empty</option>
              <option value="half">When half gone</option>
              <option value="custom">Custom % left</option>
            </Form.Select>

            {form.restockTrigger === 'custom' && (
              <Form.Control
                className="mt-2"
                name="customThreshold"
                type="number"
                placeholder="% left"
                value={form.customThreshold}
                onChange={handleChange}
              />
            )}
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          style={{ backgroundColor: 'var(--fern-green)' }}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
