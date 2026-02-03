'use client';

import { Button, Col, Form, Modal, Row, InputGroup, Offcanvas } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import swal from 'sweetalert';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AddShoppingListItemSchema } from '@/lib/validationSchemas';
import { addShoppingListItem } from '@/lib/dbActions';

// ------- types -------
type SL = { id: number; name: string };

type AddItemValues = {
  name: string;
  quantity: number;
  shoppingListId: number;
  price?: number | null;
  unit?: string;
};

interface Props {
  show: boolean;
  onHide: () => void;
  shoppingLists: SL[];
  sidePanel: boolean;
  prefillName: string;
}

const AddToShoppingListModal = ({
  show,
  onHide,
  shoppingLists,
  sidePanel = false,
  prefillName,
}: Props) => {
  const router = useRouter();
  const { data: session } = useSession();
  const owner = session?.user?.email;

  // list of units
  const unitOptions = useMemo(
    () => ['kg', 'g', 'lb', 'oz', 'pcs', 'ml', 'l', 'Other'],
    [],
  );
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddItemValues>({
    resolver: yupResolver(AddShoppingListItemSchema),
    defaultValues: {
      name: prefillName,
      quantity: 1,
      unit: 'kg',
      price: undefined,
      shoppingListId: shoppingLists[0]?.id ?? 0,
    },
  });
  const selectedUnit = watch('unit');

  useEffect(() => {
    if (selectedUnit === 'Other') {
      setShowCustomUnit(true);
    } else {
      setShowCustomUnit(false);
    }
  }, [selectedUnit]);

  useEffect(() => {
    if (!show) {
      reset({ name: prefillName, quantity: 1, price: undefined, unit: 'kg' });
      setShowCustomUnit(false);
    }
  }, [show, reset, prefillName]);

  const handleClose = () => {
    reset({ name: prefillName });
    onHide();
  };

  const onSubmit = async (data: AddItemValues) => {
    if (!owner) {
      swal('Error', 'You must be signed in...', 'error');
      return;
    }

    try {
      await addShoppingListItem({
        name: data.name.trim(),
        quantity: Number(data.quantity),
        unit: data.unit === 'Other' ? '' : data.unit || '',
        price: data.price ?? 0,
        shoppingListId: Number(data.shoppingListId),
      });

      swal('Success', 'Item added...', 'success', { timer: 2000 });
      handleClose();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      swal('Error', err?.message || 'Something went wrong', 'error');
    }
  };

  const formContent = (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Row className="mb-3">
        <Col xs={6}>
          <Form.Group>
            <Form.Label>Item Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Bananas"
              {...register('name')}
              className={`${errors.name ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.name?.message}</div>
          </Form.Group>
        </Col>

        <Col xs={2}>
          <Form.Group>
            <Form.Label>Qty</Form.Label>
            <Form.Control
              type="number"
              min={1}
              {...register('quantity')}
              className={`${errors.quantity ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.quantity?.message}</div>
          </Form.Group>
        </Col>
        <Col xs={4}>
          <Form.Group>
            <Form.Label>Unit</Form.Label>
            {!showCustomUnit ? (
              <Form.Select {...register('unit')}>
                {unitOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Form.Select>
            ) : (
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Enter unit..."
                  {...register('unit')}
                  autoFocus
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setValue('unit', 'kg');
                    setShowCustomUnit(false);
                  }}
                >
                  ✕
                </Button>
              </InputGroup>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs={5}>
          <Form.Group>
            <Form.Label>Price (optional)</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.05"
                min="0"
                {...register('price')}
                className={`${errors.price ? 'is-invalid' : ''}`}
              />
            </InputGroup>
            <div className="text-danger" style={{ fontSize: '0.875em' }}>
              {errors.price?.message}
            </div>
          </Form.Group>
        </Col>

        <Col xs={7}>
          <Form.Group>
            <Form.Label>List</Form.Label>
            <Form.Select
              {...register('shoppingListId')}
              defaultValue={shoppingLists[0]?.id ?? ''}
            >
              <option value="">Choose a list…</option>
              {shoppingLists.map((sl) => (
                <option key={sl.id} value={sl.id}>
                  {sl.name}
                </option>
              ))}
            </Form.Select>
            <div className="text-danger" style={{ fontSize: '0.875em' }}>
              {errors.shoppingListId?.message}
            </div>
          </Form.Group>
        </Col>
      </Row>

      <Row className="pt-3">
        <Col>
          <Button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Submit'}
          </Button>
        </Col>
        <Col>
          <Button
            type="button"
            onClick={() => {
              reset({ name: prefillName, quantity: 1, price: undefined, unit: 'kg' });
              setShowCustomUnit(false);
            }}
            variant="warning"
            className="btn-reset"
          >
            Reset
          </Button>
        </Col>
      </Row>
    </Form>
  );

  return !sidePanel ? (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header className="justify-content-center">
        <Modal.Title>Add Shopping List Item</Modal.Title>
      </Modal.Header>
      <Modal.Body>{formContent}</Modal.Body>
    </Modal>
  ) : (
    <Offcanvas show={show} onHide={onHide} placement="end" backdrop={false}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Add Shopping List Item</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>{formContent}</Offcanvas.Body>
    </Offcanvas>
  );
};

export default AddToShoppingListModal;
