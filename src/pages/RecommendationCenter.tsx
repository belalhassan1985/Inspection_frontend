import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KpiSummaryCards } from '../components/recommendation-tracking/KpiSummaryCards';
import type { ApiStatsSummary } from '../components/recommendation-tracking/KpiSummaryCards';
import { FilterSidebar } from '../components/recommendation-tracking/FilterSidebar';
import type { RecommendationFilters } from '../components/recommendation-tracking/FilterSidebar';
import { RecommendationsTable } from '../components/recommendation-tracking/RecommendationsTable';
import { fetchRiskLevelOptions } from '../services/riskLevelService';
import type { RiskLevelOption } from '../services/riskLevelService';

// ————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————

// الـ API يُرجع: { kpis: { total, open, closed, inProgress, completed, overdue, ... } }
// يتم استخدام ApiStatsSummary المُصدَّر من KpiSummaryCards


interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

// ————————————————————————————————————————————————————
// Default Filters
// ————————————————————————————————————————————————————

const DEFAULT_FILTERS: RecommendationFilters = {
  search: '',
  status: '',
  statusIn: undefined,
  statusNotIn: undefined,
  riskLevel: '',
  impactCategory: '',
  overdue: false,
  campaignId: '',
  assignedEntityId: '',
};

const ITEMS_PER_PAGE = 10;

// ————————————————————————————————————————————————————
// Build query string from filters
// ————————————————————————————————————————————————————

function buildQuery(
  filters: RecommendationFilters & { statusIn?: string; statusNotIn?: string },
  page: number,
  limit: number,
  sortField: string,
  sortDir: 'asc' | 'desc',
) {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
    sortField,
    sortDir,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.statusIn) params.statusIn = filters.statusIn;
  if (filters.statusNotIn) params.statusNotIn = filters.statusNotIn;
  if (filters.riskLevel) params.riskLevel = filters.riskLevel;
  if (filters.impactCategory) params.impactCategory = filters.impactCategory;
  if (filters.overdue) params.overdue = 'true';
  if (filters.campaignId) params.campaignId = filters.campaignId;
  if (filters.assignedEntityId) params.assignedEntityId = filters.assignedEntityId;
  return new URLSearchParams(params).toString();
}

// ————————————————————————————————————————————————————
// Page Component
// ————————————————————————————————————————————————————

