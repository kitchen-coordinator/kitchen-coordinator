/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Modal,
  Row,
  InputGroup,
  Image as RBImage,
} from 'react-bootstrap';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import swal from 'sweetalert';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddProduceSchema } from '@/lib/validationSchemas';
import { addProduce } from '@/lib/dbActions';
import { useRouter } from 'next/navigation';
import ImagePickerModal from '@/components/images/ImagePickerModal';
import BarcodeScanner from './BarcodeScanner';
import CommonItemModal from './CommonItemModal';
import '../../styles/buttons.css';

type ProduceValues = {
  id: number;
  name: string;
  type: string;
  location: string;
  storage: string;
  quantity: number;
  unit: string;
  expiration: string | null;
  owner: string;
  image: string;
  restockThreshold: number | null;
  commonItemId: number | null;
};

type CommonItemOption = {
  id: number;
  name: string;
  displayUnit: string;
  normalizedQuantityPerUnit: number;
  normalizedUnit: string;
};

interface AddProduceModalProps {
  show: boolean;
  onHide: () => void;
  produce?: {
    id?: number;
    name?: string;
    type?: string;
    location?: string;
    storage?: string;
    quantity?: number;
    unit?: string;
    displayQuantity?: number | null;
    displayUnit?: string | null;
    expiration?: Date | string | null;
    owner?: string;
    image?: string | null;
    restockThreshold?: number | null;
    commonItemId?: number | null;
  };
}

function mapProduceToFormValues(produce?: AddProduceModalProps['produce']) {
  return {
    id: produce?.id ?? 0,
    name: produce?.name ?? '',
    type: produce?.type ?? '',
    location: produce?.location ?? '',
    storage: produce?.storage ?? '',
    quantity: produce?.displayQuantity ?? produce?.quantity ?? undefined,
    unit: produce?.displayUnit ?? produce?.unit ?? '',
    expiration: produce?.expiration
      ? new Date(produce.expiration).toISOString().split('T')[0]
      : null,
    owner: produce?.owner ?? '',
    image: produce?.image ?? '',
    restockThreshold: produce?.restockThreshold ?? null,
    commonItemId: produce?.commonItemId ?? null,
  };
}

