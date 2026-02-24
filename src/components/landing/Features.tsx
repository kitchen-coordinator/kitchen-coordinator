'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Track Your Pantry',
    description: 'Easily keep track of your pantry, fridge, freezer, and spices, so you always know what you have.',
    icon: '/apple.png',
    href: '/view-pantry',
  },
  {
    title: 'Reduce Food Waste',
    description: 'Get expiration reminders and suggestions to finish food before it spoils.',
    icon: '/banana.png',
    href: '/view-pantry',
  },
  {
    title: 'Generate Shopping Lists',
    description: 'Automatically create shopping lists based on low or missing items in your pantry.',
    icon: '/carrot.png',
    href: '/shopping-list',
  },
  {
    title: 'Discover Recipes',
    description: 'Find recipes based on ingredients you already have, reducing waste and meal prep stress.',
    icon: '/chickenbreast.png',
    href: '/recipes',
  },
];

export default function Features() {
  return (
    <div style={{ backgroundColor: 'var(--timberwolf, #d4c5b0)' }}>

      {/* Intro section */}
      <section style={{ padding: '3rem 1.5rem 2rem', maxWidth: 700, margin: '0 auto' }}>
        <h2
          style={{
            fontWeight: 800,
            fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
            color: 'var(--brunswick-green, #3a5a40)',
            marginBottom: '1rem',
            lineHeight: 1.2,
          }}
        >
          Welcome to Kitchen
          <br />
          Coordinator
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.65, marginBottom: '2rem' }}>
          Keep track of your pantry, cut down on food waste, and discover recipes with
          what you already have. Smarter cooking, simplified.
        </p>
        <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.15 }}>
          <Link
            href="/aboutus"
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--brunswick-green, #3a5a40)',
              color: 'white',
              padding: '0.9rem 2.5rem',
              borderRadius: '0.75rem',
              fontWeight: 500,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            About Us
          </Link>
        </motion.div>
      </section>

      {/* Feature cards */}
      <section style={{ padding: '1rem 1.5rem 4rem', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href={feature.href}
                key={feature.title}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '1.75rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  textDecoration: 'none', // ADDED: removes underline from link
                  color: 'inherit', // ADDED: prevents link from changing text color
                }}
              >
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={56}
                  height={56}
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: 'var(--brunswick-green, #3a5a40)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
                    {feature.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
