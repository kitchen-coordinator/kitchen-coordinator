'use client';

import { useEffect, useMemo } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import swal from 'sweetalert';
import { CommonItemSchema } from '@/lib/validationSchemas';
import {
  COMMON_FRACTION_SUGGESTIONS,
  parseFractionInput,
} from '@/lib/fractions';

type CommonItemFormValues = {
  owner: string;
  name: string;
  displayUnit: string;
  normalizedQuantityPerUnit: string;
  normalizedUnit: string;
};

interface CommonItemModalProps {
  show: boolean;
  onHide: () => void;
  owner: string;
  // eslint-disable-next-line react/require-default-props
  initialValues?: {
    name?: string;
    unit?: string;
  };
  // eslint-disable-next-line react/require-default-props
  onCreated?: (item: any) => void;
}

function getDefaultValues(
  owner: string,
  initialValues?: { name?: string; unit?: string },
): CommonItemFormValues {
  return {
    owner,
    name: initialValues?.name ?? '',
    displayUnit: initialValues?.unit ?? '',
    normalizedQuantityPerUnit: '1',
    normalizedUnit: 'cup',
  };
}

export default function CommonItemModal({
  show,
  onHide,
  owner,
  initialValues,
  onCreated,
}: CommonItemModalProps) {
  const normalizedUnitOptions = useMemo(
    () => ['mg', 'g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz'],
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommonItemFormValues>({
    resolver: yupResolver(CommonItemSchema) as any,
    defaultValues: getDefaultValues(owner, initialValues),
  });

  useEffect(() => {
    if (show) {
      reset(getDefaultValues(owner, initialValues));
    }
  }, [show, owner, initialValues, reset]);

  const closeAndReset = () => {
    reset(getDefaultValues(owner, initialValues));
    onHide();
  };

  const onSubmit = async (data: CommonItemFormValues) => {
    const res = await fetch('/api/common-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        normalizedQuantityPerUnit: parseFractionInput(data.normalizedQuantityPerUnit),
      }),
    });

    const payload = await res.json();

    if (!res.ok) {
      await swal('Unable to save', payload.error || 'Failed to save common item', 'error');
      return;
    }

    await swal('Saved', 'Common item saved successfully.', 'success');
    onCreated?.(payload);
    closeAndReset();
  };

  return (
    <Modal show={show} onHide={closeAndReset} centered>
      <Modal.Header closeButton>
        <Modal.Title>Save Common Item</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" value={owner} {...register('owner')} />

          <Row className="mb-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" {...register('name')} isInvalid={!!errors.name} />
                <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Display Unit</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. can, bag, bottle, jar"
                  {...register('displayUnit')}
                  isInvalid={!!errors.displayUnit}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.displayUnit?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Normalized Quantity per 1 Unit</Form.Label>
                <Form.Control
                  type="text"
                  list="fraction-suggestions"
                  placeholder="e.g. 1/2, 1 1/2, 16"
                  {...register('normalizedQuantityPerUnit')}
                  isInvalid={!!errors.normalizedQuantityPerUnit}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.normalizedQuantityPerUnit?.message}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Fractions and mixed numbers are allowed.
                </Form.Text>
              </Form.Group>
            </Col>

            <Col xs={6}>
              <Form.Group>
                <Form.Label>Normalized Unit</Form.Label>
                <Form.Select {...register('normalizedUnit')} isInvalid={!!errors.normalizedUnit}>
                  {normalizedUnitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.normalizedUnit?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <datalist id="fraction-suggestions">
            {COMMON_FRACTION_SUGGESTIONS.map((value) => (
              // eslint-disable-next-line jsx-a11y/control-has-associated-label
              <option key={value} value={value} />
            ))}
          </datalist>

          <Form.Text className="text-muted">
            Example: 1 can = 2 1/3 cups, or 1 bag = 16 oz.
          </Form.Text>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
