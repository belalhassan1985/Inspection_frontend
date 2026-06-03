import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export const Hierarchy: React.FC = () => {
  const { user } = useAuth();
  const isEditable = user?.role === 'ADMIN' || user?.role === 'EDITOR';
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard state
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Pagination for Directory Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Form states for Entity
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [entityName, setEntityName] = useState('');
  const [entityParentId, setEntityParentId] = useState('');
  const [entityLevel, setEntityLevel] = useState('LEVEL_1');
  const [isAssistant, setIsAssistant] = useState(false);

  // Form states for Position
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [posEntityId, setPosEntityId] = useState('');
  const [posId, setPosId] = useState<string | null>(null);
  const [posName, setPosName] = useState('');
  const [posStatus, setPosStatus] = useState('اصالة');
  const [posStatNum, setPosStatNum] = useState('');
  const [posHolder, setPosHolder] = useState('');
  const [posJoined, setPosJoined] = useState('');
  const [posActive, setPosActive] = useState(true);
  const [posRank, setPosRank] = useState('');
  const [posEducation, setPosEducation] = useState('');
  const [posNotes, setPosNotes] = useState('');
  const [posYearsOfService, setPosYearsOfService] = useState('');
  const [posEvaluation, setPosEvaluation] = useState('');
  const [posCadreStatus, setPosCadreStatus] = useState('');

  // Fetch all entities
  const loadEntities = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/entities');
      setEntities(data);
      // Preselect ROOT if exists
      const root = data.find((e: any) => e.level === 'ROOT');
      if (root) {
        setSelectedEntityId(root.id);
        // Expand root by default
        setExpandedNodes((prev) => ({ ...prev, [root.id]: true }));
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء تحميل الهيكل التنظيمي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities();
  }, []);

  // Synchronously expand parents of matching nodes when searching
  const autoExpandedIds = useMemo(() => {
    const expanded = new Set<string>();
    const term = searchTerm.trim().toLowerCase();
    if (!term || entities.length === 0) return expanded;

    const matches = entities.filter((ent) => {
      const nameMatch = ent.name.toLowerCase().includes(term);
      const positionMatch = ent.positions?.some((pos: any) => 
        pos.positionName.toLowerCase().includes(term) ||
        pos.positionHolder.toLowerCase().includes(term) ||
        pos.statisticalNumber.toLowerCase().includes(term)
      );
      return nameMatch || positionMatch;
    });

    matches.forEach((node) => {
      let parentId = node.parentId;
      while (parentId) {
        expanded.add(parentId);
        const parentNode = entities.find((item) => item.id === parentId);
        parentId = parentNode ? parentNode.parentId : null;
      }
    });

    return expanded;
  }, [searchTerm, entities]);

  // Combine manual expansions with auto-expansions from search
  const isNodeExpanded = (nodeId: string) => {
    if (searchTerm.trim() && autoExpandedIds.has(nodeId)) {
      return true;
    }
    return !!expandedNodes[nodeId];
  };

  const toggleNodeExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Helper to build breadcrumbs path for an entity
  const getBreadcrumbs = (entityId: string | null): string => {
    if (!entityId) return '';
    const pathList: string[] = [];
    let current = entities.find((e) => e.id === entityId);
    while (current) {
      pathList.unshift(current.name);
      current = current.parentId ? entities.find((e) => e.id === current.parentId) : null;
    }
    return pathList.join(' ➔ ');
  };

  const handleEntitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: entityName,
        parentId: entityParentId || null,
        level: entityLevel,
        isAssistant,
      };

      if (entityId) {
        await apiFetch(`/entities/${entityId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/entities', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowEntityForm(false);
      resetEntityForm();
      loadEntities();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الكيان التنظيمي');
    }
  };

  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        positionName: posName,
        positionStatus: posStatus,
        statisticalNumber: posStatNum,
        positionHolder: posHolder,
        joinedDate: posJoined ? new Date(posJoined).toISOString() : null,
        isActive: posActive,
        rank: posRank || null,
        education: posEducation || null,
        notes: posNotes || null,
        yearsOfService: posYearsOfService ? parseInt(posYearsOfService, 10) : null,
        evaluation: posEvaluation || null,
        cadreStatus: posCadreStatus || null,
      };

      if (posId) {
        await apiFetch(`/entities/positions/${posId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/entities/${posEntityId}/positions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowPositionForm(false);
      resetPositionForm();
      loadEntities();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ المنصب');
    }
  };

  const deleteEntity = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكيان وكافة المناصب والتقييمات التابعة له؟')) return;
    try {
      await apiFetch(`/entities/${id}`, { method: 'DELETE' });
      if (selectedEntityId === id) setSelectedEntityId(null);
      loadEntities();
    } catch (err: any) {
      setError(err.message || 'فشل حذف الكيان');
    }
  };

  const deletePosition = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنصب؟')) return;
    try {
      await apiFetch(`/entities/positions/${id}`, { method: 'DELETE' });
      loadEntities();
    } catch (err: any) {
      setError(err.message || 'فشل حذف المنصب');
    }
  };

  const resetEntityForm = () => {
    setEntityId(null);
    setEntityName('');
    setEntityParentId('');
    setEntityLevel('LEVEL_1');
    setIsAssistant(false);
  };

  const resetPositionForm = () => {
    setPosId(null);
    setPosEntityId('');
    setPosName('');
    setPosStatus('اصالة');
    setPosStatNum('');
    setPosHolder('');
    setPosJoined('');
    setPosActive(true);
    setPosRank('');
    setPosEducation('');
    setPosNotes('');
    setPosYearsOfService('');
    setPosEvaluation('');
    setPosCadreStatus('');
  };

  const editEntity = (ent: any) => {
    setEntityId(ent.id);
    setEntityName(ent.name);
    setEntityParentId(ent.parentId || '');
    setEntityLevel(ent.level);
    setIsAssistant(ent.isAssistant);
    setShowEntityForm(true);
  };

  const editPosition = (pos: any) => {
    setPosId(pos.id);
    setPosEntityId(pos.entityId);
    setPosName(pos.positionName);
    setPosStatus(pos.positionStatus);
    setPosStatNum(pos.statisticalNumber);
    setPosHolder(pos.positionHolder);
    setPosJoined(pos.joinedDate ? pos.joinedDate.substring(0, 10) : '');
    setPosActive(pos.isActive);
    setPosRank(pos.rank || '');
    setPosEducation(pos.education || '');
    setPosNotes(pos.notes || '');
    setPosYearsOfService(pos.yearsOfService !== undefined && pos.yearsOfService !== null ? String(pos.yearsOfService) : '');
    setPosEvaluation(pos.evaluation || '');
    setPosCadreStatus(pos.cadreStatus || '');
    setShowPositionForm(true);
  };

  // Translate levels to Arabic text
  const levelLabels: Record<string, string> = {
    ROOT: 'المستوى الرئاسي (السيادي)',
    LEVEL_1: 'مديرية عامة',
    LEVEL_2: 'قسم تفتيش',
    LEVEL_3: 'شعبة تفتيش',
  };

  const levelBadges: Record<string, string> = {
    ROOT: 'badge-info',
    LEVEL_1: 'badge-success',
    LEVEL_2: 'badge-warning',
    LEVEL_3: 'badge-danger',
  };

  // Search and Filter entities list for directory view
  const filteredEntities = useMemo(() => {
    return entities.filter((ent) => {
      // 1. Level Filter
      if (levelFilter !== 'all' && ent.level !== levelFilter) return false;

      // 2. Search Text
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;

      const nameMatch = ent.name.toLowerCase().includes(term);
      const levelMatch = ent.level.toLowerCase().includes(term);
      const positionMatch = ent.positions?.some((pos: any) => 
        pos.positionName.toLowerCase().includes(term) ||
        pos.positionHolder.toLowerCase().includes(term) ||
        pos.statisticalNumber.toLowerCase().includes(term)
      );

      return nameMatch || levelMatch || positionMatch;
    });
  }, [entities, levelFilter, searchTerm]);

  // Paginated entities for directory view
  const totalItems = filteredEntities.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedEntities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntities.slice(start, start + pageSize);
  }, [filteredEntities, currentPage, pageSize]);

  // Adjust current page if filter or search reduces count
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Selected Entity details
  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find((e) => e.id === selectedEntityId) || null;
  }, [selectedEntityId, entities]);

  // Recursive Tree Rendering
  const renderTreeNodes = (list: any[], parentId: string | null = null, depth = 0): React.ReactNode => {
    const children = list.filter((item) => item.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: depth === 0 ? 0 : '15px', borderRight: depth === 0 ? 'none' : '1px dashed var(--border-color)' }}>
        {children.map((node) => {
          const hasChildren = list.some((item) => item.parentId === node.id);
          const expanded = isNodeExpanded(node.id);
          const isSelected = selectedEntityId === node.id;
          
          // Check if search term matches this node or its direct officers
          const term = searchTerm.trim().toLowerCase();
          const matchesSearch = term && (
            node.name.toLowerCase().includes(term) ||
            node.positions?.some((p: any) => 
              p.positionHolder.toLowerCase().includes(term) ||
              p.positionName.toLowerCase().includes(term)
            )
          );

          return (
            <div key={node.id} style={{ marginTop: '5px' }}>
              <div
                onClick={() => setSelectedEntityId(node.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                  border: isSelected 
                    ? '1.5px solid var(--secondary-color)' 
                    : matchesSearch 
                      ? '1.5px dashed var(--secondary-color)' 
                      : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                  justifyContent: 'space-between',
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {hasChildren ? (
                    <button
                      onClick={(e) => toggleNodeExpand(node.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {expanded ? '▼' : '▶'}
                    </button>
                  ) : (
                    <span style={{ width: '22px', display: 'inline-block', textAlign: 'center', color: '#cbd5e0' }}>•</span>
                  )}

                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    [{node.level === 'ROOT' ? 'سيادي' : node.level === 'LEVEL_1' ? 'مديرية' : node.level === 'LEVEL_2' ? 'قسم' : 'شعبة'}]
                  </span>

                  <span style={{
                    fontWeight: isSelected || matchesSearch ? 'bold' : 500,
                    color: isSelected ? 'var(--secondary-color)' : 'var(--primary-color)',
                    fontSize: '14px'
                  }}>
                    {node.name}
                  </span>

                  {node.positions && node.positions.length > 0 && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      backgroundColor: '#edf2f7',
                      color: 'var(--primary-light)',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      {node.positions.length} منصب
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {node.positions && node.positions[0] && (
                    <span style={{ fontSize: '11px', color: '#718096' }}>
                      👤 {node.positions[0].positionHolder.split(' ')[0]} ({node.positions[0].positionName})
                    </span>
                  )}
                </div>
              </div>

              {/* Recursive rendering of children */}
              {hasChildren && expanded && (
                <div style={{ marginTop: '6px' }}>
                  {renderTreeNodes(list, node.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <style>{`
        .hierarchy-split-container {
          display: flex;
          flex-direction: column-reverse;
          gap: 20px;
        }
        @media (min-width: 1024px) {
          .hierarchy-split-container {
            display: grid;
            grid-template-columns: 1.6fr 1fr;
            align-items: flex-start;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الهيكل الإداري والتشكيلات</h1>
          <p className="page-subtitle">استعراض وتفويض هيكلية وزارة الداخلية وتوزيع الضباط الآمرين والمفتشين</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
          <button
            onClick={() => {
              resetEntityForm();
              setShowEntityForm(true);
            }}
            className="btn-primary"
          >
            + إضافة كيان إداري جديد
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Control Panel (Search, Filters, View Switches) */}
      <div className="card m-b-20" style={{ padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          
          {/* Search bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <input
              type="text"
              placeholder="ابحث باسم المديرية، رتبة الضابط، اسم المنصب، الرقم الإحصائي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0, padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="btn-outline" style={{ padding: '8px 15px' }}>تصفير</button>
            )}
          </div>

          {/* Level Filter (visible in table view) */}
          {viewMode === 'table' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>تصفية المستوى:</span>
              <select 
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
                style={{ width: '180px', margin: 0, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              >
                <option value="all">كل المستويات</option>
                <option value="ROOT">السيادي (المستوى الرئاسي)</option>
                <option value="LEVEL_1">LEVEL 1 (المديريات العامة)</option>
                <option value="LEVEL_2">LEVEL 2 (الأقسام)</option>
                <option value="LEVEL_3">LEVEL 3 (الشعب)</option>
              </select>
            </div>
          )}

          {/* View Mode switches */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#edf2f7', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('tree')}
              className="btn-outline"
              style={{
                margin: 0,
                border: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                backgroundColor: viewMode === 'tree' ? '#ffffff' : 'transparent',
                color: viewMode === 'tree' ? 'var(--primary-color)' : '#4a5568',
                fontWeight: viewMode === 'tree' ? 'bold' : 'normal',
                boxShadow: viewMode === 'tree' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              🌳 شجرة الهيكل التفاعلية
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="btn-outline"
              style={{
                margin: 0,
                border: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary-color)' : '#4a5568',
                fontWeight: viewMode === 'table' ? 'bold' : 'normal',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              📋 دليل الكيانات والمناصب (جدول)
            </button>
          </div>
        </div>
      </div>

      {/* Entity Modal Form */}
      {showEntityForm && (
        <div className="card m-b-20" style={{ borderRight: '6px solid var(--primary-color)', padding: '20px' }}>
          <h3 className="m-b-15" style={{ color: 'var(--primary-color)' }}>
            {entityId ? 'تعديل الكيان الإداري' : 'إضافة كيان إداري جديد'}
          </h3>
          <form onSubmit={handleEntitySubmit} style={{ marginTop: '15px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label>اسم الكيان / المديرية</label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="مثال: قسم تفتيش بغداد الكرخ"
                  required
                />
              </div>

              <div className="form-group">
                <label>الكيان الأعلى (الارتباط الإداري)</label>
                <select value={entityParentId} onChange={(e) => setEntityParentId(e.target.value)}>
                  <option value="">(كيان سيادي رئيسي - بلا مرجع أعلى)</option>
                  {entities.map((ent) => (
                    <option key={ent.id} value={ent.id}>{ent.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>مستوى الهيكل التنظيمي</label>
                <select value={entityLevel} onChange={(e) => setEntityLevel(e.target.value)}>
                  <option value="ROOT">ROOT (السيادي / الرئاسة)</option>
                  <option value="LEVEL_1">LEVEL 1 (المديريات العامة)</option>
                  <option value="LEVEL_2">LEVEL 2 (الأقسام التفتيشية)</option>
                  <option value="LEVEL_3">LEVEL 3 (الشعب والمكاتب الفرعية)</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
                <input
                  type="checkbox"
                  checked={isAssistant}
                  onChange={(e) => setIsAssistant(e.target.checked)}
                  style={{ width: '20px', height: '20px', margin: 0, cursor: 'pointer' }}
                />
                <label style={{ margin: 0, fontWeight: 'bold' }}>مساعد أو معاون إداري للكيان الأعلى</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button type="button" onClick={() => setShowEntityForm(false)} className="btn-outline">إلغاء</button>
              <button type="submit" className="btn-primary">حفظ الكيان</button>
            </div>
          </form>
        </div>
      )}

      {/* Position Modal Form */}
      {showPositionForm && (
        <div className="card m-b-20" style={{ borderRight: '6px solid var(--secondary-color)', padding: '20px' }}>
          <h3 className="m-b-15" style={{ color: 'var(--secondary-color)' }}>
            {posId ? 'تعديل المنصب العسكري' : 'إضافة منصب عسكري جديد للتشكيل'}
          </h3>
          <form onSubmit={handlePositionSubmit} style={{ marginTop: '15px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label>المسمى الوظيفي للمنصب</label>
                <input
                  type="text"
                  value={posName}
                  onChange={(e) => setPosName(e.target.value)}
                  placeholder="مثال: آمر قسم التفتيش، ضابط الشؤون الإدارية"
                  required
                />
              </div>

              <div className="form-group">
                <label>نوع التكليف بالمنصب</label>
                <select value={posStatus} onChange={(e) => setPosStatus(e.target.value)}>
                  <option value="اصالة">أصالة (تكليف رسمي دائم)</option>
                  <option value="وكالة">وكالة (مؤقت بالوكالة)</option>
                  <option value="تكليف">تكليف إداري خاص</option>
                </select>
              </div>

              <div className="form-group">
                <label>الرقم الإحصائي للضابط</label>
                <input
                  type="text"
                  value={posStatNum}
                  onChange={(e) => setPosStatNum(e.target.value)}
                  placeholder="مثال: A-10903"
                  required
                />
              </div>

              <div className="form-group">
                <label>اسم الضابط شاغل المنصب حالياً</label>
                <input
                  type="text"
                  value={posHolder}
                  onChange={(e) => setPosHolder(e.target.value)}
                  placeholder="الرتبة والاسم الثلاثي للضابط"
                  required
                />
              </div>

              <div className="form-group">
                <label>تاريخ استلام و مباشرة المنصب</label>
                <input
                  type="date"
                  value={posJoined}
                  onChange={(e) => setPosJoined(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>الرتبة العسكرية</label>
                <input
                  type="text"
                  value={posRank}
                  onChange={(e) => setPosRank(e.target.value)}
                  placeholder="مثال: لواء، عميد، عقيد"
                />
              </div>

              <div className="form-group">
                <label>التحصيل الدراسي</label>
                <input
                  type="text"
                  value={posEducation}
                  onChange={(e) => setPosEducation(e.target.value)}
                  placeholder="مثال: بكالوريوس علوم عسكرية، دكتوراه"
                />
              </div>

              <div className="form-group">
                <label>سنوات الخدمة (اختياري)</label>
                <input
                  type="number"
                  value={posYearsOfService}
                  onChange={(e) => setPosYearsOfService(e.target.value)}
                  placeholder="مثال: 25"
                />
              </div>

              <div className="form-group">
                <label>التقييم العام (اختياري)</label>
                <input
                  type="text"
                  value={posEvaluation}
                  onChange={(e) => setPosEvaluation(e.target.value)}
                  placeholder="مثال: ممتاز"
                />
              </div>

              <div className="form-group">
                <label>الملاك (اختياري)</label>
                <input
                  type="text"
                  value={posCadreStatus}
                  onChange={(e) => setPosCadreStatus(e.target.value)}
                  placeholder="مثال: ملاك المقر"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>ملاحظات المنصب شاغل أو غيره</label>
                <textarea
                  value={posNotes}
                  onChange={(e) => setPosNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية بخصوص هذا المنصب..."
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
                <input
                  type="checkbox"
                  checked={posActive}
                  onChange={(e) => setPosActive(e.target.checked)}
                  style={{ width: '20px', height: '20px', margin: 0, cursor: 'pointer' }}
                />
                <label style={{ margin: 0 }}>منصب فعال ونشط حالياً</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button type="button" onClick={() => setShowPositionForm(false)} className="btn-outline">إلغاء</button>
              <button type="submit" className="btn-secondary" style={{ color: 'white' }}>حفظ بيانات المنصب</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '50px', textAlign: 'center' }}>جاري تحميل الهيكل الإداري والمناصب...</div>
      ) : (
        <div>
          {/* VIEW MODE 1: Tree Explorer (World-class split screen) */}
          {viewMode === 'tree' && (
            <div className="hierarchy-split-container">
              
              {/* Left Tree Explorer Panel */}
              <div className="card" style={{ flex: '1 1 550px', padding: '20px', minHeight: '500px' }}>
                <h3 className="m-b-15">🌲 التشكيلات والهيكل التنظيمي الهرمي</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                  اضغط على الأسهم لتوسيع أو طي الفروع، واضغط على اسم الكيان لعرض ملفه التفصيلي والمناصب.
                </p>
                {entities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    لا توجد بيانات هيكلية متوفرة.
                  </div>
                ) : (
                  renderTreeNodes(entities, null, 0)
                )}
              </div>

              {/* Right Details Panel */}
              <div className="card" style={{ flex: '1 1 350px', borderTop: '6px solid var(--secondary-color)', padding: '20px', position: 'sticky', top: '20px' }}>
                {!selectedEntity ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🏢</span>
                    يرجى اختيار جهة أو تشكيل إداري من الشجرة التنظيمية لاستعراض الهوية والضباط الآمرين.
                  </div>
                ) : (
                  <div>
                    <span className={`badge ${levelBadges[selectedEntity.level] || 'badge-info'}`} style={{ fontSize: '11px', marginBottom: '8px' }}>
                      {levelLabels[selectedEntity.level] || selectedEntity.level}
                    </span>
                    <h2 style={{ fontSize: '20px', color: 'var(--primary-color)', margin: '0 0 10px 0' }}>
                      {selectedEntity.name}
                    </h2>

                    {selectedEntity.parentId && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', borderRight: '3px solid #cbd5e0' }}>
                        <strong>مسار التبعية الإدارية الأعلى:</strong><br />
                        {getBreadcrumbs(selectedEntity.parentId)}
                      </div>
                    )}

                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
                        👥 الضباط وشاغلي المناصب ({selectedEntity.positions?.length || 0})
                      </h4>

                      {selectedEntity.positions && selectedEntity.positions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {selectedEntity.positions.map((pos: any) => (
                            <div key={pos.id} style={{
                              padding: '12px',
                              backgroundColor: 'rgba(212, 175, 55, 0.03)',
                              border: '1.5px solid rgba(212, 175, 55, 0.15)',
                              borderRadius: '8px',
                              fontSize: '13px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ color: 'var(--primary-color)', fontSize: '13.5px' }}>
                                  👤 {pos.positionHolder}
                                </strong>
                                <span className={`badge badge-${pos.positionStatus === 'اصالة' ? 'success' : pos.positionStatus === 'وكالة' ? 'warning' : 'info'}`} style={{ fontSize: '10px' }}>
                                  {pos.positionStatus}
                                </span>
                              </div>
                              <div style={{ color: 'var(--text-secondary)' }}>
                                <strong>المنصب المكلف به:</strong> {pos.positionName} <br />
                                <strong>الرقم الإحصائي:</strong> {pos.statisticalNumber} <br />
                                {pos.rank && <span><strong>الرتبة العسكرية:</strong> {pos.rank} <br /></span>}
                                {pos.education && <span><strong>التحصيل الدراسي:</strong> {pos.education} <br /></span>}
                                {pos.yearsOfService && <span><strong>سنوات الخدمة:</strong> {pos.yearsOfService} سنة <br /></span>}
                                {pos.evaluation && <span><strong>التقييم العام:</strong> {pos.evaluation} <br /></span>}
                                {pos.cadreStatus && <span><strong>الملاك:</strong> {pos.cadreStatus} <br /></span>}
                                {pos.joinedDate && (
                                  <span><strong>تاريخ المباشرة:</strong> {pos.joinedDate.substring(0, 10)} <br /></span>
                                )}
                                {pos.notes && (
                                  <div style={{ marginTop: '6px', padding: '6px 8px', backgroundColor: '#f7fafc', borderRight: '3px solid var(--secondary-color)', borderRadius: '4px', fontSize: '12px' }}>
                                    <strong>ملاحظات:</strong> {pos.notes}
                                  </div>
                                )}
                              </div>

                              {isEditable && (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid #edf2f7', paddingTop: '8px' }}>
                                  <button
                                    onClick={() => editPosition(pos)}
                                    className="btn-outline"
                                    style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                                  >
                                    تعديل المنصب ✏️
                                  </button>
                                  {user?.role === 'ADMIN' && (
                                    <button
                                      onClick={() => deletePosition(pos.id)}
                                      className="btn-danger"
                                      style={{ padding: '3px 8px', fontSize: '11px' }}
                                    >
                                      حذف 🗑️
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#a0aec0', fontSize: '12.5px', textAlign: 'center', padding: '15px' }}>
                          لا توجد مناصب عسكرية معينة لهذا التشكيل حالياً.
                        </p>
                      )}
                    </div>

                    {isEditable && (
                      <div style={{ marginTop: '25px', display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                        <button
                          onClick={() => {
                            resetPositionForm();
                            setPosEntityId(selectedEntity.id);
                            setShowPositionForm(true);
                          }}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '8px 14px', flex: '1 1 auto', color: 'white' }}
                        >
                          + إضافة منصب عسكري
                        </button>
                        <button
                          onClick={() => editEntity(selectedEntity)}
                          className="btn-outline"
                          style={{ fontSize: '12px', padding: '8px 14px', flex: '1 1 auto' }}
                        >
                          تعديل التشكيل ✏️
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => deleteEntity(selectedEntity.id)}
                            className="btn-danger"
                            style={{ fontSize: '12px', padding: '8px 14px', flex: '1 1 auto' }}
                          >
                            حذف الكيان 🗑️
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW MODE 2: Paginated Directory Table View */}
          {viewMode === 'table' && (
            <div className="card">
              <h3 className="m-b-15">📋 دليل الكيانات التنظيمية والمناصب المعتمدة</h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right' }}>الكيان التنظيمي</th>
                      <th style={{ textAlign: 'right' }}>مستوى الهيكل</th>
                      <th style={{ textAlign: 'right' }}>الارتباط الإداري الأعلى</th>
                      <th style={{ textAlign: 'right' }}>المناصب وشاغليها حالياً</th>
                      {isEditable && <th style={{ textAlign: 'center', width: '220px' }}>العمليات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntities.map((ent) => {
                      return (
                        <tr key={ent.id}>
                          {/* Entity Name */}
                          <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            {ent.name}
                            {ent.isAssistant && (
                              <span style={{ marginRight: '6px', fontSize: '9px', padding: '2px 6px', backgroundColor: '#e2e8f0', color: '#4a5568', borderRadius: '4px' }}>
                                مساعد
                              </span>
                            )}
                          </td>

                          {/* Level */}
                          <td>
                            <span className={`badge ${levelBadges[ent.level] || 'badge-info'}`}>
                              {levelLabels[ent.level] || ent.level}
                            </span>
                          </td>

                          {/* Hierarchy breadcrumbs */}
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {ent.parentId ? getBreadcrumbs(ent.parentId) : '— (رئيسي)'}
                          </td>

                          {/* Positions list */}
                          <td>
                            {ent.positions && ent.positions.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                 {ent.positions.map((p: any) => (
                                   <div key={p.id} style={{ fontSize: '12.5px' }}>
                                     • {p.rank ? `${p.rank} ` : ''}<strong>{p.positionHolder}</strong> - <span style={{ color: 'var(--text-secondary)' }}>{p.positionName} ({p.positionStatus})</span>
                                   </div>
                                 ))}
                              </div>
                            ) : (
                              <span style={{ color: '#a0aec0', fontSize: '12px' }}>لا يوجد مناصب</span>
                            )}
                          </td>

                          {/* Operations */}
                          {isEditable && (
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => {
                                    resetPositionForm();
                                    setPosEntityId(ent.id);
                                    setShowPositionForm(true);
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px', color: 'white' }}
                                >
                                  + منصب
                                </button>
                                <button
                                  onClick={() => editEntity(ent)}
                                  className="btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                                >
                                  تعديل ✏️
                                </button>
                                {user?.role === 'ADMIN' && (
                                  <button
                                    onClick={() => deleteEntity(ent.id)}
                                    className="btn-danger"
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                  >
                                    حذف 🗑️
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {paginatedEntities.length === 0 && (
                      <tr>
                        <td colSpan={isEditable ? 5 : 4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                          لا توجد نتائج تطابق معايير البحث والتصفية المدخلة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '15px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  {/* Page Info */}
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    استعراض <strong>{Math.min(pageSize, filteredEntities.length)}</strong> من أصل <strong>{filteredEntities.length}</strong> كيان تنظيمي
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      ⏮️ الأولى
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      السابق
                    </button>
                    
                    <span style={{ fontSize: '13px', margin: '0 8px', fontWeight: 'bold' }}>
                      صفحة {currentPage} من {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      التالي
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      الأخيرة ⏭️
                    </button>
                  </div>

                  {/* Page Size Selector */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px' }}>حجم الصفحة:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ width: '80px', margin: 0, padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px' }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
