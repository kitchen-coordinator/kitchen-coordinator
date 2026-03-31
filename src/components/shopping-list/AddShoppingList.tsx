'use client';

import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import swal from 'sweetalert';
import { AddShoppingListSchema } from '@/lib/validationSchemas';
import { addShoppingList } from '@/lib/dbActions';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  show: boolean;
  onHide: () => void;
  owner: string;
}

type FormValues = {
  name: string;
  owner: string;
  deadline?: string | null;
  location?: string | null;
  budgetLimit?: number | null;
};

export default function AddShoppingList({ show, onHide, owner }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(AddShoppingListSchema),
    defaultValues: {
      name: '',
      owner,
      deadline: '',
      location: '',
      budgetLimit: null,
    },
  });

  useEffect(() => {
    if (!show) reset();
  }, [show, reset]);

  // Keep the hidden owner field in sync with session email.
  useEffect(() => {
    if (show) setValue('owner', owner ?? '', { shouldValidate: true });
  }, [owner, setValue, show]);
  const router = useRouter();
  const onSubmit = async (data: FormValues) => {
    try {
      await addShoppingList({
        name: data.name.trim(),
        owner: data.owner,
      });

      swal('Success', 'Shopping list created!', 'success', { timer: 2000 });
      router.refresh();
      onHide();
    } catch (err: any) {
      console.error(err);
      swal('Error', err?.message || 'Failed to create shopping list', 'error');
    }
  };

  // TODO: Refactor to add the following fields:
  /**
  - Deadline
  - Store/Location
  - Budget
  !!! USER WILL ADD ITEMS IN THE OTHER MODAL !!!
  */

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>New Shopping List</Modal.Title>
      </Modal.Header>

      <Modal.Body>

        {/* Form Fields */}
        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
          {/* List Name */}
          <Form.Group className="mb-3">
            <Form.Label>List Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="ex. Weekly Groceries"
              {...register('name')}
              className={`${errors.name ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.name?.message}</div>
          </Form.Group>

          {/* Deadline */}
          <Form.Group className="mb-3">
            <Form.Label>Deadline</Form.Label>
            <Form.Control
              type="date"
              {...register('deadline')}
              className={`${errors.deadline ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.deadline?.message}</div>
          </Form.Group>

          {/* Location */}
          <Form.Group className="mb-3">
            <Form.Label>Store / Location</Form.Label>
            <Form.Control
              type="text"
              placeholder="ex. Walmart"
              {...register('location')}
              className={`${errors.location ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.location?.message}</div>
          </Form.Group>

          {/* Budget */}
          <Form.Group className="mb-3">
            <Form.Label>Budget Limit</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              placeholder="ex. $50.00"
              {...register('budgetLimit', { valueAsNumber: true })}
              className={`${errors.budgetLimit ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.budgetLimit?.message}</div>
          </Form.Group>

          {/* OWNER HIDDEN */}
          <input type="hidden" {...register('owner')} />

          {/* Buttons */}
          <Row className="pt-3">
            <Col>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--fern-green)' }}
                className="btn-submit"
              >
                {isSubmitting ? 'Creating…' : 'Create'}
              </Button>
            </Col>
            <Col>
              <Button
                type="button"
                onClick={() => reset()}
                variant="warning"
                className="btn-reset"
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
