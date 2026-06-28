import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CriteriaDetailModal } from '../components/criteria/CriteriaDetailModal';

const EVALUATION_TEMPLATES = {
  general: [
    { optionText: 'ممتاز', type: 'positive', scoreValue: 10 },
    { optionText: 'جيد جداً', type: 'positive', scoreValue: 8 },
    { optionText: 'جيد', type: 'positive', scoreValue: 6 },
    { optionText: 'فوق الوسط', type: 'positive', scoreValue: 5 },
    { optionText: 'وسط', type: 'positive', scoreValue: 4 },
    { optionText: 'دون الوسط', type: 'positive', scoreValue: 2 },
    { optionText: 'ضعيف', type: 'positive', scoreValue: 0 },
  ],
  verification: [
    { optionText: 'متحقق', type: 'positive', scoreValue: 1 },
    { optionText: 'غير متحقق', type: 'negative', scoreValue: 0 },
  ],
  compliance: [
    { optionText: 'ملتزم', type: 'positive', scoreValue: 10 },
    { optionText: 'ملتزم جزئياً', type: 'positive', scoreValue: 5 },
    { optionText: 'غير ملتزم', type: 'negative', scoreValue: 0 },
  ],
  readiness: [
    { optionText: 'جاهز', type: 'positive', scoreValue: 10 },
    { optionText: 'جاهزية متوسطة', type: 'positive', scoreValue: 5 },
    { optionText: 'غير جاهز', type: 'negative', scoreValue: 0 },
  ],
  field_cases: [
    { optionText: 'إيجابي', type: 'positive', scoreValue: 0 },
    { optionText: 'سلبي', type: 'negative', scoreValue: 0 },
    { optionText: 'معوق', type: 'impediment', scoreValue: 0 },
    { optionText: 'معضلة', type: 'obstacle', scoreValue: 0 },
  ]
};

