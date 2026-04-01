'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Modal,
  InputGroup,
  Image as RBImage,
} from 'react-bootstrap';
import {
  PencilSquare, X, Tag, Grid, GeoAlt,
  Archive, Stack, Rulers, ArrowRepeat, Calendar,
} from 'react-bootstrap-icons';
import { useForm } from 'react-hook-form';
import swal from 'sweetalert';
import { yupResolver } from '@hookform/resolvers/yup';
import { EditProduceSchema } from '@/lib/validationSchemas';
import { editProduce } from '@/lib/dbActions';
import type { InferType } from 'yup';
import { useRouter } from 'next/navigation';
import ImagePickerModal from '@/components/images/ImagePickerModal';
import '../../styles/buttons.css';
import { ProduceRelations } from '@/types/ProduceRelations';
import { getPantryDisplayAmount } from '@/lib/displayUnits';

function mapProduceToFormValues(produce: ProduceRelations) {
  const display = getPantryDisplayAmount(produce);

  return {
    id: produce.id,
    name: produce.name,
    type: produce.type,
    quantity: display.quantity,
    unit: display.unit,
    owner: produce.owner,
    image: produce.image ?? '',
    restockThreshold: produce.restockThreshold ?? null,
    commonItemId: produce.commonItemId ?? null,
    expiration: produce.expiration
      ? new Date(produce.expiration).toISOString().split('T')[0]
      : null,
    location: produce.location?.name || '',
    storage: produce.storage?.name || '',
  };
}

type ProduceValues =
  Omit<InferType<typeof EditProduceSchema>, 'expiration'> & {
    expiration: string | null;
  };

interface EditProduceModalProps {
  show: boolean;
  onHide: () => void;
  produce: ProduceRelations & { restockThreshold?: number | null };
}

function FieldRow({
  fieldKey,
  label,
  displayValue,
  editingField,
  setEditingField,
  icon,
  children,
}: {
  fieldKey: string;
  label: string;
  displayValue: string;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const isEditing = editingField === fieldKey;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
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
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
        {isEditing ? (
          <div style={{ marginTop: 4 }}>{children}</div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 2 }}>
            {displayValue || '—'}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {isEditing ? (
          <X
            size={20}
            style={{
              cursor: 'pointer',
              color: '#888',
            }}
            onClick={() => setEditingField(null)}
          />
        ) : (
          <PencilSquare
            size={16}
            style={{
              cursor: 'pointer',
              color: '#888',
            }}
            onClick={() => setEditingField(fieldKey)}
          />
        )}
      </div>
    </div>
  );
}

