import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kitchen Coordinator',
  description: 'Manage your pantry, reduce food waste, and cook smarter.',
  icons: '/favicon.ico',
};

/** The Home page. */
const Home = () => (
  <main>
    <Hero />
    <Features />
  </main>
);

export default Home;
