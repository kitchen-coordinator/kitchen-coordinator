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
      <section style={{ padding: '3.5rem 2rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <h2
          style={{
            fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--brunswick-green, #3a5a40)',
            marginBottom: '1rem',
            lineHeight: 1.15,
          }}
        >
          Welcome to Kitchen Coordinator
        </h2>
        <p style={{
          fontSize: '1.05rem',
          color: '#555',
          lineHeight: 1.7,
          marginBottom: '2rem',
          maxWidth: 560,
        }}
        >
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
              padding: '0.85rem 2rem',
              borderRadius: '0.75rem',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            About Us
          </Link>
        </motion.div>
      </section>

      {/* Feature cards */}
      <section style={{ padding: '1.5rem 2rem 5rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href={feature.href}
                style={{
                  background: 'white',
                  borderRadius: '1.25rem',
                  padding: '1.5rem 2rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  textDecoration: 'none',
                  color: 'inherit',
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
                  <h3 style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'var(--brunswick-green, #3a5a40)',
                    margin: '0 0 0.35rem 0',
                  }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.6, margin: 0 }}>
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
