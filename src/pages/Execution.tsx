import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { CriteriaDetailModal } from '../components/criteria/CriteriaDetailModal';

const DEFAULT_PERSONNEL_SCHEMA = [
  { key: 'category', label: 'الفئة', type: 'text', required: true, role: 'label' },
  { key: 'nominal', label: 'الملاك', type: 'number', required: true, role: 'nominal' },
  { key: 'actual', label: 'الموجود', type: 'number', required: true, role: 'actual' },
  { key: 'deficit', label: 'النقص', type: 'number', required: false, role: 'deficit' },
  { key: 'increase', label: 'الزيادة', type: 'number', required: false, role: 'increase' },
  { key: 'percentage', label: 'النسبة %', type: 'percentage', required: false, role: 'percentage' },
];

export const Execution: React.FC = () => {
  const { user } = useAuth();
  const routeLocation = useLocation();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [template, setTemplate] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form selections
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [location, setLocation] = useState('');
  const [findings, setFindings] = useState('');

  // Tab & Instance Suffix selection
  // activeTabKey: "${secondaryCriteriaId}_${instanceSuffix}"
  const [activeTabKey, setActiveTabKey] = useState<string | null>(null);

  // Active instances for each secondary criteria (specialized sections)
  // Key: secondaryCriteriaId (number), Value: list of custom suffixes (e.g. ['الرصافة الأولى', 'الكرخ'])
  const [sectionInstances, setSectionInstances] = useState<Record<number, string[]>>({});

  // Grades entry state
  // Key: "${detailId}_${suffix}", Value: { gradeEarned: string, notes: string }
  const [enteredGrades, setEnteredGrades] = useState<Record<string, { gradeEarned: string, notes: string }>>({});

  // Selected options state
  // Key: "${detailId}_${suffix}", Value: optionId[]
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, number[]>>({});

  // Quantitative tables state
  // Key: "${detailId}_${suffix}", Value: array of rows
  const [quantitativeTables, setQuantitativeTables] = useState<Record<string, any[]>>({});

  // Officer credentials state
  // Key: "${secondaryCriteriaId}_${suffix}", Value: position details
  const [officerCredentials, setOfficerCredentials] = useState<Record<string, {
    id: string | null;
    rank: string;
    name: string;
    statisticalNumber: string;
    joinedDate: string;
    positionStatus: string;
    education: string;
    notes: string;
    positionName: string;
  }>>({});

  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedPrimaryIds, setExpandedPrimaryIds] = useState<Record<number, boolean>>({});

  // Save/Edit flow status states
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [existingInspectionId, setExistingInspectionId] = useState<string | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<string | null>(null);

  // Result popup modal state
  const [resultModal, setResultModal] = useState<any | null>(null);

  // Official criteria extension modals
  const [showCriteriaDetailModal, setShowCriteriaDetailModal] = useState(false);
  const [optionTargetDetail, setOptionTargetDetail] = useState<any | null>(null);

  const openAddCriteriaDetailModal = () => {
    setShowCriteriaDetailModal(true);
  };

  const openAddCriteriaOptionModal = (detail: any) => {
    setOptionTargetDetail(detail);
  };

  const [activeTabSecId, activeTabSuffix] = useMemo(() => {
    if (!activeTabKey) return [null, 'default'];
    const parts = activeTabKey.split('_');
    return [Number(parts[0]), parts.slice(1).join('_')];
  }, [activeTabKey]);

  // Helper to normalize Arabic on the frontend
  const normalizeArabicStr = (str: string) => {
    if (!str) return '';
    return str
      .trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ');
  };

  // Duplicate officer credentials check
  const officerConflicts = useMemo(() => {
    const conflicts: Record<string, { type: 'error' | 'warning'; message: string }> = {};
    const entries = Object.entries(officerCredentials);

    for (let i = 0; i < entries.length; i++) {
      const [key, cred] = entries[i];
      const statNum = cred.statisticalNumber?.trim();

      if (!statNum || statNum === 'غير محدد' || statNum === 'غير حدد') continue;

      for (let j = 0; j < entries.length; j++) {
        const [otherKey, otherCred] = entries[j];
        if (key === otherKey) continue;

        const otherStatNum = otherCred.statisticalNumber?.trim();
        if (statNum === otherStatNum) {
          const name1 = normalizeArabicStr(cred.name);
          const name2 = normalizeArabicStr(otherCred.name);
          const rank1 = normalizeArabicStr(cred.rank);
          const rank2 = normalizeArabicStr(otherCred.rank);

          if (name1 !== name2) {
            conflicts[key] = {
              type: 'error',
              message: `خطأ: الرقم الإحصائي مكرر مع منصب "${otherCred.positionName}" لشخص آخر (الاسم غير متطابق).`,
            };
            break;
          } else if (rank1 !== rank2) {
            if (!conflicts[key]) {
              conflicts[key] = {
                type: 'warning',
                message: `تنبيه: تم رصد رتبة مختلفة لنفس الضابط في منصب "${otherCred.positionName}" (ترقية محتملة).`,
              };
            }
          }
        }
      }
    }
    return conflicts;
  }, [officerCredentials]);

  // Initialize page data
  useEffect(() => {
    async function loadData() {
      try {
        const [cData, eData] = await Promise.all([
          apiFetch('/campaigns'),
          apiFetch('/entities'),
        ]);
        setCampaigns(cData.filter((c: any) => c.status === 'active'));
        setEntities(eData);

        // Prepopulate selections if navigated with state
        if (routeLocation.state) {
          const { campaignId, entityId } = routeLocation.state;
          if (campaignId) setSelectedCampaignId(campaignId);
          if (entityId) setSelectedEntityId(entityId);
        }
      } catch (e: any) {
        setError(e.message || 'حدث خطأ أثناء تحميل البيانات الأولية');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [routeLocation.state]);



  // Load Criteria Template when campaign selection changes
  const refreshTemplateAndGrades = async (campaignId: string, entityId?: string) => {
    if (!campaignId) return;
    try {
      const tData = await apiFetch(`/inspections/criteria-template?campaignId=${campaignId}`);
      setTemplate(tData);

      // Automatically expand all primary criteria folders on start
      const expandMap: Record<number, boolean> = {};
      tData.forEach((pri: any) => {
        expandMap[pri.id] = true;
      });
      setExpandedPrimaryIds(expandMap);

      const activeEntityId = entityId || selectedEntityId;
      const entity = entities.find(e => e.id === activeEntityId);
      if (entity) {
        await loadExistingInspection(campaignId, entity, tData);
      } else {
        resetFormStates(tData, null);
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء تحميل قالب الأسس');
    }
  };

  const getDefaultQuantRowsForDetail = (det: any) => {
    const isDetailedTable = det.inputType === 'detailed_table' || det.detailText.includes("المواقف الرسمية") || det.detailText.includes("نسب التكامل");
    if (!isDetailedTable) return undefined;
    const schema = det.tableSchema
      ? (typeof det.tableSchema === 'string' ? JSON.parse(det.tableSchema) : det.tableSchema)
      : DEFAULT_PERSONNEL_SCHEMA;
    const isPersonnel = schema.some((c: any) => c.key === 'category') && schema.some((c: any) => c.key === 'nominal');
    return isPersonnel ? [
      { category: 'الضباط', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
      { category: 'المراتب', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
      { category: 'الموظفين', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 }
    ] : [];
  };

  const initializeMissingLocalState = (latestTemplate: any[]) => {
    const suffixesBySecId: Record<number, string[]> = {};
    latestTemplate.forEach((pri: any) => {
      pri.secondaryCriteria.forEach((sec: any) => {
        suffixesBySecId[sec.id] = ['default', ...(sectionInstances[sec.id] || [])];
      });
    });

    setEnteredGrades((prev) => {
      const next = { ...prev };
      latestTemplate.forEach((pri: any) => {
        pri.secondaryCriteria.forEach((sec: any) => {
          suffixesBySecId[sec.id].forEach((suffix) => {
            sec.details.forEach((det: any) => {
              const stateKey = `${det.id}_${suffix}`;
              if (next[stateKey] === undefined) next[stateKey] = { gradeEarned: '', notes: '' };
            });
          });
        });
      });
      return next;
    });

    setSelectedOptionsMap((prev) => {
      const next = { ...prev };
      latestTemplate.forEach((pri: any) => {
        pri.secondaryCriteria.forEach((sec: any) => {
          suffixesBySecId[sec.id].forEach((suffix) => {
            sec.details.forEach((det: any) => {
              const stateKey = `${det.id}_${suffix}`;
              if (next[stateKey] === undefined) next[stateKey] = [];
            });
          });
        });
      });
      return next;
    });

    setQuantitativeTables((prev) => {
      const next = { ...prev };
      latestTemplate.forEach((pri: any) => {
        pri.secondaryCriteria.forEach((sec: any) => {
          suffixesBySecId[sec.id].forEach((suffix) => {
            sec.details.forEach((det: any) => {
              const stateKey = `${det.id}_${suffix}`;
              if (next[stateKey] === undefined) {
                const defaultRows = getDefaultQuantRowsForDetail(det);
                if (defaultRows !== undefined) next[stateKey] = defaultRows;
              }
            });
          });
        });
      });
      return next;
    });
  };

  const refreshTemplatePreservingEntries = async () => {
    if (!selectedCampaignId) return;
    const tData = await apiFetch(`/inspections/criteria-template?campaignId=${selectedCampaignId}`);
    setTemplate(tData);
    const expandMap: Record<number, boolean> = {};
    tData.forEach((pri: any) => {
      expandMap[pri.id] = true;
    });
    setExpandedPrimaryIds(expandMap);
    initializeMissingLocalState(tData);
  };

  const handleCriteriaDetailSubmit = async (detailPayload: any) => {
    if (!activeTabSecId) throw new Error('يرجى اختيار قسم لإضافة البند داخله');
    const created = await apiFetch('/inspections/criteria-detail', {
      method: 'POST',
      body: JSON.stringify({
        ...detailPayload,
        secondaryId: activeTabSecId,
      }),
    });
    setShowCriteriaDetailModal(false);
    await refreshTemplatePreservingEntries();
    setActiveTabKey(`${created.secondaryId || activeTabSecId}_${activeTabSuffix || 'default'}`);
  };

  const handleCriteriaOptionSubmit = async (optionPayload: any) => {
    if (!optionTargetDetail?.id) throw new Error('يرجى اختيار بند لإضافة الخيار داخله');
    await apiFetch('/inspections/criteria-option', {
      method: 'POST',
      body: JSON.stringify({
        ...optionPayload,
        detailId: optionTargetDetail.id,
      }),
    });
    setOptionTargetDetail(null);
    await refreshTemplatePreservingEntries();
  };

  useEffect(() => {
    if (!selectedCampaignId) {
      setTemplate([]);
      return;
    }
    refreshTemplateAndGrades(selectedCampaignId);
  }, [selectedCampaignId]);

  // Synchronize target entity and load existing inspection
  useEffect(() => {
    if (!selectedCampaignId || !selectedEntityId) return;

    const entity = entities.find(e => e.id === selectedEntityId);
    if (entity && template.length > 0) {
      loadExistingInspection(selectedCampaignId, entity, template);
    }
  }, [selectedEntityId]);

  // Ensure activeTabKey is valid when template or instances change
  useEffect(() => {
    if (template.length > 0) {
      const allSecIds = template.flatMap((pri: any) => pri.secondaryCriteria.map((sec: any) => sec.id));
      const currentSecId = activeTabSecId;
      
      const suffixList = currentSecId ? ['default', ...(sectionInstances[currentSecId] || [])] : [];

      if (activeTabKey === null || !currentSecId || !allSecIds.includes(currentSecId) || !suffixList.includes(activeTabSuffix)) {
        const firstSec = template[0]?.secondaryCriteria?.[0];
        if (firstSec) {
          setActiveTabKey(`${firstSec.id}_default`);
        } else {
          setActiveTabKey(null);
        }
      }
    } else {
      setActiveTabKey(null);
    }
  }, [template, sectionInstances, activeTabKey]);

  // Reset form states to clean templates
  const resetFormStates = (latestTemplate: any[], entDetails: any) => {
    setExistingInspectionId(null);
    setInspectionStatus(null);
    setIsReadOnly(false);
    setSectionInstances({});
    setOfficerCredentials({});

    const defaultGrades: Record<string, { gradeEarned: string, notes: string }> = {};
    const defaultOptions: Record<string, number[]> = {};
    const defaultQuantTables: Record<string, any[]> = {};
    const defaultCredentials: Record<string, any> = {};

    latestTemplate.forEach((pri: any) => {
      pri.secondaryCriteria.forEach((sec: any) => {
        const key = `${sec.id}_default`;

        // Prepopulate default credentials from entity positions
        const cleanedTitle = sec.title.replace(/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سادسا|سابعاً|ثامناً|تاسعاً|عاشراً|حادي عشر|ثاني عشر)\.\s*/, '');
        const matchingPos = entDetails?.positions?.find((pos: any) =>
          pos.positionName === cleanedTitle || pos.positionName.includes(cleanedTitle)
        );

        defaultCredentials[key] = {
          id: matchingPos?.id || null,
          rank: matchingPos?.rank || '',
          name: matchingPos?.positionHolder || '',
          statisticalNumber: matchingPos?.statisticalNumber || '',
          joinedDate: matchingPos?.joinedDate ? matchingPos.joinedDate.substring(0, 10) : '',
          positionStatus: matchingPos?.positionStatus || 'اصالة',
          education: matchingPos?.education || '',
          notes: matchingPos?.notes || '',
          positionName: cleanedTitle,
        };

        sec.details.forEach((det: any) => {
          const dKey = `${det.id}_default`;
          defaultGrades[dKey] = { gradeEarned: '', notes: '' }; // default empty string!
          defaultOptions[dKey] = [];

          const isDetailedTable = det.inputType === 'detailed_table' || det.detailText.includes("المواقف الرسمية") || det.detailText.includes("نسب التكامل");
          if (isDetailedTable) {
            const schema = det.tableSchema 
              ? (typeof det.tableSchema === 'string' ? JSON.parse(det.tableSchema) : det.tableSchema)
              : DEFAULT_PERSONNEL_SCHEMA;
            const isPersonnel = schema.some((c: any) => c.key === 'category') && schema.some((c: any) => c.key === 'nominal');
            if (isPersonnel) {
              defaultQuantTables[dKey] = [
                { category: 'الضباط', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
                { category: 'المراتب', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
                { category: 'الموظفين', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 }
              ];
            } else {
              defaultQuantTables[dKey] = [];
            }
          }
        });
      });
    });

    setEnteredGrades(defaultGrades);
    setSelectedOptionsMap(defaultOptions);
    setQuantitativeTables(defaultQuantTables);
    setOfficerCredentials(defaultCredentials);
  };

  // Load existing inspection helper
  const loadExistingInspection = async (campaignId: string, entDetails: any, latestTemplate: any[]) => {
    try {
      const inspection = await apiFetch(`/inspections/campaign/${campaignId}`);
      if (inspection && inspection.entityId === entDetails.id) {
        setExistingInspectionId(inspection.id);
        setInspectionStatus(inspection.status);
        setLocation(inspection.location || '');
        setFindings(inspection.findings || '');
        setIsReadOnly(false); // Enable editing regardless of status per user request

        const loadedInstances: Record<number, string[]> = {};
        const loadedGrades: Record<string, { gradeEarned: string, notes: string }> = {};
        const loadedOptions: Record<string, number[]> = {};
        const loadedQuantTables: Record<string, any[]> = {};
        const loadedCredentials: Record<string, any> = {};

        if (inspection.officerCredentials) {
          Object.assign(loadedCredentials, inspection.officerCredentials);
          Object.keys(loadedCredentials).forEach((key) => {
            loadedCredentials[key] = {
              ...loadedCredentials[key],
              positionStatus: loadedCredentials[key]?.positionStatus || 'اصالة',
            };
          });
        }

        inspection.grades.forEach((g: any) => {
          const suffix = g.instanceName || 'default';
          const secId = g.criteriaDetail.secondaryId;
          const detId = g.detailId;

          if (suffix !== 'default') {
            if (!loadedInstances[secId]) loadedInstances[secId] = [];
            if (!loadedInstances[secId].includes(suffix)) {
              loadedInstances[secId].push(suffix);
            }
          }

          const stateKey = `${detId}_${suffix}`;
          loadedGrades[stateKey] = {
            gradeEarned: g.gradeEarned !== null && g.gradeEarned !== undefined ? String(g.gradeEarned) : '',
            notes: g.notes || ''
          };

          if (g.selectedOptions) {
            loadedOptions[stateKey] = g.selectedOptions.map((o: any) => o.optionId);
          }

          if (g.quantitativeData) {
            loadedQuantTables[stateKey] = g.quantitativeData;
          }
        });

        setSectionInstances(loadedInstances);

        // Prepopulate missing default states
        latestTemplate.forEach((pri: any) => {
          pri.secondaryCriteria.forEach((sec: any) => {
            const suffixes = ['default', ...(loadedInstances[sec.id] || [])];
            suffixes.forEach((suffix) => {
              const credKey = `${sec.id}_${suffix}`;
              if (!loadedCredentials[credKey]) {
                const cleanedTitle = sec.title.replace(/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سادسا|سابعاً|ثامناً|تاسعاً|عاشراً|حادي عشر|ثاني عشر)\.\s*/, '');
                const fullInstName = suffix === 'default' ? cleanedTitle : `${cleanedTitle} / ${suffix}`;
                const matchingPos = entDetails?.positions?.find((pos: any) =>
                  pos.positionName === fullInstName || pos.positionName.includes(fullInstName)
                );
                loadedCredentials[credKey] = {
                  id: matchingPos?.id || null,
                  rank: matchingPos?.rank || '',
                  name: matchingPos?.positionHolder || '',
                  statisticalNumber: matchingPos?.statisticalNumber || '',
                  joinedDate: matchingPos?.joinedDate ? matchingPos.joinedDate.substring(0, 10) : '',
                  positionStatus: matchingPos?.positionStatus || 'اصالة',
                  education: matchingPos?.education || '',
                  notes: matchingPos?.notes || '',
                  positionName: fullInstName,
                };
              }

              sec.details.forEach((det: any) => {
                const stateKey = `${det.id}_${suffix}`;
                if (loadedGrades[stateKey] === undefined) {
                  loadedGrades[stateKey] = { gradeEarned: '', notes: '' };
                }
                if (loadedOptions[stateKey] === undefined) {
                  loadedOptions[stateKey] = [];
                }
                if (loadedQuantTables[stateKey] === undefined) {
                  const isDetailedTable = det.inputType === 'detailed_table' || det.detailText.includes("المواقف الرسمية") || det.detailText.includes("نسب التكامل");
                  if (isDetailedTable) {
                    const schema = det.tableSchema 
                      ? (typeof det.tableSchema === 'string' ? JSON.parse(det.tableSchema) : det.tableSchema)
                      : DEFAULT_PERSONNEL_SCHEMA;
                    const isPersonnel = schema.some((c: any) => c.key === 'category') && schema.some((c: any) => c.key === 'nominal');
                    if (isPersonnel) {
                      loadedQuantTables[stateKey] = [
                        { category: 'الضباط', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
                        { category: 'المراتب', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
                        { category: 'الموظفين', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 }
                      ];
                    } else {
                      loadedQuantTables[stateKey] = [];
                    }
                  }
                }
              });
            });
          });
        });

        setEnteredGrades(loadedGrades);
        setSelectedOptionsMap(loadedOptions);
        setQuantitativeTables(loadedQuantTables);
        setOfficerCredentials(loadedCredentials);
      } else {
        resetFormStates(latestTemplate, entDetails);
      }
    } catch (err: any) {
      console.error("Error loading existing inspection:", err);
      resetFormStates(latestTemplate, entDetails);
    }
  };

  // Add a new section instance suffix
  const handleAddInstance = (secId: number) => {
    if (isReadOnly) return;
    const suffix = window.prompt('أدخل اسم النسخة الجديدة (مثال: الرصافة الأولى، الكرخ، قاطع النجدة الثاني):');
    if (!suffix) return;
    
    const cleanSuffix = suffix.trim();
    if (cleanSuffix === '' || cleanSuffix === 'default') {
      window.alert('اسم النسخة غير صالح.');
      return;
    }

    const currentInstances = sectionInstances[secId] || [];
    if (currentInstances.includes(cleanSuffix)) {
      window.alert('هذه النسخة موجودة بالفعل.');
      return;
    }

    // Add to section instances
    const nextInstances = {
      ...sectionInstances,
      [secId]: [...currentInstances, cleanSuffix]
    };
    setSectionInstances(nextInstances);

    // Initialize grades and options for new details
    const sec = template.flatMap((p: any) => p.secondaryCriteria).find((s: any) => s.id === secId);
    if (sec) {
      const nextGrades = { ...enteredGrades };
      const nextOptions = { ...selectedOptionsMap };
      const nextQuantTables = { ...quantitativeTables };
      const nextCredentials = { ...officerCredentials };

      const cleanedTitle = sec.title.replace(/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سادسا|سابعاً|ثامناً|تاسعاً|عاشراً|حادي عشر|ثاني عشر)\.\s*/, '');
      const fullInstName = `${cleanedTitle} / ${cleanSuffix}`;
      const entity = entities.find(e => e.id === selectedEntityId);
      
      const matchingPos = entity?.positions?.find((pos: any) =>
        pos.positionName === fullInstName || pos.positionName.includes(fullInstName)
      );

      const credKey = `${secId}_${cleanSuffix}`;
      nextCredentials[credKey] = {
        id: matchingPos?.id || null,
        rank: matchingPos?.rank || '',
        name: matchingPos?.positionHolder || '',
        statisticalNumber: matchingPos?.statisticalNumber || '',
        joinedDate: matchingPos?.joinedDate ? matchingPos.joinedDate.substring(0, 10) : '',
        positionStatus: matchingPos?.positionStatus || 'اصالة',
        education: matchingPos?.education || '',
        notes: matchingPos?.notes || '',
        positionName: fullInstName,
      };

      sec.details.forEach((det: any) => {
        const stateKey = `${det.id}_${cleanSuffix}`;
        nextGrades[stateKey] = { gradeEarned: '', notes: '' };
        nextOptions[stateKey] = [];

        const isDetailedTable = det.inputType === 'detailed_table' || det.detailText.includes("المواقف الرسمية") || det.detailText.includes("نسب التكامل");
        if (isDetailedTable) {
          const schema = det.tableSchema 
            ? (typeof det.tableSchema === 'string' ? JSON.parse(det.tableSchema) : det.tableSchema)
            : DEFAULT_PERSONNEL_SCHEMA;
          const isPersonnel = schema.some((c: any) => c.key === 'category') && schema.some((c: any) => c.key === 'nominal');
          if (isPersonnel) {
            nextQuantTables[stateKey] = [
              { category: 'الضباط', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
              { category: 'المراتب', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 },
              { category: 'الموظفين', nominal: 0, actual: 0, deficit: 0, increase: 0, percentage: 0 }
            ];
          } else {
            nextQuantTables[stateKey] = [];
          }
        }
      });

      setEnteredGrades(nextGrades);
      setSelectedOptionsMap(nextOptions);
      setQuantitativeTables(nextQuantTables);
      setOfficerCredentials(nextCredentials);
    }

    setActiveTabKey(`${secId}_${cleanSuffix}`);
  };

  // Delete a section instance suffix
  const handleDeleteInstance = (secId: number, suffix: string) => {
    if (isReadOnly) return;
    const confirm = window.confirm(`هل أنت متأكد من حذف النسخة "${suffix}" وجميع بيانات التقييم والضباط المدخلة فيها؟`);
    if (!confirm) return;

    const currentInstances = sectionInstances[secId] || [];
    const nextInstances = {
      ...sectionInstances,
      [secId]: currentInstances.filter(s => s !== suffix)
    };
    setSectionInstances(nextInstances);

    // Clean up states
    const nextGrades = { ...enteredGrades };
    const nextOptions = { ...selectedOptionsMap };
    const nextQuantTables = { ...quantitativeTables };
    const nextCredentials = { ...officerCredentials };

    const credKey = `${secId}_${suffix}`;
    delete nextCredentials[credKey];

    const sec = template.flatMap((p: any) => p.secondaryCriteria).find((s: any) => s.id === secId);
    if (sec) {
      sec.details.forEach((det: any) => {
        const stateKey = `${det.id}_${suffix}`;
        delete nextGrades[stateKey];
        delete nextOptions[stateKey];
        delete nextQuantTables[stateKey];
      });
    }

    setEnteredGrades(nextGrades);
    setSelectedOptionsMap(nextOptions);
    setQuantitativeTables(nextQuantTables);
    setOfficerCredentials(nextCredentials);

    setActiveTabKey(`${secId}_default`);
  };

  const handleCredentialChange = (field: string, value: string) => {
    if (isReadOnly || !activeTabSecId) return;
    const credKey = `${activeTabSecId}_${activeTabSuffix}`;
    setOfficerCredentials((prev) => ({
      ...prev,
      [credKey]: {
        ...prev[credKey],
        [field]: value,
      },
    }));
  };

  // Handle grade change
  const handleGradeChange = (detailId: number, field: 'gradeEarned' | 'notes', value: string) => {
    if (isReadOnly) return;
    const stateKey = `${detailId}_${activeTabSuffix}`;
    setEnteredGrades((prev) => ({
      ...prev,
      [stateKey]: {
        ...prev[stateKey],
        [field]: value,
      },
    }));
  };

  // Calculate recommended grade from options
  const calculateRecommendedGrade = (detail: any, nextSelectedOpts: number[]) => {
    if (!detail.options || detail.options.length === 0) return '0';
    let selectedMultipliers: number[] = [];

    nextSelectedOpts.forEach((optId) => {
      const opt = detail.options.find((o: any) => o.id === optId);
      if (opt) {
        selectedMultipliers.push(getOptionScoreMultiplier(opt));
      }
    });

    const maxG = parseFloat(detail.maxGrade);
    const multiplier = selectedMultipliers.length > 0 ? Math.max(...selectedMultipliers) : 0;
    return (maxG * multiplier).toFixed(1);
  };

  const getOptionTypeCode = (opt: any) => opt.optionType?.code || opt.type || 'positive';

  const getOptionScoreMultiplier = (opt: any) => {
    if (opt.optionType?.scoreMultiplier !== undefined && opt.optionType?.scoreMultiplier !== null) {
      const multiplier = Number(opt.optionType.scoreMultiplier);
      return Number.isFinite(multiplier) ? multiplier : 0;
    }
    const type = getOptionTypeCode(opt);
    if (type === 'positive') return 1;
    if (type === 'negative') return 0.5;
    if (type === 'impediment') return 0.3;
    if (type === 'obstacle') return 0;
    return 0;
  };

  // Toggle option select
  const handleOptionToggle = (detail: any, optionId: number) => {
    if (isReadOnly) return;
    const stateKey = `${detail.id}_${activeTabSuffix}`;
    const currentSelected = selectedOptionsMap[stateKey] || [];
    let nextSelected: number[] = [];

    const isMulti = detail.inputType === 'multi' || detail.inputType === 'multiple';

    if (isMulti) {
      if (currentSelected.includes(optionId)) {
        nextSelected = currentSelected.filter((id) => id !== optionId);
      } else {
        nextSelected = [...currentSelected, optionId];
      }
    } else {
      nextSelected = [optionId];
    }

    setSelectedOptionsMap((prev) => ({
      ...prev,
      [stateKey]: nextSelected,
    }));

    // Auto-calculate recommended grade
    const recommended = calculateRecommendedGrade(detail, nextSelected);
    handleGradeChange(detail.id, 'gradeEarned', recommended);
  };

  const getTableSchema = (det: any) =>
    det.tableSchema
      ? (typeof det.tableSchema === 'string' ? JSON.parse(det.tableSchema) : det.tableSchema)
      : DEFAULT_PERSONNEL_SCHEMA;

  // Check if a quantitative table is modified/entered
  const isQuantTableEntered = (rows: any[], schema?: any[]) => {
    if (!rows || rows.length === 0) return false;
    if (schema && schema.length > 0) {
      return rows.some((row) =>
        schema.some((col: any) => {
          const value = row?.[col.key];
          if (value === null || value === undefined || value === '') return false;
          if (col.type === 'number' || col.type === 'percentage') {
            return Number(value) !== 0;
          }
          if (typeof value === 'string') return value.trim() !== '';
          if (typeof value === 'number') return value !== 0;
          return Boolean(value);
        })
      );
    }

    return rows.some(row => 
      (Number(row.nominal) || 0) > 0 || 
      (Number(row.actual) || 0) > 0 || 
      (Number(row.working) || 0) > 0 || 
      (Number(row.total_count) || 0) > 0 || 
      (Number(row.required_count) || 0) > 0 || 
      (Number(row.working_actual) || 0) > 0 || 
      (row.notes && row.notes.trim() !== '')
    );
  };

  // Calculate live completion progress dots
  const getSectionProgress = (secId: number, suffix: string) => {
    const sec = template.flatMap((p: any) => p.secondaryCriteria).find((s: any) => s.id === secId);
    if (!sec) return 'notStarted';

    let hasData = false;
    let allCompleted = true;

    // Check if the section has officer credentials (unconditionally enabled for all sections/instances)
    const credKey = `${secId}_${suffix}`;
    const cred = officerCredentials[credKey];
    const hasOfficerCard = true;
    
    if (hasOfficerCard && cred) {
      const isOfficerEntered = (cred.name && cred.name.trim() !== '') || (cred.statisticalNumber && cred.statisticalNumber.trim() !== '');
      if (isOfficerEntered) {
        hasData = true;
      }
    }

    sec.details.forEach((det: any) => {
      const stateKey = `${det.id}_${suffix}`;
      const state = enteredGrades[stateKey];
      const selectedOpts = selectedOptionsMap[stateKey] || [];
      const isDetailedTable = det.inputType === 'detailed_table' || det.detailText.includes("المواقف الرسمية") || det.detailText.includes("نسب التكامل");

      let isDetailCompleted = false;

      // Grade is entered if it's explicitly entered (not empty string)
      if (state && state.gradeEarned !== '') {
        hasData = true;
        isDetailCompleted = true;
      }
      if (selectedOpts.length > 0) {
        hasData = true;
        isDetailCompleted = true;
      }
      if (state && state.notes && state.notes.trim() !== '') {
        hasData = true;
        isDetailCompleted = true;
      }
      if (isDetailedTable) {
        const rows = quantitativeTables[stateKey] || [];
        const schema = getTableSchema(det);
        if (isQuantTableEntered(rows, schema)) {
          hasData = true;
          isDetailCompleted = true;
        }
      }

      if (!isDetailCompleted) {
        allCompleted = false;
      }
    });

    if (allCompleted && hasData) return 'completed';
    if (hasData) return 'inProgress';
    return 'notStarted';
  };

  const getPrimaryProgress = (priId: number) => {
    const pri = template.find((p: any) => p.id === priId);
    if (!pri) return 'notStarted';

    let allCompleted = true;
    let hasData = false;

    pri.secondaryCriteria.forEach((sec: any) => {
      const suffixes = ['default', ...(sectionInstances[sec.id] || [])];
      suffixes.forEach((suffix) => {
        const prog = getSectionProgress(sec.id, suffix);
        if (prog !== 'completed') {
          allCompleted = false;
        }
        if (prog !== 'notStarted') {
          hasData = true;
        }
      });
    });

    if (allCompleted && hasData) return 'completed';
    if (hasData) return 'inProgress';
    return 'notStarted';
  };

  const togglePrimaryExpanded = (priId: number) => {
    setExpandedPrimaryIds(prev => ({
      ...prev,
      [priId]: !prev[priId]
    }));
  };

  // Reset all selections
  const resetForm = () => {
    const confirm = window.confirm('هل أنت متأكد من إعادة تهيئة النموذج ومسح جميع المدخلات الحالية؟');
    if (!confirm) return;
    const entity = entities.find(e => e.id === selectedEntityId);
    resetFormStates(template, entity);
  };

  // Save drafts or submit for review
  const saveInspection = async (targetStatus: 'draft' | 'pendingReview') => {
    if (!selectedCampaignId || !selectedEntityId) {
      setError('يرجى اختيار اللجنة التفتيشية والكيان التنظيمي المستهدف أولاً.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Validate scores do not exceed maximums
      let hasValidationError = false;
      let validationMsg = '';

      template.forEach((pri) => {
        pri.secondaryCriteria.forEach((sec: any) => {
          const suffixes = ['default', ...(sectionInstances[sec.id] || [])];
          suffixes.forEach((suffix) => {
            sec.details.forEach((det: any) => {
              const stateKey = `${det.id}_${suffix}`;
              const state = enteredGrades[stateKey];
              if (state && state.gradeEarned !== '') {
                const earned = parseFloat(state.gradeEarned);
                const max = parseFloat(det.maxGrade);
                if (earned > max) {
                  hasValidationError = true;
                  validationMsg = `الدرجة المدخلة لبند "${det.detailText}" (${earned}) تتجاوز الدرجة العظمى المسموحة (${max}).`;
                }
              }
            });
          });
        });
      });

      if (hasValidationError) {
        throw new Error(validationMsg);
      }

      // Build grades payload array
      const gradesPayload: any[] = [];
      template.forEach((pri) => {
        pri.secondaryCriteria.forEach((sec: any) => {
          const suffixes = ['default', ...(sectionInstances[sec.id] || [])];
          suffixes.forEach((suffix) => {
            sec.details.forEach((det: any) => {
              const stateKey = `${det.id}_${suffix}`;
              const state = enteredGrades[stateKey] || { gradeEarned: '', notes: '' };
              const selectedOpts = selectedOptionsMap[stateKey] || [];
              const rows = quantitativeTables[stateKey] || [];
              const isDetailedTable = det.inputType === 'detailed_table' || det.detailText.includes("المواقف الرسمية") || det.detailText.includes("نسب التكامل");
              const schema = isDetailedTable ? getTableSchema(det) : undefined;
              
              const hasData = state.gradeEarned !== '' || selectedOpts.length > 0 || state.notes.trim() !== '' || isQuantTableEntered(rows, schema);
              
              if (hasData) {
                gradesPayload.push({
                  detailId: det.id,
                  gradeEarned: state.gradeEarned !== '' ? state.gradeEarned : '0',
                  notes: state.notes,
                  quantitativeData: rows.length > 0 ? rows : null,
                  instanceName: suffix === 'default' ? null : suffix,
                  selectedOptions: selectedOpts
                });
              }
            });
          });
        });
      });

      const payload = {
        campaignId: selectedCampaignId,
        entityId: selectedEntityId,
        inspectorId: user?.id || null,
        location,
        findings,
        status: targetStatus,
        grades: gradesPayload,
        officerCredentials
      };

      const result = await apiFetch('/inspections', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setResultModal(result);
      setExistingInspectionId(result.id);
      setInspectionStatus(result.status);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التفتيش.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate live statistics
  const liveStats = useMemo(() => {
    let scoreSum = 0;
    let maxSum = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let impedimentCount = 0;
    let obstacleCount = 0;

    template.forEach((pri) => {
      pri.secondaryCriteria.forEach((sec: any) => {
        const suffixes = ['default', ...(sectionInstances[sec.id] || [])];
        suffixes.forEach((suffix) => {
          sec.details.forEach((det: any) => {
            const stateKey = `${det.id}_${suffix}`;
            const state = enteredGrades[stateKey];
            const selectedOpts = selectedOptionsMap[stateKey] || [];

            if (state && state.gradeEarned !== '') {
              scoreSum += parseFloat(state.gradeEarned) || 0;
            }
            maxSum += parseFloat(det.maxGrade) || 0;

            selectedOpts.forEach((optId) => {
              const opt = det.options?.find((o: any) => o.id === optId);
              if (opt) {
                const type = getOptionTypeCode(opt);
                if (type === 'positive') positiveCount++;
                if (type === 'negative') negativeCount++;
                if (type === 'impediment') impedimentCount++;
                if (type === 'obstacle') obstacleCount++;
              }
            });
          });
        });
      });
    });

    const percentage = maxSum > 0 ? (scoreSum / maxSum) * 100 : 0;
    
    // Performance rating calculation
    let rating = 'ضعيف';
    if (percentage >= 90) rating = 'ممتاز';
    else if (percentage >= 80) rating = 'جيد جداً';
    else if (percentage >= 70) rating = 'جيد';
    else if (percentage >= 65) rating = 'فوق الوسط';
    else if (percentage >= 60) rating = 'وسط';
    else if (percentage >= 50) rating = 'دون الوسط';

    return {
      scoreSum,
      maxSum,
      percentage,
      rating,
      positiveCount,
      negativeCount,
      impedimentCount,
      obstacleCount
    };
  }, [template, enteredGrades, selectedOptionsMap, sectionInstances]);

  // Update calculations for dynamic tables
  const updateRowCalculations = (row: any, schema: any[] = []) => {
    const newRow = { ...row };

    const keyByRole = (role: string, fallbackKey: string) =>
      schema.find((col: any) => col.role === role)?.key || (fallbackKey in newRow ? fallbackKey : null);

    const nominalKey = keyByRole('nominal', 'nominal');
    const actualKey = keyByRole('actual', 'actual');
    const deficitKey = keyByRole('deficit', 'deficit');
    const increaseKey = keyByRole('increase', 'increase');
    const percentageKey = keyByRole('percentage', 'percentage');

    const nominal = nominalKey ? Number(newRow[nominalKey]) || 0 : 0;
    const actual = actualKey ? Number(newRow[actualKey]) || 0 : 0;
    const working = Number(newRow.working) || 0;
    const total_count = Number(newRow.total_count) || 0;
    const required_count = Number(newRow.required_count) || 0;
    const working_actual = Number(newRow.working_actual) || 0;

    if (deficitKey && deficitKey in newRow) {
      newRow[deficitKey] = Math.max(0, nominal - actual);
    }
    if (increaseKey && increaseKey in newRow) {
      newRow[increaseKey] = Math.max(0, actual - nominal);
    }
    if (percentageKey && percentageKey in newRow) {
      if (nominalKey) {
        if (actualKey && !('working' in newRow)) {
          newRow[percentageKey] = nominal > 0 ? parseFloat(((actual / nominal) * 100).toFixed(1)) : 0;
        } else if ('working' in newRow) {
          newRow[percentageKey] = nominal > 0 ? parseFloat(((working / nominal) * 100).toFixed(1)) : 0;
        }
      } else if ('actual' in newRow && 'working' in newRow) {
        newRow[percentageKey] = actual > 0 ? parseFloat(((working / actual) * 100).toFixed(1)) : 0;
      } else if ('required_count' in newRow && 'working_actual' in newRow) {
        newRow[percentageKey] = required_count > 0 ? parseFloat(((working_actual / required_count) * 100).toFixed(1)) : 0;
      }
    }
    if ('readiness_rate' in newRow) {
      if ('total_count' in newRow && 'working' in newRow) {
        newRow.readiness_rate = total_count > 0 ? parseFloat(((working / total_count) * 100).toFixed(1)) : 0;
      }
    }
    if ('gap' in newRow) {
      newRow.gap = Math.max(0, required_count - working_actual);
    }
    return newRow;
  };

  // Find active secondary and its data
  const activeSecondary = useMemo(() => {
    if (!activeTabSecId) return null;
    return template.flatMap((pri: any) => pri.secondaryCriteria).find((sec: any) => sec.id === activeTabSecId);
  }, [activeTabSecId, template]);

  const activePrimary = useMemo(() => {
    if (!activeTabSecId) return null;
    return template.find((pri: any) => pri.secondaryCriteria.some((sec: any) => sec.id === activeTabSecId));
  }, [activeTabSecId, template]);

  // Render dynamic quantitative table
  const renderDetailedTable = (det: any, suffix: string) => {
    const stateKey = `${det.id}_${suffix}`;
    const rows = quantitativeTables[stateKey] || [];
    const schema = det.tableSchema 
      ? (typeof det.tableSchema === 'string' ? JSON.parse(det.tableSchema) : det.tableSchema)
      : DEFAULT_PERSONNEL_SCHEMA;

    const handleCellChange = (rowIndex: number, colKey: string, val: string) => {
      if (isReadOnly) return;
      const nextRows = [...rows];
      const currentRow = { ...nextRows[rowIndex] };
      
      const colSchema = schema.find((c: any) => c.key === colKey);
      if (colSchema?.type === 'number') {
        currentRow[colKey] = val === '' ? '' : Number(val);
      } else {
        currentRow[colKey] = val;
      }

      const updatedRow = updateRowCalculations(currentRow, schema);
      nextRows[rowIndex] = updatedRow;
      
      setQuantitativeTables(prev => ({
        ...prev,
        [stateKey]: nextRows
      }));
    };

    const addTableRow = () => {
      if (isReadOnly) return;
      const newRow: any = {};
      schema.forEach((col: any) => {
        if (col.type === 'number' || col.type === 'percentage') {
          newRow[col.key] = 0;
        } else {
          newRow[col.key] = '';
        }
      });
      setQuantitativeTables(prev => ({
        ...prev,
        [stateKey]: [...rows, newRow]
      }));
    };

    const removeTableRow = (rowIndex: number) => {
      if (isReadOnly) return;
      const nextRows = rows.filter((_: any, idx: number) => idx !== rowIndex);
      setQuantitativeTables(prev => ({
        ...prev,
        [stateKey]: nextRows
      }));
    };

    return (
      <div style={{ marginTop: '15px', overflowX: 'auto' }}>
        <table className="table table-bordered table-striped" style={{ width: '100%', minWidth: '600px', fontSize: '12.5px' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              {schema.map((col: any) => (
                <th key={col.key} style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{col.label}</th>
              ))}
              {!isReadOnly && <th style={{ padding: '8px', width: '50px' }}>جراء</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, rIdx: number) => (
              <tr key={rIdx}>
                {schema.map((col: any) => {
                  const isCalculated = ['deficit', 'increase', 'percentage', 'readiness_rate', 'gap'].includes(col.key);
                  const isLabel = col.role === 'label' && rIdx < 3 && (row.category === 'الضباط' || row.category === 'المراتب' || row.category === 'الموظفين');
                  const isEditable = !isCalculated && !isLabel;

                  return (
                    <td key={col.key} style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {isEditable ? (
                        <input
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={row[col.key] !== undefined ? row[col.key] : ''}
                          onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                          disabled={isReadOnly}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            margin: 0,
                            fontSize: '13px',
                            textAlign: col.type === 'number' ? 'center' : 'right',
                            border: '1px solid #cbd5e0',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: isCalculated || isLabel ? 'bold' : 'normal' }}>
                          {col.type === 'percentage' || col.key === 'readiness_rate'
                            ? `${row[col.key] || 0}%`
                            : row[col.key]}
                        </span>
                      )}
                    </td>
                  );
                })}
                {!isReadOnly && (
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    {!(rIdx < 3 && (row.category === 'الضباط' || row.category === 'المراتب' || row.category === 'الموظفين')) && (
                      <button
                        type="button"
                        onClick={() => removeTableRow(rIdx)}
                        className="btn-link"
                        style={{ color: '#e53e3e', padding: '4px', border: 'none', background: 'none', cursor: 'pointer' }}
                        title="حذف الصف"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isReadOnly && (
          <button
            type="button"
            onClick={addTableRow}
            className="btn-outline"
            style={{ padding: '4px 10px', fontSize: '11px', marginTop: '8px' }}
          >
            ➕ إضافة صف جديد
          </button>
        )}
      </div>
    );
  };

  const getSecondaryCriteriaList = () => {
    return template.flatMap((pri: any) => pri.secondaryCriteria);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>⏳ جاري تحميل البيانات الأساسية للنظام...</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', direction: 'rtl', textAlign: 'right' }}>
      {/* Top Header Section */}
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ إدارة وتوثيق عمليات التفتيش والتقييم الميداني</h1>
          <p className="page-subtitle">قم باختيار حملة التفتيش والجهة المستهدفة للبدء في ملء استمارة التقييم وحساب المؤشرات.</p>
        </div>
        
        {existingInspectionId && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className={`badge ${
              inspectionStatus === 'approved' ? 'badge-success' : 'badge-warning'
            }`} style={{ fontSize: '14px', padding: '8px 16px' }}>
              {inspectionStatus === 'approved' ? '🟢 معتمد ومغلق' : '🟡 مسودة / قيد المراجعة'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fff5f5',
          color: '#e53e3e',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius)',
          marginBottom: '20px',
          borderRight: '4px solid #e53e3e',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main Campaign/Entity selectors */}
      <div className="card m-b-20" style={{ padding: '20px' }}>
        <h3 className="m-b-15">أولاً. المعلومات الأساسية والتعريفية للتفتيش</h3>
        
        <div className="grid-2">
          <div className="form-group">
            <label>اللجنة / الحملة التفتيشية النشطة</label>
            <select
              value={selectedCampaignId}
              onChange={(e) => {
                setSelectedCampaignId(e.target.value);
                setSelectedEntityId('');
              }}
              style={{ padding: '10px 14px' }}
            >
              <option value="">-- اختر حملة تفتيشية نشطة --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.formationNumber || 'بدون رقم تشكيل'})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>الكيان الأمني / الدائرة المستهدفة بالتفتيش</label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              disabled={!selectedCampaignId}
              style={{ padding: '10px 14px' }}
            >
              <option value="">-- اختر الكيان المستهدف --</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.level})</option>
              ))}
            </select>
          </div>
        </div>

        {selectedCampaignId && selectedEntityId && (
          <div className="grid-2" style={{ marginTop: '15px' }}>
            <div className="form-group">
              <label>الموقع الجغرافي الميداني الحالي</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: مقر قيادة الشرطة، قاطع الكرخ"
                disabled={isReadOnly}
              />
            </div>
            <div className="form-group">
              <label>المشاهدات الميدانية والملاحظات الأولية للجنة</label>
              <textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={2}
                placeholder="اكتب الخلاصة الميدانية المرصودة في هذا التفتيش..."
                disabled={isReadOnly}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {selectedCampaignId && selectedEntityId && template.length === 0 && (
        <div className="card text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
          <h3>⚠️ تنبيه: لا توجد أسس تفتيشية مرتبطة بقالب هذه الحملة</h3>
          <p style={{ marginTop: '10px' }}>يرجى تهيئة قالب الأسئلة والبنود المعيارية لهذه الحملة من إعدادات النظام.</p>
        </div>
      )}

      {selectedCampaignId && selectedEntityId && template.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Workspace with Split layout */}
          <div style={{ display: 'flex', gap: sidebarCollapsed ? '0px' : '20px', alignItems: 'start' }}>
            
            {/* Left Side: Main Form Workspace */}
            <div style={{
              width: sidebarCollapsed ? '100%' : 'calc(100% - 300px)',
              transition: 'width 0.3s ease'
            }}>
              <form onSubmit={(e) => e.preventDefault()} className="card" style={{ padding: '24px' }}>
                
                {/* Active Tab Header */}
                {activeSecondary && activePrimary && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '2px solid var(--border-color)',
                    paddingBottom: '12px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                        {activePrimary.title}
                      </span>
                      <h2 style={{ fontSize: '18px', color: 'var(--primary-color)', margin: '4px 0 0 0' }}>
                        {activeSecondary.title} {activeTabSuffix !== 'default' && `(${activeTabSuffix})`}
                      </h2>
                    </div>

                    {/* Collapsible toggle button */}
                    <button
                      type="button"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #cbd5e0',
                        color: 'var(--primary-color)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {sidebarCollapsed ? '📖 إظهار الشجرة' : '🗂️ طي الشجرة'}
                    </button>
                  </div>
                )}

                {/* Tab content rendering */}
                {activeSecondary && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Render Officer Credentials Card (displayed for all sections/instances) */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      borderRight: '5px solid var(--secondary-color)'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                        🪪 بطاقة تعريف الضابط المسؤول (الآمر / المفرز للقسم)
                      </h4>
                        
                        {officerConflicts[`${activeSecondary.id}_${activeTabSuffix}`] && (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: officerConflicts[`${activeSecondary.id}_${activeTabSuffix}`].type === 'error' ? '#fff5f5' : '#fffaf0',
                            color: officerConflicts[`${activeSecondary.id}_${activeTabSuffix}`].type === 'error' ? '#e53e3e' : '#dd6b20',
                            borderRadius: '4px',
                            fontSize: '12px',
                            marginBottom: '12px',
                            borderRight: `3px solid ${officerConflicts[`${activeSecondary.id}_${activeTabSuffix}`].type === 'error' ? '#e53e3e' : '#dd6b20'}`
                          }}>
                            {officerConflicts[`${activeSecondary.id}_${activeTabSuffix}`].message}
                          </div>
                        )}

                        <div className="grid-3" style={{ gap: '12px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>رتبة الضابط</label>
                            <input
                              type="text"
                              value={officerCredentials[`${activeSecondary.id}_${activeTabSuffix}`]?.rank || ''}
                              onChange={(e) => handleCredentialChange('rank', e.target.value)}
                              placeholder="مثال: لواء، عميد، عقيد"
                              style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              disabled={isReadOnly}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>الاسم الكامل</label>
                            <input
                              type="text"
                              value={officerCredentials[`${activeSecondary.id}_${activeTabSuffix}`]?.name || ''}
                              onChange={(e) => handleCredentialChange('name', e.target.value)}
                              placeholder="الاسم الثلاثي واللقب"
                              style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              disabled={isReadOnly}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>الرقم الإحصائي للضابط</label>
                            <input
                              type="text"
                              value={officerCredentials[`${activeSecondary.id}_${activeTabSuffix}`]?.statisticalNumber || ''}
                              onChange={(e) => handleCredentialChange('statisticalNumber', e.target.value)}
                              placeholder="مثال: A-1029"
                              style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              disabled={isReadOnly}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>تاريخ المباشرة بالمنصب الحالي</label>
                            <input
                              type="date"
                              value={officerCredentials[`${activeSecondary.id}_${activeTabSuffix}`]?.joinedDate || ''}
                              onChange={(e) => handleCredentialChange('joinedDate', e.target.value)}
                              style={{ padding: '5px 10px', fontSize: '12.5px' }}
                              disabled={isReadOnly}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>نوع الإشغال</label>
                            <select
                              value={officerCredentials[`${activeSecondary.id}_${activeTabSuffix}`]?.positionStatus || 'اصالة'}
                              onChange={(e) => handleCredentialChange('positionStatus', e.target.value)}
                              style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              disabled={isReadOnly}
                            >
                              <option value="اصالة">أصالة</option>
                              <option value="وكالة">وكالة</option>
                              <option value="تكليف">تكليف</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>التحصيل الدراسي والشهادة العليا</label>
                            <input
                              type="text"
                              value={officerCredentials[`${activeSecondary.id}_${activeTabSuffix}`]?.education || ''}
                              onChange={(e) => handleCredentialChange('education', e.target.value)}
                              placeholder="الشهادة الأكاديمية أو العسكرية"
                              style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              disabled={isReadOnly}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>ملاحظات أو توصيات المفتش</label>
                            <input
                              type="text"
                              value={officerCredentials[`${activeSecondary.id}_${activeTabSuffix}`]?.notes || ''}
                              onChange={(e) => handleCredentialChange('notes', e.target.value)}
                              placeholder="ملاحظات حول أداء الضابط..."
                              style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>

                    {/* Render Checklist details for active tab */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {activeSecondary.details.map((det: any) => {
                        const stateKey = `${det.id}_${activeTabSuffix}`;
                        const state = enteredGrades[stateKey] || { gradeEarned: '', notes: '' };
                        const selectedOpts = selectedOptionsMap[stateKey] || [];
                        const isDetailedTable = det.inputType === 'detailed_table' || det.detailText.includes("المواقف الرسمية") || det.detailText.includes("نسب التكامل");

                        const isError = state.gradeEarned !== '' && parseFloat(state.gradeEarned) > parseFloat(det.maxGrade);

                        return (
                          <div key={det.id} style={{
                            padding: '16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            backgroundColor: isError ? 'rgba(230, 57, 70, 0.03)' : 'white'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--primary-color)', fontWeight: 600 }}>
                                {det.detailText}
                              </h4>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                <span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>
                                  الدرجة القصوى: {det.maxGrade} درجات
                                </span>
                              </div>
                            </div>

                            {/* Render dynamic table input */}
                            {isDetailedTable && renderDetailedTable(det, activeTabSuffix)}

                            {/* Predefined Options Selector */}
                            {det.options && det.options.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                                  الحالات الميدانية المرصودة:
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                                  {det.options.map((opt: any) => {
                                    const isSelected = selectedOpts.includes(opt.id);
                                    
                                    // Set color styling based on option type
                                    let borderC = '#cbd5e0';
                                    let bgC = 'white';
                                    let textC = 'var(--text-primary)';
                                    let badgeColor = '';
                                    let badgeLabel = '';

                                    if (opt.type === 'positive') {
                                      borderC = isSelected ? 'var(--success-color)' : '#cbd5e0';
                                      bgC = isSelected ? 'rgba(42,157,143,0.06)' : 'white';
                                      textC = isSelected ? 'var(--success-color)' : 'var(--text-primary)';
                                      badgeColor = 'badge-success';
                                      badgeLabel = 'إيجابي';
                                    } else if (opt.type === 'negative') {
                                      borderC = isSelected ? 'var(--accent-color)' : '#cbd5e0';
                                      bgC = isSelected ? 'rgba(230,57,70,0.06)' : 'white';
                                      textC = isSelected ? 'var(--accent-color)' : 'var(--text-primary)';
                                      badgeColor = 'badge-danger';
                                      badgeLabel = 'سلبي';
                                    } else if (opt.type === 'impediment') {
                                      borderC = isSelected ? 'var(--warning-color)' : '#cbd5e0';
                                      bgC = isSelected ? 'rgba(244,162,97,0.06)' : 'white';
                                      textC = isSelected ? '#c05621' : 'var(--text-primary)';
                                      badgeColor = 'badge-warning';
                                      badgeLabel = 'معوق';
                                    } else if (opt.type === 'obstacle') {
                                      borderC = isSelected ? '#a855f7' : '#cbd5e0';
                                      bgC = isSelected ? 'rgba(168,85,247,0.06)' : 'white';
                                      textC = isSelected ? '#6b21a8' : 'var(--text-primary)';
                                      badgeColor = 'badge-info';
                                      badgeLabel = 'معضلة';
                                    }

                                    if (opt.optionType) {
                                      badgeLabel = opt.optionType.nameAr || badgeLabel || opt.optionType.code;
                                      if (opt.optionType.color) {
                                        borderC = isSelected ? opt.optionType.color : '#cbd5e0';
                                        bgC = isSelected ? `${opt.optionType.color}14` : 'white';
                                        textC = isSelected ? opt.optionType.color : 'var(--text-primary)';
                                      }
                                    }
                                    return (
                                      <div
                                        key={opt.id}
                                        onClick={() => handleOptionToggle(det, opt.id)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          padding: '8px 10px',
                                          borderRadius: '6px',
                                          border: `1.5px solid ${borderC}`,
                                          backgroundColor: bgC,
                                          color: textC,
                                          cursor: isReadOnly ? 'default' : 'pointer',
                                          fontSize: '11.5px',
                                          userSelect: 'none'
                                        }}
                                      >
                                        <input
                                          type={det.inputType === 'multi' || det.inputType === 'multiple' ? 'checkbox' : 'radio'}
                                          checked={isSelected}
                                          readOnly
                                          disabled={isReadOnly}
                                          style={{ width: '15px', height: '15px', cursor: isReadOnly ? 'default' : 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>{opt.optionText}</div>
                                        <span className={`badge ${badgeColor}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                                          {badgeLabel}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => openAddCriteriaOptionModal(det)}
                                className="btn-outline"
                                style={{
                                  marginTop: '10px',
                                  padding: '6px 10px',
                                  borderStyle: 'dashed',
                                  borderColor: 'var(--secondary-color)',
                                  color: 'var(--primary-color)',
                                  fontSize: '11.5px',
                                  fontWeight: 'bold',
                                  borderRadius: '6px',
                                }}
                              >
                                + إضافة خيار تقييم رسمي
                              </button>
                            )}

                            {/* Score field and manual notes */}
                            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '15px', marginTop: '12px' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>الدرجة المستحقة</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={det.maxGrade}
                                  step="0.5"
                                  value={state.gradeEarned}
                                  onChange={(e) => handleGradeChange(det.id, 'gradeEarned', e.target.value)}
                                  required
                                  disabled={isReadOnly}
                                  placeholder="درجة التقييم"
                                  style={{
                                    margin: 0,
                                    borderColor: isError ? 'red' : undefined,
                                    backgroundColor: '#fffdf5',
                                    fontWeight: 'bold',
                                    fontSize: '13.5px',
                                    color: 'var(--primary-light)',
                                    textAlign: 'center'
                                  }}
                                />
                              </div>

                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>الملاحظات التفصيلية وتوثيق القواطع</label>
                                <input
                                  type="text"
                                  value={state.notes}
                                  onChange={(e) => handleGradeChange(det.id, 'notes', e.target.value)}
                                  placeholder="ملاحظات تفصيلية أو نقاط الضعف المرصودة في هذا البند..."
                                  style={{ margin: 0, fontSize: '12.5px' }}
                                  disabled={isReadOnly}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add official criteria detail button */}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={openAddCriteriaDetailModal}
                          className="btn-outline"
                          style={{
                            padding: '10px 16px',
                            borderStyle: 'dashed',
                            borderColor: 'var(--primary-color)',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(12, 35, 64, 0.02)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginTop: '10px',
                            width: '100%'
                          }}
                        >
                          + إضافة بند رسمي للقسم الحالي
                        </button>
                      )}
                    </div>

                    {/* Navigation and Bottom controls */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '15px',
                      marginTop: '10px'
                    }}>
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={getSecondaryCriteriaList().findIndex(x => x.id === activeTabSecId) === 0}
                        onClick={() => {
                          const list = getSecondaryCriteriaList();
                          const idx = list.findIndex(x => x.id === activeTabSecId);
                          if (idx > 0) setActiveTabKey(`${list[idx - 1].id}_default`);
                        }}
                      >
                        ⬅️ القسم السابق
                      </button>

                      {/* Shortcut Draft/Submit buttons when sidebar is collapsed */}
                      {sidebarCollapsed && !isReadOnly && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => saveInspection('draft')}
                            className="btn-outline"
                            style={{ borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)', fontSize: '13px', padding: '8px 16px' }}
                          >
                            💾 حفظ مسودة
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => saveInspection('pendingReview')}
                            className="btn-primary"
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                          >
                            🚀 إرسال للاعتماد
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn-outline"
                        disabled={getSecondaryCriteriaList().findIndex(x => x.id === activeTabSecId) === getSecondaryCriteriaList().length - 1}
                        onClick={() => {
                          const list = getSecondaryCriteriaList();
                          const idx = list.findIndex(x => x.id === activeTabSecId);
                          if (idx < list.length - 1) setActiveTabKey(`${list[idx + 1].id}_default`);
                        }}
                      >
                        القسم التالي ➡️
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Side: Folders tree and dynamic instances */}
            <div style={{
              width: sidebarCollapsed ? '0px' : '300px',
              transition: 'width 0.3s ease, opacity 0.3s ease',
              opacity: sidebarCollapsed ? 0 : 1,
              backgroundColor: 'white',
              borderLeft: sidebarCollapsed ? 'none' : '1px solid var(--border-color)',
              padding: sidebarCollapsed ? '0px' : '16px',
              position: 'sticky',
              top: '20px',
              borderRadius: 'var(--border-radius)',
              boxShadow: sidebarCollapsed ? 'none' : 'var(--box-shadow)',
              maxHeight: 'calc(100vh - 150px)',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              {!sidebarCollapsed && (
                <>
                  <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', marginBottom: '15px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px', fontWeight: 'bold' }}>
                    🗂️ شجرة بنود التفتيش والنسخ
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {template.map((pri) => {
                      const priProgress = getPrimaryProgress(pri.id);
                      const isExpanded = !!expandedPrimaryIds[pri.id];
                      const primaryDot = priProgress === 'completed' ? '🟢' : priProgress === 'inProgress' ? '🟡' : '⚪';

                      return (
                        <div key={pri.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {/* Folder category node */}
                          <div 
                            onClick={() => togglePrimaryExpanded(pri.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '12.5px',
                              userSelect: 'none',
                              borderRight: isExpanded ? '3px solid var(--secondary-color)' : '3px solid #cbd5e0'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                              <span>{primaryDot}</span>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pri.title}</span>
                            </div>
                            <span style={{ fontSize: '10px' }}>{isExpanded ? '▼' : '◀'}</span>
                          </div>

                          {/* Secondary items */}
                          {isExpanded && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              paddingRight: '10px',
                              borderRight: '1px dashed #cbd5e0',
                              marginRight: '6px',
                              marginTop: '2px'
                            }}>
                              {pri.secondaryCriteria.map((sec: any) => {
                                const suffixes = ['default', ...(sectionInstances[sec.id] || [])];

                                return (
                                  <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {suffixes.map((suffix) => {
                                      const tabKey = `${sec.id}_${suffix}`;
                                      const isActive = activeTabKey === tabKey;
                                      const progress = getSectionProgress(sec.id, suffix);
                                      const dot = progress === 'completed' ? '🟢' : progress === 'inProgress' ? '🟡' : '⚪';
                                      
                                      // Render title with indicator
                                      const cleanedTitle = sec.title.replace(/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سادسا|سابعاً|ثامناً|تاسعاً|عاشراً|حادي عشر|ثاني عشر)\.\s*/, '');
                                      const displayName = suffix === 'default' ? cleanedTitle : `${cleanedTitle} / ${suffix}`;

                                      return (
                                        <div 
                                          key={tabKey}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 8px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '11.5px',
                                            backgroundColor: isActive ? 'rgba(12, 35, 64, 0.06)' : 'transparent',
                                            color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            borderRight: isActive ? '3px solid var(--primary-color)' : 'none'
                                          }}
                                        >
                                          <div 
                                            onClick={() => setActiveTabKey(tabKey)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}
                                          >
                                            <span>{dot}</span>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {displayName}
                                            </span>
                                          </div>

                                          {/* Add / Delete instance inline control */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {suffix === 'default' && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAddInstance(sec.id);
                                                }}
                                                style={{
                                                  padding: '2px 4px',
                                                  fontSize: '9px',
                                                  backgroundColor: '#ebf8ff',
                                                  color: '#2b6cb0',
                                                  borderRadius: '4px',
                                                  border: 'none',
                                                  cursor: 'pointer'
                                                }}
                                                title="إضافة نسخة فرعية"
                                              >
                                                ➕
                                              </button>
                                            )}
                                            {suffix !== 'default' && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteInstance(sec.id, suffix);
                                                }}
                                                style={{
                                                  padding: '2px 4px',
                                                  fontSize: '9px',
                                                  backgroundColor: '#fff5f5',
                                                  color: '#c53030',
                                                  borderRadius: '4px',
                                                  border: 'none',
                                                  cursor: 'pointer'
                                                }}
                                                title="حذف هذه النسخة"
                                              >
                                                🗑️
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Floating Performance Dashboard Stats and Actions */}
          <div className="grid-3" style={{ gap: '20px', marginTop: '10px' }}>
            {/* Realtime stats card */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px 20px' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '6px solid #edf2f7',
                borderTopColor: liveStats.percentage >= 80 ? '#38a169' : liveStats.percentage >= 65 ? '#ecc94b' : '#e53e3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {liveStats.percentage.toFixed(0)}%
                </span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>النسبة والتقدير الفوري</h4>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: liveStats.percentage >= 80 ? '#38a169' : liveStats.percentage >= 65 ? '#d69e2e' : '#e53e3e'
                }}>
                  التقدير: {liveStats.rating}
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  الدرجة الكلية: {liveStats.scoreSum.toFixed(1)} / {liveStats.maxSum.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Finding Counters Card */}
            <div className="card" style={{ padding: '15px 20px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>ملخص المؤشرات الفردية:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px' }}>
                <div style={{ padding: '4px', backgroundColor: 'rgba(42,157,143,0.1)', color: 'var(--success-color)', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                  🟢 إيجابي: {liveStats.positiveCount}
                </div>
                <div style={{ padding: '4px', backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                  🔴 سلبي: {liveStats.negativeCount}
                </div>
                <div style={{ padding: '4px', backgroundColor: 'rgba(244,162,97,0.1)', color: '#c05621', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                  🟡 معوقات: {liveStats.impedimentCount}
                </div>
                <div style={{ padding: '4px', backgroundColor: 'rgba(168,85,247,0.1)', color: '#6b21a8', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                  🟣 معضلات: {liveStats.obstacleCount}
                </div>
              </div>
            </div>

            {/* Bottom Global Actions */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px 20px' }}>
              {!isReadOnly ? (
                <>
                  <button type="button" onClick={resetForm} disabled={submitting} className="btn-outline" style={{ flex: 1, padding: '10px' }}>
                    🔄 تهيئة النموذج
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => saveInspection('draft')}
                    className="btn-outline"
                    style={{ borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)', flex: 1, padding: '10px' }}
                  >
                    💾 حفظ مسودة
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => saveInspection('pendingReview')}
                    className="btn-primary"
                    style={{ flex: 1.5, padding: '10px' }}
                  >
                    🚀 إرسال للاعتماد
                  </button>
                </>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>🔒 نموذج مقفل لا يمكن تعديله</span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Result Popups / Success Modal */}
      {resultModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', padding: '30px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px' }}>🎉</span>
            <h3 style={{ marginTop: '15px', color: 'var(--primary-color)' }}>تم حفظ التقدير بنجاح</h3>
            
            <div style={{ margin: '20px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <p>حالة التفتيش الحالية: <strong>{resultModal.status === 'approved' ? '🟢 معتمد' : '🟡 مسودة / قيد المراجعة'}</strong></p>
              <p style={{ marginTop: '5px' }}>التقييم المحسوب: <strong>{resultModal.totalScore ? parseFloat(resultModal.totalScore).toFixed(1) : 0}%</strong> ({resultModal.performanceRating})</p>
            </div>
            
            <button
              type="button"
              className="btn-primary"
              onClick={() => setResultModal(null)}
              style={{ width: '100%' }}
            >
              حسناً، إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      <CriteriaDetailModal
        isOpen={showCriteriaDetailModal}
        mode="add"
        initialData={{
          parentId: activeTabSecId,
          titleOrText: '',
          maxGrade: '10',
          inputType: 'single',
          options: [],
          tableSchema: [],
        }}
        title="إضافة بند رسمي للقسم الحالي"
        submitLabel="إضافة البند"
        onClose={() => setShowCriteriaDetailModal(false)}
        onSubmit={handleCriteriaDetailSubmit}
      />

      <CriteriaDetailModal
        isOpen={!!optionTargetDetail}
        mode="add"
        variant="option"
        initialData={{
          options: [{ tempKey: 'new_option', optionText: '', type: 'positive', scoreValue: 0 }],
        }}
        title="إضافة خيار تقييم رسمي"
        submitLabel="إضافة الخيار"
        onClose={() => setOptionTargetDetail(null)}
        onSubmit={handleCriteriaOptionSubmit}
      />
    </div>
  );
};
