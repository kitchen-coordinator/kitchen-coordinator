'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '@/styles/signin.module.css';

export default function SignOutPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated') router.replace('/auth/signin');
  }, [status, router]);

  if (status === 'loading' || status !== 'authenticated') return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    // Do not redirect automatically, let router handle it
    await signOut({ callbackUrl: '/' });
    setIsSigningOut(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Sign Out</h1>
        <p className={styles.descriptionCentered}>
          Are you sure you want to sign out of your Kitchen Coordinator account?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }}>
          <button
            type="button"
            data-testid="signout-button"
            className={styles.button}
            style={{ backgroundColor: 'var(--fern-green)' }}
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? <span className={styles.spinner} /> : 'Sign Out'}
          </button>

          <button
            type="button"
            className={styles.button}
            style={{
              backgroundColor: 'var(--sage)',
              color: 'var(--brunswick-green)',
            }}
            onClick={() => router.push('/dashboard')}
            disabled={isSigningOut}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
