'use client';

import { useState, useEffect, useRef } from 'react';
import { Col, Spinner, Button, Alert, Row } from 'react-bootstrap';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';

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
      <div className="mb-4">
        <Alert
          className="d-flex align-items-start gap-3 mb-0"
          style={{
            backgroundColor: '#fdf6ec',
            border: '1px solid #ead9c2',
            color: '#4f4a42',
            borderRadius: '8px',
          }}
        >
          <div>
            <Alert.Heading style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Hold on while we search your pantries for items that will expire!
            </Alert.Heading>
          </div>
          <div className="text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
          </div>
        </Alert>
      </div>
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

  const formatAlertText = () => {
    const today = new Date();
    let alertText = '';

    // Case 1: Nothing to Report
    if (expiredItems.length === 0 && expiringWithinWeek.length === 0) {
      return null;
    }

    // Case 2: Exists expired items (priority over expiring soon)
    if (expiredItems.length > 0) {
      const oldestExpired = expiredItems[0];
      const oldestExpiredDate = new Date(oldestExpired.expiration);
      const oldestExpiredLocation = typeof
      oldestExpired.location === 'object' ? oldestExpired.location?.name : oldestExpired.location;

      const diffTime = Math.abs(today.getTime() - oldestExpiredDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (!oldestExpiredLocation) {
        // No location info available
        alertText = `Yikes! You have an item that expired ${diffDays} days ago!`;
      } else if (diffDays <= 1) {
        // (1) Expired today or yesterday
        alertText = `We've got some cleaning to do at ${oldestExpiredLocation}!`;
      } else if (diffDays <= 7) {
        // (2) Expired within the last week
        alertText = `Uh Oh... Something at ${oldestExpiredLocation} is past it's prime!`;
      } else {
        // (3) Expired for over a week
        alertText = `You've had expired items for ${diffDays} days now...
         It's time to clean out ${oldestExpiredLocation}!`;
      }
      return alertText;
    }
    // Case 3: Exists expiring items
    alertText = `Heads up! You have ${expiringWithinWeek.length} item
    ${expiringWithinWeek.length > 1 ? 's' : ''} expiring within the week!`;
    return alertText;
  };

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
    <Alert
      className="d-flex align-items-start gap-3 mb-3"
      style={{
        backgroundColor: '#fdf6ec',
        border: '1px solid #ead9c2',
        color: '#4f4a42',
        borderRadius: '8px',
      }}
    >
      <ExclamationTriangleFill
        size={18}
        style={{ color: '#d28b18', marginTop: '2px', flexShrink: 0 }}
      />
      <Col>
        <Alert.Heading style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        {formatAlertText()}
        </Alert.Heading>
        <Row>
          <Col className="mt-2">
            <p className="mb-2">
            {expiredItemsSection}
            </p>
            <p className="mb-2">
            {expiringSoonSection}
            </p>
          </Col>
          <Col className="mt-auto d-flex justify-content-end">
            <Button
              variant="outline-secondary"
              onClick={handleHideForNow}
            >
              Remind Me Later!
            </Button>
          </Col>
        </Row>
      </Col>
    </Alert>
  );
}