export const RecommendationCenter: React.FC = () => {
  useAuth(); // ensure auth context is available

  // Stats — نستخدم ApiStatsSummary المتوافق مع الـ response الحقيقي
  const [stats, setStats] = useState<ApiStatsSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Table data
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableMeta, setTableMeta] = useState<PaginationMeta>({
    totalItems: 0,
    itemCount: 0,
    itemsPerPage: ITEMS_PER_PAGE,
    totalPages: 1,
    currentPage: 1,
  });

  // Filters, page, sort
  const [filters, setFilters] = useState<RecommendationFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('recommendationNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [riskLevelOptions, setRiskLevelOptions] = useState<RiskLevelOption[]>([]);

  // Export loading
  const [exporting, setExporting] = useState(false);

  // Debounce timer ref for search
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ————————————————————————————
  // Fetch Stats
  // ————————————————————————————
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch('/recommendations/tracking/stats/summary');
      setStats(res);
    } catch (e) {
      console.error('Failed to load tracking stats:', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ————————————————————————————
  // Fetch Table Data
  // ————————————————————————————
  const fetchTable = useCallback(
    async (
      currentFilters: RecommendationFilters,
      currentPage: number,
      currentSortField: string,
      currentSortDir: 'asc' | 'desc',
    ) => {
      setTableLoading(true);
      try {
        const qs = buildQuery(currentFilters, currentPage, ITEMS_PER_PAGE, currentSortField, currentSortDir);
        const res = await apiFetch(`/recommendations/tracking?${qs}`);
        setTableData(res.data ?? []);
        setTableMeta(res.meta ?? {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: ITEMS_PER_PAGE,
          totalPages: 1,
          currentPage: 1,
        });
      } catch (e) {
        console.error('Failed to load recommendations list:', e);
        setTableData([]);
      } finally {
        setTableLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchRiskLevelOptions().then(opts => setRiskLevelOptions(opts)).catch(() => {});
  }, [fetchStats]);

  useEffect(() => {
    fetchTable(filters, page, sortField, sortDir);
  }, [filters, page, sortField, sortDir, fetchTable]);

  // ————————————————————————————
  // Handlers
  // ————————————————————————————

  const handleFiltersChange = (newFilters: RecommendationFilters) => {
    // Debounce only the search field
    if (newFilters.search !== filters.search) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        setFilters(newFilters);
        setPage(1);
      }, 400);
      // Optimistically update the search text in UI
      setFilters((prev) => ({ ...prev, search: newFilters.search }));
    } else {
      setFilters(newFilters);
      setPage(1);
    }
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter shortcuts from KPI cards
  const handleFilterOverdue = () => {
    setFilters({ ...DEFAULT_FILTERS, overdue: true });
    setPage(1);
  };

  const handleFilterCritical = () => {
    setFilters({ ...DEFAULT_FILTERS, riskLevel: 'CRITICAL' });
    setPage(1);
  };

  const handleFilterHigh = () => {
    setFilters({ ...DEFAULT_FILTERS, riskLevel: 'HIGH' });
    setPage(1);
  };

  const handleFilterOpen = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      statusNotIn: 'CLOSED,VERIFIED,REJECTED',
    });
    setPage(1);
  };

  const handleFilterInProgress = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      statusIn: 'UNDER_PROCESSING,PARTIALLY_COMPLETED',
    });
    setPage(1);
  };

  const handleFilterCompleted = () => {
    setFilters({ ...DEFAULT_FILTERS, status: 'COMPLETED' });
    setPage(1);
  };

  const handleFilterClosed = () => {
    setFilters({ ...DEFAULT_FILTERS, status: 'CLOSED' });
    setPage(1);
  };

  const handleFilterVerified = () => {
    setFilters({ ...DEFAULT_FILTERS, status: 'VERIFIED' });
    setPage(1);
  };

  const handleFilterRejected = () => {
    setFilters({ ...DEFAULT_FILTERS, status: 'REJECTED' });
    setPage(1);
  };

  // ————————————————————————————
  // Export Excel (placeholder — calls same list endpoint with limit=1000)
  // ————————————————————————————
  const handleExport = async () => {
    setExporting(true);
    try {
      const qs = buildQuery(filters, 1, 1000, sortField, sortDir);
      const res = await apiFetch(`/recommendations/tracking?${qs}`);
      const rows: any[] = res.data ?? [];
      if (rows.length === 0) {
        alert('لا توجد بيانات لتصديرها.');
        return;
      }

      // Build CSV
      const headers = [
        'رقم التوصية',
        'مضمون التوصية',
        'الجهة المعنية',
        'الحملة',
        'الحالة',
        'نسبة التقدم',
        'مستوى الخطورة',
        'تصنيف الأثر',
        'تاريخ الاستحقاق',
        'مستوى التصعيد',
      ];
      const csvRows = [
        headers.join(','),
        ...rows.map((r) =>
          [
            r.recommendationNumber,
            `"${(r.recommendation?.recommendationText || '').replace(/"/g, '""')}"`,
            `"${r.assignedEntityNameSnapshot || ''}"`,
            `"${r.campaign?.name || ''}"`,
            r.status,
            r.progressPercent + '%',
            r.riskLevel,
            r.impactCategory,
            r.dueDate ? new Date(r.dueDate).toLocaleDateString('ar-IQ') : '',
            r.escalationLevel,
          ].join(','),
        ),
      ].join('\n');

      const bom = '\uFEFF'; // UTF-8 BOM for Arabic Excel
      const blob = new Blob([bom + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `توصيات_رقابية_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('فشل تصدير البيانات. حاول مرة أخرى.');
    } finally {
      setExporting(false);
    }
  };

  // ————————————————————————————
  // Render
  // ————————————————————————————


  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      {/* ─────────── Page Header ─────────── */}
      <div
        className="page-header"
        style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h1
            className="page-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            🏛️ مركز معالجة ومتابعة التوصيات الرقابية
          </h1>
          <p className="page-subtitle" style={{ marginTop: '6px' }}>
            متابعة دورة حياة التوصيات الرقابية الصادرة من الحملات التفتيشية ورصد حالة تنفيذها.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-outline"
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              fontSize: '13px',
              fontFamily: 'Cairo, sans-serif',
              padding: '9px 16px',
            }}
          >
            {exporting ? '⏳ جاري التصدير...' : '📂 تصدير CSV'}
          </button>
          <button
            onClick={() => { fetchStats(); fetchTable(filters, page, sortField, sortDir); }}
            className="btn-outline"
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              fontSize: '13px',
              fontFamily: 'Cairo, sans-serif',
              padding: '9px 16px',
            }}
          >
            🔄 تحديث
          </button>
        </div>
      </div>

      {/* ─────────── KPI Cards ─────────── */}
      <KpiSummaryCards
        stats={stats}
        loading={statsLoading}
        onFilterOverdue={handleFilterOverdue}
        onFilterCritical={handleFilterCritical}
        onFilterHigh={handleFilterHigh}
        onFilterOpen={handleFilterOpen}
        onFilterInProgress={handleFilterInProgress}
        onFilterCompleted={handleFilterCompleted}
        onFilterVerified={handleFilterVerified}
        onFilterClosed={handleFilterClosed}
        onFilterRejected={handleFilterRejected}
      />

      {/* ─────────── Horizontal Filters ─────────── */}
      <FilterSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
        riskLevelOptions={riskLevelOptions}
      />

      {/* ─────────── Search Bar ─────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          width: '100%',
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: '#718096',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="ابحث برقم التوصية، اسم الجهة، أو مضمون التوصية..."
            value={filters.search}
            onChange={(e) =>
              handleFiltersChange({ ...filters, search: e.target.value })
            }
            style={{
              width: '100%',
              padding: '11px 42px 11px 14px',
              border: '1px solid #cbd5e0',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'Cairo, sans-serif',
              backgroundColor: '#fff',
              color: '#1a202c',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0c2340';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(12,35,64,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          />
          {filters.search && (
            <button
              onClick={() => handleFiltersChange({ ...filters, search: '' })}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#a0aec0',
                fontFamily: 'Cairo, sans-serif',
                padding: '2px',
              }}
              title="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>

        {/* Active filters count pill */}
        {(filters.status || filters.riskLevel || filters.impactCategory || filters.overdue || filters.campaignId || filters.assignedEntityId) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(12,35,64,0.07)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0c2340',
              whiteSpace: 'nowrap',
            }}
          >
            🔧 فلاتر نشطة
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#e63946',
                fontSize: '12px',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 700,
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ─────────── Recommendations Table (Full Width) ─────────── */}
      <div style={{ width: '100%' }}>
        <RecommendationsTable
          data={tableData}
          loading={tableLoading}
          totalItems={tableMeta.totalItems}
          currentPage={tableMeta.currentPage}
          totalPages={tableMeta.totalPages}
          itemsPerPage={tableMeta.itemsPerPage}
          onPageChange={handlePageChange}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          riskLevelOptions={riskLevelOptions}
        />
      </div>
    </div>
  );
};
