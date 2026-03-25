'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

type Props = {
  show: boolean;
  onHide: () => void;
  recipeId: number;
  recipeTitle: string;
};

type DishImage = {
  id: string;
  userEmail: string;
  url: string;
  name: string;
  createdAt: any;
};

export default function DishImagesModal({ show, onHide, recipeId, recipeTitle }: Props) {
  const [images, setImages] = useState<DishImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;

    async function fetchImages() {
      setLoading(true);
      setError(null);
      try {
        if (!db) {
          setError('Database is not configured. Please try again later.');
          setLoading(false);
          return;
        }

        const q = query(
          collection(db!, 'recipeImages'),
          where('recipeId', '==', recipeId),
        );
        const snapshot = await getDocs(q);
        const fetchedImages: DishImage[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          userEmail: doc.data().userEmail,
          url: doc.data().url,
          name: doc.data().name,
          createdAt: doc.data().createdAt,
        }));

        fetchedImages.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });

        setImages(fetchedImages);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [show, recipeId]);

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          Community Photos:
          {' '}
          {recipeTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading photos...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
        )}

        {!loading && !error && images.length === 0 && (
          <Alert variant="info" className="mb-0 text-center">
            No photos have been shared for this recipe yet. Be the first to upload!
          </Alert>
        )}

        {!loading && !error && images.length > 0 && (
          <Row className="g-4">
            {images.map((img) => (
              <Col key={img.id} md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0">
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '75%' }}>
                    <Image
                      src={img.url}
                      alt={`Dish by ${img.userEmail}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>
                  <Card.Body>
                    <Card.Text className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                      <strong>Made by:</strong>
                      {' '}
                      {img.userEmail}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal.Body>
    </Modal>
  );
}
