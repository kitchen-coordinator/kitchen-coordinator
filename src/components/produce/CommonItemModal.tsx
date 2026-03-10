'use client';

import { useEffect, useMemo } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import type { InferType } from 'yup';
import swal from 'sweetalert';
import { CommonItemSchema } from '@/lib/validationSchemas';

type CommonItemFormValues = InferType<typeof CommonItemSchema>;

interface CommonItemModalProps {
  show: boolean;
  onHide: () => void;
  owner: string;
  initialValues?: {
    name?: string;
    type?: string;
    unit?: string;
  };
  onCreated?: (item: any) => void;
}

export default function CommonItemModal({
  show,
  onHide,
  owner,
  initialValues,
  onCreated,
}: CommonItemModalProps) {
  const unitOptions = useMemo(() => ['kg', 'g', 'lb', 'oz', 'pcs', 'ml', 'l'], []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommonItemFormValues>({
    resolver: yupResolver(CommonItemSchema),
    defaultValues: {
      owner,
      name: initialValues?.name ?? '',
      type: initialValues?.type ?? '',
      defaultUnit: initialValues?.unit ?? 'pcs',
      preferredDisplayUnit: initialValues?.unit ?? 'pcs',
    },
  });

  useEffect(() => {
    if (show) {
      reset({
        owner,
        name: initialValues?.name ?? '',
        type: initialValues?.type ?? '',
        defaultUnit: initialValues?.unit ?? 'pcs',
        preferredDisplayUnit: initialValues?.unit ?? 'pcs',
      });
    }
  }, [show, owner, initialValues, reset]);

  const closeAndReset = () => {
    reset({
      owner,
      name: initialValues?.name ?? '',
      type: initialValues?.type ?? '',
      defaultUnit: initialValues?.unit ?? 'pcs',
      preferredDisplayUnit: initialValues?.unit ?? 'pcs',
    });
    onHide();
  };

  const onSubmit = async (data: CommonItemFormValues) => {
    const res = await fetch('/api/common-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
                <Form.Control
                  type="text"
                  {...register('name')}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Control
                  type="text"
                  {...register('type')}
                  isInvalid={!!errors.type}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.type?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Default Unit</Form.Label>
                <Form.Select
                  {...register('defaultUnit')}
                  isInvalid={!!errors.defaultUnit}
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.defaultUnit?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={6}>
              <Form.Group>
                <Form.Label>Preferred Display Unit</Form.Label>
                <Form.Select
                  {...register('preferredDisplayUnit')}
                  isInvalid={!!errors.preferredDisplayUnit}
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.preferredDisplayUnit?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2">
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
