import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import type { RiskLevelOption } from '../../services/riskLevelService';

type RecommendationStatus =
  | 'ISSUED'
  | 'FORWARDED'
  | 'UNDER_PROCESSING'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'NEEDS_CLARIFICATION'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REJECTED'
  | 'OVERDUE';

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ImpactCategory =
  | 'SECURITY'
  | 'OPERATIONAL'
  | 'ADMINISTRATIVE'
  | 'FINANCIAL'
  | 'HUMAN_RESOURCES'
  | 'LOGISTICAL'
  | 'TECHNICAL'
  | 'LEGAL';

export interface RecommendationFilters {
  search: string;
  status: RecommendationStatus | '';
  statusIn?: string;
  statusNotIn?: string;
  riskLevel: RiskLevel | '';
  impactCategory: ImpactCategory | '';
  overdue: boolean;
  campaignId: string;
  assignedEntityId: string;
}

interface FilterSidebarProps {
  filters: RecommendationFilters;
  onFiltersChange: (filters: RecommendationFilters) => void;
  onReset: () => void;
  riskLevelOptions: RiskLevelOption[];
}

const statusLabels: Record<RecommendationStatus, string> = {
  ISSUED: '⚪ صادرة (جديدة)',
  FORWARDED: '🔵 محالة للجهة',
  UNDER_PROCESSING: '🟡 قيد المعالجة',
  PARTIALLY_COMPLETED: '🌗 منجزة جزئياً',
  COMPLETED: '🟠 منجزة من الجهة',
  NEEDS_CLARIFICATION: '❓ بحاجة لتوضيح',
  VERIFIED: '🟣 تم التحقق منها',
  CLOSED: '🟢 مغلقة ومعتمدة',
  REJECTED: '❌ مرفوضة',
  OVERDUE: '🔴 متأخرة عن الاستحقاق',
};

const impactLabels: Record<ImpactCategory, string> = {
  SECURITY: '🛡️ أمني',
  OPERATIONAL: '⚙️ تشغيلي',
  ADMINISTRATIVE: '📋 إداري',
  FINANCIAL: '💰 مالي',
  HUMAN_RESOURCES: '👥 موارد بشرية',
  LOGISTICAL: '🚛 لوجستي',
  TECHNICAL: '🔧 تقني',
  LEGAL: '⚖️ قانوني',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4a5568',
  marginBottom: '6px',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #cbd5e0',
  borderRadius: '8px',
  fontSize: '13px',
  backgroundColor: '#fff',
  color: '#1a202c',
  fontFamily: 'Cairo, sans-serif',
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFiltersChange,
  onReset,
  riskLevelOptions,
}) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);

  useEffect(() => {
    // جلب الحملات للفلترة
    apiFetch('/campaigns?limit=100')
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data ?? [];
        setCampaigns(data);
      })
      .catch(() => setCampaigns([]));

    // جلب الجهات للفلترة
    apiFetch('/entities?limit=200')
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data ?? [];
        setEntities(data);
      })
      .catch(() => setEntities([]));
  }, []);

  const set = (field: keyof RecommendationFilters, value: any) => {
    const updated = { ...filters, [field]: value };
    if (field === 'status' && value !== filters.status) {
      delete updated.statusIn;
      delete updated.statusNotIn;
    }
    onFiltersChange(updated);
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.statusIn ||
    filters.statusNotIn ||
    filters.riskLevel ||
    filters.impactCategory ||
    filters.overdue ||
    filters.campaignId ||
    filters.assignedEntityId;

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #edf2f7',
          paddingBottom: '8px',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0c2340' }}>🔧 خيارات التصفية</span>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            style={{
              background: 'none',
              border: 'none',
              color: '#e63946',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '6px',
              fontFamily: 'Cairo, sans-serif',
            }}
            title="إعادة تعيين كل الفلاتر"
          >
            ✕ إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Grid container for filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          alignItems: 'end',
        }}
      >
        {/* حالة التوصية */}
        <div>
          <label style={labelStyle}>حالة التوصية</label>
          <select
            value={filters.status}
            onChange={(e) => set('status', e.target.value)}
            style={selectStyle}
          >
            <option value="">— الكل —</option>
            {(Object.entries(statusLabels) as [RecommendationStatus, string][]).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* مستوى الخطورة */}
        <div>
          <label style={labelStyle}>مستوى الخطورة</label>
          <select
            value={filters.riskLevel}
            onChange={(e) => set('riskLevel', e.target.value)}
            style={selectStyle}
          >
            <option value="">— الكل —</option>
            {riskLevelOptions.filter(o => o.isActive).map(opt => (
              <option key={opt.code} value={opt.code}>{opt.nameAr}</option>
            ))}
          </select>
        </div>

        {/* تصنيف الأثر */}
        <div>
          <label style={labelStyle}>تصنيف الأثر</label>
          <select
            value={filters.impactCategory}
            onChange={(e) => set('impactCategory', e.target.value)}
            style={selectStyle}
          >
            <option value="">— الكل —</option>
            {(Object.entries(impactLabels) as [ImpactCategory, string][]).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* الحملة التفتيشية */}
        <div>
          <label style={labelStyle}>الحملة التفتيشية</label>
          <select
            value={filters.campaignId}
            onChange={(e) => set('campaignId', e.target.value)}
            style={selectStyle}
          >
            <option value="">— الكل —</option>
            {campaigns.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* الجهة المعنية */}
        {entities.length > 0 && (
          <div>
            <label style={labelStyle}>الجهة المعنية</label>
            <select
              value={filters.assignedEntityId}
              onChange={(e) => set('assignedEntityId', e.target.value)}
              style={selectStyle}
            >
              <option value="">— الكل —</option>
              {entities.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* متأخرة فقط */}
        <div
          onClick={() => set('overdue', !filters.overdue)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            backgroundColor: filters.overdue ? 'rgba(239, 68, 68, 0.08)' : '#f8fafc',
            border: `1px solid ${filters.overdue ? '#ef4444' : '#e2e8f0'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '38px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              border: `2px solid ${filters.overdue ? '#ef4444' : '#cbd5e0'}`,
              backgroundColor: filters.overdue ? '#ef4444' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {filters.overdue && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: filters.overdue ? '#ef4444' : '#4a5568' }}>
            ⏰ المتأخرة فقط
          </span>
        </div>
      </div>

      {/* بيان الفلاتر النشطة */}
      {hasActiveFilters && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(12, 35, 64, 0.04)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#0c2340',
            fontWeight: 600,
          }}
        >
          ℹ️ الفلاتر النشطة مطبّقة على نتائج الجدول.
        </div>
      )}
    </div>
  );
};
