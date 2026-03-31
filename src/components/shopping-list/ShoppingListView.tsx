'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import AddShoppingList from './AddShoppingList';
import ShoppingListCard from './ShoppingListCard';
import AddToShoppingListModal from './AddToShoppingListModal';
import RecommendedWidget from './RecommendedWidget';

type ShoppingListViewProps = {
  initialShoppingLists: any[];
};

export default function ShoppingListView({ initialShoppingLists }: ShoppingListViewProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [show, setShow] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);

  const searchLower = searchTerm.toLowerCase();
  const filteredLists = initialShoppingLists.filter((list) => list.name.toLowerCase().includes(searchLower));

  return (
    <>
      {/* TODO: Adjust Styling for Search + Buttons Row */}
      {/* Search + Buttons Row */}
      <Row
        className="mb-4 d-flex justify-content-center align-items-center text-center"
        style={{ minHeight: '60px' }}
      >
        <Col xs={12} md={6} lg={4} className="mb-2">
          <Form.Control
            type="text"
            placeholder="Search shopping lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>

        <Col xs="auto" className="mb-2">
          {/* TODO: Uniform Styling */}
          <Button
            onClick={() => setShow(true)}
            style={{
              backgroundColor: 'var(--fern-green)',
              height: '34px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
            }}
            className="btn-submit"
          >
            + Add Item to List
          </Button>
          <AddToShoppingListModal
            show={show}
            onHide={() => setShow(false)}
            shoppingLists={initialShoppingLists}
            sidePanel={false}
            prefillName=""
          />
        </Col>

        <Col xs="auto" className="mb-2">
          <Button
            onClick={() => setShowCreateList(true)}
            style={{
              backgroundColor: 'var(--fern-green)',
              height: '34px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
            }}
            className="btn-submit"
          >
            + New List
          </Button>

          <AddShoppingList
            show={showCreateList}
            onHide={() => setShowCreateList(false)}
            owner={session?.user?.email ?? ''}
          />
        </Col>
      </Row>

      {/* MAIN LAYOUT: Lists left, Recommended right */}
      <Row>
        {/* LEFT SIDE — Shopping Lists */}
        <Col xs={12} md={8}>
          {filteredLists.length === 0 ? (
            <Row>
              <Col className="text-center">
                <p className="text-muted">No shopping lists found. Create one to get started!</p>
              </Col>
            </Row>
          ) : (
            <Row>
              {filteredLists.map((list) => (
                <Col key={list.id} md={6} className="mb-4">
                  <ShoppingListCard shoppingList={list} />
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* RIGHT SIDE — Recommended Items */}
        <Col xs={12} md={4} className="mt-4 mt-md-0">
          {session?.user?.email && (
          <RecommendedWidget
            owner={session?.user?.email ?? ''}
            shoppingLists={initialShoppingLists}
          />
          )}
        </Col>
      </Row>
    </>
  );
}
