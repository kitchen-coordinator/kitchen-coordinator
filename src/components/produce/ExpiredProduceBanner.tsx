'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Spinner, Badge } from 'react-bootstrap';

type ExpiredItemsBannerProps = {
  ownerEmail: string;
  produce: any[];
};

export default function ExpiredItemsBanner({ ownerEmail, produce }: ExpiredItemsBannerProps) {
  const [expiredItems, setExpiredItems] = useState<any[]>([]);
  const [expiringWithinWeek, setExpiringWithinWeek] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerEmail) {
      setExpiredItems([]);
      setExpiringWithinWeek([]);
      return () => {};
    }

    const fetchExpiringItems = async () => {
      setLoading(true);
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
      }
    };

    fetchExpiringItems();
    const interval = setInterval(fetchExpiringItems, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [ownerEmail]);

  if (loading) {
    return (
      <Card className="mb-4 shadow-sm border-light">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <Card.Title className="mb-0">Hold on while we search your pantries for items that will expire!</Card.Title>
          </div>
          <div className="text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading alerts...
          </div>
        </Card.Body>
      </Card>

    );
  }
}
