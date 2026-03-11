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
    <section className={styles.heroSection}>
      <motion.div
        className={styles.heroWrapper}
        variants={parent}
        initial="hidden"
        animate="show"
      >
        {/* Logo */}
        <motion.div variants={item} style={{ marginBottom: '1.25rem' }}>
          <Image
            src="/kitchen-coordinator-logo.png"
            alt="Kitchen Coordinator"
            width={180}
            height={180}
            priority
          />
        </motion.div>

        {/* Buttons */}
        {!isLoading && (
          <motion.div className={styles.buttonGroup} variants={item}>
            {!session ? (
              <>
                <Link href="/auth/signin" className={styles.primaryButton}>
                  Log In
                </Link>
                <Link href="/auth/signup" className={styles.secondaryButton}>
                  Create an Account
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className={styles.primaryButton}>
                Go to Dashboard
              </Link>
            )}
          </motion.div>
        )}

        {/* Dashboard preview */}
        <motion.div className={styles.previewWrapper} variants={item}>
          <Image
            src="/dashboard-preview.png"
            alt="Dashboard preview"
            width={600}
            height={320}
            className={styles.previewImage}
            priority
          />
        </motion.div>

      </motion.div>
    </section>
  );
}