export default function EditProduceModal({ show, onHide, produce }: EditProduceModalProps) {
  const router = useRouter();

  const [locations, setLocations] = useState<string[]>(
    () => (produce.location?.name ? [produce.location.name] : []),
  );

  const [storageOptions, setStorageOptions] = useState<string[]>(
    () => (produce.storage?.name ? [produce.storage.name] : []),
  );

  const [selectedLocation, setSelectedLocation] = useState(produce.location?.name || '');
  const [selectedStorage, setSelectedStorage] = useState(produce.storage?.name || '');

  const unitOptions = useMemo(
    () => ['kg', 'g', 'lb', 'oz', 'pcs', 'ml', 'l', 'Other'],
    [],
  );

  const { unit: initialUnit } = getPantryDisplayAmount(produce);

  const [unitChoice, setUnitChoice] = useState(
    unitOptions.includes(initialUnit) ? initialUnit : 'Other',
  );

  const [showPicker, setShowPicker] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProduceValues>({
    resolver: yupResolver(EditProduceSchema) as any,
    defaultValues: { ...mapProduceToFormValues(produce) },
  });

  const imageVal = watch('image') || '';
  const watchedValues = watch();
  const itemImage = imageVal || produce.image || '/no-image.png';

  const fetchStorage = useCallback(
    async (location: string) => {
      if (!produce?.owner || !location) return;
      const res = await fetch(
        `/api/produce/${produce.id}/storage?owner=${produce.owner}&location=${encodeURIComponent(location)}`,
      );
      if (!res.ok) return;
      const data: string[] = await res.json();
      setStorageOptions((prev) => Array.from(new Set([...prev, ...data])));

      if (data.length === 1) {
        setSelectedStorage(data[0]);
        setValue('storage', data[0]);
      }
    },
    [produce?.id, produce?.owner, setValue],
  );

  useEffect(() => {
    if (show) {
      reset(mapProduceToFormValues(produce));
      setSelectedLocation(produce.location?.name || '');
      setSelectedStorage(produce.storage?.name || '');

      const { unit: unitToUse } = getPantryDisplayAmount(produce);
      setUnitChoice(unitOptions.includes(unitToUse) ? unitToUse : 'Other');

      const fetchLocations = async () => {
        const res = await fetch(`/api/produce/${produce.id}/locations?owner=${produce.owner}`);
        if (!res.ok) return;
        const data: string[] = await res.json();
        setLocations((prev) => Array.from(new Set([...prev, ...data])));
      };
      fetchLocations();

      if (produce.location?.name) {
        fetchStorage(produce.location.name);
      }
    }
  }, [show, produce, reset, unitOptions, fetchStorage]);

  const handleClose = () => {
    reset(mapProduceToFormValues(produce));
    setEditingField(null);
    onHide();
  };

  const onSubmit = async (data: ProduceValues) => {
    try {
      await editProduce({
        ...data,
        expiration: data.expiration ? new Date(data.expiration) : null,
        image: data.image === '' ? null : data.image,
        restockThreshold: data.restockThreshold
          ? Number(data.restockThreshold)
          : 0,
        commonItemId: data.commonItemId ?? null,
      });

      swal('Success', 'Your item has been updated', 'success', { timer: 2000 });
      handleClose();
      router.refresh();
    } catch (err) {
      swal('Error', 'Failed to update item', 'error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <div
        style={{
          backgroundColor: 'var(--fern-green)',
          borderRadius: '8px 8px 0 0',
          padding: '20px 24px',
        }}
      >
        <h5 style={{ color: 'white', margin: 0, fontWeight: 700 }}>Edit Pantry Item</h5>
        <small style={{ color: 'rgba(255,255,255,0.75)' }}>{produce.name}</small>
      </div>

      <Modal.Body style={{ padding: '0 24px 24px' }}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register('id')} value={produce.id} />
          <input type="hidden" {...register('owner')} value={produce.owner} />
          <input
            type="hidden"
            {...register('commonItemId', { valueAsNumber: true })}
            value={produce.commonItemId ?? ''}
          />

          <FieldRow
            fieldKey="image"
            label="Image"
            displayValue={imageVal ? 'Image set' : 'No image'}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={(
              <RBImage
                src={itemImage}
                alt={produce.name}
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10 }}
              />
            )}
          >
            <InputGroup>
              <Form.Control
                type="text"
                {...register('image')}
                placeholder="URL"
                isInvalid={!!errors.image}
              />
              <Button
                variant="outline-secondary"
                type="button"
                style={{ zIndex: 99 }}
                onClick={() => setShowPicker(true)}
              >
                Pick
              </Button>
            </InputGroup>
          </FieldRow>

          <FieldRow
            fieldKey="name"
            label="Name"
            displayValue={watchedValues.name}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<Tag color="white" size={20} />}
          >
            <Form.Control type="text" {...register('name')} placeholder="e.g., Chicken" isInvalid={!!errors.name} />
          </FieldRow>

          <FieldRow
            fieldKey="type"
            label="Type"
            displayValue={watchedValues.type}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<Grid color="white" size={20} />}
          >
            <Form.Control type="text" {...register('type')} placeholder="e.g., Meat" isInvalid={!!errors.type} />
          </FieldRow>

          <FieldRow
            fieldKey="location"
            label="Location"
            displayValue={selectedLocation}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<GeoAlt color="white" size={20} />}
          >
            <Form.Select
              value={selectedLocation}
              required
              className={errors.location ? 'is-invalid' : ''}
              onChange={async (e) => {
                const { value } = e.target;
                setSelectedLocation(value);
                if (value === 'Add Location') {
                  setValue('location', '');
                  setStorageOptions([]);
                  setSelectedStorage('Add Storage');
                  setValue('storage', '');
                } else {
                  setValue('location', value);
                  await fetchStorage(value);
                }
              }}
            >
              <option value="" disabled>Select...</option>
              {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              <option value="Add Location">+ Add Location</option>
            </Form.Select>
            {selectedLocation === 'Add Location' && (
              <Form.Control
                type="text"
                placeholder="New location"
                className="mt-2"
                {...register('location', { required: true })}
                onChange={(e) => setValue('location', e.target.value)}
                required
              />
            )}
          </FieldRow>

          <FieldRow
            fieldKey="storage"
            label="Storage"
            displayValue={selectedStorage}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<Archive color="white" size={20} />}
          >
            <Form.Select
              value={selectedStorage}
              required
              className={errors.storage ? 'is-invalid' : ''}
              onChange={(e) => {
                const { value } = e.target;
                setSelectedStorage(value);
                setValue('storage', value === 'Add Storage' ? '' : value);
              }}
            >
              <option value="" disabled>Select...</option>
              {storageOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="Add Storage">+ Add Storage</option>
            </Form.Select>
            {selectedStorage === 'Add Storage' && (
              <Form.Control
                type="text"
                placeholder="New storage"
                className="mt-2"
                {...register('storage', { required: true })}
                onChange={(e) => setValue('storage', e.target.value)}
                required
              />
            )}
          </FieldRow>

          <FieldRow
            fieldKey="quantity"
            label="Quantity"
            displayValue={`${watchedValues.quantity ?? ''} ${watchedValues.unit ?? ''}`}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<Stack color="white" size={20} />}
          >
            <Form.Control
              type="number"
              step={0.125}
              {...register('quantity')}
              placeholder="e.g., 1"
              isInvalid={!!errors.quantity}
            />
          </FieldRow>

          <FieldRow
            fieldKey="unit"
            label="Unit"
            displayValue={unitChoice}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<Rulers color="white" size={20} />}
          >
            <>
              <Form.Select
                value={unitChoice}
                isInvalid={!!errors.unit}
                onChange={(e) => {
                  setUnitChoice(e.target.value);
                  setValue('unit', e.target.value !== 'Other' ? e.target.value : '');
                }}
              >
                {unitOptions.map((u) => <option key={u}>{u}</option>)}
              </Form.Select>
              {unitChoice === 'Other' && (
                <Form.Control
                  type="text"
                  {...register('unit')}
                  placeholder="Custom unit"
                  required
                  className="mt-2"
                  isInvalid={!!errors.unit}
                />
              )}
            </>
          </FieldRow>

          <FieldRow
            fieldKey="restockThreshold"
            label="Restock Threshold"
            displayValue={String(watchedValues.restockThreshold ?? '—')}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<ArrowRepeat color="white" size={20} />}
          >
            <Form.Control
              type="number"
              step={0.5}
              {...register('restockThreshold')}
              placeholder="e.g., 0.5"
              isInvalid={!!errors.restockThreshold}
            />
          </FieldRow>

          <FieldRow
            fieldKey="expiration"
            label="Expiration Date"
            displayValue={watchedValues.expiration ?? '—'}
            editingField={editingField}
            setEditingField={setEditingField}
            icon={<Calendar color="white" size={20} />}
          >
            <Form.Control
              type="date"
              {...register('expiration')}
              isInvalid={!!errors.expiration}
            />
          </FieldRow>

          <div className="d-flex gap-2 mt-4">
            <Button type="submit" className="btn-submit flex-fill">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="warning"
              onClick={() => reset(mapProduceToFormValues(produce))}
              className="btn-reset flex-fill"
            >
              Reset
            </Button>
          </div>
        </Form>
      </Modal.Body>

      <ImagePickerModal
        show={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(url) => {
          setValue('image', url, { shouldValidate: true, shouldDirty: true });
        }}
      />
    </Modal>
  );
}
