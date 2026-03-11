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
  price?: number | string | null;
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

  const unitOptions = useMemo(
    () => ['kg', 'g', 'lb', 'oz', 'pcs', 'ml', 'l', 'Other'],
    [],
  );
  const [unitChoice, setUnitChoice] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddItemValues>({
    resolver: yupResolver(AddShoppingListItemSchema),
    defaultValues: {
      name: prefillName,
      quantity: 0,
      unit: '',
      price: null,
      shoppingListId: shoppingLists[0]?.id ?? 0,
    },
  });

  useEffect(() => {
    if (!show) {
      reset({ name: prefillName, price: null, unit: '' });
      setUnitChoice('');
    } else if (prefillName) {
      setValue('name', prefillName, { shouldValidate: true });
    }
  }, [show, reset, prefillName, setValue]);

  const handleClose = () => {
    reset({ name: prefillName, price: null, unit: '' });
    setUnitChoice('');
    onHide();
  };

  const onSubmit = async (data: AddItemValues) => {
    if (!owner) {
      swal('Error', 'You must be signed in to add to your shopping list.', 'error');
      return;
    }

    try {
      const priceNum = data.price === '' || data.price === null || typeof data.price === 'undefined'
        ? undefined
        : Number(data.price);

      await addShoppingListItem({
        name: data.name.trim(),
        quantity: Number(data.quantity),
        unit: data.unit?.trim() ? data.unit.trim() : '',
        price: Number.isFinite(priceNum as number) ? (priceNum as number) : undefined,
        shoppingListId: Number(data.shoppingListId),
      });

      swal('Success', 'Item added to your shopping list', 'success', { timer: 2000 });
      handleClose();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      swal('Error', err?.message || 'Something went wrong', 'error');
    }
  };

  const unitValue = watch('unit') ?? '';

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

        <Col xs={3}>
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

        <Col xs={3}>
          <Form.Group>
            <Form.Label>Unit</Form.Label>
            {/* keep RHF field registered even when using a controlled select */}
            <input type="hidden" {...register('unit')} />
            <Form.Select
              value={unitChoice}
              onChange={(e) => {
                const { value } = e.target;
                setUnitChoice(value);
                setValue('unit', value === 'Other' ? '' : value, { shouldValidate: true });
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
                type="text"
                placeholder="Enter custom unit"
                value={unitValue}
                onChange={(e) => setValue('unit', e.target.value, { shouldValidate: true })}
              />
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
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="e.g., 3.99"
                {...register('price')}
                className={`${errors.price ? 'is-invalid' : ''}`}
              />
            </InputGroup>
            <div className="invalid-feedback">{errors.price?.message}</div>
          </Form.Group>
        </Col>

        <Col xs={7}>
          <Form.Group>
            <Form.Label>List</Form.Label>
            <Form.Select
              {...register('shoppingListId', { valueAsNumber: true })}
              defaultValue={shoppingLists[0]?.id ?? ''}
            >
              <option value="">Choose a list…</option>
              {shoppingLists.map((sl) => (
                <option key={sl.id} value={sl.id}>
                  {sl.name}
                </option>
              ))}
            </Form.Select>
            <div className="invalid-feedback">{errors.shoppingListId?.message}</div>
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
              reset({ name: prefillName, price: null, unit: '' });
              setUnitChoice('');
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
