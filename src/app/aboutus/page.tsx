'use client';

import { Container, Image, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';

/** The About Us page. */
const About = () => (
  <main
    style={{
      backgroundColor: 'var(--timberwolf)',
      paddingTop: '2rem',
      paddingBottom: '2rem',
    }}
  >
    <Container>
      {/* Logo + Intro */}
      <Row className="align-items-center mb-5">
        <Col md={4} className="text-center mb-4 mb-md-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/pantrypals-logo.png"
              alt="Pantry Pals Logo"
              width={250}
              height={250}
              className="rounded-lg shadow"
            />
          </motion.div>
        </Col>
        <Col md={8}>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1
              style={{
                color: 'var(--fern-green)',
                marginBottom: '1rem',
              }}
            >
              About Kitchen Coordinator
            </h1>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Kitchen Coordinator is an application designed to help users keep track of
              the food items they already have at home. With Kitchen Coordinator you
              can:
            </p>
            <ul
              style={{
                color: 'var(--hunter-green)',
                fontSize: '1.05rem',
                lineHeight: '1.6',
              }}
            >
              <li>
                Track what&apos;s in stock - log what you have, how much you have,
                and when it expires
              </li>
              <li>
                Stay organized - see at a glance what&apos;s running low, so
                you&apos;re not caught off guard when cooking
              </li>
              <li>
                Easy meal planning - use the items you already have at home to
                find inspiration for meals
              </li>
              <li>
                Simplified grocery shopping - easily add items to a shopping list as things are
                running low or out of stock
              </li>
            </ul>
          </motion.div>
        </Col>
      </Row>

      {/* Why We Built It */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Row
          className="mb-5"
          style={{
            backgroundColor: 'var(--sage)',
            borderRadius: '10px',
            padding: '2rem',
          }}
        >
          <Col>
            <h2
              style={{
                color: 'var(--brunswick-green)',
                marginBottom: '1rem',
              }}
            >
              Why We Built It
            </h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Our team is dedicated to this project to address food
              waste and disorganization in the kitchen. Many people struggle to keep track of
              what they have at home, leading to forgotten items that expire or go unused.
              This not only wastes food but also money.
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              With Kitchen Coordinator, we wanted to offer a simple tool to help people stay organized,
              make the most of the food they already have,
              and ultimately make cooking at home easier and more enjoyable.
            </p>
          </Col>
        </Row>
      </motion.div>

      {/* Looking Ahead */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Row
          className="mb-5"
          style={{
            backgroundColor: 'var(--fern-green)',
            color: 'white',
            borderRadius: '10px',
            padding: '2rem',
          }}
        >
          <Col>
            <h2 style={{ marginBottom: '1rem' }}>Looking Ahead</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              This application is a continuation of a team project developed for:&nbsp;
              <a
                href="https://pantry-pals.vercel.app/"
                style={{
                  color: 'var(--timberwolf)',
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                }}
              >
                ICS 414 at the University of Hawaii at Manoa.
              </a>
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              We&apos;re excited about the future of Kitchen Coordinator and have plans
              to add even more features to make it an indispensable tool for
              home cooks. Some of the features we&apos;re considering include:
            </p>
            <ul style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
              <li>Barcode scanning for easy item entry</li>
              <li>Recipe suggestions based on dietary restrictions</li>
              <li>Sharing pantry lists with family members or roommates</li>
              <li>Notifications when an item is about to expire</li>
              <li>Mobile friendly UI to access your pantry on the go</li>
              <li>Estimated cost of each recipe</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              We&apos;re committed to continuously improving Kitchen Coordinator and
              making it the best it can be for our users.
            </p>
          </Col>
        </Row>
      </motion.div>

      {/* Learn More */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Row
          className="mb-5"
          style={{
            backgroundColor: 'var(--sage)',
            borderRadius: '10px',
            padding: '2rem',
          }}
        >
          <Col>
            <h2
              style={{
                color: 'var(--brunswick-green)',
                marginBottom: '1rem',
              }}
            >
              Learn More
            </h2>
            <a
              href="https://pantry-pals.github.io/"
              style={{
                color: 'var(--brunswick-green)',
                fontSize: '1.1rem',
                lineHeight: '1.6',
              }}
            >
              Click to learn more about our development
              process and our team
            </a>
          </Col>
        </Row>
      </motion.div>
    </Container>
  </main>
);

export default About;
