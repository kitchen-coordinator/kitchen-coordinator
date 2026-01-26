'use client';

import { useState } from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import { GeoAlt, Envelope, Github } from 'react-bootstrap-icons';
import Link from 'next/link';

const Footer = () => {
  const [imgSrc, setImgSrc] = useState('/pantrypals-logo.png');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="navandfooter mt-auto">
      <Container>
        <Row className="justify-content-center text-start">

          {/* Company Info */}
          <Col md={4} lg={3} className="mb-4 mb-md-0">
            <Link href="/" className="navbar-brand d-flex align-items-center mb-2">
              <div className="p-1 me-4 rounded" style={{ backgroundColor: 'var(--timberwolf)' }}>
                <Image
                  src={imgSrc}
                  alt="Pantry Pals Logo"
                  width="50"
                  height="50"
                  onError={() => setImgSrc('/fallback-logo.png')}
                />
              </div>
              <h5 className="fw-bold mb-0">Kitchen Coordinator</h5>
            </Link>

            <p className="footer-text-muted small">
              Keep track of your pantry, cut down on food waste, and discover recipes with
              what you already have. Smarter cooking, simplified.
            </p>
          </Col>

          {/* Browse Links */}
          <Col md={2} className="mb-4 mb-md-0">
            <h6 className="fw-bold">Browse</h6>
            <ul className="list-unstyled small footer-links">
              <li className="mb-1">
                <Link href="/" className="nav-link p-0">Home</Link>
              </li>
              <li className="mb-1">
                <Link href="/aboutus" className="nav-link p-0">About Us</Link>
              </li>
              <li className="mb-1">
                <Link href="/dashboard" className="nav-link p-0">Dashboard</Link>
              </li>
            </ul>
          </Col>

          {/* Features */}
          <Col md={2} className="mb-4 mb-md-0">
            <h6 className="fw-bold">Features</h6>
            <ul className="list-unstyled small footer-links">
              <li className="mb-1">
                <Link href="/view-pantry" className="nav-link p-0">View Pantry</Link>
              </li>
              <li className="mb-1">
                <Link href="/shopping-list" className="nav-link p-0">Shopping List</Link>
              </li>
              <li className="mb-1">
                <Link href="/recipes" className="nav-link p-0">Recipes</Link>
              </li>
            </ul>
          </Col>

          {/* Contact Info */}
          <Col md={4} lg={3}>
            <h6 className="fw-bold">Contact</h6>
            <ul className="list-unstyled small footer-text-muted">
              <li className="d-flex align-items-center mb-2">
                <GeoAlt className="me-2 flex-shrink-0" />
                <span>2500 Campus Rd, Honolulu, HI 96822</span>
              </li>
              <li className="d-flex align-items-center mb-2">
                <Envelope className="me-2 flex-shrink-0" />
                <span>pantrypal808@gmail.com</span>
              </li>
              <li className="d-flex align-items-center">
                <a
                  href="https://github.com/pantry-pals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link p-0 d-inline-flex align-items-center"
                >
                  <Github className="me-2" />
                  View on GitHub
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>

      {/* Copyright Bar */}
      <div className="footer-bottom-bar">
        <Container>
          <Row>
            <Col className="text-center small">
              &copy;
              {' '}
              {currentYear}
              {' '}
              Kitchen Coordinator. All Rights Reserved.
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
