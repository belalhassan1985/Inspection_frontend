import { apiFetch } from './api';

export interface RiskLevelOption {
  id: number;
  code: string;
  nameAr: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  severityWeight: number | null;
}

export async function fetchRiskLevelOptions(): Promise<RiskLevelOption[]> {
  const data = await apiFetch('/risk-level-options');
  return Array.isArray(data) ? data : data?.data ?? [];
}

export function getRiskLevelMap(options: RiskLevelOption[]): Record<string, RiskLevelOption> {
  const map: Record<string, RiskLevelOption> = {};
  for (const opt of options) {
    map[opt.code] = opt;
  }
  return map;
}

const iconMap: Record<string, string> = {
  CRITICAL: '🚨',
  HIGH: '🟠',
  MEDIUM: '🟡',
  LOW: '🟢',
};

export function getRiskLevelDisplay(riskMap: Record<string, RiskLevelOption>, code: string): {
  label: string;
  color: string;
  bg: string;
  icon: string;
} {
  const opt = riskMap[code];
  if (opt) {
    return {
      label: opt.nameAr,
      color: opt.color,
      bg: hexToRgba(opt.color, 0.1),
      icon: iconMap[code] || '🔘',
    };
  }
  return { label: code, color: '#718096', bg: 'rgba(113,128,150,0.1)', icon: '🔘' };
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
