'use client';

import React, { useMemo, useState } from 'react';
import { Container } from 'react-bootstrap';
import type { ProduceRelations } from '@/types/ProduceRelations';
import { normalizeUnit, toBase } from '@/lib/units';
import SearchBarControls from './SearchBarControls';
import ProduceTable from './ProduceTable';
import ProduceCardGrid from './ProduceCardGrid';
import GroupedSections from './GroupedSections';

const STORAGE_ORDER = ['freezer', 'fridge', 'pantry'] as const;
type ViewMode = 'table' | 'cards';

const toTime = (d: unknown): number => {
  if (!d) return Number.POSITIVE_INFINITY;
  const t = new Date(d as string | number | Date).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

export type SortType =
  | ''
  | 'name-asc'
  | 'type-asc'
  | 'expiration-soon'
  | 'qty-desc'
  | 'qty-asc';

function sortProduce(arr: ProduceRelations[], sort: string): ProduceRelations[] {
  const sorted = [...arr];
  const qtyBaseForSort = (p: ProduceRelations): number => {
    const q = typeof p.quantity === 'number' ? p.quantity : 0;
    const u = typeof (p as any).unit === 'string' ? ((p as any).unit as string) : '';
    if (!u) return q;
    try {
      return toBase(q, normalizeUnit(u));
    } catch {
      return q;
    }
  };
  switch (sort) {
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'type-asc':
      sorted.sort((a, b) => (a.type ?? '').localeCompare(b.type ?? ''));
      break;
    case 'expiration-soon':
      sorted.sort((a, b) => toTime(a.expiration) - toTime(b.expiration));
      break;
    case 'qty-desc':
      sorted.sort((a, b) => qtyBaseForSort(b) - qtyBaseForSort(a));
      break;
    case 'qty-asc':
      sorted.sort((a, b) => qtyBaseForSort(a) - qtyBaseForSort(b));
      break;
    default:
      break;
  }
  return sorted;
}

const ProduceListWithGrouping: React.FC<{ initialProduce: ProduceRelations[] }> = ({ initialProduce }) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('');
  const [groupByStorage, setGroupByStorage] = useState(false);
  const [view, setView] = useState<ViewMode>('table');

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = [...initialProduce];
    if (q) {
      arr = arr.filter(
        (p) => p.name.toLowerCase().includes(q)
          || (p.type?.toLowerCase().includes(q) ?? false)
          || (p.storage?.name?.toLowerCase().includes(q) ?? false)
          || (p.location?.name?.toLowerCase().includes(q) ?? false),
      );
    }
    return sortProduce(arr, sort);
  }, [initialProduce, search, sort]);

  const grouped = useMemo(() => {
    if (!groupByStorage) return [] as Array<[string, ProduceRelations[]]>;
    const map = new Map<string, ProduceRelations[]>();
    for (const item of filteredSorted) {
      const key = item.storage?.name?.trim().toLowerCase() || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    const sections: Array<[string, ProduceRelations[]]> = [];
    for (const storage of STORAGE_ORDER) {
      if (map.has(storage)) {
        sections.push([storage, sortProduce(map.get(storage)!, sort)]);
        map.delete(storage);
      }
    }
    for (const [storage, items] of Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      sections.push([storage, sortProduce(items, sort)]);
    }

    return sections;
  }, [filteredSorted, groupByStorage, sort]);

  const clear = () => {
    setSearch('');
    setSort('');
    setGroupByStorage(false);
  };

  const renderContent = () => {
    if (groupByStorage) {
      return view === 'table'
        ? <GroupedSections groups={grouped} view="table" />
        : <GroupedSections groups={grouped} view="cards" />;
    }
    return view === 'table'
      ? <ProduceTable rows={filteredSorted} />
      : <ProduceCardGrid rows={filteredSorted} />;
  };

  return (
    <Container>
      <SearchBarControls
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        groupByStorage={groupByStorage}
        setGroupByStorage={setGroupByStorage}
        view={view}
        setView={setView}
        clear={clear}
      />
      {renderContent()}
    </Container>
  );
};

export default ProduceListWithGrouping;
