import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import ministryLogo from '../assets/images/ministry-logo.png';
import {
  getLevel1Number,
  getLevel2ArabicLetter,
  getLevel3Ordinal,
  getLevel4Number,
  getLevel5ArabicLetter,
  getIndentation,
  DEFAULT_FORMATTING_CONFIG,
} from '../utils/reportNumbering';const parseCommitteeMember = (member: string) => {
  const cleanMember = member.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim();
  const parts = cleanMember.split(/\s{2,}/);
  if (parts.length >= 2) {
    return {
      name: parts[0].trim(),
      role: parts.slice(1).join(' ').trim(),
    };
  }
  const roles = [
    'رئيس اللجنة',
    'رئيـس اللجنة',
    'معاون اللجنة',
    'معـاون اللجنة',
    'عضو اللجنة',
    'عضو',
    'عضواً',
    'عضـــــــــواً',
  ];
  for (const role of roles) {
    if (cleanMember.endsWith(role)) {
      const name = cleanMember.substring(0, cleanMember.length - role.length).trim();
      return { name, role };
    }
  }
  return { name: cleanMember, role: '' };
};

export const Reports: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [reportPayload, setReportPayload] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadInitialData() {
      try {
        const campsData = await apiFetch('/campaigns');
        setCampaigns(campsData);
      } catch (e: any) {
        setError(e.message || 'فشل تحميل البيانات الأساسية');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleCampaignChange = async (campId: string) => {
    setSelectedCampId(campId);
    setReportPayload(null);
    setEditMode(false);
    setSuccessMsg('');
    setError('');
    if (!campId) return;

    setLoading(true);
    try {
      const data = await apiFetch(`/reports/campaign/${campId}/payload`);
      setReportPayload(data);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات تقرير الحملة');
    } finally {
      setLoading(false);
    }
  };

  const savePresentation = async () => {
    if (!selectedCampId || !reportPayload) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await apiFetch(`/reports/campaign/${selectedCampId}/presentation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportPayload),
      });
      setSuccessMsg('تم حفظ التعديلات على عرض التقرير بنجاح.');
      // Reload payload
      const data = await apiFetch(`/reports/campaign/${selectedCampId}/payload`);
      setReportPayload(data);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!selectedCampId) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في إعادة التعيين وحذف كافة التعديلات المخصصة؟ سيتم إعادة بناء التقرير بالكامل من درجات التفتيش الأساسية.')) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await apiFetch(`/reports/campaign/${selectedCampId}/presentation`, {
        method: 'DELETE',
      });
      setSuccessMsg('تمت إعادة تعيين التقرير للأصل بنجاح.');
      const data = await apiFetch(`/reports/campaign/${selectedCampId}/payload`);
      setReportPayload(data);
      setEditMode(false);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء إعادة التعيين.');
    } finally {
      setLoading(false);
    }
  };

  const rebuildReportFromLatest = async () => {
    if (!selectedCampId) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في إعادة بناء التقرير؟ سيتم مسح التعديلات المخصصة واستيراد كافة درجات وخيارات التفتيش المدخلة حديثاً.')) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await apiFetch(`/reports/campaign/${selectedCampId}/presentation`, {
        method: 'DELETE',
      });
      setSuccessMsg('تم إعادة بناء التقرير من أحدث بيانات التفتيش بنجاح.');
      const data = await apiFetch(`/reports/campaign/${selectedCampId}/payload`);
      setReportPayload(data);
      setEditMode(false);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء إعادة بناء التقرير.');
    } finally {
      setLoading(false);
    }
  };


  const restoreVersion = (versionData: any) => {
    if (!versionData || !versionData.payload) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في استعادة هذه النسخة المؤرشفة؟ سيتم استبدال العرض الحالي مؤقتاً، ويجب الضغط على زر "حفظ التعديلات" لاعتماده بشكل دائم.')) return;
    
    setReportPayload({
      ...versionData.payload,
      history: reportPayload?.history || [],
      hasSavedPresentation: true,
      restoredFromHistory: true,
    });
    setSuccessMsg('تمت استعادة النسخة المؤرشفة مؤقتاً. الرجاء مراجعتها وحفظ التعديلات لحفظها بشكل دائم.');
  };

  const downloadPdf = async () => {
    if (!selectedCampId || !reportPayload) return;
    setDownloading(true);
    setError('');
    try {
      const blob: Blob = await apiFetch(`/reports/campaign/${selectedCampId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportPayload),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `تقرير_تفتيش_رسمي_${selectedCampId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل التقرير بصيغة PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadWord = async () => {
    if (!selectedCampId || !reportPayload) return;
    setDownloading(true);
    setError('');
    try {
      const blob: Blob = await apiFetch(`/reports/campaign/${selectedCampId}/word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportPayload),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `تقرير_تفتيش_رسمي_${selectedCampId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل التقرير بصيغة Word.');
    } finally {
      setDownloading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  // State manipulation helpers for inline editing
  const updatePayloadField = (field: string, value: any) => {
    if (!reportPayload) return;
    setReportPayload({
      ...reportPayload,
      [field]: value,
    });
  };

  const updateSignatureField = (field: string, value: any) => {
    if (!reportPayload) return;
    setReportPayload({
      ...reportPayload,
      signatures: {
        ...reportPayload.signatures,
        [field]: value,
      },
    });
  };

  const updateCommitteeMember = (index: number, value: string) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.committeeMembers];
    updated[index] = value;
    setReportPayload({
      ...reportPayload,
      committeeMembers: updated,
    });
  };

  const addCommitteeMember = () => {
    if (!reportPayload) return;
    setReportPayload({
      ...reportPayload,
      committeeMembers: [...reportPayload.committeeMembers, 'الرتبة / الاسم الكامل &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; عضواً'],
    });
  };

  const removeCommitteeMember = (index: number) => {
    if (!reportPayload) return;
    const updated = reportPayload.committeeMembers.filter((_: any, idx: number) => idx !== index);
    setReportPayload({
      ...reportPayload,
      committeeMembers: updated,
    });
  };

  const updatePositionField = (index: number, field: string, value: any) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.positions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setReportPayload({
      ...reportPayload,
      positions: updated,
    });
  };

  const addPositionRow = () => {
    if (!reportPayload) return;
    const newPos = {
      id: `new-${Date.now()}`,
      positionName: 'منصب جديد',
      rank: '—',
      positionHolder: '—',
      statisticalNumber: '—',
      joinedDate: '',
      positionStatus: 'اصالة',
      education: '—',
      notes: '—',
    };
    setReportPayload({
      ...reportPayload,
      positions: [...reportPayload.positions, newPos],
    });
  };

  const removePositionRow = (index: number) => {
    if (!reportPayload) return;
    const updated = reportPayload.positions.filter((_: any, idx: number) => idx !== index);
    setReportPayload({
      ...reportPayload,
      positions: updated,
    });
  };

  const updatePersonnelRowField = (index: number, field: string, value: any) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.personnelRows];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setReportPayload({
      ...reportPayload,
      personnelRows: updated,
    });
  };

  const addPersonnelRow = () => {
    if (!reportPayload) return;
    const newRow = {
      category: 'فئة جديدة',
      nominal: 0,
      actual: 0,
      increase: 0,
      deficit: 0,
      percentage: 0,
    };
    setReportPayload({
      ...reportPayload,
      personnelRows: [...reportPayload.personnelRows, newRow],
    });
  };

  const removePersonnelRow = (index: number) => {
    if (!reportPayload) return;
    const updated = reportPayload.personnelRows.filter((_: any, idx: number) => idx !== index);
    setReportPayload({
      ...reportPayload,
      personnelRows: updated,
    });
  };

  const updateEvaluationField = (index: number, field: string, value: any) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.evaluations];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setReportPayload({
      ...reportPayload,
      evaluations: updated,
    });
  };

  const updateSectionField = (secIndex: number, field: string, value: any) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.sections];
    updated[secIndex] = {
      ...updated[secIndex],
      [field]: value,
    };
    setReportPayload({
      ...reportPayload,
      sections: updated,
    });
  };

  const updateSubsectionField = (secIndex: number, subIndex: number, field: string, value: any) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const updatedSubsections = [...updatedSections[secIndex].subsections];
    updatedSubsections[subIndex] = {
      ...updatedSubsections[subIndex],
      [field]: value,
    };
    updatedSections[secIndex] = {
      ...updatedSections[secIndex],
      subsections: updatedSubsections,
    };
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const handleDetailedTableCellChange = (
    secIdx: number,
    subIdx: number,
    tableIdx: number,
    rowIdx: number,
    colKey: string,
    value: any
  ) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const subsections = [...updatedSections[secIdx].subsections];
    const detailedTables = [...subsections[subIdx].detailedTables];
    const table = { ...detailedTables[tableIdx] };
    const rows = [...table.rows];
    const row = { ...rows[rowIdx] };

    const schema = table.schema || [];
    const nominalCol = schema.find((c: any) => c.role === 'nominal');
    const actualCol = schema.find((c: any) => c.role === 'actual');
    const deficitCol = schema.find((c: any) => c.role === 'deficit');
    const increaseCol = schema.find((c: any) => c.role === 'increase');
    const percentageCol = schema.find((c: any) => c.role === 'percentage');

    const nominalKey = nominalCol?.key || 'nominal';
    const actualKey = actualCol?.key || 'actual';
    const deficitKey = deficitCol?.key || 'deficit';
    const increaseKey = increaseCol?.key || 'increase';
    const percentageKey = percentageCol?.key || 'percentage';

    const colType = schema.find((c: any) => c.key === colKey)?.type;
    let parsedVal = value;
    if (colType === 'number' || colType === 'percentage') {
      parsedVal = value === '' ? '' : (parseFloat(value) || 0);
    }
    row[colKey] = parsedVal;

    if (colKey === nominalKey || colKey === actualKey) {
      const nominalVal = parseFloat(row[nominalKey]) || 0;
      const actualVal = parseFloat(row[actualKey]) || 0;

      if (deficitCol) {
        row[deficitKey] = Math.max(0, nominalVal - actualVal);
      }
      if (increaseCol) {
        row[increaseKey] = Math.max(0, actualVal - nominalVal);
      }
      if (percentageCol) {
        row[percentageKey] = nominalVal > 0 ? Math.round((actualVal / nominalVal) * 100) : 0;
      }
    }

    rows[rowIdx] = row;
    table.rows = rows;
    detailedTables[tableIdx] = table;
    subsections[subIdx].detailedTables = detailedTables;
    updatedSections[secIdx].subsections = subsections;

    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const addDetailedTableRow = (secIdx: number, subIdx: number, tableIdx: number) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const subsections = [...updatedSections[secIdx].subsections];
    const detailedTables = [...subsections[subIdx].detailedTables];
    const table = { ...detailedTables[tableIdx] };
    const rows = [...table.rows];

    const newRow: Record<string, any> = {};
    table.schema.forEach((col: any) => {
      if (col.role === 'label') {
        newRow[col.key] = 'بند جديد';
      } else if (col.type === 'number' || col.type === 'percentage') {
        newRow[col.key] = 0;
      } else {
        newRow[col.key] = '';
      }
    });

    rows.push(newRow);
    table.rows = rows;
    detailedTables[tableIdx] = table;
    subsections[subIdx].detailedTables = detailedTables;
    updatedSections[secIdx].subsections = subsections;

    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const removeDetailedTableRow = (secIdx: number, subIdx: number, tableIdx: number, rowIdx: number) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const subsections = [...updatedSections[secIdx].subsections];
    const detailedTables = [...subsections[subIdx].detailedTables];
    const table = { ...detailedTables[tableIdx] };
    const rows = table.rows.filter((_: any, idx: number) => idx !== rowIdx);

    table.rows = rows;
    detailedTables[tableIdx] = table;
    subsections[subIdx].detailedTables = detailedTables;
    updatedSections[secIdx].subsections = subsections;

    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const updateFindingListItem = (secIndex: number, subIndex: number, listType: string, itemIdx: number, value: string) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    if (updatedSections[secIndex].isManual) {
      const listName = `${listType}List`;
      const list = [...updatedSections[secIndex][listName]];
      list[itemIdx] = value;
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        [listName]: list,
      };
    } else {
      const updatedSubsections = [...updatedSections[secIndex].subsections];
      const listName = `${listType}List`;
      const list = [...updatedSubsections[subIndex][listName]];
      list[itemIdx] = value;
      updatedSubsections[subIndex] = {
        ...updatedSubsections[subIndex],
        [listName]: list,
      };
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        subsections: updatedSubsections,
      };
    }
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const addFindingListItem = (secIndex: number, subIndex: number, listType: string) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const listName = `${listType}List`;
    const showFlag = `show${listType.charAt(0).toUpperCase() + listType.slice(1)}`;
    
    if (updatedSections[secIndex].isManual) {
      const list = [...(updatedSections[secIndex][listName] || [])];
      list.push('بند جديد مضاف يدوياً...');
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        [listName]: list,
        [showFlag]: true,
      };
    } else {
      const updatedSubsections = [...updatedSections[secIndex].subsections];
      const list = [...(updatedSubsections[subIndex][listName] || [])];
      list.push('بند جديد مضاف يدوياً...');
      updatedSubsections[subIndex] = {
        ...updatedSubsections[subIndex],
        [listName]: list,
        [showFlag]: true,
      };
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        subsections: updatedSubsections,
      };
    }
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const removeFindingListItem = (secIndex: number, subIndex: number, listType: string, itemIdx: number) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const listName = `${listType}List`;
    
    if (updatedSections[secIndex].isManual) {
      const list = updatedSections[secIndex][listName].filter((_: any, idx: number) => idx !== itemIdx);
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        [listName]: list,
      };
    } else {
      const updatedSubsections = [...updatedSections[secIndex].subsections];
      const list = updatedSubsections[subIndex][listName].filter((_: any, idx: number) => idx !== itemIdx);
      updatedSubsections[subIndex] = {
        ...updatedSubsections[subIndex],
        [listName]: list,
      };
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        subsections: updatedSubsections,
      };
    }
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const moveFindingListItemUp = (secIndex: number, subIndex: number, listType: string, itemIdx: number) => {
    if (itemIdx === 0 || !reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const listName = `${listType}List`;
    
    if (updatedSections[secIndex].isManual) {
      const list = [...updatedSections[secIndex][listName]];
      const temp = list[itemIdx];
      list[itemIdx] = list[itemIdx - 1];
      list[itemIdx - 1] = temp;
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        [listName]: list,
      };
    } else {
      const updatedSubsections = [...updatedSections[secIndex].subsections];
      const list = [...updatedSubsections[subIndex][listName]];
      const temp = list[itemIdx];
      list[itemIdx] = list[itemIdx - 1];
      list[itemIdx - 1] = temp;
      updatedSubsections[subIndex] = {
        ...updatedSubsections[subIndex],
        [listName]: list,
      };
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        subsections: updatedSubsections,
      };
    }
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const moveFindingListItemDown = (secIndex: number, subIndex: number, listType: string, itemIdx: number) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const listName = `${listType}List`;
    
    if (updatedSections[secIndex].isManual) {
      const list = [...updatedSections[secIndex][listName]];
      if (itemIdx === list.length - 1) return;
      const temp = list[itemIdx];
      list[itemIdx] = list[itemIdx + 1];
      list[itemIdx + 1] = temp;
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        [listName]: list,
      };
    } else {
      const updatedSubsections = [...updatedSections[secIndex].subsections];
      const list = [...updatedSubsections[subIndex][listName]];
      if (itemIdx === list.length - 1) return;
      const temp = list[itemIdx];
      list[itemIdx] = list[itemIdx + 1];
      list[itemIdx + 1] = temp;
      updatedSubsections[subIndex] = {
        ...updatedSubsections[subIndex],
        [listName]: list,
      };
      updatedSections[secIndex] = {
        ...updatedSections[secIndex],
        subsections: updatedSubsections,
      };
    }
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const updateRecommendationGroup = (grpIdx: number, field: string, value: any) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.recommendations];
    updated[grpIdx] = {
      ...updated[grpIdx],
      [field]: value,
    };
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const updateRecommendationText = (grpIdx: number, recIdx: number, value: string) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.recommendations];
    const recs = [...updated[grpIdx].recs];
    recs[recIdx] = {
      ...recs[recIdx],
      text: value,
    };
    updated[grpIdx] = {
      ...updated[grpIdx],
      recs,
    };
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const addRecommendation = (grpIdx: number) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.recommendations];
    const recs = [...(updated[grpIdx].recs || [])];
    recs.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      text: 'توصية جديدة مضافة...',
      children: [],
    });
    updated[grpIdx] = {
      ...updated[grpIdx],
      recs,
      visible: true,
    };
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const removeRecommendation = (grpIdx: number, recIdx: number) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.recommendations];
    const recs = updated[grpIdx].recs.filter((_: any, idx: number) => idx !== recIdx);
    updated[grpIdx] = {
      ...updated[grpIdx],
      recs,
    };
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const addRecommendationGroup = () => {
    if (!reportPayload) return;
    const newGrp = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      authority: 'جهة جديدة لم يسبق إضافتها',
      visible: true,
      recs: [{
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        text: 'توصية أولى للجهة الجديدة...',
        children: [],
      }],
    };
    setReportPayload({
      ...reportPayload,
      recommendations: [...reportPayload.recommendations, newGrp],
    });
  };

  const removeRecommendationGroup = (grpIdx: number) => {
    if (!reportPayload) return;
    const updated = reportPayload.recommendations.filter((_: any, idx: number) => idx !== grpIdx);
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const updateAppendixField = (idx: number, field: string, value: any) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.appendices];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    setReportPayload({
      ...reportPayload,
      appendices: updated,
    });
  };

  const addAppendix = () => {
    if (!reportPayload) return;
    const newApp = {
      id: `app-${Date.now()}`,
      symbol: 'أ',
      text: 'محتوى الملحق الجديد...',
      visible: true,
    };
    setReportPayload({
      ...reportPayload,
      appendices: [...reportPayload.appendices, newApp],
    });
  };

  const removeAppendix = (idx: number) => {
    if (!reportPayload) return;
    const updated = reportPayload.appendices.filter((_: any, i: number) => i !== idx);
    setReportPayload({
      ...reportPayload,
      appendices: updated,
    });
  };

  const addCustomSection = () => {
    if (!reportPayload) return;
    const newSec = {
      id: `custom-sec-${Date.now()}`,
      title: 'قسم رئيسي مخصص جديد',
      visible: true,
      isManual: true,
      positivesList: ['بند إيجابي أول...'],
      negativesList: ['بند سلبي أول...'],
      impedimentsList: [],
      obstaclesList: [],
      showPositives: true,
      showNegatives: true,
      showImpediments: false,
      showObstacles: false,
      narrativeText: '',
      numbering: '',
    };
    setReportPayload({
      ...reportPayload,
      sections: [...reportPayload.sections, newSec],
    });
  };

  const deleteSection = (secIdx: number) => {
    if (!reportPayload) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا القسم بالكامل من عرض التقرير؟')) return;
    const updated = reportPayload.sections.filter((_: any, idx: number) => idx !== secIdx);
    setReportPayload({
      ...reportPayload,
      sections: updated,
    });
  };

  const moveSectionUp = (idx: number) => {
    if (idx === 0 || !reportPayload) return;
    const updated = [...reportPayload.sections];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setReportPayload({
      ...reportPayload,
      sections: updated,
    });
  };

  const moveSectionDown = (idx: number) => {
    if (!reportPayload || idx === reportPayload.sections.length - 1) return;
    const updated = [...reportPayload.sections];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setReportPayload({
      ...reportPayload,
      sections: updated,
    });
  };

  const addCustomSubsection = (secIndex: number) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const subsections = updatedSections[secIndex].subsections || [];
    const newSub = {
      id: `custom-sub-${Date.now()}`,
      title: 'قسم فرعي مخصص جديد',
      visible: true,
      earnedSum: 0,
      maxSum: 0,
      detailsList: [],
      positivesList: ['بند إيجابي فرعي أول...'],
      negativesList: [],
      impedimentsList: [],
      obstaclesList: [],
      showDetails: false,
      showPositives: true,
      showNegatives: false,
      showImpediments: false,
      showObstacles: false,
      narrativeText: '',
      numbering: '',
    };
    updatedSections[secIndex] = {
      ...updatedSections[secIndex],
      subsections: [...subsections, newSub],
    };
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const deleteSubsection = (secIndex: number, subIndex: number) => {
    if (!reportPayload) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا القسم الفرعي بالكامل من التقرير؟')) return;
    const updatedSections = [...reportPayload.sections];
    const subsections = updatedSections[secIndex].subsections.filter((_: any, idx: number) => idx !== subIndex);
    updatedSections[secIndex] = {
      ...updatedSections[secIndex],
      subsections,
    };
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const moveSubsectionUp = (secIdx: number, subIdx: number) => {
    if (subIdx === 0 || !reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const updatedSubsections = [...updatedSections[secIdx].subsections];
    const temp = updatedSubsections[subIdx];
    updatedSubsections[subIdx] = updatedSubsections[subIdx - 1];
    updatedSubsections[subIdx - 1] = temp;
    updatedSections[secIdx] = {
      ...updatedSections[secIdx],
      subsections: updatedSubsections,
    };
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const moveSubsectionDown = (secIdx: number, subIdx: number) => {
    if (!reportPayload) return;
    const updatedSections = [...reportPayload.sections];
    const subsections = updatedSections[secIdx].subsections || [];
    if (subIdx === subsections.length - 1) return;
    const updatedSubsections = [...subsections];
    const temp = updatedSubsections[subIdx];
    updatedSubsections[subIdx] = updatedSubsections[subIdx + 1];
    updatedSubsections[subIdx + 1] = temp;
    updatedSections[secIdx] = {
      ...updatedSections[secIdx],
      subsections: updatedSubsections,
    };
    setReportPayload({
      ...reportPayload,
      sections: updatedSections,
    });
  };

  const moveRecommendationGroupUp = (idx: number) => {
    if (idx === 0 || !reportPayload) return;
    const updated = [...reportPayload.recommendations];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const moveRecommendationGroupDown = (idx: number) => {
    if (!reportPayload || idx === reportPayload.recommendations.length - 1) return;
    const updated = [...reportPayload.recommendations];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const moveRecommendationUp = (grpIdx: number, recIdx: number) => {
    if (recIdx === 0 || !reportPayload) return;
    const updated = [...reportPayload.recommendations];
    const recs = [...updated[grpIdx].recs];
    const temp = recs[recIdx];
    recs[recIdx] = recs[recIdx - 1];
    recs[recIdx - 1] = temp;
    updated[grpIdx] = {
      ...updated[grpIdx],
      recs,
    };
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const moveRecommendationDown = (grpIdx: number, recIdx: number) => {
    if (!reportPayload) return;
    const updated = [...reportPayload.recommendations];
    const recs = updated[grpIdx].recs || [];
    if (recIdx === recs.length - 1) return;
    const updatedRecs = [...recs];
    const temp = updatedRecs[recIdx];
    updatedRecs[recIdx] = updatedRecs[recIdx + 1];
    updatedRecs[recIdx + 1] = temp;
    updated[grpIdx] = {
      ...updated[grpIdx],
      recs: updatedRecs,
    };
    setReportPayload({
      ...reportPayload,
      recommendations: updated,
    });
  };

  const moveAppendixUp = (idx: number) => {
    if (idx === 0 || !reportPayload) return;
    const updated = [...reportPayload.appendices];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setReportPayload({
      ...reportPayload,
      appendices: updated,
    });
  };

  const moveAppendixDown = (idx: number) => {
    if (!reportPayload || idx === reportPayload.appendices.length - 1) return;
    const updated = [...reportPayload.appendices];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setReportPayload({
      ...reportPayload,
      appendices: updated,
    });
  };


  // Convert Western numerals to Eastern Arabic-Indic numerals (١٢٣...)
  const toArabicDigits = (n: number): string =>
    String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);

  const isEducation = reportPayload?.isEducation === true;
  const formattingConfig = reportPayload?.formatting || DEFAULT_FORMATTING_CONFIG;
  const officialObservationSectionIndex = reportPayload?.sections?.findIndex((sec: any) => sec.id === 'manual-notes' || sec.isManual) ?? -1;
  const officialObservationSection = officialObservationSectionIndex >= 0 ? reportPayload?.sections?.[officialObservationSectionIndex] : null;
  const renderOfficialObservationItems = (items: string[] = [], listType: string) => {
    if (editMode && officialObservationSectionIndex >= 0) {
      return (
        <div style={{ marginRight: getIndentation(3, formattingConfig), marginTop: '6px' }}>
          {items.map((text: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ minWidth: '52px', fontWeight: 'bold', color: '#0c2340' }}>{getLevel3Ordinal(idx + 1, formattingConfig)}</span>
              <input
                type="text"
                value={text}
                onChange={(e) => updateFindingListItem(officialObservationSectionIndex, -1, listType, idx, e.target.value)}
                style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '4px 6px', fontSize: '13px', fontFamily: 'inherit' }}
              />
              <button
                type="button"
                onClick={() => moveFindingListItemUp(officialObservationSectionIndex, -1, listType, idx)}
                disabled={idx === 0}
                className="no-print"
                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                title="نقل للأعلى"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveFindingListItemDown(officialObservationSectionIndex, -1, listType, idx)}
                disabled={idx === items.length - 1}
                className="no-print"
                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                title="نقل للأسفل"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeFindingListItem(officialObservationSectionIndex, -1, listType, idx)}
                className="no-print"
                style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
              >
                حذف
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addFindingListItem(officialObservationSectionIndex, -1, listType)}
            className="btn-outline no-print"
            style={{ padding: '4px 10px', fontSize: '12px', marginTop: '4px' }}
          >
            إضافة بند
          </button>
        </div>
      );
    }

    return items.length > 0 ? (
      items.map((text: string, idx: number) => (
        <div key={idx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', fontSize: '13.5px', textAlign: 'justify' }}>
          {getLevel3Ordinal(idx + 1, formattingConfig)} {text}
        </div>
      ))
    ) : (
      <div style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', fontSize: '13.5px', color: '#718096' }}>
        لا توجد ملاحظات ضمن هذا التصنيف.
      </div>
    );
  };


  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">محرك التقارير والطباعة</h1>
          <p className="page-subtitle">توليد تقارير التفتيش الموحدة بصيغة A4 قياسية مطابقة للمواصفات الرسمية</p>
        </div>
      </div>

      {error && (
        <div className="no-print" style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="no-print" style={{ backgroundColor: 'rgba(72,187,120,0.1)', color: '#2f855a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ✅ {successMsg}
        </div>
      )}

      {reportPayload?.isStale && (
        <div className="no-print" style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#b45309',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div>
            <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>⚠️ تنبيه: تم تحديث بيانات التفتيش الأساسية</strong>
            <span style={{ fontSize: '13px' }}>
              لقد تم تعديل درجات أو خيارات التفتيش لهذه الحملة بعد تاريخ حفظ مسودة التقرير الحالية. قد لا تظهر التعديلات الجديدة في هذا التقرير.
            </span>
          </div>
          <button
            type="button"
            onClick={rebuildReportFromLatest}
            className="btn-primary"
            style={{
              backgroundColor: '#d97706',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            🔄 إعادة بناء التقرير
          </button>
        </div>
      )}

      {/* Select campaign block */}
      <div className="card m-b-20 no-print">
        <div className="form-group" style={{ margin: 0 }}>
          <label>اختر حملة تفتيشية نشطة أو مكتملة لتوليد التقرير:</label>
          <select value={selectedCampId} onChange={(e) => handleCampaignChange(e.target.value)}>
            <option value="">(اختر الحملة التفتيشية)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name} [رقم: {c.formationNumber || 'بلا'}]</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>}

      {reportPayload && (
        <div>
          {/* Action buttons */}
          <div className="flex gap-15 m-b-20 no-print" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
            <div className="flex gap-10" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setEditMode(!editMode)}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: editMode ? 'var(--accent-color)' : '#4a5568',
                  color: '#fff',
                }}
              >
                {editMode ? '👁️ إنهاء التعديل (معاينة)' : '✏️ تعديل التقرير يدوياً'}
              </button>

              {editMode && (
                <>
                  <button
                    onClick={savePresentation}
                    disabled={saving}
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      gap: '8px',
                      padding: '12px 24px',
                      backgroundColor: 'var(--success-color)',
                      color: '#fff',
                    }}
                  >
                    {saving ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                  </button>

                  <button
                    onClick={resetToDefault}
                    className="btn-outline"
                    style={{
                      display: 'inline-flex',
                      gap: '8px',
                      padding: '12px 24px',
                      color: '#c53030',
                      borderColor: '#feb7b7',
                    }}
                  >
                    🔄 إعادة تعيين للأصل
                  </button>
                </>
              )}

              {/* Version History Rollback */}
              {editMode && reportPayload.history && reportPayload.history.length > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>استعادة نسخة سابقة:</label>
                  <select
                    onChange={(e) => {
                      const ver = reportPayload.history.find((h: any) => h.version.toString() === e.target.value);
                      if (ver) restoreVersion(ver);
                      e.target.value = ""; // Reset select
                    }}
                    defaultValue=""
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }}
                  >
                    <option value="" disabled>اختر نسخة مؤرشفة...</option>
                    {reportPayload.history.map((h: any, idx: number) => (
                      <option key={idx} value={h.version}>
                        نسخة {reportPayload.history.length - idx} ({new Date(h.version).toLocaleString('ar-EG')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-10">
              <button
                onClick={printReport}
                className="btn-outline"
                style={{ display: 'inline-flex', gap: '8px', padding: '12px 24px' }}
              >
                🖨️ طباعة التقرير المباشرة
              </button>
              <button
                onClick={downloadPdf}
                disabled={downloading}
                className="btn-primary"
                style={{ display: 'inline-flex', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--success-color)' }}
              >
                {downloading ? 'جاري التحميل...' : '📥 تحميل PDF'}
              </button>
              <button
                onClick={downloadWord}
                disabled={downloading}
                className="btn-primary"
                style={{ display: 'inline-flex', gap: '8px', padding: '12px 24px', backgroundColor: '#2b6cb0' }}
              >
                {downloading ? 'جاري التحميل...' : '📄 تحميل Word'}
              </button>

            </div>
          </div>

          {/* Interactive Print Preview A4 Wrapper */}
          <div className="print-container card" style={{
            maxWidth: '850px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            padding: '50px 40px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            border: '1px solid #cbd5e0',
            fontFamily: "'Cairo', 'Times New Roman', serif",
            lineHeight: 1.7,
            fontSize: '14px',
            direction: 'rtl',
            textAlign: 'right'
          }}>
            
            {/* SPECIALIZED MILITARY CAMPAIGN TEMPLATE */}
            {isEducation ? (
              <div>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                  <div style={{ width: '220px', fontSize: '13px' }}>
                    <strong>جمهورية العراق</strong><br />
                    <strong>وزارة الداخلية</strong><br />
                    <strong>هيئة تفتيش قوى الامن الداخلي</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <img src={ministryLogo} alt="وزارة الداخلية" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
                  </div>
                  <div style={{ width: '220px', fontSize: '13px', textAlign: 'left', direction: 'rtl' }}>
                    {editMode ? (
                      <>
                        <div style={{ marginBottom: '5px' }}>
                          <strong>التاريخ:</strong>{' '}
                          <input
                            type="text"
                            value={reportPayload.startDateText ?? (reportPayload.startDate ? new Date(reportPayload.startDate).toLocaleDateString('ar-EG') : '')}
                            onChange={(e) => updatePayloadField('startDateText', e.target.value)}
                            style={{ border: '1px dashed #cbd5e0', padding: '2px', width: '130px', fontSize: '12px', fontFamily: 'inherit' }}
                          />
                        </div>
                        <div>
                          <strong>العدد:</strong>{' '}
                          <input
                            type="text"
                            value={reportPayload.formationNumber ?? ''}
                            onChange={(e) => updatePayloadField('formationNumber', e.target.value)}
                            style={{ border: '1px dashed #cbd5e0', padding: '2px', width: '130px', fontSize: '12px', fontFamily: 'inherit' }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div><strong>التاريخ:</strong> {reportPayload.startDateText ?? (reportPayload.startDate ? new Date(reportPayload.startDate).toLocaleDateString('ar-EG') : '')}</div>
                        <div><strong>العدد:</strong> {reportPayload.formationNumber || '—'}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Report Title */}
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                  {editMode ? (
                    <input
                      type="text"
                      value={reportPayload.title}
                      onChange={(e) => updatePayloadField('title', e.target.value)}
                      style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        width: '100%',
                        textAlign: 'center',
                        border: '1px dashed #cbd5e0',
                        borderRadius: '4px',
                        padding: '5px',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0', textDecoration: 'underline', textUnderlineOffset: '8px' }}>
                      {reportPayload.title}
                    </h1>
                  )}
                </div>

                {/* 1. التكليف */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="section-num">{getLevel1Number(1, formattingConfig)} التكلـــــيف</h3>
                  <div className="section-body">
                    {editMode ? (
                      <textarea
                        value={reportPayload.assignmentText}
                        onChange={(e) => updatePayloadField('assignmentText', e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          border: '1px dashed #cbd5e0',
                          borderRadius: '4px',
                          padding: '8px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                        }}
                      />
                    ) : (
                      reportPayload.assignmentText
                    )}
                  </div>
                </div>

                {/* 2. التأليف */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="section-num">{getLevel1Number(2, formattingConfig)} التــــأليف</h3>
                  <div className="section-body">
                    {editMode ? (
                      <div>
                        {reportPayload.committeeMembers.map((member: string, idx: number) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <input
                              type="text"
                              value={member.replace(/&nbsp;/g, ' ')}
                              onChange={(e) => updateCommitteeMember(idx, e.target.value)}
                              style={{
                                flex: 1,
                                border: '1px dashed #cbd5e0',
                                borderRadius: '4px',
                                padding: '5px',
                                fontFamily: 'inherit',
                                fontSize: '14px',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeCommitteeMember(idx)}
                              className="no-print"
                              style={{
                                backgroundColor: '#fed7d7',
                                color: '#c53030',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '5px 10px',
                                cursor: 'pointer',
                              }}
                            >
                              حذف
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addCommitteeMember}
                          className="btn-outline no-print"
                          style={{ padding: '6px 12px', fontSize: '12px', marginTop: '5px' }}
                        >
                          ➕ إضافة عضو لجنة
                        </button>
                      </div>
                    ) : (
                      <table style={{ width: '100%', maxWidth: '650px', borderCollapse: 'collapse', border: 'none', marginTop: '10px' }}>
                        <tbody>
                          {reportPayload.committeeMembers.map((member: string, idx: number) => {
                            const parsed = parseCommitteeMember(member);
                            return (
                              <tr key={idx}>
                                <td style={{ border: 'none', padding: '4px 0', fontSize: '15px', width: '60%', textAlign: 'right' }}>
                                  {parsed.name}
                                </td>
                                <td style={{ border: 'none', padding: '4px 0', fontSize: '15px', width: '40%', textAlign: 'right' }}>
                                  {parsed.role}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* 3. الغاية */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 className="section-num">{getLevel1Number(3, formattingConfig)} الغــــاية</h3>
                  <div className="section-body">
                    {editMode ? (
                      <textarea
                        value={reportPayload.purposeText}
                        onChange={(e) => updatePayloadField('purposeText', e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          border: '1px dashed #cbd5e0',
                          borderRadius: '4px',
                          padding: '8px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                        }}
                      />
                    ) : (
                      reportPayload.purposeText
                    )}
                  </div>
                </div>

                {/* 4. تاريخ التفتيش */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="section-num">{getLevel1Number(4, formattingConfig)} تاريخ التفتيش</h3>
                  <div className="section-body">
                    {editMode ? (
                      <input
                        type="text"
                        value={reportPayload.durationText}
                        onChange={(e) => updatePayloadField('durationText', e.target.value)}
                        style={{
                          width: '100%',
                          border: '1px dashed #cbd5e0',
                          borderRadius: '4px',
                          padding: '5px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                        }}
                      />
                    ) : (
                      reportPayload.durationText
                    )}
                  </div>
                </div>

                {/* 5. جدول المدراء والآمرين */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 className="section-num">{getLevel1Number(5, formattingConfig)} جدول المدراء والآمرين وشاغلي المناصب الأساسية</h3>
                  <div className="section-body">
                    <table className="military-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #000' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '5%', fontWeight: 'bold' }}>ت</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '20%', fontWeight: 'bold' }}>المنصب</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>الرتبة</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '15%', fontWeight: 'bold' }}>الاسم الكامل</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>الرقم الإحصائي</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '15%', fontWeight: 'bold' }}>تاريخ إشغال المنصب</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>نوع الإشغال</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>التحصيل الدراسي</th>
                          <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '15%', fontWeight: 'bold' }}>الملاحظات</th>
                          {editMode && <th className="no-print" style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '5%', fontWeight: 'bold' }}>إجراء</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {reportPayload.positions.map((pos: any, index: number) => (
                          <tr key={pos.id}>
                            <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{index + 1}</td>
                            {editMode ? (
                              <>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.positionName}
                                    onChange={(e) => updatePositionField(index, 'positionName', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', fontWeight: 'bold' }}
                                  />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.rank || ''}
                                    onChange={(e) => updatePositionField(index, 'rank', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                                  />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.positionHolder || ''}
                                    onChange={(e) => updatePositionField(index, 'positionHolder', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                                  />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.statisticalNumber || ''}
                                    onChange={(e) => updatePositionField(index, 'statisticalNumber', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                                  />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.joinedDate || ''}
                                    onChange={(e) => updatePositionField(index, 'joinedDate', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                                  />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.positionStatus || ''}
                                    onChange={(e) => updatePositionField(index, 'positionStatus', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                                  />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.education || ''}
                                    onChange={(e) => updatePositionField(index, 'education', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                                  />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #000' }}>
                                  <input
                                    type="text"
                                    value={pos.notes || ''}
                                    onChange={(e) => updatePositionField(index, 'notes', e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                                  />
                                </td>
                                <td className="no-print" style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => removePositionRow(index)}
                                    style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}
                                  >
                                    حذف
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>{pos.positionName}</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.rank || '—'}</td>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>{pos.positionHolder || '—'}</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.statisticalNumber || '—'}</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>
                                  {(() => {
                                    if (!pos.joinedDate) return '—';
                                    const d = new Date(pos.joinedDate);
                                    if (isNaN(d.getTime())) return pos.joinedDate;
                                    return d.toLocaleDateString('ar-EG');
                                  })()}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.positionStatus || '—'}</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.education || '—'}</td>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>{pos.notes || '—'}</td>
                              </>
                            )}
                          </tr>
                        ))}
                        {reportPayload.positions.length === 0 && (
                          <tr>
                            <td colSpan={editMode ? 10 : 9} style={{ padding: '10px', textAlign: 'center', color: '#718096' }}>
                              لا توجد مناصب مسجلة في الهيكل الإداري حالياً.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {editMode && (
                      <div className="no-print" style={{ marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={addPositionRow}
                          className="btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          ➕ إضافة منصب جديد للجدول
                        </button>
                      </div>
                    )}

                  </div>
                </div>

                {/* 6. المواقف الرسمية ونسب التكامل الفعلي */}
                {(reportPayload.personnelRows.length > 0 || editMode) && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 className="section-num">{getLevel1Number(6, formattingConfig)} المواقف الرسمية ونسب التكامل الفعلي</h3>
                    <div className="section-body">
                      <table className="military-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px', border: '1px solid #000' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>الفئة</th>
                            <th style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold', width: '120px' }}>الملاك</th>
                            <th style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold', width: '120px' }}>الموجود</th>
                            <th style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold', width: '100px' }}>الزيادة</th>
                            <th style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold', width: '100px' }}>النقص</th>
                            <th style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold', width: '110px' }}>نسبة التكامل</th>
                            {editMode && <th className="no-print" style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold', width: '80px' }}>إجراء</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {reportPayload.personnelRows.map((row: any, rIdx: number) => {
                            const nominal = row.authorized !== undefined ? row.authorized : (row.nominal || 0);
                            const actual = row.present !== undefined ? row.present : (row.actual || 0);
                            const increase = row.excess !== undefined ? row.excess : Math.max(0, actual - nominal);
                            const deficit = row.shortage !== undefined ? row.shortage : Math.max(0, nominal - actual);
                            const percentage = row.percentage !== undefined ? row.percentage : (nominal > 0 ? (actual / nominal * 100).toFixed(0) : '0');

                            return (
                              <tr key={rIdx}>
                                {editMode ? (
                                  <>
                                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                                      <input
                                        type="text"
                                        value={row.category}
                                        onChange={(e) => updatePersonnelRowField(rIdx, 'category', e.target.value)}
                                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', fontWeight: 'bold', textAlign: 'right' }}
                                      />
                                    </td>
                                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                                      <input
                                        type="number"
                                        value={nominal}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          if (row.authorized !== undefined) updatePersonnelRowField(rIdx, 'authorized', val);
                                          else updatePersonnelRowField(rIdx, 'nominal', val);
                                        }}
                                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                                      />
                                    </td>
                                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                                      <input
                                        type="number"
                                        value={actual}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          if (row.present !== undefined) updatePersonnelRowField(rIdx, 'present', val);
                                          else updatePersonnelRowField(rIdx, 'actual', val);
                                        }}
                                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                                      />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #000', color: '#2b6cb0', fontWeight: 'bold' }}>{increase}</td>
                                    <td style={{ padding: '8px', border: '1px solid #000', color: '#c53030', fontWeight: 'bold' }}>{deficit}</td>
                                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>{parseFloat(percentage).toFixed(1)}%</td>
                                    <td className="no-print" style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={() => removePersonnelRow(rIdx)}
                                        style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}
                                      >
                                        حذف
                                      </button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>{row.category}</td>
                                    <td style={{ padding: '8px', border: '1px solid #000' }}>{nominal}</td>
                                    <td style={{ padding: '8px', border: '1px solid #000' }}>{actual}</td>
                                    <td style={{ padding: '8px', border: '1px solid #000', color: '#2b6cb0', fontWeight: 'bold' }}>{increase}</td>
                                    <td style={{ padding: '8px', border: '1px solid #000', color: '#c53030', fontWeight: 'bold' }}>{deficit}</td>
                                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>{parseFloat(percentage).toFixed(1)}%</td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {editMode && (
                        <div className="no-print" style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={addPersonnelRow}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ➕ إضافة فئة ملاك جديدة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. تفاصيل التفتيش */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 className="section-num">{getLevel1Number(7, formattingConfig)} تفاصيل التفتيش</h3>
                  <div className="section-body">
                    بناءً على التوجيهات الرسمية، تم تجميع وتصنيف كافة نتائج التفتيش الميداني وأسس التقييم والخيارات المرصودة والملاحظات والدرجات للمنطقة الأمنية المعنية بشكل منظم ومبوب كما يلي:
                    <br /><br />
                    {reportPayload.sections?.filter((sec: any) => !sec.isManual && (editMode || (sec.visible && !sec.isEmpty))).length === 0 ? (
                      <div className="card text-center no-print" style={{
                        padding: '40px 20px',
                        backgroundColor: 'rgba(230, 57, 70, 0.05)',
                        border: '2px dashed var(--accent-color)',
                        borderRadius: '12px',
                        color: 'var(--accent-color)',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '20px'
                      }}>
                        <span style={{ fontSize: '36px' }}>⚠️</span>
                        لا توجد أسس مرتبطة بهذا القالب التفتيشي
                      </div>
                    ) : (
                      (() => {
                        let level2Idx = 1;
                        return reportPayload.sections.map((sec: any, sIdx: number) => {
                          if (sec.isManual) return null;
                          if (!sec.visible && !editMode) return null;
                          if (sec.isEmpty && !sec.isManual && !editMode) return null;
                        let manualLevel4Idx = 1;
                        return (
                          <div key={sec.id || sIdx} style={{ marginTop: '25px', marginRight: getIndentation(2, formattingConfig), opacity: sec.visible ? 1 : 0.5 }}>
                            {editMode ? (
                              <div style={{ border: '1px dashed #cbd5e0', padding: '10px', borderRadius: '6px', marginBottom: '15px', backgroundColor: '#fcfcfc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                  <button type="button" onClick={() => moveSectionUp(sIdx)} disabled={sIdx === 0} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬆️</button>
                                  <button type="button" onClick={() => moveSectionDown(sIdx)} disabled={sIdx === reportPayload.sections.length - 1} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬇️</button>
                                  
                                  <input
                                    type="checkbox"
                                    checked={!!sec.visible}
                                    onChange={(e) => updateSectionField(sIdx, 'visible', e.target.checked)}
                                    title="إظهار/إخفاء القسم بالكامل"
                                    style={{ width: 'auto' }}
                                  />
                                  
                                  <input
                                    type="text"
                                    value={sec.numbering || ''}
                                    onChange={(e) => updateSectionField(sIdx, 'numbering', e.target.value)}
                                    placeholder="ترقيم القسم (مثال: أ.)"
                                    style={{ width: '80px', border: '1px dashed #cbd5e0', padding: '4px', fontFamily: 'inherit' }}
                                  />
                                  
                                  <input
                                    type="text"
                                    value={sec.title}
                                    onChange={(e) => updateSectionField(sIdx, 'title', e.target.value)}
                                    style={{
                                      fontWeight: 'bold',
                                      fontSize: '15px',
                                      color: '#0c2340',
                                      border: '1px dashed #cbd5e0',
                                      padding: '4px',
                                      flex: 1,
                                      fontFamily: 'inherit',
                                    }}
                                  />
                                  
                                  {sec.isManual ? (
                                    <div className="no-print" style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                                      <label><input type="checkbox" checked={!!sec.showPositives} onChange={(e) => updateSectionField(sIdx, 'showPositives', e.target.checked)} /> إيجابيات</label>
                                      <label><input type="checkbox" checked={!!sec.showNegatives} onChange={(e) => updateSectionField(sIdx, 'showNegatives', e.target.checked)} /> سلبيات</label>
                                      <label><input type="checkbox" checked={!!sec.showImpediments} onChange={(e) => updateSectionField(sIdx, 'showImpediments', e.target.checked)} /> معوقات</label>
                                      <label><input type="checkbox" checked={!!sec.showObstacles} onChange={(e) => updateSectionField(sIdx, 'showObstacles', e.target.checked)} /> معاضل</label>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => addCustomSubsection(sIdx)}
                                      className="btn-outline no-print"
                                      style={{ padding: '3px 8px', fontSize: '11px' }}
                                    >
                                      ➕ إضافة قسم فرعي
                                    </button>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => deleteSection(sIdx)}
                                    className="no-print"
                                    style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}
                                  >
                                    ❌ حذف
                                  </button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>فقرة السرد النصية للقسم:</label>
                                  <textarea
                                    value={sec.narrativeText || ''}
                                    onChange={(e) => updateSectionField(sIdx, 'narrativeText', e.target.value)}
                                    placeholder="أدخل فقرة سرد نصية هنا تظهر تحت عنوان القسم الرئيسي مباشرة..."
                                    rows={2}
                                    style={{ width: '100%', border: '1px dashed #cbd5e0', padding: '6px', fontSize: '13px', fontFamily: 'inherit' }}
                                  />
                                </div>
                              </div>
                            ) : (
                              sec.visible && (
                                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0c2340', borderBottom: '1.5px solid #0c2340', paddingBottom: '3px', marginBottom: '10px' }}>
                                  {sec.numbering || getLevel2ArabicLetter(level2Idx++, formattingConfig)} {sec.title}
                                </div>
                              )
                            )}

                            {!editMode && sec.visible && sec.narrativeText && (
                              <div style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '15px', fontSize: '13.5px', whiteSpace: 'pre-line', textAlign: 'justify' }}>
                                {sec.narrativeText}
                              </div>
                            )}

                            {sec.isManual ? (
                              <div style={{ marginRight: getIndentation(3, formattingConfig) }}>
                                {(sec.showPositives || editMode) && (
                                  <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#1a5235', marginBottom: '6px' }}>
                                      {getLevel4Number(manualLevel4Idx++, formattingConfig)} الإيجابيات وعوامل القوة العامة:
                                    </div>
                                    {(sec.positivesList || []).map((text: string, idx: number) => (
                                      <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13.5px', marginBottom: '4px', color: '#1a5235', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editMode ? (
                                          <>
                                            <input
                                              type="text"
                                              value={text}
                                              onChange={(e) => updateFindingListItem(sIdx, -1, 'positives', idx, e.target.value)}
                                              style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '13px', fontFamily: 'inherit', color: '#1a5235' }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemUp(sIdx, -1, 'positives', idx)}
                                              disabled={idx === 0}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأعلى"
                                            >
                                              ↑
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemDown(sIdx, -1, 'positives', idx)}
                                              disabled={idx === (sec.positivesList || []).length - 1}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأسفل"
                                            >
                                              ↓
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeFindingListItem(sIdx, -1, 'positives', idx)}
                                              className="no-print"
                                              style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                            >
                                              حذف
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {editMode && (
                                      <button
                                        type="button"
                                        onClick={() => addFindingListItem(sIdx, -1, 'positives')}
                                        className="btn-outline no-print"
                                        style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                      >
                                        ➕ إضافة بند إيجابي
                                      </button>
                                    )}
                                  </div>
                                )}

                                {(sec.showNegatives || editMode) && (
                                  <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#742a2a', marginBottom: '6px' }}>
                                      {getLevel4Number(manualLevel4Idx++, formattingConfig)} السلبيات ونقاط التقصير العامة:
                                    </div>
                                    {(sec.negativesList || []).map((text: string, idx: number) => (
                                      <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13.5px', marginBottom: '4px', color: '#742a2a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editMode ? (
                                          <>
                                            <input
                                              type="text"
                                              value={text}
                                              onChange={(e) => updateFindingListItem(sIdx, -1, 'negatives', idx, e.target.value)}
                                              style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '13px', fontFamily: 'inherit', color: '#742a2a' }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemUp(sIdx, -1, 'negatives', idx)}
                                              disabled={idx === 0}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأعلى"
                                            >
                                              ↑
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemDown(sIdx, -1, 'negatives', idx)}
                                              disabled={idx === (sec.negativesList || []).length - 1}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأسفل"
                                            >
                                              ↓
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeFindingListItem(sIdx, -1, 'negatives', idx)}
                                              className="no-print"
                                              style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                            >
                                              حذف
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {editMode && (
                                      <button
                                        type="button"
                                        onClick={() => addFindingListItem(sIdx, -1, 'negatives')}
                                        className="btn-outline no-print"
                                        style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                      >
                                        ➕ إضافة بند سلبي
                                      </button>
                                    )}
                                  </div>
                                )}

                                {(sec.showImpediments || editMode) && (
                                  <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#7b341e', marginBottom: '6px' }}>
                                      {getLevel4Number(manualLevel4Idx++, formattingConfig)} المعوقات العامة:
                                    </div>
                                    {(sec.impedimentsList || []).map((text: string, idx: number) => (
                                      <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13.5px', marginBottom: '4px', color: '#7b341e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editMode ? (
                                          <>
                                            <input
                                              type="text"
                                              value={text}
                                              onChange={(e) => updateFindingListItem(sIdx, -1, 'impediments', idx, e.target.value)}
                                              style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '13px', fontFamily: 'inherit', color: '#7b341e' }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemUp(sIdx, -1, 'impediments', idx)}
                                              disabled={idx === 0}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأعلى"
                                            >
                                              ↑
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemDown(sIdx, -1, 'impediments', idx)}
                                              disabled={idx === (sec.impedimentsList || []).length - 1}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأسفل"
                                            >
                                              ↓
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeFindingListItem(sIdx, -1, 'impediments', idx)}
                                              className="no-print"
                                              style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                            >
                                              حذف
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {editMode && (
                                      <button
                                        type="button"
                                        onClick={() => addFindingListItem(sIdx, -1, 'impediments')}
                                        className="btn-outline no-print"
                                        style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                      >
                                        ➕ إضافة بند معوقات
                                      </button>
                                    )}
                                  </div>
                                )}

                                {(sec.showObstacles || editMode) && (
                                  <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#5a3e2b', marginBottom: '6px' }}>
                                      {getLevel4Number(manualLevel4Idx++, formattingConfig)} المعاضل العامة:
                                    </div>
                                    {(sec.obstaclesList || []).map((text: string, idx: number) => (
                                      <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13.5px', marginBottom: '4px', color: '#5a3e2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editMode ? (
                                          <>
                                            <input
                                              type="text"
                                              value={text}
                                              onChange={(e) => updateFindingListItem(sIdx, -1, 'obstacles', idx, e.target.value)}
                                              style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '13px', fontFamily: 'inherit', color: '#5a3e2b' }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemUp(sIdx, -1, 'obstacles', idx)}
                                              disabled={idx === 0}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأعلى"
                                            >
                                              ↑
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveFindingListItemDown(sIdx, -1, 'obstacles', idx)}
                                              disabled={idx === (sec.obstaclesList || []).length - 1}
                                              className="no-print"
                                              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                              title="نقل للأسفل"
                                            >
                                              ↓
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeFindingListItem(sIdx, -1, 'obstacles', idx)}
                                              className="no-print"
                                              style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                            >
                                              حذف
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {editMode && (
                                      <button
                                        type="button"
                                        onClick={() => addFindingListItem(sIdx, -1, 'obstacles')}
                                        className="btn-outline no-print"
                                        style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                      >
                                        ➕ إضافة بند معضلة
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ marginRight: getIndentation(3, formattingConfig) }}>
                                {(sec.subsections || []).map((sub: any, subIdx: number) => {
                                  if (!sub.visible && !editMode) return null;
                                  if (sub.isEmpty && !editMode) return null;
                                  let subLevel4Idx = 1;
                                  return (
                                    <div key={sub.id || subIdx} style={{ marginTop: '20px', opacity: sub.visible ? 1 : 0.5 }}>
                                      {editMode ? (
                                        <div style={{ border: '1px dashed #cbd5e0', padding: '10px', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#fafafa' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                            <button type="button" onClick={() => moveSubsectionUp(sIdx, subIdx)} disabled={subIdx === 0} style={{ padding: '1px 4px', fontSize: '11px', cursor: 'pointer' }}>⬆️</button>
                                            <button type="button" onClick={() => moveSubsectionDown(sIdx, subIdx)} disabled={subIdx === sec.subsections.length - 1} style={{ padding: '1px 4px', fontSize: '11px', cursor: 'pointer' }}>⬇️</button>
                                            
                                            <input
                                              type="checkbox"
                                              checked={!!sub.visible}
                                              onChange={(e) => updateSubsectionField(sIdx, subIdx, 'visible', e.target.checked)}
                                              title="إظهار/إخفاء هذا القسم الفرعي"
                                            />
                                            
                                            <input
                                              type="text"
                                              value={sub.numbering || ''}
                                              onChange={(e) => updateSubsectionField(sIdx, subIdx, 'numbering', e.target.value)}
                                              placeholder="ترقيم فرعي (مثال: أولاً.)"
                                              style={{ width: '80px', border: '1px dashed #cbd5e0', padding: '3px', fontSize: '12px', fontFamily: 'inherit' }}
                                            />
                                            
                                            <input
                                              type="text"
                                              value={sub.title}
                                              onChange={(e) => updateSubsectionField(sIdx, subIdx, 'title', e.target.value)}
                                              style={{
                                                fontWeight: 'bold',
                                                fontSize: '14px',
                                                border: '1px dashed #cbd5e0',
                                                padding: '3px',
                                                flex: 1,
                                                fontFamily: 'inherit',
                                              }}
                                            />

                                            <span style={{ fontSize: '12px', color: '#4a5568' }}>
                                              (الدرجة المستحصلة: {parseFloat(sub.earnedSum || 0).toFixed(1)} من {parseFloat(sub.maxSum || 0).toFixed(1)})
                                            </span>

                                            <button
                                              type="button"
                                              onClick={() => deleteSubsection(sIdx, subIdx)}
                                              className="no-print"
                                              style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}
                                            >
                                              ❌ حذف الفرعي
                                            </button>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4a5568' }}>فقرة السرد النصية للقسم الفرعي:</label>
                                            <textarea
                                              value={sub.narrativeText || ''}
                                              onChange={(e) => updateSubsectionField(sIdx, subIdx, 'narrativeText', e.target.value)}
                                              placeholder="أدخل فقرة سرد نصية هنا تظهر تحت عنوان القسم الفرعي مباشرة..."
                                              rows={2}
                                              style={{ width: '100%', border: '1px dashed #cbd5e0', padding: '4px', fontSize: '12px', fontFamily: 'inherit' }}
                                            />
                                          </div>

                                          <div className="no-print" style={{ display: 'flex', gap: '10px', fontSize: '12px', flexWrap: 'wrap', backgroundColor: '#edf2f7', padding: '6px', borderRadius: '4px' }}>
                                            <label><input type="checkbox" checked={!!sub.showDetails} onChange={(e) => updateSubsectionField(sIdx, subIdx, 'showDetails', e.target.checked)} /> الدرجات التفصيلية</label>
                                            <label><input type="checkbox" checked={!!sub.showPositives} onChange={(e) => updateSubsectionField(sIdx, subIdx, 'showPositives', e.target.checked)} /> الإيجابيات</label>
                                            <label><input type="checkbox" checked={!!sub.showNegatives} onChange={(e) => updateSubsectionField(sIdx, subIdx, 'showNegatives', e.target.checked)} /> السلبيات</label>
                                            <label><input type="checkbox" checked={!!sub.showImpediments} onChange={(e) => updateSubsectionField(sIdx, subIdx, 'showImpediments', e.target.checked)} /> المعوقات</label>
                                            <label><input type="checkbox" checked={!!sub.showObstacles} onChange={(e) => updateSubsectionField(sIdx, subIdx, 'showObstacles', e.target.checked)} /> المعاضل</label>
                                          </div>
                                        </div>
                                      ) : (
                                        sub.visible && (
                                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1a202c', marginBottom: '10px', paddingRight: '8px' }}>
                                            {sub.numbering || getLevel3Ordinal(subIdx + 1, formattingConfig)} {sub.title}
                                          </div>
                                        )
                                      )}

                                      {editMode && (
                                        <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0c2340', marginBottom: '6px' }}>
                                            ملاحظات ومكتشفات التفتيش الميدانية (البنود):
                                          </div>
                                          {(sub.findings || []).map((text: string, idx: number) => (
                                            <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <button type="button" onClick={() => {
                                                if (idx === 0) return;
                                                const updated = [...sub.findings];
                                                const temp = updated[idx];
                                                updated[idx] = updated[idx - 1];
                                                updated[idx - 1] = temp;
                                                updateSubsectionField(sIdx, subIdx, 'findings', updated);
                                              }} disabled={idx === 0} style={{ padding: '1px 4px', fontSize: '11px', cursor: 'pointer' }}>⬆️</button>
                                              <button type="button" onClick={() => {
                                                if (idx === sub.findings.length - 1) return;
                                                const updated = [...sub.findings];
                                                const temp = updated[idx];
                                                updated[idx] = updated[idx + 1];
                                                updated[idx + 1] = temp;
                                                updateSubsectionField(sIdx, subIdx, 'findings', updated);
                                              }} disabled={idx === sub.findings.length - 1} style={{ padding: '1px 4px', fontSize: '11px', cursor: 'pointer' }}>⬇️</button>
                                              
                                              <span style={{ fontWeight: 'bold', color: '#0c2340' }}>({idx + 1})</span>
                                              
                                              <input
                                                type="text"
                                                value={text}
                                                onChange={(e) => {
                                                  const updated = [...sub.findings];
                                                  updated[idx] = e.target.value;
                                                  updateSubsectionField(sIdx, subIdx, 'findings', updated);
                                                }}
                                                style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '12.5px', fontFamily: 'inherit' }}
                                              />
                                              
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = sub.findings.filter((_: any, i: number) => i !== idx);
                                                  updateSubsectionField(sIdx, subIdx, 'findings', updated);
                                                }}
                                                className="no-print"
                                                style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                              >
                                                حذف
                                              </button>
                                            </div>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...(sub.findings || [])];
                                              updated.push('بند ملاحظة تفتيشية جديدة...');
                                              updateSubsectionField(sIdx, subIdx, 'findings', updated);
                                            }}
                                            className="btn-outline no-print"
                                            style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                          >
                                            ➕ إضافة بند ملاحظة (مكتشفات)
                                          </button>
                                        </div>
                                      )}

                                      {!editMode && sub.visible && (
                                        <div style={{ marginRight: getIndentation(4, formattingConfig), fontSize: '13.5px', lineHeight: '2' }}>
                                          {/* Officer info items: (١)(٢)(٣)(٤) */}
                                          {sub.officerInfo && (() => {
                                            const oi = sub.officerInfo;
                                            const items: string[] = [
                                              `الرتبة والاسم الكامل / ${oi.rank} ${oi.fullName}.`,
                                              `الرقم الإحصائي/ (${oi.statisticalNumber}).`,
                                              `تاريخ استلام المنصب/ ${oi.joinedDate} (${oi.positionStatus}).`,
                                            ];
                                            if (oi.education && oi.education !== '—') {
                                              items.push(`التحصيل الدراسي/ ${oi.education}.`);
                                            }
                                            return items.map((text, idx) => (
                                              <div key={`oi-${idx}`} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 'bold', minWidth: '28px', color: '#0c2340' }}>({toArabicDigits(idx + 1)})</span>
                                                <span>{text}</span>
                                              </div>
                                            ));
                                          })()}
                                          {/* Findings items: continue numbering from after officer info */}
                                          {sub.findings && sub.findings.length > 0 && (() => {
                                            const baseIdx = sub.officerInfo
                                              ? (sub.officerInfo.education && sub.officerInfo.education !== '—' ? 4 : 3)
                                              : 0;
                                            return sub.findings.map((text: string, idx: number) => (
                                              <div key={`f-${idx}`} style={{ display: 'flex', gap: '6px', marginBottom: '4px', textAlign: 'justify' }}>
                                                <span style={{ fontWeight: 'bold', minWidth: '28px', color: '#0c2340' }}>({toArabicDigits(baseIdx + idx + 1)})</span>
                                                <span>{text}</span>
                                              </div>
                                            ));
                                          })()}
                                          {sub.narrativeText && (
                                            <div style={{ marginTop: '6px', whiteSpace: 'pre-line', color: '#4a5568' }}>{sub.narrativeText}</div>
                                          )}
                                        </div>
                                      )}
                                        {(sub.showDetails || editMode) && (
                                          <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#4a5568', marginBottom: '6px' }}>
                                              {getLevel4Number(subLevel4Idx++, formattingConfig)} الدرجات والملاحظات التفصيلية للبنود:
                                            </div>
                                            {(sub.detailsList || []).map((text: string, idx: number) => (
                                              <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13px', marginBottom: '4px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {editMode ? (
                                                  <>
                                                    <input
                                                      type="text"
                                                      value={text}
                                                      onChange={(e) => {
                                                        const updatedList = [...sub.detailsList];
                                                        updatedList[idx] = e.target.value;
                                                        updateSubsectionField(sIdx, subIdx, 'detailsList', updatedList);
                                                      }}
                                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '12.5px', fontFamily: 'inherit' }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const updatedList = sub.detailsList.filter((_: any, i: number) => i !== idx);
                                                        updateSubsectionField(sIdx, subIdx, 'detailsList', updatedList);
                                                      }}
                                                      className="no-print"
                                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                                    >
                                                      حذف
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    {text}
                                                  </>
                                                )}
                                              </div>
                                            ))}
                                            {editMode && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedList = [...(sub.detailsList || [])];
                                                  updatedList.push('ملاحظة بند تفصيلية جديدة...');
                                                  updateSubsectionField(sIdx, subIdx, 'detailsList', updatedList);
                                                }}
                                                className="btn-outline no-print"
                                                style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                              >
                                                ➕ إضافة بند تفصيل
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {(sub.showPositives || editMode) && (
                                          <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1a5235', marginBottom: '6px' }}>
                                              {getLevel4Number(subLevel4Idx++, formattingConfig)} الإيجابيات وعوامل القوة المرصودة:
                                            </div>
                                            {(sub.positivesList || []).map((text: string, idx: number) => (
                                              <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13px', marginBottom: '4px', color: '#1a5235', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {editMode ? (
                                                  <>
                                                    <input
                                                      type="text"
                                                      value={text}
                                                      onChange={(e) => updateFindingListItem(sIdx, subIdx, 'positives', idx, e.target.value)}
                                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '12.5px', fontFamily: 'inherit', color: '#1a5235' }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemUp(sIdx, subIdx, 'positives', idx)}
                                                      disabled={idx === 0}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأعلى"
                                                    >
                                                      ↑
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemDown(sIdx, subIdx, 'positives', idx)}
                                                      disabled={idx === (sub.positivesList || []).length - 1}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأسفل"
                                                    >
                                                      ↓
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => removeFindingListItem(sIdx, subIdx, 'positives', idx)}
                                                      className="no-print"
                                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                                    >
                                                      حذف
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                                  </>
                                                )}
                                              </div>
                                            ))}
                                            {editMode && (
                                              <button
                                                type="button"
                                                onClick={() => addFindingListItem(sIdx, subIdx, 'positives')}
                                                className="btn-outline no-print"
                                                style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                              >
                                                ➕ إضافة بند إيجابي
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {(sub.showNegatives || editMode) && (
                                          <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#742a2a', marginBottom: '6px' }}>
                                              {getLevel4Number(subLevel4Idx++, formattingConfig)} السلبيات ونقاط التقصير الإداري والتنظيمي:
                                            </div>
                                            {(sub.negativesList || []).map((text: string, idx: number) => (
                                              <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13px', marginBottom: '4px', color: '#742a2a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {editMode ? (
                                                  <>
                                                    <input
                                                      type="text"
                                                      value={text}
                                                      onChange={(e) => updateFindingListItem(sIdx, subIdx, 'negatives', idx, e.target.value)}
                                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '12.5px', fontFamily: 'inherit', color: '#742a2a' }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemUp(sIdx, subIdx, 'negatives', idx)}
                                                      disabled={idx === 0}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأعلى"
                                                    >
                                                      ↑
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemDown(sIdx, subIdx, 'negatives', idx)}
                                                      disabled={idx === (sub.negativesList || []).length - 1}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأسفل"
                                                    >
                                                      ↓
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => removeFindingListItem(sIdx, subIdx, 'negatives', idx)}
                                                      className="no-print"
                                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                                    >
                                                      حذف
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                                  </>
                                                )}
                                              </div>
                                            ))}
                                            {editMode && (
                                              <button
                                                type="button"
                                                onClick={() => addFindingListItem(sIdx, subIdx, 'negatives')}
                                                className="btn-outline no-print"
                                                style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                              >
                                                ➕ إضافة بند سلبي
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {(sub.showImpediments || editMode) && (
                                          <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#7b341e', marginBottom: '6px' }}>
                                              {getLevel4Number(subLevel4Idx++, formattingConfig)} المعوقات ونقص الدعم اللوجستي والبشري:
                                            </div>
                                            {(sub.impedimentsList || []).map((text: string, idx: number) => (
                                              <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13px', marginBottom: '4px', color: '#7b341e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {editMode ? (
                                                  <>
                                                    <input
                                                      type="text"
                                                      value={text}
                                                      onChange={(e) => updateFindingListItem(sIdx, subIdx, 'impediments', idx, e.target.value)}
                                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '12.5px', fontFamily: 'inherit', color: '#7b341e' }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemUp(sIdx, subIdx, 'impediments', idx)}
                                                      disabled={idx === 0}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأعلى"
                                                    >
                                                      ↑
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemDown(sIdx, subIdx, 'impediments', idx)}
                                                      disabled={idx === (sub.impedimentsList || []).length - 1}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأسفل"
                                                    >
                                                      ↓
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => removeFindingListItem(sIdx, subIdx, 'impediments', idx)}
                                                      className="no-print"
                                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                                    >
                                                      حذف
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                                  </>
                                                )}
                                              </div>
                                            ))}
                                            {editMode && (
                                              <button
                                                type="button"
                                                onClick={() => addFindingListItem(sIdx, subIdx, 'impediments')}
                                                className="btn-outline no-print"
                                                style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                              >
                                                ➕ إضافة بند معوقات
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {(sub.showObstacles || editMode) && (
                                          <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#5a3e2b', marginBottom: '6px' }}>
                                              المعاضل والمشاكل الهيكلية الحرجة (تتطلب تدخل المراجع):
                                            </div>
                                            {(sub.obstaclesList || []).map((text: string, idx: number) => (
                                              <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13px', marginBottom: '4px', color: '#5a3e2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {editMode ? (
                                                  <>
                                                    <input
                                                      type="text"
                                                      value={text}
                                                      onChange={(e) => updateFindingListItem(sIdx, subIdx, 'obstacles', idx, e.target.value)}
                                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: '12.5px', fontFamily: 'inherit', color: '#5a3e2b' }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemUp(sIdx, subIdx, 'obstacles', idx)}
                                                      disabled={idx === 0}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأعلى"
                                                    >
                                                      ↑
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => moveFindingListItemDown(sIdx, subIdx, 'obstacles', idx)}
                                                      disabled={idx === (sub.obstaclesList || []).length - 1}
                                                      className="no-print"
                                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                                      title="نقل للأسفل"
                                                    >
                                                      ↓
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => removeFindingListItem(sIdx, subIdx, 'obstacles', idx)}
                                                      className="no-print"
                                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
                                                    >
                                                      حذف
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
                                                  </>
                                                )}
                                              </div>
                                            ))}
                                            {editMode && (
                                              <button
                                                type="button"
                                                onClick={() => addFindingListItem(sIdx, subIdx, 'obstacles')}
                                                className="btn-outline no-print"
                                                style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
                                              >
                                                ➕ إضافة بند معضلة
                                              </button>
                                            )}
                                          </div>
                                        )}
                                        {/* Detailed Tables Rendering */}
                                        {sub.detailedTables && sub.detailedTables.length > 0 && (
                                          <div style={{ marginTop: '15px', marginRight: getIndentation(4, formattingConfig) }}>
                                            {sub.detailedTables.map((table: any, tIdx: number) => (
                                              <div key={table.detailId || tIdx} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0c2340', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  <span>📊 {table.title}</span>
                                                  <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#718096', marginRight: 'auto' }}>({table.entityName})</span>
                                                  {editMode && (
                                                    <button
                                                      type="button"
                                                      onClick={() => addDetailedTableRow(sIdx, subIdx, tIdx)}
                                                      className="no-print"
                                                      style={{ backgroundColor: '#edf2f7', color: '#2b6cb0', border: '1px solid #cbd5e0', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                                    >
                                                      ➕ إضافة صف
                                                    </button>
                                                  )}
                                                </div>
                                                <div style={{ overflowX: 'auto', width: '100%' }}>
                                                  <table className="military-table" style={{ margin: '5px 0 10px 0', width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                                                    <thead>
                                                      <tr style={{ backgroundColor: '#f2f2f2' }}>
                                                        {table.schema.map((col: any, colIdx: number) => (
                                                          <th key={col.key || colIdx} style={{ padding: '6px 8px', border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>
                                                            {col.label}
                                                          </th>
                                                        ))}
                                                        {editMode && <th className="no-print" style={{ padding: '6px 8px', border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', fontSize: '12px', width: '60px' }}>إجراء</th>}
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {table.rows.map((row: any, rIdx: number) => (
                                                        <tr key={rIdx}>
                                                          {table.schema.map((col: any, cIdx: number) => {
                                                            const cellVal = row[col.key] !== undefined ? row[col.key] : '';
                                                            const isPercentage = col.role === 'percentage';
                                                            const formattedVal = isPercentage ? `${cellVal}%` : cellVal;
                                                            
                                                            let textColor = '#000000';
                                                            if (col.role === 'deficit' && Number(cellVal) > 0) textColor = '#c53030';
                                                            if (col.role === 'increase' && Number(cellVal) > 0) textColor = '#2b6cb0';

                                                            const isBold = col.role === 'label' || col.role === 'percentage' || col.role === 'deficit' || col.role === 'increase';
                                                            const fontWeight = isBold ? 'bold' : 'normal';

                                                            return (
                                                              <td key={col.key || cIdx} style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontSize: '12px', color: textColor, fontWeight: fontWeight }}>
                                                                {editMode ? (
                                                                  col.role === 'deficit' || col.role === 'increase' || col.role === 'percentage' ? (
                                                                    <span>{formattedVal}</span>
                                                                  ) : (
                                                                    <input
                                                                      type={col.type === 'number' ? 'number' : 'text'}
                                                                      value={cellVal}
                                                                      onChange={(e) => handleDetailedTableCellChange(sIdx, subIdx, tIdx, rIdx, col.key, e.target.value)}
                                                                      style={{ width: '100%', border: 'none', padding: '2px', textAlign: col.type === 'number' ? 'center' : 'right', fontFamily: 'inherit', fontWeight: fontWeight, color: textColor }}
                                                                    />
                                                                  )
                                                                ) : (
                                                                  formattedVal
                                                                )}
                                                              </td>
                                                            );
                                                          })}
                                                          {editMode && (
                                                            <td className="no-print" style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>
                                                              <button
                                                                type="button"
                                                                onClick={() => removeDetailedTableRow(sIdx, subIdx, tIdx, rIdx)}
                                                                style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px' }}
                                                              >
                                                                حذف
                                                              </button>
                                                            </td>
                                                          )}
                                                        </tr>
                                                      ))}
                                                      {table.rows.length === 0 && (
                                                        <tr>
                                                          <td colSpan={table.schema.length + (editMode ? 1: 0)} style={{ padding: '10px', color: '#a0aec0', textAlign: 'center' }}>لا توجد سجلات.</td>
                                                        </tr>
                                                      )}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                            )}
                          </div>
                        );
                      });
                    })()
                  )}
                    {editMode && (
                      <div className="no-print" style={{ marginTop: '15px' }}>
                        <button
                          type="button"
                          onClick={addCustomSection}
                          className="btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          ➕ إضافة قسم رئيسي جديد
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 8. التوصيات والمقترحات */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 className="section-num">{getLevel1Number(8, formattingConfig)} الملاحظات</h3>
                  <div className="section-body">
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(1, formattingConfig)} الإيجابيات</div>
                    {renderOfficialObservationItems(officialObservationSection?.positivesList || [], 'positives')}
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(2, formattingConfig)} السلبيات</div>
                    {renderOfficialObservationItems(officialObservationSection?.negativesList || [], 'negatives')}
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(3, formattingConfig)} المعوقات</div>
                    {renderOfficialObservationItems(officialObservationSection?.impedimentsList || [], 'impediments')}
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(4, formattingConfig)} المعاضل</div>
                    {renderOfficialObservationItems(officialObservationSection?.obstaclesList || [], 'obstacles')}
                  </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <h3 className="section-num">{getLevel1Number(9, formattingConfig)} التوصيات</h3>
                  <div className="section-body">
                    {reportPayload.recommendations && reportPayload.recommendations.length > 0 ? (
                      reportPayload.recommendations.map((recGroup: any, grpIdx: number) => {
                        if (!recGroup.visible && !editMode) return null;
                        return (
                          <div key={recGroup.id || grpIdx} style={{ marginBottom: '20px', marginRight: getIndentation(2, formattingConfig), opacity: recGroup.visible ? 1 : 0.5 }}>
                            <div style={{ fontWeight: 'bold', color: '#0c2340', marginBottom: '8px' }}>
                              {getLevel2ArabicLetter(grpIdx + 1, formattingConfig)} {recGroup.authority}
                            </div>
                            <div style={{ marginRight: getIndentation(3, formattingConfig) }}>
                              {recGroup.recs && recGroup.recs.length > 0 ? (
                                recGroup.recs.map((rec: any, recIdx: number) => (
                                  <div key={rec.id || recIdx} style={{ marginBottom: '10px' }}>
                                    <div style={{ marginBottom: '4px', fontSize: '13.5px', fontWeight: '500' }}>
                                      {getLevel3Ordinal(recIdx + 1, formattingConfig).replace('.', ':')} {rec.text}
                                    </div>
                                    {rec.children && rec.children.length > 0 && (
                                      <div style={{ marginRight: getIndentation(4, formattingConfig), display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {rec.children.map((child: any, childIdx: number) => (
                                          <div key={child.id || childIdx} style={{ fontSize: '13px', color: '#4a5568' }}>
                                            • {child.text}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontSize: '13.5px', color: '#718096', fontStyle: 'italic', marginBottom: '10px' }}>
                                  لا توجد توصيات مدخلة تحت هذه الجهة.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ marginRight: getIndentation(2, formattingConfig), fontSize: '13.5px', color: '#718096' }}>لا توجد توصيات مدخلة.</div>
                    )}
                  </div>
                </div>

                {reportPayload.finalEvaluation?.statement && (
                  <div style={{ marginTop: '25px', marginBottom: '25px' }}>
                    <h3 className="section-num">{getLevel1Number(10, formattingConfig)} {reportPayload.finalEvaluation.statement}</h3>
                  </div>
                )}

                {false && (reportPayload.recommendations?.some((r: any) => r.visible && r.recs.length > 0) || editMode) && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 className="section-num">{getLevel1Number(8, formattingConfig)} التوصيات والمقترحات المرفوعة للمصادقة</h3>
                    <div className="section-body">
                      {reportPayload.recommendations.map((recGroup: any, grpIdx: number) => {
                        if (!recGroup.visible && !editMode) return null;
                        return (
                          <div key={grpIdx} style={{ marginBottom: '15px', opacity: recGroup.visible ? 1 : 0.5 }}>
                            {editMode ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                                <button type="button" onClick={() => moveRecommendationGroupUp(grpIdx)} disabled={grpIdx === 0} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬆️</button>
                                <button type="button" onClick={() => moveRecommendationGroupDown(grpIdx)} disabled={grpIdx === reportPayload.recommendations.length - 1} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬇️</button>
                                <input
                                  type="checkbox"
                                  checked={!!recGroup.visible}
                                  onChange={(e) => updateRecommendationGroup(grpIdx, 'visible', e.target.checked)}
                                  title="إظهار/إخفاء هذه المجموعة"
                                />
                                <span>الموجهة إلى:</span>
                                <input
                                  type="text"
                                  value={recGroup.authority}
                                  onChange={(e) => updateRecommendationGroup(grpIdx, 'authority', e.target.value)}
                                  style={{
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    border: '1px dashed #cbd5e0',
                                    padding: '3px',
                                    flex: 1,
                                    fontFamily: 'inherit',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeRecommendationGroup(grpIdx)}
                                  className="no-print"
                                  style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px' }}
                                >
                                  حذف المجموعة
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '15px' }}>
                                {getLevel2ArabicLetter(grpIdx + 1, formattingConfig)} الموجهة إلى ({recGroup.authority}):
                              </div>
                            )}
                            <div style={{ marginRight: getIndentation(3, formattingConfig) }}>
                              {recGroup.recs.map((r: string, rIdx: number) => (
                                <div key={rIdx} style={{ marginBottom: '6px', fontSize: '13.5px' }}>
                                  {editMode ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                      <button type="button" onClick={() => moveRecommendationUp(grpIdx, rIdx)} disabled={rIdx === 0} style={{ padding: '1px 3px', fontSize: '10px', cursor: 'pointer' }}>⬆️</button>
                                      <button type="button" onClick={() => moveRecommendationDown(grpIdx, rIdx)} disabled={rIdx === recGroup.recs.length - 1} style={{ padding: '1px 3px', fontSize: '10px', cursor: 'pointer' }}>⬇️</button>
                                      <span>{getLevel3Ordinal(rIdx + 1, formattingConfig)}</span>
                                      <input
                                        type="text"
                                        value={r}
                                        onChange={(e) => updateRecommendationText(grpIdx, rIdx, e.target.value)}
                                        style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontSize: '13.5px', fontFamily: 'inherit' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeRecommendation(grpIdx, rIdx)}
                                        className="no-print"
                                        style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
                                      >
                                        حذف
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      {getLevel3Ordinal(rIdx + 1, formattingConfig)} {r}
                                    </>
                                  )}
                                </div>
                              ))}
                              {editMode && (
                                <button
                                  type="button"
                                  onClick={() => addRecommendation(grpIdx)}
                                  className="btn-outline no-print"
                                  style={{ padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                                >
                                  ➕ إضافة توصية
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {editMode && (
                        <div className="no-print" style={{ marginTop: '15px' }}>
                          <button
                            type="button"
                            onClick={addRecommendationGroup}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ➕ إضافة جهة توصية جديدة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 9. ملاحق التقرير التفتيشي */}
                {(reportPayload.appendices?.some((a: any) => a.visible) || editMode) && (
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ pageBreakBefore: 'always' }}></div>
                    <h3 className="section-num">{getLevel1Number(11, formattingConfig)} ملاحق التقرير التفتيشي</h3>
                    <div className="section-body">
                      {reportPayload.appendices.map((app: any, idx: number) => {
                        if (!app.visible && !editMode) return null;
                        return (
                          <div key={app.id} style={{ marginBottom: '20px', opacity: app.visible ? 1 : 0.5 }}>
                            {editMode ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <button type="button" onClick={() => moveAppendixUp(idx)} disabled={idx === 0} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬆️</button>
                                <button type="button" onClick={() => moveAppendixDown(idx)} disabled={idx === reportPayload.appendices.length - 1} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬇️</button>
                                <input
                                  type="checkbox"
                                  checked={!!app.visible}
                                  onChange={(e) => updateAppendixField(idx, 'visible', e.target.checked)}
                                  title="إظهار/إخفاء الملحق"
                                />
                                <span>رمز الملحق:</span>
                                <input
                                  type="text"
                                  value={app.symbol}
                                  onChange={(e) => updateAppendixField(idx, 'symbol', e.target.value)}
                                  style={{ width: '60px', border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', fontFamily: 'inherit' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeAppendix(idx)}
                                  className="no-print"
                                  style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px' }}
                                >
                                  حذف الملحق
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontWeight: 'bold', color: '#0c2340', borderBottom: '1px dashed #cbd5e0', paddingBottom: '3px', marginBottom: '8px' }}>
                                {getLevel2ArabicLetter(idx + 1, formattingConfig)} ملحق ({app.symbol})
                              </div>
                            )}
                            <div>
                              {editMode ? (
                                <textarea
                                  value={app.text}
                                  onChange={(e) => updateAppendixField(idx, 'text', e.target.value)}
                                  rows={4}
                                  style={{ width: '100%', border: '1px dashed #cbd5e0', padding: '8px', fontFamily: 'inherit', fontSize: '13px' }}
                                />
                              ) : (
                                <div style={{ whiteSpace: 'pre-line', fontSize: '13px' }}>{app.text}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {editMode && (
                        <div className="no-print" style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={addAppendix}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ➕ إضافة ملحق جديد
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {false && reportPayload.finalEvaluation?.statement && (
                  <div style={{ marginTop: '25px', marginBottom: '25px' }}>
                    <h3 className="section-num">{getLevel1Number(10, formattingConfig)} {reportPayload.finalEvaluation.statement}</h3>
                  </div>
                )}

                {/* Signatures block */}
                {(() => {
                  const signatures = reportPayload.signatures || {};
                  const leaderRank = signatures.leaderRank || '';
                  const leaderName = signatures.leaderName || '';
                  const leaderRole = signatures.leaderRole || 'رئيس اللجنة';
                  const leaderDate = signatures.leaderDate || '';

                  const deputyRank = signatures.deputyRank || '';
                  const deputyName = signatures.deputyName || '';
                  const deputyRole = signatures.deputyRole || 'رئيس هيئة تفتيش قوى الامن الداخلي';
                  const deputyDate = signatures.deputyDate || '';

                  const showMinisterSign = signatures.showMinisterSign !== false;
                  const ministerTitle = signatures.ministerTitle || 'اصادق اصوليا';
                  const ministerName = signatures.ministerName || 'وزيـــــــر الداخلية';
                  const ministerDate = signatures.ministerDate || '٢٠٢٦/  / ';

                  return (
                    <div style={{ marginTop: '60px', borderTop: '1px dashed #cbd5e0', paddingTop: '20px' }}>
                      {/* Minister Signature Toggle and Inputs in Edit Mode */}
                      {editMode && (
                        <div className="no-print" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                            <input
                              type="checkbox"
                              checked={showMinisterSign}
                              onChange={(e) => updateSignatureField('showMinisterSign', e.target.checked)}
                            />
                            إظهار توقيع مصادقة وزير الداخلية في أعلى يسار التذييل
                          </label>
                          {showMinisterSign && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>عبارة المصادقة:</label>
                                <input
                                  type="text"
                                  value={ministerTitle}
                                  onChange={(e) => updateSignatureField('ministerTitle', e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>منصب المصادق:</label>
                                <input
                                  type="text"
                                  value={ministerName}
                                  onChange={(e) => updateSignatureField('ministerName', e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>التاريخ:</label>
                                <input
                                  type="text"
                                  value={ministerDate}
                                  onChange={(e) => updateSignatureField('ministerDate', e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Minister Signature in Preview Mode */}
                      {showMinisterSign && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px', paddingLeft: '5%' }}>
                          <div style={{ textAlign: 'center', width: '45%' }}>
                            {editMode ? (
                              <div style={{ color: '#718096', fontSize: '12px', border: '1px dashed #cbd5e0', padding: '5px', display: 'inline-block' }}>
                                (توقيع مصادقة وزير الداخلية - معروض أعلاه)
                              </div>
                            ) : (
                              <>
                                <p style={{ margin: '0 0 5px 0' }}><strong>{ministerTitle}</strong></p>
                                <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}><strong>{ministerName}</strong></p>
                                <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
                                  <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{ministerDate}</span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Two Columns: Leader (Right) and Deputy (Left) */}
                      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                        {/* Right Column: Leader */}
                        <div style={{ textAlign: 'center', width: '45%' }}>
                          {editMode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={leaderRank}
                                onChange={(e) => updateSignatureField('leaderRank', e.target.value)}
                                placeholder="الرتبة / العنوان الوظيفي"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={leaderName}
                                onChange={(e) => updateSignatureField('leaderName', e.target.value)}
                                placeholder="الاسم الكامل"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit' }}
                              />
                              <input
                                type="text"
                                value={leaderRole}
                                onChange={(e) => updateSignatureField('leaderRole', e.target.value)}
                                placeholder="الصفة باللجنة"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={leaderDate}
                                onChange={(e) => updateSignatureField('leaderDate', e.target.value)}
                                placeholder="التاريخ"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontSize: '11px', color: '#4a5568' }}
                              />
                            </div>
                          ) : (
                            <>
                              <div style={{ height: '55px' }}></div>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{leaderRank || '\u00A0'}</strong></p>
                              <p style={{ margin: '0 0 5px 0' }}>{leaderName}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{leaderRole}</strong></p>
                              <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
                                <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{leaderDate}</span>
                              </p>
                            </>
                          )}
                        </div>

                        {/* Left Column: Deputy */}
                        <div style={{ textAlign: 'center', width: '45%' }}>
                          {editMode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={deputyRank}
                                onChange={(e) => updateSignatureField('deputyRank', e.target.value)}
                                placeholder="الرتبة / العنوان الوظيفي"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={deputyName}
                                onChange={(e) => updateSignatureField('deputyName', e.target.value)}
                                placeholder="الاسم الكامل"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit' }}
                              />
                              <input
                                type="text"
                                value={deputyRole}
                                onChange={(e) => updateSignatureField('deputyRole', e.target.value)}
                                placeholder="الصفة باللجنة"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={deputyDate}
                                onChange={(e) => updateSignatureField('deputyDate', e.target.value)}
                                placeholder="التاريخ"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontSize: '11px', color: '#4a5568' }}
                              />
                            </div>
                          ) : (
                            <>
                              <div style={{ height: '55px' }}></div>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{deputyRank || '\u00A0'}</strong></p>
                              <p style={{ margin: '0 0 5px 0' }}>{deputyName}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{deputyRole}</strong></p>
                              <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
                                <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{deputyDate}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* STANDARD GENERAL TEMPLATE (for regular campaigns) */
              <div>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                  <div style={{ width: '220px', fontSize: '13px' }}>
                    <strong>جمهورية العراق</strong><br />
                    <strong>وزارة الداخلية</strong><br />
                    <strong>هيئة تفتيش قوى الامن الداخلي</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <img src={ministryLogo} alt="وزارة الداخلية" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
                  </div>
                  <div style={{ width: '220px', fontSize: '13px', textAlign: 'left', direction: 'rtl' }}>
                    {editMode ? (
                      <>
                        <div style={{ marginBottom: '5px' }}>
                          <strong>التاريخ:</strong>{' '}
                          <input
                            type="text"
                            value={reportPayload.startDateText ?? (reportPayload.startDate ? new Date(reportPayload.startDate).toLocaleDateString('ar-EG') : '')}
                            onChange={(e) => updatePayloadField('startDateText', e.target.value)}
                            style={{ border: '1px dashed #cbd5e0', padding: '2px', width: '130px', fontSize: '12px', fontFamily: 'inherit' }}
                          />
                        </div>
                        <div>
                          <strong>العدد:</strong>{' '}
                          <input
                            type="text"
                            value={reportPayload.formationNumber ?? ''}
                            onChange={(e) => updatePayloadField('formationNumber', e.target.value)}
                            style={{ border: '1px dashed #cbd5e0', padding: '2px', width: '130px', fontSize: '12px', fontFamily: 'inherit' }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div><strong>التاريخ:</strong> {reportPayload.startDateText ?? (reportPayload.startDate ? new Date(reportPayload.startDate).toLocaleDateString('ar-EG') : '')}</div>
                        <div><strong>العدد:</strong> {reportPayload.formationNumber || '—'}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Report Title */}
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                  {editMode ? (
                    <input
                      type="text"
                      value={reportPayload.title}
                      onChange={(e) => updatePayloadField('title', e.target.value)}
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        width: '100%',
                        textAlign: 'center',
                        border: '1px dashed #cbd5e0',
                        borderRadius: '4px',
                        padding: '5px',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0c2340', margin: '8px 0', textDecoration: 'underline', textUnderlineOffset: '8px' }}>
                      {reportPayload.title}
                    </h1>
                  )}
                </div>

                {/* Basic Info */}
                <h3 className="section-title">{getLevel1Number(1, formattingConfig)} المعلومات الأساسية للحملة التفتيشية</h3>
                <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', width: '30%', backgroundColor: '#f8fafc' }}>اسم الحملة التفتيشية</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {editMode ? (
                          <input
                            type="text"
                            value={reportPayload.campaignName}
                            onChange={(e) => updatePayloadField('campaignName', e.target.value)}
                            style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                          />
                        ) : (
                          reportPayload.campaignName
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>الأمر الإداري المكلف</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {editMode ? (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                              type="text"
                              value={reportPayload.assignmentReference}
                              onChange={(e) => updatePayloadField('assignmentReference', e.target.value)}
                              placeholder="رقم الكتاب"
                              style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontFamily: 'inherit' }}
                            />
                            <input
                              type="text"
                              value={reportPayload.assignmentDate || ''}
                              onChange={(e) => updatePayloadField('assignmentDate', e.target.value)}
                              placeholder="تاريخ الكتاب (YYYY-MM-DD)"
                              style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontFamily: 'inherit' }}
                            />
                          </div>
                        ) : (
                          <>كتاب رقم {reportPayload.assignmentReference} في {(() => {
                            if (!reportPayload.assignmentDate) return '';
                            const d = new Date(reportPayload.assignmentDate);
                            if (isNaN(d.getTime())) return reportPayload.assignmentDate;
                            return d.toLocaleDateString('ar-EG');
                          })()}</>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>الكيان التنظيمي المستهدف الرئيسي</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {editMode ? (
                          <input
                            type="text"
                            value={reportPayload.targetEntityName}
                            onChange={(e) => updatePayloadField('targetEntityName', e.target.value)}
                            style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                          />
                        ) : (
                          reportPayload.targetEntityName
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>رئيس اللجنة التفتيشية</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {editMode ? (
                          <input
                            type="text"
                            value={reportPayload.signatures.leaderName}
                            onChange={(e) => updateSignatureField('leaderName', e.target.value)}
                            style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                          />
                        ) : (
                          reportPayload.signatures.leaderName
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>معاون رئيس اللجنة / المقرر</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {editMode ? (
                          <input
                            type="text"
                            value={reportPayload.signatures.deputyName}
                            onChange={(e) => updateSignatureField('deputyName', e.target.value)}
                            style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                          />
                        ) : (
                          reportPayload.signatures.deputyName
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Evaluation Table */}
                <h3 className="section-title">{getLevel1Number(2, formattingConfig)} جدول تقييم الأداء الميداني للكيانات المفتشة</h3>
                <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f4f8' }}>
                      <th style={{ padding: '10px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>ت</th>
                      <th style={{ padding: '10px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>الكيان المفتش</th>
                      <th style={{ padding: '10px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>آمر الكيان الحالي</th>
                      <th style={{ padding: '10px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>الموقع الجغرافي</th>
                      <th style={{ padding: '10px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>الدرجة المستحصلة %</th>
                      <th style={{ padding: '10px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>التقدير اللفظي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportPayload.evaluations.map((insp: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #1a1a1a' }}>{idx + 1}</td>
                        {editMode ? (
                          <>
                            <td style={{ padding: '4px', border: '1px solid #1a1a1a' }}>
                              <input
                                type="text"
                                value={insp.entityName}
                                onChange={(e) => updateEvaluationField(idx, 'entityName', e.target.value)}
                                style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                            </td>
                            <td style={{ padding: '4px', border: '1px solid #1a1a1a' }}>
                              <input
                                type="text"
                                value={insp.commanderName}
                                onChange={(e) => updateEvaluationField(idx, 'commanderName', e.target.value)}
                                style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                              />
                            </td>
                            <td style={{ padding: '4px', border: '1px solid #1a1a1a' }}>
                              <input
                                type="text"
                                value={insp.location}
                                onChange={(e) => updateEvaluationField(idx, 'location', e.target.value)}
                                style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                              />
                            </td>
                            <td style={{ padding: '4px', border: '1px solid #1a1a1a' }}>
                              <input
                                type="text"
                                value={insp.totalScore}
                                onChange={(e) => updateEvaluationField(idx, 'totalScore', e.target.value)}
                                style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', fontWeight: 'bold', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '4px', border: '1px solid #1a1a1a' }}>
                              <input
                                type="text"
                                value={insp.performanceRating}
                                onChange={(e) => updateEvaluationField(idx, 'performanceRating', e.target.value)}
                                style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', fontWeight: 'bold', textAlign: 'center' }}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '8px', border: '1px solid #1a1a1a' }}>{insp.entityName}</td>
                            <td style={{ padding: '8px', border: '1px solid #1a1a1a' }}>{insp.commanderName}</td>
                            <td style={{ padding: '8px', border: '1px solid #1a1a1a' }}>{insp.location}</td>
                            <td style={{ padding: '8px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>{parseFloat(insp.totalScore).toFixed(1)}%</td>
                            <td style={{ padding: '8px', border: '1px solid #1a1a1a', fontWeight: 'bold' }}>{insp.performanceRating}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {reportPayload.evaluations.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '12px', border: '1px solid #1a1a1a', color: '#718096' }}>
                          لا توجد عمليات تقييم مسجلة لهذه الحملة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Notes Section */}
                <h3 className="section-title">{getLevel1Number(3, formattingConfig)} الملاحظات والنتائج العامة للجنة التفتيشية</h3>
                <div style={{ marginRight: getIndentation(2, formattingConfig) }}>
                  {(() => {
                    const manualSecIndex = reportPayload.sections.findIndex((s: any) => s.isManual);
                    const manualSec = reportPayload.sections[manualSecIndex];
                    if (manualSecIndex === -1 || !manualSec) return null;
                    let level2Idx = 1;
                    return (
                      <>
                        {editMode && (
                          <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '15px', backgroundColor: '#f7fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                            <label style={{ fontWeight: 'bold' }}>أقسام الملاحظات النشطة:</label>
                            <label><input type="checkbox" checked={!!manualSec.showPositives} onChange={(e) => updateSectionField(manualSecIndex, 'showPositives', e.target.checked)} /> الإيجابيات</label>
                            <label><input type="checkbox" checked={!!manualSec.showNegatives} onChange={(e) => updateSectionField(manualSecIndex, 'showNegatives', e.target.checked)} /> السلبيات</label>
                            <label><input type="checkbox" checked={!!manualSec.showImpediments} onChange={(e) => updateSectionField(manualSecIndex, 'showImpediments', e.target.checked)} /> المعوقات</label>
                            <label><input type="checkbox" checked={!!manualSec.showObstacles} onChange={(e) => updateSectionField(manualSecIndex, 'showObstacles', e.target.checked)} /> المعاضل</label>
                          </div>
                        )}

                        {((manualSec.showPositives && manualSec.positivesList?.length > 0) || (editMode && manualSec.showPositives)) && (
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', color: '#1a5235', marginBottom: '5px' }}>
                              {getLevel2ArabicLetter(level2Idx++, formattingConfig)} الإيجابيات ورصد كفاءة الأداء:
                            </div>
                            {manualSec.positivesList?.map((text: string, idx: number) => (
                              <div key={idx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', color: '#1a5235' }}>
                                {editMode ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span>{getLevel3Ordinal(idx + 1, formattingConfig)}</span>
                                    <input
                                      type="text"
                                      value={text}
                                      onChange={(e) => updateFindingListItem(manualSecIndex, -1, 'positives', idx, e.target.value)}
                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontSize: '13.5px', color: '#1a5235', fontFamily: 'inherit' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemUp(manualSecIndex, -1, 'positives', idx)}
                                      disabled={idx === 0}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأعلى"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemDown(manualSecIndex, -1, 'positives', idx)}
                                      disabled={idx === (manualSec.positivesList || []).length - 1}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأسفل"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeFindingListItem(manualSecIndex, -1, 'positives', idx)}
                                      className="no-print"
                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                      حذف
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {getLevel3Ordinal(idx + 1, formattingConfig)} {text}
                                  </>
                                )}
                              </div>
                            ))}
                            {editMode && (
                              <button
                                type="button"
                                onClick={() => addFindingListItem(manualSecIndex, -1, 'positives')}
                                className="btn-outline no-print"
                                style={{ marginRight: getIndentation(3, formattingConfig), padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                              >
                                ➕ إضافة بند إيجابي
                              </button>
                            )}
                          </div>
                        )}

                        {((manualSec.showNegatives && manualSec.negativesList?.length > 0) || (editMode && manualSec.showNegatives)) && (
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', color: '#742a2a', marginBottom: '5px' }}>
                              {getLevel2ArabicLetter(level2Idx++, formattingConfig)} السلبيات ونقاط الضعف المرصودة:
                            </div>
                            {manualSec.negativesList?.map((text: string, idx: number) => (
                              <div key={idx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', color: '#742a2a' }}>
                                {editMode ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span>{getLevel3Ordinal(idx + 1, formattingConfig)}</span>
                                    <input
                                      type="text"
                                      value={text}
                                      onChange={(e) => updateFindingListItem(manualSecIndex, -1, 'negatives', idx, e.target.value)}
                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontSize: '13.5px', color: '#742a2a', fontFamily: 'inherit' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemUp(manualSecIndex, -1, 'negatives', idx)}
                                      disabled={idx === 0}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأعلى"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemDown(manualSecIndex, -1, 'negatives', idx)}
                                      disabled={idx === (manualSec.negativesList || []).length - 1}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأسفل"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeFindingListItem(manualSecIndex, -1, 'negatives', idx)}
                                      className="no-print"
                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                      حذف
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {getLevel3Ordinal(idx + 1, formattingConfig)} {text}
                                  </>
                                )}
                              </div>
                            ))}
                            {editMode && (
                              <button
                                type="button"
                                onClick={() => addFindingListItem(manualSecIndex, -1, 'negatives')}
                                className="btn-outline no-print"
                                style={{ marginRight: getIndentation(3, formattingConfig), padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                              >
                                ➕ إضافة بند سلبي
                              </button>
                            )}
                          </div>
                        )}

                        {((manualSec.showImpediments && manualSec.impedimentsList?.length > 0) || (editMode && manualSec.showImpediments)) && (
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', color: '#7b341e', marginBottom: '5px' }}>
                              {getLevel2ArabicLetter(level2Idx++, formattingConfig)} المعوقات التي تواجه العمل:
                            </div>
                            {manualSec.impedimentsList?.map((text: string, idx: number) => (
                              <div key={idx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', color: '#7b341e' }}>
                                {editMode ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span>{getLevel3Ordinal(idx + 1, formattingConfig)}</span>
                                    <input
                                      type="text"
                                      value={text}
                                      onChange={(e) => updateFindingListItem(manualSecIndex, -1, 'impediments', idx, e.target.value)}
                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontSize: '13.5px', color: '#7b341e', fontFamily: 'inherit' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemUp(manualSecIndex, -1, 'impediments', idx)}
                                      disabled={idx === 0}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأعلى"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemDown(manualSecIndex, -1, 'impediments', idx)}
                                      disabled={idx === (manualSec.impedimentsList || []).length - 1}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأسفل"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeFindingListItem(manualSecIndex, -1, 'impediments', idx)}
                                      className="no-print"
                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                      حذف
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {getLevel3Ordinal(idx + 1, formattingConfig)} {text}
                                  </>
                                )}
                              </div>
                            ))}
                            {editMode && (
                              <button
                                type="button"
                                onClick={() => addFindingListItem(manualSecIndex, -1, 'impediments')}
                                className="btn-outline no-print"
                                style={{ marginRight: getIndentation(3, formattingConfig), padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                              >
                                ➕ إضافة بند عائق
                              </button>
                            )}
                          </div>
                        )}

                        {((manualSec.showObstacles && manualSec.obstaclesList?.length > 0) || (editMode && manualSec.showObstacles)) && (
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', color: '#5a3e2b', marginBottom: '5px' }}>
                              {getLevel2ArabicLetter(level2Idx++, formattingConfig)} المعاضل التي واجهت الأداء الميداني:
                            </div>
                            {manualSec.obstaclesList?.map((text: string, idx: number) => (
                              <div key={idx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', color: '#5a3e2b' }}>
                                {editMode ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span>{getLevel3Ordinal(idx + 1, formattingConfig)}</span>
                                    <input
                                      type="text"
                                      value={text}
                                      onChange={(e) => updateFindingListItem(manualSecIndex, -1, 'obstacles', idx, e.target.value)}
                                      style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontSize: '13.5px', color: '#5a3e2b', fontFamily: 'inherit' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemUp(manualSecIndex, -1, 'obstacles', idx)}
                                      disabled={idx === 0}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأعلى"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveFindingListItemDown(manualSecIndex, -1, 'obstacles', idx)}
                                      disabled={idx === (manualSec.obstaclesList || []).length - 1}
                                      className="no-print"
                                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                                      title="نقل للأسفل"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeFindingListItem(manualSecIndex, -1, 'obstacles', idx)}
                                      className="no-print"
                                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                      حذف
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {getLevel3Ordinal(idx + 1, formattingConfig)} {text}
                                  </>
                                )}
                              </div>
                            ))}
                            {editMode && (
                              <button
                                type="button"
                                onClick={() => addFindingListItem(manualSecIndex, -1, 'obstacles')}
                                className="btn-outline no-print"
                                style={{ marginRight: getIndentation(3, formattingConfig), padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                              >
                                ➕ إضافة بند معضلة حرجة
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Recommendations (Standard layout) */}
                {(reportPayload.recommendations && reportPayload.recommendations.length > 0 || editMode) && (
                  <div style={{ marginTop: '25px' }}>
                    <h3 className="section-title">{getLevel1Number(4, formattingConfig)} التوصيات</h3>
                    <div style={{ marginRight: getIndentation(2, formattingConfig) }}>
                      {reportPayload.recommendations.map((recGroup: any, grpIdx: number) => {
                        if (!recGroup.visible && !editMode) return null;
                        return (
                          <div key={recGroup.id || grpIdx} style={{ marginBottom: '15px', opacity: recGroup.visible ? 1 : 0.5 }}>
                            {editMode ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                                <input
                                  type="checkbox"
                                  checked={!!recGroup.visible}
                                  onChange={(e) => updateRecommendationGroup(grpIdx, 'visible', e.target.checked)}
                                  title="إظهار/إخفاء هذه المجموعة"
                                />
                                <span>الموجهة إلى:</span>
                                <input
                                  type="text"
                                  value={recGroup.authority}
                                  onChange={(e) => updateRecommendationGroup(grpIdx, 'authority', e.target.value)}
                                  style={{
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    border: '1px dashed #cbd5e0',
                                    padding: '3px',
                                    flex: 1,
                                    fontFamily: 'inherit',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeRecommendationGroup(grpIdx)}
                                  className="no-print"
                                  style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px' }}
                                >
                                  حذف المجموعة
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontWeight: 'bold', color: '#0c2340', marginBottom: '5px' }}>
                                {getLevel2ArabicLetter(grpIdx + 1, formattingConfig)} {recGroup.authority}
                              </div>
                            )}
                            <div style={{ marginRight: getIndentation(3, formattingConfig) }}>
                              {recGroup.recs && recGroup.recs.length > 0 ? (
                                recGroup.recs.map((recObj: any, rIdx: number) => (
                                  <div key={recObj.id || rIdx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px' }}>
                                    {editMode ? (
                                      <div style={{ marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                          <button type="button" onClick={() => moveRecommendationUp(grpIdx, rIdx)} disabled={rIdx === 0} style={{ padding: '1px 3px', fontSize: '10px', cursor: 'pointer' }}>⬆️</button>
                                          <button type="button" onClick={() => moveRecommendationDown(grpIdx, rIdx)} disabled={rIdx === recGroup.recs.length - 1} style={{ padding: '1px 3px', fontSize: '10px', cursor: 'pointer' }}>⬇️</button>
                                          <span>{getLevel3Ordinal(rIdx + 1, formattingConfig).replace('.', ':')}</span>
                                          <input
                                            type="text"
                                            value={recObj.text}
                                            onChange={(e) => updateRecommendationText(grpIdx, rIdx, e.target.value)}
                                            style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontSize: '13.5px', fontFamily: 'inherit' }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeRecommendation(grpIdx, rIdx)}
                                            className="no-print"
                                            style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
                                          >
                                            حذف
                                          </button>
                                        </div>
                                        {recObj.children && recObj.children.length > 0 && (
                                          <div style={{ marginRight: getIndentation(4, formattingConfig), display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {recObj.children.map((child: any, childIdx: number) => (
                                              <div key={child.id || childIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '12px', color: '#4a5568' }}>•</span>
                                                <input
                                                  type="text"
                                                  value={child.text}
                                                  onChange={(e) => {
                                                    const updated = [...reportPayload.recommendations];
                                                    const recs = [...updated[grpIdx].recs];
                                                    const children = [...recs[rIdx].children];
                                                    children[childIdx] = { ...children[childIdx], text: e.target.value };
                                                    recs[rIdx] = { ...recs[rIdx], children };
                                                    updated[grpIdx] = { ...updated[grpIdx], recs };
                                                    setReportPayload({ ...reportPayload, recommendations: updated });
                                                  }}
                                                  style={{ flex: 1, border: '1px dashed #e2e8f0', padding: '2px', fontSize: '12.5px', fontFamily: 'inherit', color: '#4a5568' }}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...reportPayload.recommendations];
                                                    const recs = [...updated[grpIdx].recs];
                                                    const children = recs[rIdx].children.filter((_: any, idx: number) => idx !== childIdx);
                                                    recs[rIdx] = { ...recs[rIdx], children };
                                                    updated[grpIdx] = { ...updated[grpIdx], recs };
                                                    setReportPayload({ ...reportPayload, recommendations: updated });
                                                  }}
                                                  className="no-print"
                                                  style={{ backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '1px 4px', cursor: 'pointer', borderRadius: '3px', fontSize: '10px' }}
                                                >
                                                  حذف فرعي
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <>
                                        <div style={{ fontWeight: '500', fontSize: '13.5px' }}>
                                          {getLevel3Ordinal(rIdx + 1, formattingConfig).replace('.', ':')} {recObj.text}
                                        </div>
                                        {recObj.children && recObj.children.length > 0 && (
                                          <div style={{ marginRight: getIndentation(4, formattingConfig), display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                            {recObj.children.map((child: any, childIdx: number) => (
                                              <div key={child.id || childIdx} style={{ fontSize: '13px', color: '#4a5568' }}>
                                                • {child.text}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic', marginBottom: '10px' }}>
                                  لا توجد توصيات مدخلة تحت هذه الجهة.
                                </div>
                              )}
                              {editMode && (
                                <button
                                  type="button"
                                  onClick={() => addRecommendation(grpIdx)}
                                  className="btn-outline no-print"
                                  style={{ padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                                >
                                  ➕ إضافة توصية
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {editMode && (
                        <div className="no-print" style={{ marginTop: '15px' }}>
                          <button
                            type="button"
                            onClick={addRecommendationGroup}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ➕ إضافة جهة توصية جديدة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appendices (Standard layout) */}
                {(reportPayload.appendices?.some((a: any) => a.visible) || editMode) && (
                  <div style={{ marginTop: '25px' }}>
                    <div style={{ pageBreakBefore: 'always' }}></div>
                    <h3 className="section-title">{getLevel1Number(5, formattingConfig)} ملاحق التقرير التفتيشي</h3>
                    <div style={{ marginRight: getIndentation(2, formattingConfig) }}>
                      {reportPayload.appendices.map((app: any, idx: number) => {
                        if (!app.visible && !editMode) return null;
                        return (
                          <div key={app.id} style={{ marginBottom: '20px', opacity: app.visible ? 1 : 0.5 }}>
                            {editMode ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={!!app.visible}
                                  onChange={(e) => updateAppendixField(idx, 'visible', e.target.checked)}
                                  title="إظهار/إخفاء الملحق"
                                />
                                <span>رمز الملحق:</span>
                                <input
                                  type="text"
                                  value={app.symbol}
                                  onChange={(e) => updateAppendixField(idx, 'symbol', e.target.value)}
                                  style={{ width: '60px', border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', fontFamily: 'inherit' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeAppendix(idx)}
                                  className="no-print"
                                  style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px' }}
                                >
                                  حذف الملحق
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontWeight: 'bold', color: '#0c2340', borderBottom: '1px dashed #cbd5e0', paddingBottom: '3px', marginBottom: '8px' }}>
                                {getLevel2ArabicLetter(idx + 1, formattingConfig)} ملحق ({app.symbol})
                              </div>
                            )}
                            <div>
                              {editMode ? (
                                <textarea
                                  value={app.text}
                                  onChange={(e) => updateAppendixField(idx, 'text', e.target.value)}
                                  rows={4}
                                  style={{ width: '100%', border: '1px dashed #cbd5e0', padding: '8px', fontFamily: 'inherit', fontSize: '13px' }}
                                />
                              ) : (
                                <div style={{ whiteSpace: 'pre-line', fontSize: '13px' }}>{app.text}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {editMode && (
                        <div className="no-print" style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={addAppendix}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ➕ إضافة ملحق جديد
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {reportPayload.finalEvaluation?.statement && (
                  <div style={{ marginTop: '25px', marginBottom: '25px' }}>
                    <h3 className="section-title">{getLevel1Number(10, formattingConfig)} {reportPayload.finalEvaluation.statement}</h3>
                  </div>
                )}

                {/* Signatures block */}
                {(() => {
                  const signatures = reportPayload.signatures || {};
                  const leaderRank = signatures.leaderRank || '';
                  const leaderName = signatures.leaderName || '';
                  const leaderRole = signatures.leaderRole || 'رئيس اللجنة';
                  const leaderDate = signatures.leaderDate || '';

                  const deputyRank = signatures.deputyRank || '';
                  const deputyName = signatures.deputyName || '';
                  const deputyRole = signatures.deputyRole || 'رئيس هيئة تفتيش قوى الامن الداخلي';
                  const deputyDate = signatures.deputyDate || '';

                  const showMinisterSign = signatures.showMinisterSign !== false;
                  const ministerTitle = signatures.ministerTitle || 'اصادق اصوليا';
                  const ministerName = signatures.ministerName || 'وزيـــــــر الداخلية';
                  const ministerDate = signatures.ministerDate || '٢٠٢٦/  / ';

                  return (
                    <div style={{ marginTop: '60px', borderTop: '1px dashed #cbd5e0', paddingTop: '20px' }}>
                      {/* Minister Signature Toggle and Inputs in Edit Mode */}
                      {editMode && (
                        <div className="no-print" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                            <input
                              type="checkbox"
                              checked={showMinisterSign}
                              onChange={(e) => updateSignatureField('showMinisterSign', e.target.checked)}
                            />
                            إظهار توقيع مصادقة وزير الداخلية في أعلى يسار التذييل
                          </label>
                          {showMinisterSign && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>عبارة المصادقة:</label>
                                <input
                                  type="text"
                                  value={ministerTitle}
                                  onChange={(e) => updateSignatureField('ministerTitle', e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>منصب المصادق:</label>
                                <input
                                  type="text"
                                  value={ministerName}
                                  onChange={(e) => updateSignatureField('ministerName', e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>التاريخ:</label>
                                <input
                                  type="text"
                                  value={ministerDate}
                                  onChange={(e) => updateSignatureField('ministerDate', e.target.value)}
                                  style={{ width: '100%', border: '1px solid #cbd5e0', padding: '5px', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Minister Signature in Preview Mode */}
                      {showMinisterSign && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px', paddingLeft: '5%' }}>
                          <div style={{ textAlign: 'center', width: '45%' }}>
                            {editMode ? (
                              <div style={{ color: '#718096', fontSize: '12px', border: '1px dashed #cbd5e0', padding: '5px', display: 'inline-block' }}>
                                (توقيع مصادقة وزير الداخلية - معروض أعلاه)
                              </div>
                            ) : (
                              <>
                                <p style={{ margin: '0 0 5px 0' }}><strong>{ministerTitle}</strong></p>
                                <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}><strong>{ministerName}</strong></p>
                                <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
                                  <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{ministerDate}</span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Two Columns: Leader (Right) and Deputy (Left) */}
                      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                        {/* Right Column: Leader */}
                        <div style={{ textAlign: 'center', width: '45%' }}>
                          {editMode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={leaderRank}
                                onChange={(e) => updateSignatureField('leaderRank', e.target.value)}
                                placeholder="الرتبة / العنوان الوظيفي"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={leaderName}
                                onChange={(e) => updateSignatureField('leaderName', e.target.value)}
                                placeholder="الاسم الكامل"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit' }}
                              />
                              <input
                                type="text"
                                value={leaderRole}
                                onChange={(e) => updateSignatureField('leaderRole', e.target.value)}
                                placeholder="الصفة باللجنة"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={leaderDate}
                                onChange={(e) => updateSignatureField('leaderDate', e.target.value)}
                                placeholder="التاريخ"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontSize: '11px', color: '#4a5568' }}
                              />
                            </div>
                          ) : (
                            <>
                              <div style={{ height: '55px' }}></div>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{leaderRank || '\u00A0'}</strong></p>
                              <p style={{ margin: '0 0 5px 0' }}>{leaderName}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{leaderRole}</strong></p>
                              <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
                                <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{leaderDate}</span>
                              </p>
                            </>
                          )}
                        </div>

                        {/* Left Column: Deputy */}
                        <div style={{ textAlign: 'center', width: '45%' }}>
                          {editMode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={deputyRank}
                                onChange={(e) => updateSignatureField('deputyRank', e.target.value)}
                                placeholder="الرتبة / العنوان الوظيفي"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={deputyName}
                                onChange={(e) => updateSignatureField('deputyName', e.target.value)}
                                placeholder="الاسم الكامل"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit' }}
                              />
                              <input
                                type="text"
                                value={deputyRole}
                                onChange={(e) => updateSignatureField('deputyRole', e.target.value)}
                                placeholder="الصفة باللجنة"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontWeight: 'bold' }}
                              />
                              <input
                                type="text"
                                value={deputyDate}
                                onChange={(e) => updateSignatureField('deputyDate', e.target.value)}
                                placeholder="التاريخ"
                                style={{ border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', width: '90%', fontFamily: 'inherit', fontSize: '11px', color: '#4a5568' }}
                              />
                            </div>
                          ) : (
                            <>
                              <div style={{ height: '55px' }}></div>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{deputyRank || '\u00A0'}</strong></p>
                              <p style={{ margin: '0 0 5px 0' }}>{deputyName}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>{deputyRole}</strong></p>
                              <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
                                <span dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>{deputyDate}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Styles overrides */}
      <style>{`
        .report-section-title, .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #0c2340;
          border-bottom: 2px solid #0c2340;
          padding-bottom: 5px;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .section-num {
          font-size: 16px;
          font-weight: bold;
          color: #0c2340;
          margin-top: 30px;
          margin-bottom: 10px;
        }
        .section-body {
          margin-right: 15px;
          margin-bottom: 20px;
          text-align: justify;
        }
        table.military-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0 25px 0;
        }
        table.military-table th, table.military-table td {
          border: 1px solid #000000;
          padding: 8px 10px;
          text-align: center;
          font-size: 13px;
        }
        table.military-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
