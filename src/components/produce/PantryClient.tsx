'use client';

import { Button, Col, Container, Row, Nav, Modal, Toast } from 'react-bootstrap';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash } from 'react-bootstrap-icons';
import AddProduceModal from './AddProduceModal';
import ProduceListWithGrouping from './ProduceListWithGrouping';
import '../../styles/buttons.css';
import AddLocationModal from './AddLocationModal';

const PANTRY_REFRESH_INTERVAL_MS = 15000;

interface PantryClientProps {
  initialProduce: any[];
  initialLocations: string[];
  initialShoppingLists: { id: number; name: string; isCompleted?: boolean }[];
  owner: string;
}

function PantryClient({
  initialProduce,
  initialLocations,
  initialShoppingLists,
  owner,
}: PantryClientProps) {
  const router = useRouter();
  const [showAddProduceModal, setShowAddProduceModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string>('all');
  const [confirmLoc, setConfirmLoc] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>(
    () => Array.from(
      new Set(initialLocations.map((l) => l.trim().toLowerCase())),
    ).sort(),
  );

  // Refresh when user returns to this tab/page so inventory never stays stale.
  useEffect(() => {
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    window.addEventListener('focus', refreshOnVisible);
    document.addEventListener('visibilitychange', refreshOnVisible);

    return () => {
      window.removeEventListener('focus', refreshOnVisible);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [router]);

  // Keep pantry data in sync while the user stays on this page.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        router.refresh();
      }
    }, PANTRY_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [router]);

  // Filter produce based on selected location
  const filteredProduce = useMemo(() => {
    if (activeLocation === 'all') return initialProduce;
    return initialProduce.filter((p) => {
      const locName = typeof p.location === 'object' ? p.location?.name : p.location;
      return locName?.trim().toLowerCase() === activeLocation;
    });
  }, [initialProduce, activeLocation]);

  // Handle delete
  const handleDeleteLocation = async (loc: string) => {
    setConfirmLoc(loc);
  };

  const confirmDelete = async () => {
    if (!confirmLoc) return;

    try {
      const url = `/api/produce/0/locations?name=${encodeURIComponent(confirmLoc)}&owner=${encodeURIComponent(owner)}`;
      const res = await fetch(url, { method: 'DELETE' });

      if (!res.ok) {
        const errorData = await res.json();
        setToastMessage(`Failed to delete location: ${errorData.error || res.statusText}`);
        setConfirmLoc(null);
        return;
      }

      // Remove deleted location from state instead of reloading
      setLocations((prev) => prev.filter((l) => l !== confirmLoc));
      setConfirmLoc(null);
      setToastMessage(`Deleted location: ${confirmLoc}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setToastMessage('An error occurred while deleting the location.');
    } finally {
      setConfirmLoc(null);
    }
  };

  return (
    <main>
      <Container id="view-pantry" className="py-3">
        <Row className="mb-3">
          <Col className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h1>Your Pantry at a Glance</h1>
            <Button className="btn-add" onClick={() => setShowAddProduceModal(true)}>
              + Add Item
            </Button>
          </Col>
        </Row>

        {/* Tabs */}
        <Row className="mb-4">
          <Col>
            <Nav
              variant="tabs"
              activeKey={activeLocation}
              onSelect={(selectedKey) => setActiveLocation(selectedKey || 'all')}
              className="justify-content-center pantry-controls"
            >
              <Nav.Item style={{ alignItems: 'center', marginLeft: '6px' }}>
                <Nav.Link>
                  <PlusCircle
                    size={18}
                    onClick={() => setShowAddLocationModal(true)}
                    style={{ cursor: 'pointer' }}
                  />
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="all">All Locations</Nav.Link>
              </Nav.Item>

              {locations.map((loc) => (
                <Nav.Item key={loc}>
                  <div className="location-tab">
                    <Nav.Link eventKey={loc} style={{ textTransform: 'capitalize' }}>
                      {loc}
                    </Nav.Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteLocation(loc)}
                      className="delete-btn"
                      title={`Delete ${loc}`}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </Nav.Item>
              ))}
            </Nav>
          </Col>
        </Row>

        {/* Produce list */}
        <Row>
          <Col>
            <ProduceListWithGrouping
              initialProduce={filteredProduce}
              shoppingLists={initialShoppingLists}
            />
          </Col>
        </Row>
      </Container>

      {/* Add Item Modal */}
      <AddProduceModal
        show={showAddProduceModal}
        onHide={() => setShowAddProduceModal(false)}
        produce={{
          id: 0,
          name: '',
          type: '',
          location: '',
          storage: '',
          quantity: undefined,
          unit: '',
          expiration: null,
          image: null,
          owner,
          restockThreshold: 0,
        }}
      />

      {/* Add Location Modal */}
      <AddLocationModal
        show={showAddLocationModal}
        onHide={() => setShowAddLocationModal(false)}
        owner={owner}
      />

      {/* Confirm Delete Modal */}
      <Modal show={!!confirmLoc} onHide={() => setConfirmLoc(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Location</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete
          {' '}
          <strong>{confirmLoc}</strong>
          ? This will remove all related items.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmLoc(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast */}
      <Toast
        show={!!toastMessage}
        onClose={() => setToastMessage(null)}
        delay={4000}
        autohide
        bg="danger"
        style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </main>
  );
}

export default PantryClient;
