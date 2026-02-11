'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BoxSeam,
  CartCheck,
  BookHalf,
} from 'react-bootstrap-icons';
import QuickAlerts from './QuickAlerts';

interface DashboardMenuProps {
  ownerEmail: string;
  recipes: any[];
  produce: any[];
}

export default function DashboardMenu({ ownerEmail, recipes, produce }: DashboardMenuProps) {
  const parent = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };
  const menuItems = [
    {
      label: 'View Pantry',
      href: '/view-pantry',
      icon: <BoxSeam size={38} />,
      color: 'var(--hunter-green)',
    },
    {
      label: 'Shopping List',
      href: '/shopping-list',
      icon: <CartCheck size={38} />,
      color: 'var(--hunter-green)',
    },
    {
      label: 'Recipes',
      href: '/recipes',
      icon: <BookHalf size={38} />,
      color: 'var(--hunter-green)',
    },
  ];

  return (
    <main>
      <div className="container" id="dashboard">
        <div className="row align-items-center text-center mt-5">
          <motion.div variants={parent} initial="hidden" animate="show">
            <motion.h1
              className="fw-bold mb-3"
              style={{ color: 'var(--brunswick-green)' }}
              variants={item}
            >
              Welcome to your
              {' '}
              <span style={{ color: 'var(--fern-green)' }}>Dashboard</span>
            </motion.h1>

            <motion.p
              className="mb-4"
              style={{
                color: 'var(--hunter-green)',
                fontSize: '1rem',
              }}
              variants={item}
            >
              What would you like to see?
            </motion.p>
          </motion.div>
        </div>

        <QuickAlerts ownerEmail={ownerEmail} recipes={recipes} produce={produce} />

        {/* Dashboard cards */}
        <motion.div
          className="grid gap-4 mt-5 mb-5"
          variants={parent}
          initial="hidden"
          animate="show"
        >
          {menuItems.map((itemData) => (
            <motion.div
              key={itemData.href}
              variants={item}
              whileHover={{ scale: 1.06, y: -5 }}
              transition={{ duration: 0.15 }}
              className="col-4 d-flex justify-content-center"
            >
            <div
              style={{
                background: itemData.color,
                color: 'white',
                borderRadius: '22px',
                padding: '2.5rem 1rem',
                width: '100%',
                maxWidth: '320px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 14px rgba(0, 0, 0, 0.15)',
              }}
            >
              <Link
                href={itemData.href}
                style={{
                  textDecoration: 'none',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '50%',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'background-color 0.25s',
                  }}
                >
                  {itemData.icon}
                </div>
                <span style={{
                  fontSize: '1.3rem',
                  fontWeight: 600,
                }}
                >
                  {itemData.label}
                </span>
              </Link>
            </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