export default function AddProduceModal({ show, onHide, produce }: AddProduceModalProps) {
  const [locations, setLocations] = useState<string[]>([]);
  const [storageOptions, setStorageOptions] = useState<string[]>([]);
  const [commonItems, setCommonItems] = useState<CommonItemOption[]>([]);
  const [showCommonItemModal, setShowCommonItemModal] = useState(false);
  const [selectedCommonItemId, setSelectedCommonItemId] = useState('');

  const unitOptions = useMemo(() => ['kg', 'g', 'lb', 'oz', 'pcs', 'ml', 'l', 'Other'], []);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProduceValues>({
    resolver: yupResolver(AddProduceSchema) as unknown as Resolver<ProduceValues>,
    defaultValues: mapProduceToFormValues(produce),
  });

  const imageVal = watch('image') || '';
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [unitChoice, setUnitChoice] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [imageAlt, setImageAlt] = useState('');

  const selectedCommonItem = commonItems.find((item) => String(item.id) === selectedCommonItemId);

  const fetchStorage = useCallback(
    async (location: string) => {
      if (!produce?.owner || !location) return;

      const res = await fetch(
        `/api/produce/${produce?.id ?? 0}/storage?owner=${produce.owner}&location=${encodeURIComponent(location)}`,
      );

      if (!res.ok) return;

      const data = await res.json();
      setStorageOptions(data);

      if (data.length === 1) {
        setSelectedStorage(data[0]);
        setValue('storage', data[0]);
      }
    },
    [produce?.owner, produce?.id, setValue],
  );

  useEffect(() => {
    if (!show) return;

    const formValues = mapProduceToFormValues(produce);
    reset(formValues);

    setSelectedLocation(formValues.location);
    setSelectedStorage(formValues.storage);
    setSelectedCommonItemId(formValues.commonItemId ? String(formValues.commonItemId) : '');

    setUnitChoice(
      formValues.unit && unitOptions.includes(formValues.unit)
        ? formValues.unit
        : formValues.unit
          ? 'Other'
          : '',
    );

    const fetchModalData = async () => {
      if (!produce?.owner) return;

      const [locationsRes, commonItemsRes] = await Promise.all([
        fetch(`/api/produce/${produce?.id ?? 0}/locations?owner=${produce.owner}`),
        fetch(`/api/common-items?owner=${encodeURIComponent(produce.owner)}`),
      ]);

      if (locationsRes.ok) {
        const locationData = await locationsRes.json();
        setLocations(locationData);
      }

      if (commonItemsRes.ok) {
        const commonItemData = await commonItemsRes.json();
        setCommonItems(commonItemData);
      }
    };

    fetchModalData();

    if (formValues.location) {
      fetchStorage(formValues.location);
    }
  }, [show, produce, reset, fetchStorage, unitOptions]);

  const handleClose = () => {
    reset(mapProduceToFormValues(produce));
    setSelectedLocation('');
    setSelectedStorage('');
    setStorageOptions([]);
    setSelectedCommonItemId('');
    setUnitChoice('');
    setShowScanner(false);
    setShowPicker(false);
    onHide();
  };

  const handleLocationChange = async (value: string) => {
    setSelectedLocation(value);
    setValue('location', value);
    setSelectedStorage('');
    setValue('storage', '');
    await fetchStorage(value);
  };

  const onSubmit: SubmitHandler<ProduceValues> = async (data) => {
    try {
      await addProduce({
        name: data.name,
        type: data.type,
        location: data.location,
        storage: data.storage,
        quantity: Number(data.quantity),
        unit: data.unit,
        expiration: data.expiration,
        owner: data.owner,
        image: data.image || null,
        restockThreshold:
          data.restockThreshold == null || Number.isNaN(Number(data.restockThreshold))
            ? undefined
            : Number(data.restockThreshold),
        commonItemId: data.commonItemId ? Number(data.commonItemId) : null,
      });

      await swal('Success', 'Item added successfully.', 'success');
      handleClose();
      router.refresh();
    } catch (error) {
      await swal(
        'Error',
        error instanceof Error ? error.message : 'Failed to add item',
        'error',
      );
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Pantry Item</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <input type="hidden" {...register('owner')} />
            <input
              type="hidden"
              {...register('commonItemId', { valueAsNumber: true })}
              value={selectedCommonItemId || ''}
            />

            <Row className="mb-3">
              <Col xs={8}>
                <Form.Group>
                  <Form.Label className="mb-0">Common Item</Form.Label>
                  <Form.Select
                    value={selectedCommonItemId}
                    onChange={(e) => {
                      const { value } = e.target;
                      setSelectedCommonItemId(value);

                      if (!value) {
                        setValue('commonItemId', null);
                        return;
                      }

                      const item = commonItems.find((entry) => String(entry.id) === value);
                      if (!item) return;

                      setValue('commonItemId', Number(item.id));
                      setValue('unit', item.displayUnit);

                      if (unitOptions.includes(item.displayUnit)) {
                        setUnitChoice(item.displayUnit);
                      } else {
                        setUnitChoice('Other');
                      }
                    }}
                  >
                    <option value="">None (save item as entered)</option>
                    {commonItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {' '}
                        (1
                        {' '}
                        {item.displayUnit}
                        {' '}
                        =
                        {' '}
                        {item.normalizedQuantityPerUnit}
                        {' '}
                        {item.normalizedUnit}
                        )
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Optional helper for items like flour, rice, cans, or bottles. Recipes will use the converted amount.
                  </Form.Text>
                  {selectedCommonItem && (
                    <Form.Text className="d-block text-muted mt-1">
                      Enter quantity in
                      {' '}
                      <strong>{selectedCommonItem.displayUnit}</strong>
                      {' '}
                      so the pantry item can be converted correctly.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col xs={4} className="d-flex align-items-end">
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => setShowCommonItemModal(true)}
                >
                  Save Current as Common
                </Button>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" {...register('name')} isInvalid={!!errors.name} />
                  <Form.Control.Feedback type="invalid">
                    {errors.name?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Control type="text" {...register('type')} isInvalid={!!errors.type} />
                  <Form.Control.Feedback type="invalid">
                    {errors.type?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.125"
                    {...register('quantity', { valueAsNumber: true })}
                    isInvalid={!!errors.quantity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.quantity?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Unit</Form.Label>
                  <Form.Select
                    value={unitChoice}
                    onChange={(e) => {
                      const { value } = e.target;
                      setUnitChoice(value);

                      if (value !== 'Other') {
                        setValue('unit', value);
                      } else {
                        setValue('unit', '');
                      }
                    }}
                    isInvalid={!!errors.unit}
                  >
                    <option value="">Select unit...</option>
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.unit?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                {unitChoice === 'Other' && (
                  <Form.Group>
                    <Form.Label>Custom Unit</Form.Label>
                    <Form.Control type="text" {...register('unit')} isInvalid={!!errors.unit} />
                    <Form.Control.Feedback type="invalid">
                      {errors.unit?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Expiration</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('expiration')}
                    isInvalid={!!errors.expiration}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.expiration?.message as string}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Restock Threshold</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.125"
                    {...register('restockThreshold', { valueAsNumber: true })}
                    isInvalid={!!errors.restockThreshold}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.restockThreshold?.message as string}
                  </Form.Control.Feedback>
                  {selectedCommonItem && (
                    <Form.Text className="text-muted">
                      Threshold will be converted using the same common item rule.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location</Form.Label>
                  <Form.Select
                    value={selectedLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    isInvalid={!!errors.location}
                  >
                    <option value="">Select location...</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.location?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Storage</Form.Label>
                  <Form.Select
                    value={selectedStorage}
                    onChange={(e) => {
                      setSelectedStorage(e.target.value);
                      setValue('storage', e.target.value);
                    }}
                    isInvalid={!!errors.storage}
                  >
                    <option value="">Select storage...</option>
                    {storageOptions.map((storage) => (
                      <option key={storage} value={storage}>
                        {storage}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.storage?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Image</Form.Label>
                  <InputGroup>
                    <Form.Control type="text" placeholder="Image URL" {...register('image')} />
                    <Button type="button" variant="outline-secondary" onClick={() => setShowPicker(true)}>
                      Pick Image
                    </Button>
                    <Button type="button" variant="outline-secondary" onClick={() => setShowScanner(true)}>
                      Scan Barcode
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            {imageVal && (
              <Row className="mb-3">
                <Col md={12} className="text-center">
                  <RBImage
                    src={imageVal}
                    alt={imageAlt || watch('name') || 'Produce image'}
                    thumbnail
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                  />
                </Col>
              </Row>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Add Item
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <CommonItemModal
        show={showCommonItemModal}
        onHide={() => setShowCommonItemModal(false)}
        owner={produce?.owner ?? ''}
        initialValues={{
          name: watch('name'),
          unit: watch('unit') || '',
        }}
        onCreated={(item) => {
          setCommonItems((prev) => [...prev, item].sort((a, b) => {
            const nameCompare = a.name.localeCompare(b.name);
            if (nameCompare !== 0) return nameCompare;
            return a.displayUnit.localeCompare(b.displayUnit);
          }));
          setSelectedCommonItemId(String(item.id));
          setValue('commonItemId', item.id);
          setValue('unit', item.displayUnit);

          if (unitOptions.includes(item.displayUnit)) {
            setUnitChoice(item.displayUnit);
          } else {
            setUnitChoice('Other');
          }
        }}
      />

      <ImagePickerModal
        show={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(url: string, meta?: { alt?: string; credit?: string; source?: string }) => {
          setValue('image', url);
          setImageAlt(meta?.alt || '');
        }}
      />

      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onDetected={async (code: string) => {
            try {
              const response = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
              if (!response.ok) throw new Error('Lookup failed');

              const result = await response.json();

              if (result.name) setValue('name', result.name);
              if (result.image) setValue('image', result.image);
            } catch (error) {
              console.error('Barcode lookup failed:', error);
            } finally {
              setShowScanner(false);
            }
          }}
        />
      )}
    </>
  );
}
