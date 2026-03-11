/* eslint-disable react/jsx-one-expression-per-line */
import swal from 'sweetalert';
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import { ProduceRelations } from '@/types/ProduceRelations';
import AddToShoppingListModal from '@/components/shopping-list/AddToShoppingListModal';
import EditProduceModal from './EditProduceModal';
import '../../styles/buttons.css';
import DeleteProduceModal from './DeleteProduceModal';

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
}: ProduceRelations & { restockThreshold?: number; shoppingLists: any[] }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);

  const safeRestock = restockThreshold ?? 1;

  const handleAddToShoppingList = () => {
    if (addingToList) return;
    if (!shoppingLists || shoppingLists.length === 0) {
      swal('No shopping lists', 'Create a shopping list first, then try again.', 'warning');
      return;
    }
    setAddingToList(true);
    setShowAddToListModal(true);
  };

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
          <Button
            variant="success"
            size="sm"
            className="ms-auto btn-submit"
            onClick={handleAddToShoppingList}
            disabled={addingToList}
          >
            {addingToList ? 'Adding…' : '+'}
          </Button>
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
        }}
      />

      {/* Add to Shopping List modal */}
      {showAddToListModal && (
        <AddToShoppingListModal
          show={showAddToListModal}
          onHide={() => {
            setShowAddToListModal(false);
            setAddingToList(false);
          }}
          shoppingLists={shoppingLists}
          sidePanel={false}
          prefillName={name}
        />
      )}
    </>
  );
};

export default ProduceItem;
