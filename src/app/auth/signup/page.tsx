'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import styles from '@/styles/signup.module.css';

type SignUpForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const SignUp = () => {
  const { status } = useSession();
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState('');
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SignUpForm | null>(null);

  // Countdown state
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  // Countdown effect
  useEffect(() => {
    if (resendCountdown <= 0) {
      return () => {};
    }
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const validationSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email is invalid'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(40, 'Password must not exceed 40 characters'),
    confirmPassword: Yup.string()
      .required('Confirm Password is required')
      .oneOf([Yup.ref('password')], 'Confirm Password does not match'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: yupResolver(validationSchema),
  });

  // Send verification code
  const sendVerificationCode = async (email: string) => {
    // Start countdown right away (60s)
    setResendCountdown(60);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send code');

      setVerificationCodeSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification code');
      // Reset countdown if request fails
      setResendCountdown(0);
    }
  };

  // Handle registration
  const onSubmit = async (data: SignUpForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Registration failed');

      setErrorMessage('');
      setFormData(data);
      await sendVerificationCode(data.email);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle code verification + auto-login
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
      router.push('/dashboard');
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') return null;

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Sign Up</h1>
        <p className={styles.descriptionCentered}>Sign up with your email</p>

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              {...register('email')}
              className={`${styles.input} ${errors.email ? styles.invalid : ''}`}
            />
            {errors.email && <p className={styles.error}>{errors.email.message}</p>}
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              {...register('password')}
              className={`${styles.input} ${errors.password ? styles.invalid : ''}`}
            />
            {errors.password && <p className={styles.error}>{errors.password.message}</p>}
          </div>

          <div className={styles.inputGroup}>
            <label>Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className={`${styles.input} ${errors.confirmPassword ? styles.invalid : ''}`}
            />
            {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? <span className={styles.spinner} /> : 'Register'}
          </button>
        </form>

        {verificationCodeSent && (
          <div className={styles.verificationPopup}>
            <h2>Verify Your Email</h2>
            <p>
              We sent a code to
              {' '}
              <strong>{formData?.email}</strong>
              . Enter it below:
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

            <button
              type="button"
              className={styles.button}
              onClick={handleVerifyCode}
              disabled={isSubmitting}
              style={{ marginTop: '12px' }}
            >
              {isSubmitting ? <span className={styles.spinner} /> : 'Verify Code'}
            </button>

            <button
              type="button"
              className={styles.resendButton}
              onClick={() => formData && sendVerificationCode(formData.email)}
              disabled={isSubmitting || resendCountdown > 0}
            >
              {resendCountdown > 0 ? `Resend Code (${resendCountdown})` : 'Resend Code'}
            </button>
          </div>
        )}

        <p className={styles.accountPromptWrapper}>
          Already have an account?&nbsp;
          <a href="/auth/signin" className={styles.logIn}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
