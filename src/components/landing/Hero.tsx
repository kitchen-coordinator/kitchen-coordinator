'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import styles from '@/styles/hero.module.css';

export default function Hero() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  const parent = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

  return (
    // <section className="py-5" style={{ backgroundColor: 'var(--timberwolf)' }}>
    <section
      style={{
        backgroundColor: '#547c54',
        padding: '4rem 1.5rem 0 1.5rem', // no bottom padding
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <motion.div variants={parent} initial="hidden" animate="show" style={{ width: '100%', maxWidth: 600 }}>
        <motion.h1
          variants={item}
          style={{
            color: 'white',
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
            lineHeight: 1.1,
            marginBottom: '2.5rem',
          }}
        >
          Kitchen
          <br />
          Coordinator
        </motion.h1>
        {!isLoading && (
        <motion.div
          variants={item}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '3rem' }}
        >
          {!session ? (
            <>
              <Link
                href="/auth/signin"
                style={{
                  display: 'block',
                  backgroundColor: 'white',
                  color: 'black',
                  padding: '1rem 2rem',
                  borderRadius: '0.75rem',
                  fontWeight: 500,
                  fontSize: '1.1rem',
                  textDecoration: 'none',
                }}
              >
                <Link href="/auth/signin" className={styles.primaryButton}>Log In</Link>
              </Link>
              <Link
                href="/auth/signup"
                style={{
                  display: 'block',
                  backgroundColor: 'white',
                  color: 'black',
                  padding: '1rem 2rem',
                  borderRadius: '0.75rem',
                  fontWeight: 500,
                  fontSize: '1.1rem',
                  textDecoration: 'none',
                  border: '2px solid rgba(255,255,255,0.5)',
                }}
              >
                <Link href="/auth/signup" className={styles.secondaryButton}>Create an Account</Link>
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              style={{
                display: 'block',
                backgroundColor: 'white',
                color: 'black',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                fontWeight: 500,
                fontSize: '1.1rem',
                textDecoration: 'none',
              }}
            >
              Go to Dashboard
            </Link>
          )}

        </motion.div>
        )}
        {/* ADDED: dashboard screenshot preview at the bottom of the hero */}
        <motion.div
          variants={item}
          style={{
            borderRadius: '1rem 1rem 0 0', // only round the top corners
            overflow: 'hidden',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.25)',
            lineHeight: 0,
          }}
        >
          <Image
            src="/dashboard-preview.png"
            alt="Dashboard preview"
            width={600}
            height={320}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            priority
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