const DETAILED_TABLE_TEMPLATES = {
  personnel: {
    name: 'موقف الأشخاص',
    columns: [
      { key: 'category', label: 'الفئة', type: 'text', required: true, role: 'label' },
      { key: 'nominal', label: 'الملاك', type: 'number', required: true, role: 'nominal' },
      { key: 'actual', label: 'الموجود', type: 'number', required: true, role: 'actual' },
      { key: 'deficit', label: 'النقص', type: 'number', required: false, role: 'deficit' },
      { key: 'increase', label: 'الزيادة', type: 'number', required: false, role: 'increase' },
      { key: 'percentage', label: 'النسبة %', type: 'percentage', required: false, role: 'percentage' },
    ]
  },
  vehicles: {
    name: 'موقف العجلات',
    columns: [
      { key: 'vehicle_type', label: 'نوع العجلة', type: 'text', required: true, role: 'label' },
      { key: 'nominal', label: 'الملاك', type: 'number', required: true, role: 'nominal' },
      { key: 'actual', label: 'الموجود', type: 'number', required: true, role: 'actual' },
      { key: 'working', label: 'الصالح', type: 'number', required: true, role: 'none' },
      { key: 'broken', label: 'العاطل', type: 'number', required: true, role: 'none' },
      { key: 'percentage', label: 'النسبة %', type: 'percentage', required: false, role: 'percentage' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  weapons: {
    name: 'موقف الأسلحة',
    columns: [
      { key: 'weapon_type', label: 'نوع السلاح', type: 'text', required: true, role: 'label' },
      { key: 'nominal', label: 'الملاك', type: 'number', required: true, role: 'nominal' },
      { key: 'actual', label: 'الموجود', type: 'number', required: true, role: 'actual' },
      { key: 'working', label: 'الصالح', type: 'number', required: true, role: 'none' },
      { key: 'broken', label: 'غير الصالح', type: 'number', required: true, role: 'none' },
      { key: 'ammo', label: 'العتاد', type: 'number', required: false, role: 'none' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  devices: {
    name: 'موقف الأجهزة',
    columns: [
      { key: 'device_type', label: 'نوع الجهاز', type: 'text', required: true, role: 'label' },
      { key: 'total_count', label: 'العدد الكلي', type: 'number', required: true, role: 'nominal' },
      { key: 'working', label: 'الصالح', type: 'number', required: true, role: 'actual' },
      { key: 'broken', label: 'العاطل', type: 'number', required: true, role: 'none' },
      { key: 'readiness_rate', label: 'نسبة الجاهزية', type: 'percentage', required: false, role: 'percentage' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  buildings: {
    name: 'موقف الأبنية',
    columns: [
      { key: 'building_name', label: 'اسم البناية', type: 'text', required: true, role: 'label' },
      { key: 'occupancy_type', label: 'نوع الإشغال', type: 'text', required: true, role: 'none' },
      { key: 'structural_status', label: 'الحالة الإنشائية', type: 'text', required: true, role: 'none' },
      { key: 'needs_maintenance', label: 'الحاجة إلى صيانة', type: 'text', required: true, role: 'none' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  patrols: {
    name: 'موقف النجدة',
    columns: [
      { key: 'patrol_type', label: 'نوع الدورية', type: 'text', required: true, role: 'label' },
      { key: 'required_count', label: 'العدد المطلوب', type: 'number', required: true, role: 'nominal' },
      { key: 'working_actual', label: 'العامل فعلياً', type: 'number', required: true, role: 'actual' },
      { key: 'broken', label: 'العاطل', type: 'number', required: true, role: 'none' },
      { key: 'readiness_rate', label: 'نسبة الجاهزية', type: 'percentage', required: false, role: 'percentage' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  traffic: {
    name: 'موقف المرور',
    columns: [
      { key: 'service_type', label: 'نوع الخدمة/المعاملة', type: 'text', required: true, role: 'label' },
      { key: 'total_count', label: 'العدد الكلي', type: 'number', required: true, role: 'nominal' },
      { key: 'completed', label: 'المنجز', type: 'number', required: true, role: 'actual' },
      { key: 'delayed', label: 'المتأخر', type: 'number', required: false, role: 'deficit' },
      { key: 'percentage', label: 'النسبة %', type: 'percentage', required: false, role: 'percentage' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  civil_defense: {
    name: 'موقف الدفاع المدني',
    columns: [
      { key: 'team_or_vehicle_type', label: 'نوع العجلة/الفريق', type: 'text', required: true, role: 'label' },
      { key: 'present', label: 'الموجود', type: 'number', required: true, role: 'nominal' },
      { key: 'ready', label: 'الجاهز', type: 'number', required: true, role: 'actual' },
      { key: 'broken', label: 'العاطل', type: 'number', required: false, role: 'deficit' },
      { key: 'readiness_rate', label: 'نسبة الجاهزية', type: 'percentage', required: false, role: 'percentage' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  narcotics: {
    name: 'موقف المخدرات',
    columns: [
      { key: 'report_type', label: 'نوع البيان', type: 'text', required: true, role: 'label' },
      { key: 'count', label: 'العدد', type: 'number', required: true, role: 'nominal' },
      { key: 'referred_to_court', label: 'المحال للقضاء', type: 'number', required: false, role: 'none' },
      { key: 'under_investigation', label: 'قيد التحقيق', type: 'number', required: false, role: 'none' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  },
  river_police: {
    name: 'موقف الشرطة النهرية',
    columns: [
      { key: 'boat_or_patrol_type', label: 'نوع الزورق/الدورية', type: 'text', required: true, role: 'label' },
      { key: 'present', label: 'الموجود', type: 'number', required: true, role: 'nominal' },
      { key: 'working', label: 'العامل', type: 'number', required: true, role: 'actual' },
      { key: 'broken', label: 'العاطل', type: 'number', required: false, role: 'deficit' },
      { key: 'patrol_points', label: 'نقاط الرصد', type: 'text', required: false, role: 'none' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ]
  }
};

export const Criteria: React.FC = () => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Templates states
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateModalMode, setTemplateModalMode] = useState<'add' | 'edit'>('add');

  const openAddTemplateModal = () => {
    setTemplateModalMode('add');
    setTemplateName('');
    setTemplateDesc('');
    setShowTemplateModal(true);
  };

  const openEditTemplateModal = () => {
    if (!selectedTemplate) return;
    setTemplateModalMode('edit');
    setTemplateName(selectedTemplate.name);
    setTemplateDesc(selectedTemplate.description || '');
    setShowTemplateModal(true);
  };

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'primary' | 'secondary' | 'detail'>('primary');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  const [formData, setFormData] = useState({
    id: null as number | null,
    parentId: null as number | null, // primaryId for secondary, secondaryId for detail
    titleOrText: '',
    maxGrade: '',
    inputType: 'single',
    options: [] as Array<{ id?: number; tempKey?: string; optionText: string; type: string; optionTypeId?: number | null; optionType?: any; scoreValue: number }>,
    tableSchema: [] as Array<{ key: string; label: string; type: string; required: boolean; role: string; tempKey?: string }>,
  });

  // Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportHtmlContent, setReportHtmlContent] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'word' | null>(null);

  const handleViewReport = async () => {
    if (!selectedTemplateId) return;
    setReportLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/reports/criteria-report/${selectedTemplateId}/html`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('فشل تحميل التقرير');
      const html = await response.text();
      setReportHtmlContent(html);
      setShowReportModal(true);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل التقرير');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedTemplateId) return;
    setDownloading('pdf');
    setError('');
    try {
      const blob: Blob = await apiFetch(`/reports/criteria-report/${selectedTemplateId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `تقرير_أسس_ومعايير_التفتيش_${selectedTemplateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل التقرير بصيغة PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadWord = async () => {
    if (!selectedTemplateId) return;
    setDownloading('word');
    setError('');
    try {
      const blob: Blob = await apiFetch(`/reports/criteria-report/${selectedTemplateId}/word`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `تقرير_أسس_ومعايير_التفتيش_${selectedTemplateId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل التقرير بصيغة Word');
    } finally {
      setDownloading(null);
    }
  };

  const isEditable = user?.role === 'ADMIN' || user?.role === 'EDITOR';

  const loadTemplates = async () => {
    try {
      const tmplData = await apiFetch('/criteria-templates');
      setTemplates(tmplData);
      
      // Auto-select default template initially
      if (tmplData.length > 0) {
        const defaultTpl = tmplData.find((t: any) => t.isDefault) || tmplData[0];
        setSelectedTemplateId(defaultTpl.id);
      }
    } catch (e: any) {
      console.error('Failed to load templates', e);
      setError('حدث خطأ أثناء تحميل قوالب أسس التفتيش');
    }
  };

  const loadCriteriaForTemplate = async (templateId: string, isQuiet = false) => {
    if (!templateId) return;
    if (!isQuiet) setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/criteria-templates/${templateId}`);
      const primaries = data.items ? data.items.map((item: any) => item.primary) : [];
      setCriteria(primaries);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل أسس ومعايير التفتيش لهذا القالب');
    } finally {
      if (!isQuiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      loadCriteriaForTemplate(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  // Load option templates helper
  const loadOptionTemplate = (templateKey: keyof typeof EVALUATION_TEMPLATES) => {
    const selectedTemplateOptions = EVALUATION_TEMPLATES[templateKey];
    setFormData(prev => ({
      ...prev,
      options: selectedTemplateOptions.map((opt) => ({ ...opt, tempKey: `tmpl_${crypto.randomUUID()}` }))
    }));
  };

  // Open Modal Helpers
  const openAddPrimaryModal = () => {
    setModalType('primary');
    setModalMode('add');
    setFormData({ id: null, parentId: null, titleOrText: '', maxGrade: '', inputType: 'single', options: [], tableSchema: [] });
    setShowModal(true);
  };

  const openEditPrimaryModal = (pri: any) => {
    setModalType('primary');
    setModalMode('edit');
    setFormData({ id: pri.id, parentId: null, titleOrText: pri.title, maxGrade: String(pri.maxGrade), inputType: 'single', options: [], tableSchema: [] });
    setShowModal(true);
  };

  const openAddSecondaryModal = (primaryId: number) => {
    setModalType('secondary');
    setModalMode('add');
    setFormData({ id: null, parentId: primaryId, titleOrText: '', maxGrade: '', inputType: 'single', options: [], tableSchema: [] });
    setShowModal(true);
  };

  const openEditSecondaryModal = (sec: any) => {
    setModalType('secondary');
    setModalMode('edit');
    setFormData({ id: sec.id, parentId: sec.primaryId, titleOrText: sec.title, maxGrade: String(sec.maxGrade), inputType: 'single', options: [], tableSchema: [] });
    setShowModal(true);
  };

  const openAddDetailModal = (secondaryId: number) => {
    setModalType('detail');
    setModalMode('add');
    setFormData({ id: null, parentId: secondaryId, titleOrText: '', maxGrade: '', inputType: 'single', options: [], tableSchema: [] });
    setShowModal(true);
  };

  const openEditDetailModal = (det: any) => {
    setModalType('detail');
    setModalMode('edit');
    setFormData({
      id: det.id,
      parentId: det.secondaryId,
      titleOrText: det.detailText,
      maxGrade: String(det.maxGrade),
      inputType: det.inputType || 'single',
      options: det.options ? det.options.map((opt: any, i: number) => ({
        id: opt.id,
        tempKey: opt.id || `edit_${Date.now()}_${i}`,
        optionText: opt.optionText,
        type: opt.type || 'positive',
        optionTypeId: opt.optionTypeId || opt.optionType?.id || null,
        optionType: opt.optionType || null,
        scoreValue: opt.scoreValue !== null && opt.scoreValue !== undefined ? Number(opt.scoreValue) : 0,
      })) : [],
      tableSchema: det.tableSchema ? (typeof det.tableSchema === 'string' ? JSON.parse(det.tableSchema) : det.tableSchema).map((col: any, i: number) => ({
        key: col.key,
        label: col.label || '',
        type: col.type || 'text',
        required: col.required ?? true,
        role: col.role || 'none',
        tempKey: col.key || `col_${Date.now()}_${i}`
      })) : [],
    });
    setShowModal(true);
  };

  // Delete/Remove Helpers
  const handleRemovePrimaryFromTemplate = async (primaryId: number) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا المحور الرئيسي من القالب الحالي فقط؟ لن يتم حذفه من قاعدة البيانات.')) return;
    try {
      await apiFetch(`/criteria-templates/${selectedTemplateId}/items/${primaryId}`, { method: 'DELETE' });
      loadCriteriaForTemplate(selectedTemplateId);
    } catch (err: any) {
      alert(err.message || 'فشل إزالة المحور من القالب');
    }
  };

  const handleDeletePrimary = async (id: number) => {
    if (!window.confirm('⚠️ تحذير: هل أنت متأكد من حذف هذا المحور الرئيسي بالكامل؟ سيتم حذف جميع المحاور الفرعية والبنود التفصيلية التابعة له تلقائياً من قاعدة البيانات ومن كافة القوالب.')) return;
    try {
      await apiFetch(`/inspections/primary-criteria/${id}`, { method: 'DELETE' });
      loadCriteriaForTemplate(selectedTemplateId);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المحور الرئيسي');
    }
  };

  const handleDeleteSecondary = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المحور الفرعي بالكامل وجميع بنود التقييم التابعة له؟')) return;
    try {
      await apiFetch(`/inspections/secondary-criteria/${id}`, { method: 'DELETE' });
      loadCriteriaForTemplate(selectedTemplateId);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المحور الفرعي');
    }
  };

  const handleDeleteDetail = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف بند التقييم التفصيلي هذا؟')) return;
    try {
      await apiFetch(`/inspections/criteria-detail/${id}`, { method: 'DELETE' });
      loadCriteriaForTemplate(selectedTemplateId);
    } catch (err: any) {
      alert(err.message || 'فشل حذف بند التقييم');
    }
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleOrText.trim() || !formData.maxGrade) return;

    try {
      const payload: any = {
        maxGrade: parseFloat(formData.maxGrade),
      };

      let url = '';
      let method = 'POST';

      if (modalType === 'primary') {
        payload.title = formData.titleOrText;
        url = modalMode === 'edit' ? `/inspections/primary-criteria/${formData.id}` : '/inspections/primary-criteria';
      } else if (modalType === 'secondary') {
        payload.title = formData.titleOrText;
        if (modalMode === 'add') {
          payload.primaryId = formData.parentId;
        }
        url = modalMode === 'edit' ? `/inspections/secondary-criteria/${formData.id}` : '/inspections/secondary-criteria';
      } else {
        payload.detailText = formData.titleOrText;
        payload.inputType = formData.inputType;
        if (formData.inputType === 'single' || formData.inputType === 'multiple') {
          payload.options = formData.options.map((opt) => ({
            optionText: opt.optionText.trim(),
            type: opt.type,
            scoreValue: opt.scoreValue !== null && opt.scoreValue !== undefined ? Number(opt.scoreValue) : null,
          }));
          payload.tableSchema = null;
        } else if (formData.inputType === 'detailed_table') {
          payload.options = [];
          payload.tableSchema = formData.tableSchema.map((col) => ({
            key: col.key,
            label: col.label.trim(),
            type: col.type,
            required: !!col.required,
            role: col.role || 'none',
          }));
        } else {
          payload.options = [];
          payload.tableSchema = null;
        }
        if (modalMode === 'add') {
          payload.secondaryId = formData.parentId;
        }
        url = modalMode === 'edit' ? `/inspections/criteria-detail/${formData.id}` : '/inspections/criteria-detail';
      }

      if (modalMode === 'edit') {
        method = 'PUT';
      }

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      // Link newly created Primary Criteria to selected Template
      if (modalType === 'primary' && modalMode === 'add' && selectedTemplateId) {
        await apiFetch(`/criteria-templates/${selectedTemplateId}/items`, {
          method: 'POST',
          body: JSON.stringify({
            primaryId: response.id,
          }),
        });
      }

      setShowModal(false);
      loadCriteriaForTemplate(selectedTemplateId, true);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ التعديلات');
    }
  };

  const handleDetailModalSubmit = async (detailPayload: any) => {
    const payload = {
      ...detailPayload,
      ...(modalMode === 'add' ? { secondaryId: formData.parentId } : {}),
    };
    const url = modalMode === 'edit' ? `/inspections/criteria-detail/${formData.id}` : '/inspections/criteria-detail';
    await apiFetch(url, {
      method: modalMode === 'edit' ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    setShowModal(false);
    loadCriteriaForTemplate(selectedTemplateId, true);
  };

  // Template Submit Handler
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    try {
      if (templateModalMode === 'add') {
        const newTpl = await apiFetch('/criteria-templates', {
          method: 'POST',
          body: JSON.stringify({
            name: templateName.trim(),
            description: templateDesc.trim(),
          }),
        });
        setShowTemplateModal(false);
        setTemplateName('');
        setTemplateDesc('');
        
        // Reload templates list
        const tmplData = await apiFetch('/criteria-templates');
        setTemplates(tmplData);
        
        // Auto-select the newly created template
        setSelectedTemplateId(newTpl.id);
      } else {
        await apiFetch(`/criteria-templates/${selectedTemplateId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: templateName.trim(),
            description: templateDesc.trim(),
          }),
        });
        setShowTemplateModal(false);
        setTemplateName('');
        setTemplateDesc('');
        
        // Reload templates list
        const tmplData = await apiFetch('/criteria-templates');
        setTemplates(tmplData);
      }
    } catch (err: any) {
      alert(err.message || 'فشل حفظ مسمى الأسس');
    }
  };

  // Template Deletion Handler
  const handleDeleteTemplate = async () => {
    const selected = templates.find(t => t.id === selectedTemplateId);
    if (!selected) return;
    if (selected.isDefault) {
      alert('لا يمكن حذف القالب الافتراضي الموحد للوزارة');
      return;
    }
    if (!window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف المسمى "${selected.name}" بالكامل؟`)) return;
    try {
      await apiFetch(`/criteria-templates/${selectedTemplateId}`, { method: 'DELETE' });
      // Reset selected ID and reload
      setSelectedTemplateId('');
      const tmplData = await apiFetch('/criteria-templates');
      setTemplates(tmplData);
      if (tmplData.length > 0) {
        const defaultTpl = tmplData.find((t: any) => t.isDefault) || tmplData[0];
        setSelectedTemplateId(defaultTpl.id);
      }
    } catch (err: any) {
      alert(err.message || 'فشل حذف المسمى');
    }
  };

  const handleReorderPrimary = async (primaryId: number, direction: 'up' | 'down') => {
    const index = criteria.findIndex(p => p.id === primaryId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= criteria.length) return;

    const newCriteria = [...criteria];
    const temp = newCriteria[index];
    newCriteria[index] = newCriteria[newIndex];
    newCriteria[newIndex] = temp;

    setCriteria(newCriteria);

    try {
      const ids = newCriteria.map(p => p.id);
      await apiFetch('/inspections/primary-criteria/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids, templateId: selectedTemplateId }),
      });
      loadCriteriaForTemplate(selectedTemplateId);
    } catch (err: any) {
      alert(err.message || 'فشل إعادة الترتيب');
      loadCriteriaForTemplate(selectedTemplateId);
    }
  };

  const handleReorderSecondary = async (primaryId: number, secondaryId: number, direction: 'up' | 'down') => {
    const primary = criteria.find(p => p.id === primaryId);
    if (!primary || !primary.secondaryCriteria) return;

    const secondaries = primary.secondaryCriteria;
    const index = secondaries.findIndex((s: any) => s.id === secondaryId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= secondaries.length) return;

    const newSecondaries = [...secondaries];
    const temp = newSecondaries[index];
    newSecondaries[index] = newSecondaries[newIndex];
    newSecondaries[newIndex] = temp;

    setCriteria(prev => prev.map(p => p.id === primaryId ? { ...p, secondaryCriteria: newSecondaries } : p));

    try {
      const ids = newSecondaries.map((s: any) => s.id);
      await apiFetch('/inspections/secondary-criteria/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      loadCriteriaForTemplate(selectedTemplateId);
    } catch (err: any) {
      alert(err.message || 'فشل إعادة الترتيب');
      loadCriteriaForTemplate(selectedTemplateId);
    }
  };

  const handleReorderDetail = async (secondaryId: number, detailId: number, direction: 'up' | 'down') => {
    let primaryId: number | null = null;
    let details: any[] = [];

    for (const pri of criteria) {
      if (pri.secondaryCriteria) {
        const sec = pri.secondaryCriteria.find((s: any) => s.id === secondaryId);
        if (sec) {
          primaryId = pri.id;
          details = sec.details || [];
          break;
        }
      }
    }

    if (primaryId === null || details.length === 0) return;

    const index = details.findIndex((d: any) => d.id === detailId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= details.length) return;

    const newDetails = [...details];
    const temp = newDetails[index];
    newDetails[index] = newDetails[newIndex];
    newDetails[newIndex] = temp;

    setCriteria(prev => prev.map(p => {
      if (p.id !== primaryId) return p;
      return {
        ...p,
        secondaryCriteria: p.secondaryCriteria.map((s: any) =>
          s.id === secondaryId ? { ...s, details: newDetails } : s
        )
      };
    }));

    try {
      const ids = newDetails.map((d: any) => d.id);
      await apiFetch('/inspections/criteria-detail/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      loadCriteriaForTemplate(selectedTemplateId);
    } catch (err: any) {
      alert(err.message || 'فشل إعادة الترتيب');
      loadCriteriaForTemplate(selectedTemplateId);
    }
  };

  const getFilteredCriteria = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return criteria;

    return criteria
      .map((pri, priIdx) => {
        const priNum = String(priIdx + 1);
        const matchPriTitle = pri.title?.toLowerCase().includes(query) || 
                              priNum === query ||
                              (pri.orderIndex !== undefined && String(pri.orderIndex) === query) ||
                              (pri.order !== undefined && String(pri.order) === query) ||
                              (pri.sortOrder !== undefined && String(pri.sortOrder) === query);

        // Filter secondaries
        const filteredSecondaries = (pri.secondaryCriteria || [])
          .map((sec: any, secIdx: number) => {
            const secNum = String(secIdx + 1);
            const matchSecTitle = sec.title?.toLowerCase().includes(query) || 
                                  secNum === query ||
                                  (sec.orderIndex !== undefined && String(sec.orderIndex) === query) ||
                                  (sec.order !== undefined && String(sec.order) === query) ||
                                  (sec.sortOrder !== undefined && String(sec.sortOrder) === query);

            // Filter details
            const filteredDetails = (sec.details || []).filter((det: any, detIdx: number) => {
              const detNum = String(detIdx + 1);
              const matchDetText = det.detailText?.toLowerCase().includes(query) || 
                                   detNum === query ||
                                   (det.orderIndex !== undefined && String(det.orderIndex) === query) ||
                                   (det.order !== undefined && String(det.order) === query) ||
                                   (det.sortOrder !== undefined && String(det.sortOrder) === query);
              return matchDetText;
            });

            const matchSecHasMatchingDetails = filteredDetails.length > 0;

            if (matchSecTitle || matchSecHasMatchingDetails) {
              return {
                ...sec,
                details: matchSecTitle && filteredDetails.length === 0 ? sec.details : filteredDetails,
              };
            }
            return null;
          })
          .filter(Boolean);

        const matchPriHasMatchingSecondaries = filteredSecondaries.length > 0;

        if (matchPriTitle || matchPriHasMatchingSecondaries) {
          return {
            ...pri,
            secondaryCriteria: matchPriTitle && filteredSecondaries.length === 0 ? pri.secondaryCriteria : filteredSecondaries,
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const filteredCriteria = getFilteredCriteria();

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">أسس ومعايير التفتيش</h1>
          <p className="page-subtitle">إدارة وتعديل المحاور والبنود المعيارية لنموذج التفتيش العام</p>
        </div>
      </div>

      {/* Template Selection & Management Card */}
      <div className="card m-b-20" style={{ padding: '20px', borderTop: '4px solid var(--secondary-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
            <label style={{ fontWeight: 'bold', minWidth: '120px', margin: 0 }}>مسمى أسس التفتيش:</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={{ flex: 1, minWidth: '200px', margin: 0 }}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? '⭐ (أساسي)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isEditable && (
              <button
                onClick={openAddTemplateModal}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                ➕ إضافة مسمى جديد
              </button>
            )}

            {isEditable && selectedTemplateId && (
              <>
                <button
                  onClick={openEditTemplateModal}
                  className="btn-outline"
                  style={{ fontSize: '13px', padding: '8px 12px' }}
                  title="تعديل اسم المسمى الحالي"
                >
                  ✏️ تعديل الاسم
                </button>
                
                {!selectedTemplate?.isDefault && (
                  <button
                    onClick={handleDeleteTemplate}
                    className="btn-danger"
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    title="حذف هذا المسمى بالكامل"
                  >
                    🗑️ حذف
                  </button>
                )}
              </>
            )}
            {selectedTemplateId && (
              <>
                <span style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-color)', display: 'inline-block' }}></span>
                <button
                  onClick={handleViewReport}
                  className="btn-outline"
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                  title="عرض التقرير"
                  disabled={reportLoading}
                >
                  {reportLoading ? 'جاري التحميل...' : '📄 عرض التقرير'}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="btn-outline"
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                  title="تصدير PDF"
                  disabled={downloading === 'pdf'}
                >
                  {downloading === 'pdf' ? '...جاري' : '📥 PDF'}
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="btn-outline"
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                  title="تصدير Word"
                  disabled={downloading === 'word'}
                >
                  {downloading === 'word' ? '...جاري' : '📥 Word'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Template Description */}
        {selectedTemplate && (
          <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>الوصف: </strong>
            {selectedTemplate.description || 'لا يوجد وصف مضاف لهذا المسمى.'}
          </div>
        )}
      </div>

      {/* Search Input Card */}
      {selectedTemplateId && (
        <div className="card m-b-20" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', position: 'relative' }}>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-secondary)', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="البحث في المحاور الرئيسية، الفرعية، البنود التفصيلية، أو رقم الترتيب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px 10px 40px',
                paddingRight: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '14px',
                margin: 0,
                transition: 'border-color 0.2s',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  width: '24px',
                  height: '24px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                title="مسح البحث"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        {isEditable && selectedTemplateId && (
          <button onClick={openAddPrimaryModal} className="btn-primary">
            + إضافة محور رئيسي للمسمى الحالي
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل معايير التفتيش...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {filteredCriteria.map((pri) => {
            const originalPriIdx = criteria.findIndex(p => p.id === pri.id);
            const isFirstPrimary = originalPriIdx === 0;
            const isLastPrimary = originalPriIdx === criteria.length - 1;
            return (
              <div key={`primary-${pri.id}`} className="card" style={{ borderRight: '6px solid var(--primary-color)' }}>
                
                {/* Primary Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
                  <h2 style={{ fontSize: '18px', color: 'var(--primary-color)', margin: 0 }}>
                    ⚖️ {pri.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-info" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      الدرجة العظمى: {pri.maxGrade} درجة
                    </span>
                    {isEditable && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleReorderPrimary(pri.id, 'up')}
                          disabled={isFirstPrimary}
                          className="btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px', opacity: isFirstPrimary ? 0.4 : 1, cursor: isFirstPrimary ? 'not-allowed' : 'pointer' }}
                          title="تحريك للأعلى"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReorderPrimary(pri.id, 'down')}
                          disabled={isLastPrimary}
                          className="btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px', opacity: isLastPrimary ? 0.4 : 1, cursor: isLastPrimary ? 'not-allowed' : 'pointer' }}
                          title="تحريك للأسفل"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => openAddSecondaryModal(pri.id)}
                          className="btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          + محور فرعي
                        </button>
                        <button
                          onClick={() => openEditPrimaryModal(pri)}
                          className="btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                        >
                          تعديل ✏️
                        </button>
                        <button
                          onClick={() => handleRemovePrimaryFromTemplate(pri.id)}
                          className="btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}
                          title="إزالة هذا المحور من المسمى الحالي فقط (دون حذفه من مسميات أخرى)"
                        >
                          إزالة ❌
                        </button>
                        <button
                          onClick={() => handleDeletePrimary(pri.id)}
                          className="btn-danger"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="حذف المحور نهائياً من قاعدة البيانات ومن جميع المسميات"
                        >
                          حذف 🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Criteria List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '15px' }}>
                  {pri.secondaryCriteria && pri.secondaryCriteria.map((sec: any) => {
                    const originalPri = criteria.find(p => p.id === pri.id);
                    const originalSecIdx = originalPri && originalPri.secondaryCriteria
                      ? originalPri.secondaryCriteria.findIndex((s: any) => s.id === sec.id)
                      : -1;
                    const originalSecLength = originalPri && originalPri.secondaryCriteria
                      ? originalPri.secondaryCriteria.length
                      : 0;
                    const isFirstSecondary = originalSecIdx === 0;
                    const isLastSecondary = originalSecIdx === originalSecLength - 1;
                    return (
                      <div key={`secondary-${sec.id}`} style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                        
                        {/* Secondary Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h3 style={{ fontSize: '15px', color: 'var(--primary-light)', margin: 0 }}>
                            🔹 {sec.title}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                              الدرجة الفرعية: {sec.maxGrade} درجة
                            </span>
                            {isEditable && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => handleReorderSecondary(pri.id, sec.id, 'up')}
                                  disabled={isFirstSecondary}
                                  className="btn-outline"
                                  style={{ padding: '2px 6px', fontSize: '10px', opacity: isFirstSecondary ? 0.4 : 1, cursor: isFirstSecondary ? 'not-allowed' : 'pointer' }}
                                  title="تحريك للأعلى"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => handleReorderSecondary(pri.id, sec.id, 'down')}
                                  disabled={isLastSecondary}
                                  className="btn-outline"
                                  style={{ padding: '2px 6px', fontSize: '10px', opacity: isLastSecondary ? 0.4 : 1, cursor: isLastSecondary ? 'not-allowed' : 'pointer' }}
                                  title="تحريك للأسفل"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => openAddDetailModal(sec.id)}
                                  className="btn-outline"
                                  style={{ padding: '2px 6px', fontSize: '10px' }}
                                >
                                  + إضافة بند تقييم
                                </button>
                                <button
                                  onClick={() => openEditSecondaryModal(sec)}
                                  className="btn-outline"
                                  style={{ padding: '2px 6px', fontSize: '10px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteSecondary(sec.id)}
                                  className="btn-danger"
                                  style={{ padding: '2px 6px', fontSize: '10px' }}
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Details Table */}
                        <table style={{ margin: 0, backgroundColor: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '60px', textAlign: 'center' }}>ت</th>
                              <th style={{ textAlign: 'right' }}>بند التفتيش والتقييم التفصيلي</th>
                              <th style={{ width: '120px', textAlign: 'center' }}>الدرجة العظمى</th>
                              {isEditable && <th style={{ width: '180px', textAlign: 'center' }}>العمليات</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {sec.details && sec.details.map((detail: any, index: number) => {
                              const originalPri = criteria.find(p => p.id === pri.id);
                              const originalSec = originalPri && originalPri.secondaryCriteria
                                ? originalPri.secondaryCriteria.find((s: any) => s.id === sec.id)
                                : null;
                              const originalDetIdx = originalSec && originalSec.details
                                ? originalSec.details.findIndex((d: any) => d.id === detail.id)
                                : -1;
                              const originalDetLength = originalSec && originalSec.details
                                ? originalSec.details.length
                                : 0;
                              const isFirstDetail = originalDetIdx === 0;
                              const isLastDetail = originalDetIdx === originalDetLength - 1;
                              return (
                                <tr key={`detail-${detail.id}`}>
                                  <td style={{ textAlign: 'center' }}>{originalDetIdx !== -1 ? originalDetIdx + 1 : index + 1}</td>
                                  <td style={{ fontWeight: 600 }}>
                                    <div>{detail.detailText}</div>
                                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                      <span className="badge badge-info" style={{ fontSize: '10px', padding: '3px 8px', margin: 0, height: 'auto', fontWeight: 'bold' }}>
                                        نوع الإدخال: {
                                          detail.inputType === 'single' ? 'اختيار واحد' :
                                          detail.inputType === 'multiple' ? 'اختيارات متعددة' :
                                          detail.inputType === 'boolean' ? 'نعم / لا' :
                                          detail.inputType === 'text' ? 'نص حر' :
                                          detail.inputType === 'detailed_table' ? 'جدول مواقف تفصيلي' : detail.inputType
                                        }
                                      </span>
                                      {detail.options && detail.options.length > 0 && detail.options.map((opt: any) => {
                                        let badgeBg = opt.optionType?.color || '#e2e8f0';
                                        let badgeColor = '#4a5568';
                                        if (!opt.optionType?.color) {
                                          if (opt.type === 'positive') { badgeBg = '#e6fffa'; badgeColor = '#047481'; }
                                          else if (opt.type === 'negative') { badgeBg = '#fde8e8'; badgeColor = '#9b1c1c'; }
                                          else if (opt.type === 'impediment') { badgeBg = '#fef3c7'; badgeColor = '#92400e'; }
                                          else if (opt.type === 'obstacle') { badgeBg = '#ffedd5'; badgeColor = '#9a3412'; }
                                        }
                                        return (
                                          <span key={`opt-${opt.id}`} style={{
                                            backgroundColor: badgeBg,
                                            color: badgeColor,
                                            fontSize: '10px',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontWeight: 'normal',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                          }}>
                                            {opt.optionText} ({opt.scoreValue !== null && opt.scoreValue !== undefined ? opt.scoreValue : 0} د)
                                          </span>
                                        );
                                      })}
                                      {detail.inputType === 'detailed_table' && detail.tableSchema && (
                                        (typeof detail.tableSchema === 'string' ? JSON.parse(detail.tableSchema) : detail.tableSchema).map((col: any, cIdx: number) => (
                                          <span key={`col-${cIdx}`} style={{
                                            backgroundColor: '#ebf8ff',
                                            color: '#2b6cb0',
                                            fontSize: '10px',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontWeight: 'normal',
                                            border: '1px solid rgba(43,108,176,0.1)'
                                          }}>
                                            {col.label}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                    {detail.maxGrade} درجة
                                  </td>
                                  {isEditable && (
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        <button
                                          onClick={() => handleReorderDetail(sec.id, detail.id, 'up')}
                                          disabled={isFirstDetail}
                                          className="btn-outline"
                                          style={{ padding: '2px 6px', fontSize: '10px', opacity: isFirstDetail ? 0.4 : 1, cursor: isFirstDetail ? 'not-allowed' : 'pointer' }}
                                          title="تحريك للأعلى"
                                        >
                                          ↑
                                        </button>
                                        <button
                                          onClick={() => handleReorderDetail(sec.id, detail.id, 'down')}
                                          disabled={isLastDetail}
                                          className="btn-outline"
                                          style={{ padding: '2px 6px', fontSize: '10px', opacity: isLastDetail ? 0.4 : 1, cursor: isLastDetail ? 'not-allowed' : 'pointer' }}
                                          title="تحريك للأسفل"
                                        >
                                          ↓
                                        </button>
                                        <button
                                          onClick={() => openEditDetailModal(detail)}
                                          className="btn-outline"
                                          style={{ padding: '2px 6px', fontSize: '10px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDetail(detail.id)}
                                          className="btn-danger"
                                          style={{ padding: '2px 6px', fontSize: '10px' }}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                            {(!sec.details || sec.details.length === 0) && (
                              <tr>
                                <td colSpan={isEditable ? 4 : 3} style={{ textAlign: 'center', color: '#a0aec0', padding: '15px' }}>
                                  لا توجد بنود تفصيلية مضافة تحت هذا المحور الفرعي بعد.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                  {(!pri.secondaryCriteria || pri.secondaryCriteria.length === 0) && (
                    <p style={{ color: '#a0aec0', fontSize: '13px' }}>لا توجد محاور فرعية مضافة تحت هذا المحور الرئيسي بعد.</p>
                  )}
                </div>
              </div>
            );
          })}

          {criteria.length > 0 && filteredCriteria.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-color)', fontWeight: 'bold' }}>
              لا توجد أسس مطابقة لعملية البحث.
            </div>
          )}

          {criteria.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              لا توجد محاور مسجلة تحت هذا المسمى حالياً. يمكنك البدء بإضافة محور رئيسي وتأسيس الفروع تحته.
            </div>
          )}
        </div>
      )}

      <CriteriaDetailModal
        isOpen={showModal && modalType === 'detail'}
        mode={modalMode}
        initialData={formData}
        onClose={() => setShowModal(false)}
        onSubmit={handleDetailModalSubmit}
      />

      {/* CRUD MODAL */}
      {showModal && (modalType as string) !== 'detail' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '650px', width: '100%', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            borderTop: '6px solid var(--primary-color)', direction: 'rtl', textAlign: 'right',
            padding: 0, overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px 15px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                {modalMode === 'add' ? 'إضافة بند تفتيشي جديد' : 'تعديل بيانات البند التفتيشي'}
              </h3>
            </div>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                <div className="form-group">
                  <label>
                    {modalType === 'detail' ? 'نص البند التفتيشي التفصيلي' : 'عنوان المحور التفتيشي'}
                  </label>
                  {modalType === 'detail' ? (
                    <textarea
                      value={formData.titleOrText}
                      onChange={(e) => setFormData(prev => ({ ...prev, titleOrText: e.target.value }))}
                      rows={4}
                      placeholder="مثال: مدى توفر خطط بديلة للطوارئ ومصادقتها..."
                      required
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.titleOrText}
                      onChange={(e) => setFormData(prev => ({ ...prev, titleOrText: e.target.value }))}
                      placeholder={modalType === 'primary' ? "مثال: الانضباط والجاهزية العسكرية" : "مثال: القيافة والضبط العام"}
                      required
                    />
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>الدرجة العظمى المخصصة للبند</label>
                  <input
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    value={formData.maxGrade}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxGrade: e.target.value }))}
                    placeholder="مثال: 25"
                    required
                  />
                </div>

                {modalType === 'detail' && (
                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label>نوع إدخال بند التفتيش</label>
                    <select
                      value={formData.inputType}
                      onChange={(e) => setFormData(prev => ({ ...prev, inputType: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="single">اختيار واحد (Single Choice)</option>
                      <option value="multiple">اختيارات متعددة (Multiple Choice)</option>
                      <option value="boolean">نعم / لا (Boolean)</option>
                      <option value="text">نص حر (Free Text)</option>
                      <option value="detailed_table">جدول تفصيلي ديناميكي (detailed_table)</option>
                    </select>
                  </div>
                )}

                {modalType === 'detail' && formData.inputType === 'detailed_table' && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '13px' }}>تحميل قالب جاهز من مكتبة المواقف:</label>
                    <select
                      value=""
                      onChange={(e) => {
                        const templateKey = e.target.value as keyof typeof DETAILED_TABLE_TEMPLATES;
                        if (!templateKey) return;
                        const template = DETAILED_TABLE_TEMPLATES[templateKey];
                        if (template && template.columns) {
                          setFormData(prev => ({
                            ...prev,
                            tableSchema: template.columns.map((col, idx) => ({
                              ...col,
                              tempKey: `col_${Date.now()}_${idx}`
                            }))
                          }));
                        }
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="">(اختر قالباً جاهزاً من المكتبة...)</option>
                      {Object.entries(DETAILED_TABLE_TEMPLATES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {modalType === 'detail' && formData.inputType === 'detailed_table' && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ fontWeight: 'bold', margin: 0 }}>تحديد أعمدة الجدول</label>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: '12px', padding: '4px 10px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                        onClick={() => {
                          const newColIndex = formData.tableSchema.length;
                          setFormData(prev => ({
                            ...prev,
                            tableSchema: [...prev.tableSchema, {
                              tempKey: `new_col_${Date.now()}_${Math.random()}`,
                              key: `col_${newColIndex + 1}`,
                              label: '',
                              type: 'text',
                              required: true,
                              role: 'none'
                            }]
                          }));
                        }}
                      >
                        ➕ إضافة عمود جديد
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#edf2f7', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '8px', textAlign: 'right' }}>اسم العمود (بالعربية)</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '110px' }}>نوع البيانات</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '70px' }}>إجباري</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '130px' }}>الدور الحسابي</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>حذف</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.tableSchema.map((col, idx) => (
                            <tr key={col.tempKey || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                              <td style={{ padding: '6px' }}>
                                <input
                                  type="text"
                                  value={col.label}
                                  onChange={(e) => {
                                    const labelVal = e.target.value;
                                    const keyVal = labelVal === 'الفئة' ? 'category' :
                                                   labelVal === 'الملاك' ? 'nominal' :
                                                   labelVal === 'الموجود' ? 'actual' :
                                                   labelVal === 'النقص' ? 'deficit' :
                                                   labelVal === 'الزيادة' ? 'increase' :
                                                   labelVal === 'النسبة' || labelVal.includes('النسبة') ? 'percentage' :
                                                   `col_${idx}`;
                                    setFormData(prev => ({
                                      ...prev,
                                      tableSchema: prev.tableSchema.map((item, cIdx) =>
                                        cIdx === idx ? { ...item, label: labelVal, key: keyVal } : item
                                      )
                                    }));
                                  }}
                                  placeholder="اسم العمود (مثال: الفئة)"
                                  style={{ margin: 0, padding: '6px 10px', fontSize: '12px' }}
                                  required
                                />
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                <select
                                  value={col.type}
                                  onChange={(e) => {
                                    const typeVal = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      tableSchema: prev.tableSchema.map((item, cIdx) =>
                                        cIdx === idx ? { ...item, type: typeVal } : item
                                      )
                                    }));
                                  }}
                                  style={{ margin: 0, padding: '6px', width: '100%', fontSize: '12px', height: 'auto' }}
                                >
                                  <option value="text">نص (text)</option>
                                  <option value="number">رقم (number)</option>
                                  <option value="percentage">نسبة % (percentage)</option>
                                  <option value="date">تاريخ (date)</option>
                                </select>
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={col.required}
                                  onChange={(e) => {
                                    const reqVal = e.target.checked;
                                    setFormData(prev => ({
                                      ...prev,
                                      tableSchema: prev.tableSchema.map((item, cIdx) =>
                                        cIdx === idx ? { ...item, required: reqVal } : item
                                      )
                                    }));
                                  }}
                                  style={{ margin: 0 }}
                                />
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                <select
                                  value={col.role}
                                  onChange={(e) => {
                                    const roleVal = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      tableSchema: prev.tableSchema.map((item, cIdx) =>
                                        cIdx === idx ? { ...item, role: roleVal } : item
                                      )
                                    }));
                                  }}
                                  style={{ margin: 0, padding: '6px', width: '100%', fontSize: '12px', height: 'auto' }}
                                >
                                  <option value="none">بلا (none)</option>
                                  <option value="label">تسمية الفئة (label)</option>
                                  <option value="nominal">الملاك (nominal)</option>
                                  <option value="actual">الموجود (actual)</option>
                                  <option value="deficit">النقص (deficit)</option>
                                  <option value="increase">الزيادة (increase)</option>
                                  <option value="percentage">النسبة (percentage)</option>
                                </select>
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-danger"
                                  style={{ padding: '6px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', minWidth: 'auto' }}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      tableSchema: prev.tableSchema.filter((_, cIdx) => cIdx !== idx)
                                    }));
                                  }}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {formData.tableSchema.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '15px', color: '#a0aec0', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '6px', marginTop: '10px' }}>
                        لا توجد أعمدة مضافة بعد. يرجى الضغط على زر القالب أو إضافة أعمدة يدوية.
                      </div>
                    )}
                  </div>
                )}

                {modalType === 'detail' && (formData.inputType === 'single' || formData.inputType === 'multiple') && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '13px' }}>تحميل قالب خيارات جاهز</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('general')}>التقييم العام</button>
                      <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('verification')}>قالب التحقق</button>
                      <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('compliance')}>قالب الالتزام</button>
                      <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('readiness')}>قالب الجاهزية</button>
                      <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('field_cases')}>الحالات الميدانية</button>
                    </div>
                  </div>
                )}

                {modalType === 'detail' && (formData.inputType === 'single' || formData.inputType === 'multiple') && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ fontWeight: 'bold', margin: 0 }}>خيارات البند / الحالات الميدانية</label>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: '12px', padding: '4px 10px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            options: [...prev.options, { tempKey: `new_${Date.now()}_${Math.random()}`, optionText: '', type: 'positive', scoreValue: 0 }]
                          }));
                        }}
                      >
                        ➕ إضافة خيار جديد
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                      {formData.options.map((opt, idx) => (
                        <div key={opt.tempKey || opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fcfcfc', padding: '8px', borderRadius: '6px', border: '1px solid #eee' }}>
                          <div style={{ flex: 2 }}>
                            <input
                              type="text"
                              value={opt.optionText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  options: prev.options.map((item, oIdx) => 
                                    oIdx === idx ? { ...item, optionText: val } : item
                                  )
                                }));
                              }}
                              placeholder="نص الخيار (مثال: ممتاز)"
                              style={{ margin: 0, padding: '6px 10px', fontSize: '13px' }}
                              required
                            />
                          </div>

                          <div style={{ flex: 1.2 }}>
                            <select
                              value={opt.type}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  options: prev.options.map((item, oIdx) => 
                                    oIdx === idx ? { ...item, type: val } : item
                                  )
                                }));
                              }}
                              style={{ margin: 0, padding: '6px 10px', fontSize: '13px', width: '100%', height: 'auto' }}
                            >
                              <option value="positive">إيجابي (positive)</option>
                              <option value="negative">سلبي (negative)</option>
                              <option value="impediment">معوق (impediment)</option>
                              <option value="obstacle">معضلة (obstacle)</option>
                            </select>
                          </div>

                          <div style={{ width: '80px' }}>
                            <input
                              type="number"
                              step="0.1"
                              value={opt.scoreValue}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  options: prev.options.map((item, oIdx) => 
                                    oIdx === idx ? { ...item, scoreValue: isNaN(val) ? 0 : val } : item
                                  )
                                }));
                              }}
                              placeholder="الدرجة"
                              style={{ margin: 0, padding: '6px 10px', fontSize: '13px', width: '100%', textAlign: 'center' }}
                              required
                            />
                          </div>

                          <button
                            type="button"
                            className="btn-danger"
                            style={{ padding: '6px 10px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', width: '32px', height: '32px' }}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                options: prev.options.filter((_, oidx) => oidx !== idx)
                              }));
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}

                      {formData.options.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '15px', color: '#a0aec0', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '6px' }}>
                          لا توجد خيارات مضافة بعد. قم بإضافة خيار أو تحميل قالب.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                padding: '15px 24px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                backgroundColor: '#f8fafc'
              }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">إلغاء</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            width: '95%', maxWidth: '1200px', height: '95vh',
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#fff', borderRadius: '12px',
            overflow: 'hidden', direction: 'rtl', textAlign: 'right'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-color)' }}>
                📄 تقرير أسس ومعايير التفتيش المعتمدة
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleDownloadPdf}
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                  disabled={downloading === 'pdf'}
                >
                  {downloading === 'pdf' ? '...جاري' : '📥 تصدير PDF'}
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                  disabled={downloading === 'word'}
                >
                  {downloading === 'word' ? '...جاري' : '📥 تصدير Word'}
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="btn-danger"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  ✕ إغلاق
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <iframe
                srcDoc={reportHtmlContent}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="تقرير أسس ومعايير التفتيش"
              />
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', borderTop: '6px solid var(--secondary-color)', direction: 'rtl', textAlign: 'right' }}>
            <h3 style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px', color: 'var(--primary-color)' }}>
              {templateModalMode === 'add' ? 'إنشاء مسمى جديد للأسس (قالب أسس التفتيش)' : 'تعديل مسمى أسس التفتيش الحالي'}
            </h3>
            
            <form onSubmit={handleTemplateSubmit} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>اسم المسمى</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="مثال: أسس تفتيش الأفواج"
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>وصف المسمى (اختياري)</label>
                <textarea
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="مثال: المعايير والأسس الخاصة بتقييم أداء وتفتيش الأفواج الميدانية"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <button type="button" onClick={() => setShowTemplateModal(false)} className="btn-outline">إلغاء</button>
                <button type="submit" className="btn-secondary" style={{ padding: '8px 20px' }}>
                  {templateModalMode === 'add' ? 'إنشاء المسمى' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
