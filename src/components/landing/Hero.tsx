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
    <section className="py-5" style={{ backgroundColor: 'var(--timberwolf)' }}>
      <div className="container">
        <div className="row align-items-center">
          {/* Left: Logo */}
          <div className="col-md-6 mb-4 mb-md-0 mt-5">
            <motion.div
              className="d-flex justify-content-center align-items-center"
              style={{ height: 320 }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              whileHover={{ scale: 1.04, rotate: 0.8 }}
            >
              <Image
                src="/pantrypals-logo.png"
                alt="Pantry Pals Logo"
                width={420}
                height={420}
                style={{ backgroundColor: 'white' }}
                priority
                className="img-fluid rounded shadow-lg"
              />
            </motion.div>
          </div>

          {/* Right: Text */}
          <div className="col-md-6 text-center text-md-start">
            <motion.div variants={parent} initial="hidden" animate="show">
              <motion.h1
                className="fw-bold mb-3"
                style={{ color: 'var(--brunswick-green)' }}
                variants={item}
              >
                Welcome to
                {' '}
                <span style={{ color: 'var(--fern-green)' }}>Kitchen Coordinator</span>
              </motion.h1>

              <motion.p
                className="mb-4"
                style={{ color: 'var(--hunter-green)', fontSize: '1.1rem' }}
                variants={item}
              >
                Keep track of your pantry, cut down on food waste, and discover
                recipes with what you already have. Smarter cooking, simplified.
              </motion.p>

              <motion.div className="d-flex gap-3 justify-content-center justify-content-md-start" variants={item}>
                {!isLoading && (
                  !session ? (
                    <>
                      <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.12 }}>
                        <Link href="/auth/signup" className={styles.primaryButton}>
                          Sign Up
                        </Link>
                      </motion.div>

                      <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.12 }}>
                        <Link href="/auth/signin" className={styles.secondaryButton}>
                          Log In
                        </Link>
                      </motion.div>
                    </>
                  ) : (
                    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.12 }}>
                      <Link href="/dashboard" className={styles.primaryButton}>
                        Go to Dashboard
                      </Link>
                    </motion.div>
                  )
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
