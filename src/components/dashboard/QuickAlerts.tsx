'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { Clock, Search, Cart, ExclamationTriangle } from 'react-bootstrap-icons';
import Link from 'next/link';

type QuickAlertsProps = {
  ownerEmail: string;
  recipes: any[];
  produce: any[];
};

export default function QuickAlerts({ ownerEmail, recipes, produce }: QuickAlertsProps) {
  const [expiredItems, setExpiredItems] = useState<any[]>([]);
  const [expiringWithinWeek, setExpiringWithinWeek] = useState<any[]>([]);
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerEmail) {
      setExpiredItems([]);
      setExpiringWithinWeek([]);
      setShoppingLists([]);
      setLowStockItems([]);
      return () => {};
    }

    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const [expiringRes, shoppingRes, lowStockRes] = await Promise.all([
          fetch(`/api/expiring?owner=${encodeURIComponent(ownerEmail)}`),
          fetch(`/api/shopping-list?owner=${encodeURIComponent(ownerEmail)}`),
          fetch(`/api/low-stock?owner=${encodeURIComponent(ownerEmail)}`),
        ]);

        if (expiringRes.ok) {
          const expiringData = await expiringRes.json();
          setExpiredItems(expiringData.expiredItems || []);
          setExpiringWithinWeek(expiringData.expiringWithinWeek || []);
        }
        if (shoppingRes.ok) setShoppingLists((await shoppingRes.json()).shoppingLists || []);
        if (lowStockRes.ok) setLowStockItems((await lowStockRes.json()).lowStockItems || []);
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [ownerEmail]);

  const pantryNames = useMemo(
    () => new Set(produce.map((p) => p.name.toLowerCase())),
    [produce],
  );

  const availableRecipes = useMemo(
    () => recipes.filter((r) => {
      const ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];
      return ingredients.length > 0 && ingredients.every((ing: string) => pantryNames.has(ing.toLowerCase()));
    }),
    [recipes, pantryNames],
  );

  const recipeCount = availableRecipes.length;

  const getOverdueShoppingLists = () => {
    if (shoppingLists.length === 0) return null;

    const today = new Date();

    // Filter out completed lists, future shopping lists, and those without deadlines
    const pastLists = shoppingLists.filter(
      (list) => !list.isCompleted && list.deadline && new Date(list.deadline) < today,
    );

    // If there are lists, return how many are past due else null to indicate no alerts needed
    return pastLists.length > 0 ? pastLists.length : null;
  };

  const getNextShoppingDate = () => {
    if (shoppingLists.length === 0) return null;

    const today = new Date();

    // Filter out completed lists, old shopping lists, and those without deadlines
    const upcomingLists = shoppingLists.filter(
      (list) => !list.isCompleted && list.deadline && new Date(list.deadline) >= today,
    );

    // No upcoming shopping lists, so return null to indicate no alerts needed
    if (upcomingLists.length === 0) return null;

    // Find the earliest deadline
    const nextShopping = upcomingLists.reduce((earliest, list) => {
      const deadline = new Date(list.deadline!);
      return deadline < earliest ? deadline : earliest;
    }, new Date(upcomingLists[0].deadline!));

    // Strip time for day comparison (otherwise, time differences could skew results)
    today.setHours(0, 0, 0, 0);
    nextShopping.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffDays = Math.ceil((nextShopping.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Friendly Date Format
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  if (loading) {
    return (
      <Card className="mb-4 shadow-sm border-light">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <ExclamationTriangle className="me-2 text-warning" size={20} />
            <Card.Title className="mb-0">Quick Alerts</Card.Title>
          </div>
          <div className="text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading alerts...
          </div>
        </Card.Body>
      </Card>
    );
  }

  const overdueShoppingLists = getOverdueShoppingLists();
  const nextShoppingDate = getNextShoppingDate();

  const formatExpiredText = () => {
    if (expiredItems.length === 0) return null;

    const first = expiredItems[0].name;

    if (expiredItems.length === 1) {
      return `${first} has expired`;
    }

    return `${first} and ${expiredItems.length - 1} other items have expired`;
  };

  const formatExpiringWithinWeekText = () => {
    if (expiringWithinWeek.length === 0) return null;

    const first = expiringWithinWeek[0].name;

    if (expiringWithinWeek.length === 1) {
      return `${first} is expiring soon`;
    }

    return `${first} and ${expiringWithinWeek.length - 1} other items are expiring soon`;
  };

  const expiredItemsText = formatExpiredText();
  const expiringItemsText = formatExpiringWithinWeekText();

  const formatLowStockText = () => {
    if (lowStockItems.length === 0) return 'All items sufficiently stocked';
    if (lowStockItems.length === 1) return `${lowStockItems[0].name} is low`;
    return `${lowStockItems[0].name} and ${lowStockItems.length - 1} other items low`;
  };

  const formatRecipesText = () => {
    if (recipeCount === 0) return 'No recipes available with current pantry';
    if (recipeCount === 1) {
      return (
        <>
          You can make
          {' '}
          <Link
            href={`/recipes/${availableRecipes[0].id}`}
            className="text-success text-decoration-none"
            style={{ transition: 'font-weight 0.2s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.fontWeight = '900')}
            onMouseLeave={(e) => (e.currentTarget.style.fontWeight = '600')}
          >
            {availableRecipes[0].title}
          </Link>
        </>
      );
    }
    if (recipeCount === 2) {
      return (
        <>
          You can make
          {' '}
          <Link
            href={`/recipes/${availableRecipes[0].id}`}
            className="text-success text-decoration-none"
            style={{ transition: 'font-weight 0.2s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.fontWeight = '900')}
            onMouseLeave={(e) => (e.currentTarget.style.fontWeight = '600')}
          >
            {availableRecipes[0].title}
          </Link>
          {' '}
          and
          {' '}
          <Link
            href={`/recipes/${availableRecipes[1].id}`}
            className="text-success text-decoration-none"
            style={{ transition: 'font-weight 0.2s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.fontWeight = '900')}
            onMouseLeave={(e) => (e.currentTarget.style.fontWeight = '600')}
          >
            {availableRecipes[1].title}
          </Link>
        </>
      );
    }

    return (
      <>
        You can make
        {' '}
        <Link
          href={`/recipes/${availableRecipes[0].id}`}
          className="text-success text-decoration-none"
          style={{ transition: 'font-weight 0.2s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.fontWeight = '900')}
          onMouseLeave={(e) => (e.currentTarget.style.fontWeight = '600')}
        >
          {availableRecipes[0].title}
        </Link>
        ,
        {' '}
        <Link
          href={`/recipes/${availableRecipes[1].id}`}
          className="text-success text-decoration-none"
          style={{ transition: 'font-weight 0.2s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.fontWeight = '900')}
          onMouseLeave={(e) => (e.currentTarget.style.fontWeight = '600')}
        >
          {availableRecipes[1].title}
        </Link>
        , and more
      </>
    );
  };

  const formatOverdueShoppingText = () => {
    if (overdueShoppingLists != null && overdueShoppingLists > 0) {
      return `${overdueShoppingLists} overdue shopping list${overdueShoppingLists !== 1 ? 's' : ''}`;
    }
    return null;
  };

  const formatUpcomingShoppingText = () => {
    if (!nextShoppingDate) return 'No upcoming shopping lists';
    if (nextShoppingDate === 'Today'
        || nextShoppingDate === 'Tomorrow') {
      return `Grocery trip scheduled ${nextShoppingDate.toLowerCase()}`;
    }
    return `Next shopping trip in ${nextShoppingDate}`;
  };

  const overdueShoppingText = formatOverdueShoppingText();
  const upcomingShoppingText = formatUpcomingShoppingText();

  const formatShoppingBadge = () => {
    if (overdueShoppingLists != null && overdueShoppingLists > 0) return '!!!';
    if (nextShoppingDate) return nextShoppingDate;
    return 'N/A';
  };

  return (
    <Card className="mb-4 shadow-sm border-light">
      <Card.Body>
        <div className="d-flex align-items-center mb-4">
          <ExclamationTriangle className="me-2 text-warning" size={20} />
          <Card.Title className="mb-0">Quick Alerts</Card.Title>
        </div>

        <Row xs={1} md={4} className="g-4">
          {/* Expiring Soon */}
          <Col>
            <Link href="/view-pantry" className="text-success text-decoration-none fw-semibold">
              <Card className="h-100 border-start border-4 border-warning shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <Clock className="me-2 text-secondary" />
                      <Card.Subtitle className="fw-semibold text-dark">Expiring Items</Card.Subtitle>
                    </div>
                    <Badge bg="warning" text="dark">
                      {expiringWithinWeek.length + expiredItems.length}
                      {' '}
                      {(expiringWithinWeek.length + expiredItems.length) === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <Card.Text className="text-muted small mb-0">
                    {expiredItemsText && (
                      <div className="text-danger">{expiredItemsText}</div>
                    )}
                    {expiringItemsText && (
                      <div>{expiringItemsText}</div>
                    )}
                    {!expiredItemsText && !expiringItemsText && 'No items expiring within the week'}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          {/* Low Stock */}
          <Col>
            <Link href="/view-pantry" className="text-danger text-decoration-none fw-semibold">
              <Card className="h-100 border-start border-4 border-danger shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <ExclamationTriangle className="me-2 text-secondary" />
                      <Card.Subtitle className="fw-semibold text-dark">Low Stock</Card.Subtitle>
                    </div>
                    <Badge bg="danger">
                      {lowStockItems.length}
                      {' '}
                      {lowStockItems.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <Card.Text className="text-muted small mb-0">{formatLowStockText()}</Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          {/* Recipes Available */}
          <Col>
            <Link href="/recipes" className="text-danger text-decoration-none fw-semibold">
              <Card className="h-100 border-start border-4 border-success shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <Search className="me-2 text-secondary" />
                      <Card.Subtitle className="fw-semibold text-dark">Recipes Available</Card.Subtitle>
                    </div>
                    <Badge bg="success">
                      {recipeCount}
                      {' '}
                      new
                    </Badge>
                  </div>
                  <Card.Text className="text-muted small mb-0">{formatRecipesText()}</Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          {/* Shopping List Due */}
          <Col>
            <Link href="/shopping-list" className="text-danger text-decoration-none fw-semibold">
              <Card className="h-100 border-start border-4 border-info shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <Cart className="me-2 text-secondary" />
                      <Card.Subtitle className="fw-semibold text-dark">Shopping List Due</Card.Subtitle>
                    </div>
                    <Badge bg="info" text="dark">
                      {formatShoppingBadge()}
                    </Badge>
                  </div>
                  <Card.Text className="text-muted small mb-0">
                    {overdueShoppingText && (
                      <div className="text-danger">{overdueShoppingText}</div>
                    )}
                    {upcomingShoppingText && (
                      <div>{upcomingShoppingText}</div>
                    )}
                    {!overdueShoppingText && !upcomingShoppingText && 'No upcoming shopping lists'}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
