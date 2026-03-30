/* eslint-disable react/jsx-one-expression-per-line */
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { PencilSquare, Trash, PlusLg } from 'react-bootstrap-icons';
import { ProduceRelations } from '@/types/ProduceRelations';
import EditProduceModal from './EditProduceModal';
import '../../styles/buttons.css';
import DeleteProduceModal from './DeleteProduceModal';
import AddToMultipleShoppingListsModal from '../shopping-list/AddToMultipleShoppingListsModal';

/* eslint-disable react/require-default-props */
const ProduceItem = ({
  id,
  name,
  quantity,
  unit,
  type,
  location,
  storage,
  expiration,
  owner,
  image,
  restockThreshold = 1,
  shoppingLists,
}: ProduceRelations & {
  restockThreshold?: number;
  shoppingLists: { id: number; name: string; isCompleted?: boolean }[];
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddListsModal, setShowAddListsModal] = useState(false);

  const safeRestock = restockThreshold ?? 1;

  return (
    <>
      <tr>
        <td>{name}</td>
        <td>{type}</td>
        <td>
          {(typeof storage === 'object' ? storage?.name : storage) || 'N/A'} at{' '}
          {(typeof location === 'object' ? location?.name : location) || 'N/A'}
        </td>
        <td>
          {quantity.toString()}
          {unit ? ` ${unit}` : ''}
        </td>
        <td>{safeRestock}</td>
        <td>{expiration ? new Date(expiration).toISOString().split('T')[0] : 'N/A'}</td>
        <td>
          <Button className="btn-edit" onClick={() => setShowEditModal(true)}>
            <PencilSquare color="white" size={18} />
          </Button>
        </td>
        <td>
          <Button variant="danger" className="btn-delete" onClick={() => setShowDeleteModal(true)}>
            <Trash color="white" size={18} />
          </Button>
        </td>
        <td>
          <Button className="btn-edit" onClick={() => setShowAddListsModal(true)}>
            <PlusLg color="white" size={18} />
          </Button>
          {/* <Button
            variant="success"
            size="lg"
            className="ms-auto btn-submit"
            onClick={() => setShowAddListsModal(true)}
          >
            +
          </Button> */}
        </td>
      </tr>

      {/* Edit modal */}
      <EditProduceModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        produce={{
          id,
          name,
          quantity,
          unit,
          type,
          location,
          storage,
          expiration,
          owner,
          image,
          restockThreshold: safeRestock,
          commonItemId: null,
          displayQuantity: null,
          displayUnit: null,
        }}
      />

      {/* Delete modal */}
      <DeleteProduceModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        produce={{
          id,
          name,
          quantity,
          unit,
          type,
          location,
          storage,
          expiration,
          owner,
          image,
          restockThreshold: safeRestock,
          commonItemId: null,
          displayQuantity: null,
          displayUnit: null,
        }}
      />

      <AddToMultipleShoppingListsModal
        show={showAddListsModal}
        onHide={() => setShowAddListsModal(false)}
        shoppingLists={shoppingLists}
        item={{ name, quantity: Number(quantity), unit: unit ?? null }}
      />
    </>
  );
};

export default ProduceItem;
