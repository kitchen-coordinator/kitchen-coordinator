'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Spinner, Row, Col, Button } from 'react-bootstrap';

type ExpiredItemsBannerProps = {
  ownerEmail: string;
  produce: any[];
};

export default function ExpiredItemsBanner({
  ownerEmail,
  produce,
}: ExpiredItemsBannerProps) {
  const [expiredItems, setExpiredItems] = useState<any[]>([]);
  const [expiringWithinWeek, setExpiringWithinWeek] = useState<any[]>([]);
  const firstLoad = useRef(false);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!ownerEmail) {
      setExpiredItems([]);
      setExpiringWithinWeek([]);
      setLoading(false);
      return () => {};
    }

    const fetchExpiringItems = async () => {
      if (!firstLoad.current) {
        setLoading(true);
      }

      try {
        const expRes = await fetch(`/api/expiring?owner=${encodeURIComponent(ownerEmail)}`);

        if (expRes.ok) {
          const expiringData = await expRes.json();
          setExpiredItems(expiringData.expiredItems || []);
          setExpiringWithinWeek(expiringData.expiringWithinWeek || []);
        }
      } catch (err) {
        console.error('Error fetching expiring items:', err);
      } finally {
        setLoading(false);
        firstLoad.current = true;
      }
    };

    fetchExpiringItems();
    const interval = setInterval(fetchExpiringItems, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [ownerEmail, produce]);

  if (loading) {
    return (
      <Card className="mb-4 shadow-sm border-light">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <Card.Title className="mb-0">Hold on while we search your pantries for items that will expire!</Card.Title>
          </div>
          <div className="text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Handle User Dismissal
  const handleHideForNow = () => {
    setHidden(true);
  };

  // Render nothing if user has dismissed or if there are no expired/expiring items
  if (hidden || (expiredItems.length === 0 && expiringWithinWeek.length === 0)) {
    return null;
  }

  const formatExpiredItems = () => {
    if (expiredItems.length <= 0) return null;
    return (
      <div>
        <h5>
          {`${expiredItems.length} item
          ${expiredItems.length !== 1 ? 's are' : ' is'} expired!`}
        </h5>
      </div>
    );
  };

  const formatExpiringSoonItems = () => {
    if (expiringWithinWeek.length <= 0) return null;
    return (
      <div>
        <h5>
          {`${expiringWithinWeek.length} item
          ${expiringWithinWeek.length !== 1 ? 's are' : ' is'} expiring soon!`}
        </h5>
      </div>
    );
  };

  // For clearer render
  const expiredItemsSection = formatExpiredItems();
  const expiringSoonSection = formatExpiringSoonItems();

  return (
    <Card className="mb-4 shadow-sm border-light">
      <Card.Body>
        <Row className="align-items-center">
          <Col>
            {expiredItemsSection}
            {expiringSoonSection}
          </Col>
          <Col xs="3" className="text-end">
            <Button
              variant="outline-secondary"
              onClick={handleHideForNow}
            >
              Remind Me Later!
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  // Case 1: Nothing expired or expiring soon

  // Case 2: Some items expired but nothing expiring soon

  // Case 3: Some items expiring soon but nothing expired

  // Case 4: Some items expired and some expiring soon
}
