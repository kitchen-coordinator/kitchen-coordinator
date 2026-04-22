'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '@/styles/reset-password.module.css';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!token) {
      setMessage('Invalid or missing token.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6 || password.length > 40) {
      setMessage('Password must be between 6 and 40 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      setMessage(data.message || 'Password reset failed.');

      if (res.ok) {
        router.push('/auth/signin');
      }
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.descriptionCentered}>
          Enter your new password below to reset your Kitchen Coordinator account password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="New password (6-40 characters)"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="Confirm password"
            />
          </div>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? <span className={styles.spinner} /> : 'Reset Password'}
          </button>
        </form>
        {message && (
          <p className={message.toLowerCase().includes('success') ? styles.success : styles.error}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
