import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: { id: string; name: string; department?: string }[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedOption ? selectedOption.name : '');
    }
  }, [value, selectedOption, isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase()) ||
    (opt.department && opt.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label style={{ fontWeight: 'bold' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange('');
            }
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setSearch(selectedOption ? selectedOption.name : '');
            }, 200);
          }}
          placeholder={placeholder}
          required={required && !value}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
        />
        <span 
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: '12px',
            color: '#718096'
          }}
        >
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 10,
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '4px'
        }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setSearch(opt.name);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  backgroundColor: opt.id === value ? 'var(--primary-color)' : 'transparent',
                  color: opt.id === value ? '#ffffff' : 'inherit',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  textAlign: 'right'
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <span>{opt.name}</span>
                {opt.department && (
                  <span style={{ fontSize: '11px', color: opt.id === value ? '#e2e8f0' : '#718096' }}>
                    {opt.department}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '10px 12px', color: '#718096', fontSize: '13px', textAlign: 'center' }}>
              لا توجد نتائج مطابقة
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SearchableMultiSelectProps {
  label: string;
  placeholder: string;
  options: { id: string; name: string; department?: string }[];
  selectedValues: string[];
  onChange: (vals: string[]) => void;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  label,
  placeholder,
  options,
  selectedValues,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOptions = options.filter(opt => selectedValues.includes(opt.id));

  const availableOptions = options.filter(opt =>
    !selectedValues.includes(opt.id) &&
    (opt.name.toLowerCase().includes(search.toLowerCase()) ||
     (opt.department && opt.department.toLowerCase().includes(search.toLowerCase())))
  );

  const removeValue = (id: string) => {
    onChange(selectedValues.filter(val => val !== id));
  };

  const addValue = (id: string) => {
    onChange([...selectedValues, id]);
    setSearch('');
  };

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label style={{ fontWeight: 'bold' }}>{label}</label>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: selectedOptions.length > 0 ? '10px' : '0',
        padding: selectedOptions.length > 0 ? '6px 0' : '0'
      }}>
        {selectedOptions.map(opt => (
          <span
            key={opt.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary-color)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            {opt.name}
            <button
              type="button"
              onClick={() => removeValue(opt.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '0 2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={placeholder}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
        />
        <span 
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: '12px',
            color: '#718096'
          }}
        >
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 10,
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '4px'
        }}>
          {availableOptions.length > 0 ? (
            availableOptions.map(opt => (
              <div
                key={opt.id}
                onClick={() => addValue(opt.id)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  textAlign: 'right'
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <span>{opt.name}</span>
                {opt.department && (
                  <span style={{ fontSize: '11px', color: '#718096' }}>
                    {opt.department}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '10px 12px', color: '#718096', fontSize: '13px', textAlign: 'center' }}>
              {search ? 'لا توجد نتائج مطابقة' : 'تم اختيار جميع المفتشين'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for Campaign creation/edit
  const [showForm, setShowForm] = useState(false);
  const [campId, setCampId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('regular');
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentReference, setAssignmentReference] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [deputyId, setDeputyId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [formationNumber, setFormationNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('');
  const [campaignTypes, setCampaignTypes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cData, uData, eData, tData, tmplData] = await Promise.all([
        apiFetch('/campaigns'),
        apiFetch('/inspectors'),
        apiFetch('/entities'),
        apiFetch('/campaigns/types/all'),
        apiFetch('/criteria-templates'),
      ]);
      setCampaigns(cData);
      setInspectors(uData);
      setEntities(eData);
      setCampaignTypes(tData);
      setTemplates(tmplData);
      // Auto-select default template
      const defaultTpl = tmplData.find((t: any) => t.isDefault);
      if (defaultTpl) {
        setTemplateId(defaultTpl.id);
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء تحميل بيانات الحملات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!leaderId) {
      setError('يرجى اختيار رئيس اللجنة');
      return;
    }
    if (!deputyId) {
      setError('يرجى اختيار معاون رئيس اللجنة');
      return;
    }
    if (leaderId === deputyId) {
      setError('لا يمكن أن يكون رئيس اللجنة هو نفسه معاون رئيس اللجنة (المقرر)');
      return;
    }
    if (selectedMembers.includes(leaderId)) {
      setError('لا يمكن إضافة رئيس اللجنة كعضو في اللجنة');
      return;
    }
    if (selectedMembers.includes(deputyId)) {
      setError('لا يمكن إضافة معاون رئيس اللجنة كعضو في اللجنة');
      return;
    }

    try {
      const payload: Record<string, any> = {
        name: name || `لجنة تفتيشية رقم ${assignmentReference}`,
        type,
        assignmentText,
        assignmentReference,
        assignmentDate: new Date(assignmentDate).toISOString(),
        leaderId: leaderId || null,
        deputyId: deputyId || null,
        purpose,
        entityId: entityId || null,
        formationNumber: formationNumber || `هـ.ت / ${assignmentReference}`,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        status,
        memberIds: selectedMembers,
      };

      // Assign selected template
      if (templateId) {
        payload.templateId = templateId;
      }

      if (campId) {
        await apiFetch(`/campaigns/${campId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/campaigns', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      resetCampaignForm();
      setCurrentPage(1);
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الحملة');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحملة بالكامل؟')) return;
    try {
      await apiFetch(`/campaigns/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حذف الحملة');
    }
  };

  const editCampaign = (c: any) => {
    setCampId(c.id);
    setName(c.name || '');
    setType(c.type || 'regular');
    setAssignmentText(c.assignmentText || '');
    setAssignmentReference(c.assignmentReference || '');
    setAssignmentDate(c.assignmentDate ? c.assignmentDate.substring(0, 10) : '');
    setLeaderId(c.leaderId || '');
    setDeputyId(c.deputyId || '');
    setPurpose(c.purpose || '');
    setEntityId(c.entityId || '');
    setFormationNumber(c.formationNumber || '');
    setStartDate(c.startDate ? c.startDate.substring(0, 10) : '');
    setEndDate(c.endDate ? c.endDate.substring(0, 10) : '');
    setStatus(c.status || 'active');
    setSelectedMembers(c.members ? c.members.map((m: any) => m.inspectorId) : []);
    setTemplateId(c.template?.id || '');
    setShowForm(true);
  };

  const resetCampaignForm = () => {
    setCampId(null);
    setName('');
    setType(campaignTypes[0]?.key || 'regular');
    setAssignmentText('');
    setAssignmentReference('');
    setAssignmentDate('');
    setLeaderId('');
    setDeputyId('');
    setEntityId('');
    setFormationNumber('');
    setStartDate('');
    setEndDate('');
    setStatus('active');
    setPurpose('');
    setSelectedMembers([]);
    const defaultTpl = templates.find(t => t.isDefault);
    setTemplateId(defaultTpl?.id || '');
  };

  const filteredCampaigns = campaigns.filter(c => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const cName = (c.name || '').toLowerCase();
    const ref = (c.assignmentReference || '').toLowerCase();
    const entName = (c.entity?.name || '').toLowerCase();
    const leader = (c.leader?.fullName || '').toLowerCase();
    return cName.includes(term) || ref.includes(term) || entName.includes(term) || leader.includes(term);
  });

  // Sort campaigns explicitly on the frontend (latest created campaign first)
  const sortedCampaigns = useMemo(() => {
    return [...filteredCampaigns].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  }, [filteredCampaigns]);

  // Paginated campaigns
  const totalItems = sortedCampaigns.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCampaigns.slice(start, start + pageSize);
  }, [sortedCampaigns, currentPage, pageSize]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Ensure currentPage is within valid bounds if totalPages changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const inspectorOptions = useMemo(() => {
    return inspectors.map((insp: any) => ({
      id: insp.id,
      name: insp.fullName,
      department: insp.department || '',
      isActive: insp.isActive
    }));
  }, [inspectors]);

  // For leader options, filter out inactive except the currently selected leader
  const leaderOptions = useMemo(() => {
    return inspectorOptions.filter(opt => opt.isActive || opt.id === leaderId);
  }, [inspectorOptions, leaderId]);

  // For deputy options, filter out inactive except the currently selected deputy
  const deputyOptions = useMemo(() => {
    return inspectorOptions.filter(opt => opt.isActive || opt.id === deputyId);
  }, [inspectorOptions, deputyId]);

  // For members options, filter out inactive except the currently selected members
  const memberOptions = useMemo(() => {
    return inspectorOptions.filter(opt => opt.isActive || selectedMembers.includes(opt.id));
  }, [inspectorOptions, selectedMembers]);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      {showForm ? (
        /* Full-page Form Layout */
        <div className="card" style={{ borderTop: '6px solid var(--primary-color)', padding: '25px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
              {campId ? 'تعديل بيانات اللجنة التفتيشية' : 'إضافة لجنة تفتيشية جديدة'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetCampaignForm();
              }}
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
            >
              ← العودة للقائمة
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleCampaignSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>اسم اللجنة (اختياري)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: لجنة تفتيش مديرية واسط"
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>نوع اللجنة</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {campaignTypes.map((t) => (
                    <option key={t.id} value={t.key}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-3" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>رقم كتاب التكليف (الأمر)</label>
                <input
                  type="text"
                  value={assignmentReference}
                  onChange={(e) => setAssignmentReference(e.target.value)}
                  placeholder="مثال: 383"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>تاريخ كتاب التكليف</label>
                <input
                  type="date"
                  value={assignmentDate}
                  onChange={(e) => setAssignmentDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>الرقم الإداري للتشكيل</label>
                <input
                  type="text"
                  value={formationNumber}
                  onChange={(e) => setFormationNumber(e.target.value)}
                  placeholder="مثال: هـ.ت / 383"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>نص التكليف (السياق الإداري والوزاري)</label>
              <textarea
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                rows={2}
                placeholder="بناءً على توجيهات السيد الوزير المحترم..."
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>الغاية والهدف من التفتيش</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                placeholder="تقييم الأداء العام وتحديد الإيجابيات والسلبيات..."
                required
              />
            </div>

            <div className="grid-2" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>الجهة التنظيمية المستهدفة بالتفتيش</label>
                <select value={entityId} onChange={(e) => setEntityId(e.target.value)} required>
                  <option value="">(اختر الجهة المستهدفة)</option>
                  {entities.map(e => (
                    <option key={e.id} value={e.id}>{e.name} [{e.level === 'ROOT' ? 'سيادي' : e.level === 'LEVEL_1' ? 'مديرية' : 'قسم/شعبة'}]</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>قالب أسس التفتيش (الأساس التفتيشي)</label>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
                  <option value="">(اختر قالب أسس التفتيش)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.isDefault ? '(الافتراضي)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: '10px' }}>
              <SearchableSelect
                label="رئيس اللجنة (ضابط مفتش)"
                placeholder="ابحث عن رئيس اللجنة باسمه أو مديريته..."
                options={leaderOptions}
                value={leaderId}
                onChange={setLeaderId}
                required
              />

              <SearchableSelect
                label="معاون رئيس اللجنة / المقرر"
                placeholder="ابحث عن المقرر باسمه أو مديريته..."
                options={deputyOptions}
                value={deputyId}
                onChange={setDeputyId}
                required
              />
            </div>

            <div className="grid-3" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>تاريخ بدء التفتيش الميداني</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>تاريخ انتهاء التفتيش الميداني</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>حالة اللجنة</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">نشطة (قيد الميدان)</option>
                  <option value="completed">مكتملة (مغلقة)</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <SearchableMultiSelect
                label="أعضاء اللجنة المفتشون الآخرون"
                placeholder="ابحث باسم المفتش أو مديريته لإضافته للجنة..."
                options={memberOptions}
                selectedValues={selectedMembers}
                onChange={setSelectedMembers}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetCampaignForm();
                }}
                className="btn-outline"
                style={{ padding: '10px 25px' }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '10px 25px' }}
              >
                حفظ بيانات اللجنة
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Campaigns Listing Page */
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">إدارة اللجان التفتيشية</h1>
              <p className="page-subtitle">استعراض وتفويض اللجان والمجموعات التفتيشية الميدانية</p>
            </div>

            {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
              <button
                onClick={() => {
                  resetCampaignForm();
                  setShowForm(true);
                }}
                className="btn-primary"
              >
                + إضافة لجنة تفتيشية
              </button>
            )}
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="card m-b-20" style={{ padding: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>🔍</span>
              <input
                type="text"
                placeholder="ابحث باسم اللجنة، الكيان المستهدف، رقم الأمر، رئيس اللجنة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ margin: 0, flex: 1, padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="btn-outline" style={{ padding: '8px 12px' }}>تصفير</button>
              )}
            </div>
          </div>

          {/* Campaigns Listing */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل البيانات...</div>
          ) : (
        <div className="card">
          <h3 className="m-b-15">لائحة اللجان التفتيشية المسجلة</h3>
          {filteredCampaigns.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد لجان تفتيشية تطابق البحث.</div>
          ) : (
            <>
              <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'right' }}>الجهة المستهدفة</th>
                  <th style={{ textAlign: 'right' }}>رئيس اللجنة</th>
                  <th style={{ textAlign: 'right' }}>أمر التكليف</th>
                  <th style={{ textAlign: 'right' }}>تاريخ الأمر</th>
                  <th style={{ textAlign: 'right' }}>فترة التفتيش</th>
                  <th style={{ textAlign: 'right' }}>قالب الأسس</th>
                  <th style={{ textAlign: 'center' }}>الحالة</th>
                  <th style={{ textAlign: 'center', width: '320px' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.map((c) => {
                  const orderDateFormatted = c.assignmentDate ? c.assignmentDate.substring(0, 10) : '—';
                  const inspPeriod = c.startDate
                    ? `${c.startDate.substring(0, 10)} إلى ${c.endDate ? c.endDate.substring(0, 10) : 'مستمر'}`
                    : '—';

                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 'bold' }}>
                        {c.entity?.name || 'جهة غير محددة'}
                        {(() => {
                          const tObj = campaignTypes.find(t => t.key === c.type);
                          const typeLabel = tObj ? tObj.name : (c.type === 'regular' ? 'تفتيشية اعتيادية' : c.type === 'education' ? 'تعليمية وتدريبية' : c.type);
                          return (
                            <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#edf2f7', borderRadius: '4px', marginRight: '6px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                              {typeLabel}
                            </span>
                          );
                        })()}
                      </td>
                      <td>{c.leader?.fullName || 'غير متوفر'}</td>
                      <td>كتاب رقم {c.assignmentReference}</td>
                      <td>{orderDateFormatted}</td>
                      <td style={{ fontSize: '13px' }}>{inspPeriod}</td>
                      <td style={{ fontSize: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: c.template?.isDefault ? '#edf2f7' : '#e8f5e9',
                          borderRadius: '4px',
                          color: 'var(--primary-color)',
                          fontWeight: 'bold',
                          fontSize: '11px',
                        }}>
                          {c.template?.name || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${c.status === 'active' ? 'success' : c.status === 'completed' ? 'info' : 'danger'}`}>
                          {c.status === 'active' ? 'نشطة' : c.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => navigate(`/campaigns/${c.id}`)}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            عرض 👁️
                          </button>
                          
                          {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                            <button
                              onClick={() => editCampaign(c)}
                              className="btn-outline"
                              style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            >
                              تعديل ✏️
                            </button>
                          )}

                          <button
                            onClick={() => navigate('/inspections', { state: { campaignId: c.id } })}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            التقييم ⭐
                          </button>

                          <button
                            onClick={() => navigate('/reports', { state: { campaignId: c.id } })}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            تقرير 📄
                          </button>

                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => deleteCampaign(c.id)}
                              className="btn-danger"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                            >
                              حذف 🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalItems > 0 && (
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
                  عرض اللجان <strong>{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)}</strong> من أصل <strong>{totalItems}</strong> لجنة تفتيشية
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
            </>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
};
