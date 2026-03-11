'use client';

import React from 'react';
import { Container } from 'react-bootstrap';
import type { ProduceRelations } from '@/types/ProduceRelations';
import ProduceTable from './ProduceTable';
import ProduceCardGrid from './ProduceCardGrid';

function capitalizeFirst(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

type Props = {
  groups: Array<[string, ProduceRelations[]]>;
  view: 'table' | 'cards';
  shoppingLists?: any[];
};

const GroupedSections: React.FC<Props> = ({ groups, view, shoppingLists }) => {
  if (groups.length === 0) return <div className="text-center">No items found</div>;

  return (
    <>
      {groups.map(([storage, items]) => (
        <Container key={storage} className="mb-4">
          <h3 className="mt-2">{capitalizeFirst(storage) || 'Unknown'}</h3>
          {view === 'table'
            ? <ProduceTable rows={items} shoppingLists={shoppingLists ?? []} />
            : <ProduceCardGrid rows={items} />}
        </Container>
      ))}
    </>
  );
};

export default GroupedSections;
