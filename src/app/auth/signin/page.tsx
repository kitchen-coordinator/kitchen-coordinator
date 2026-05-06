/* eslint-disable react/jsx-one-expression-per-line */

'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/signin.module.css';
import swal from 'sweetalert';

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [formData, setFormData] = useState<{ email: string; password: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Countdown
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return () => {}; // consistent return: cleanup does nothing
    }
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const sendVerificationCode = async (email: string) => {
    setResendCountdown(60);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send code');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSigningIn(true);

    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };

    const email = target.email.value;
    const password = target.password.value;

    const result = await signIn('credentials', {
      redirect: false,
      callbackUrl: '/',
      email,
      password,
    });

    if (result?.error) {
      if (result.error === 'User not verified') {
        setFormData({ email, password });
        setShowVerification(true);
        await sendVerificationCode(email);
      } else {
        setError('Invalid email or password');
      }
    }

    // Fetch expiring items for notifications
    if (result?.url) {
      try {
        const res = await fetch(`/api/expiring?owner=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.expiringItems?.length > 0) {
          const itemList = data.expiringItems
            .map((item: any) => `${item.name} (expires on ${new Date(item.expiration).toLocaleDateString()})`)
            .join('\n');
          swal({
            title: 'Expiring Items!',
            text: `You have the following items expiring soon:\n\n${itemList}`,
            icon: 'warning',
            buttons: {
              add: {
                text: 'Add to Shopping List',
                value: 'add',
              },
              go: {
                text: 'Go to pantry',
                value: 'go',
              },
              later: {
                text: 'Remind me later',
                value: 'later',
              },
            },
          }).then((value) => {
            if (value === 'add') {
              const firstItem = data.expiringItems[0];
              if (firstItem) {
                const params = new URLSearchParams({
                  addItem: firstItem.name,
                  quantity: String(firstItem.quantity || 1),
                  unit: firstItem.unit || '',
                });
                window.location.href = `/shopping-list?${params.toString()}`;
              } else {
                window.location.href = '/shopping-list';
              }
            } else if (value === 'go') {
              // redirect after the user clicks "add to shopping list"
              window.location.href = '/view-pantry';
            } else {
              // Do nothing, user chose "Remind me later"
            }
          });
        } else {
          window.location.href = result.url; // no expiring items, redirect immediately
        }
      } catch (err) {
        console.error('Failed to fetch expiring items:', err);
      }
    }

    setIsSigningIn(false);
  };

  const handleVerifyCode = async () => {
    if (!formData) return;
    setIsSubmitting(true);
    setVerificationError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: enteredCode }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Verification failed');

      const signInResult = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (signInResult?.error) throw new Error(signInResult.error);

      setVerificationSuccess('Email verified! Redirecting...');
      router.push('/');
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') return null;

  return (
    <div className={styles.container}>
      {!showVerification && (
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.descriptionCentered}>
            Enter your email and password to access your Kitchen Coordinator account.
          </p>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" name="email" required className={styles.input} placeholder="you@example.com" />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Password
                <span className={styles.forgotPassword}>
                  <a href="/auth/forgot-password">Forgot password?</a>
                </span>
              </label>
              <input type="password" name="password" required className={styles.input} placeholder="Password" />
            </div>
            <button type="submit" className={styles.button} disabled={isSigningIn}>
              {isSigningIn ? <span className={styles.spinner} /> : 'Sign In'}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </form>
          <p className={styles.accountPromptWrapper}>
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className={styles.logIn}>
              Sign up
            </a>
          </p>
        </div>
      )}

      {showVerification && formData && (
        <div className={styles.verificationPopup}>
          <h2>Verify Your Email</h2>
          <p>
            We sent a code to <strong>{formData.email}</strong>. Enter it below:
          </p>
          <input
            type="text"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            className={`${styles.input} ${verificationError ? styles.invalid : ''}`}
            placeholder="Enter code"
          />
          {verificationError && <p className={styles.error}>{verificationError}</p>}
          {verificationSuccess && <p className={styles.success}>{verificationSuccess}</p>}

          <button type="button" className={styles.button} onClick={handleVerifyCode} disabled={isSubmitting}>
            {isSubmitting ? <span className={styles.spinner} /> : 'Verify Code'}
          </button>

          <button
            type="button"
            className={styles.resendButton}
            onClick={() => sendVerificationCode(formData.email)}
            disabled={isSubmitting || resendCountdown > 0}
          >
            {resendCountdown > 0 ? `Resend Code (${resendCountdown})` : 'Resend Code'}
          </button>
        </div>
      )}
    </div>
  );
}
