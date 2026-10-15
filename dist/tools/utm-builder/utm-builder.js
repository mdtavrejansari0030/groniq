document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // STATE & CONFIG
    // ==========================================
    let currentMode = 'guided'; // 'guided' | 'advanced' | 'checker'
    let activePreset = null;
    let selectedPlacementSource = null;

    const DEFAULT_NAMING_SETTINGS = {
        casing: 'lowercase',    // 'lowercase' | 'preserve'
        separator: 'underscore' // 'underscore' | 'hyphen'
    };

    let runtimeNamingSettings = { ...DEFAULT_NAMING_SETTINGS };
    let activeQrContext = null;

    const STANDARD_UTM_KEYS = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
        'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic'
    ];

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    const modes = {
        guided: document.getElementById('mode-guided'),
        advanced: document.getElementById('mode-advanced'),
        bulk: document.getElementById('mode-bulk'),
        campaigns: document.getElementById('mode-campaigns'),
        checker: document.getElementById('mode-checker')
    };

    const containers = {
        guided: document.getElementById('guided-mode-container'),
        advanced: document.getElementById('advanced-mode-container'),
        bulk: document.getElementById('bulk-mode-container'),
        campaigns: document.getElementById('campaigns-mode-container'),
        checker: document.getElementById('checker-mode-container')
    };

    const workspaceLeft = document.getElementById('workspace-left');
    const workspaceRight = document.getElementById('workspace-right');

    // Guided Inputs
    const gDest = document.getElementById('dest-url');
    const gCampaign = document.getElementById('guided-campaign');
    const gContent = document.getElementById('guided-content');
    const gTerm = document.getElementById('guided-term');
    const presetContainer = document.getElementById('platform-presets');
    const dynamicPlacementContainer = document.getElementById('dynamic-placement-container');
    const urlWarning = document.getElementById('url-warning');
    const gCampaignPreviewContainer = document.getElementById('campaign-preview-container');
    const gCampaignPreview = document.getElementById('campaign-preview');

    // Advanced Inputs
    const aDest = document.getElementById('adv-url');
    const aSource = document.getElementById('adv-source');
    const aMedium = document.getElementById('adv-medium');
    const aCampaign = document.getElementById('adv-campaign');
    const aContent = document.getElementById('adv-content');
    const aTerm = document.getElementById('adv-term');
    const aId = document.getElementById('adv-id');
    const customParamsContainer = document.getElementById('custom-params-container');
    const btnAddCustomParam = document.getElementById('add-custom-param');

    // Validation Error Elements
    const guidedDestError = document.getElementById('guided-dest-error');
    const guidedDestErrorMsg = document.getElementById('guided-dest-error-msg');
    const guidedChannelError = document.getElementById('guided-channel-error');
    const advUrlError = document.getElementById('adv-url-error');
    const advUrlErrorMsg = document.getElementById('adv-url-error-msg');
    const advSourceError = document.getElementById('adv-source-error');
    const advMediumError = document.getElementById('adv-medium-error');
    const customParamsError = document.getElementById('custom-params-error');
    const customParamsErrorMsg = document.getElementById('custom-params-error-msg');

    // Campaign Workspace Save & Edit Controls
    const btnSaveCampaign = document.getElementById('btn-save-campaign');
    const btnSaveCampaignText = document.getElementById('btn-save-campaign-text');
    const campaignEditingBanner = document.getElementById('campaign-editing-banner');
    const campaignEditingName = document.getElementById('campaign-editing-name');
    const btnCancelCampaignEdit = document.getElementById('btn-cancel-campaign-edit');
    let activeEditingCampaignId = null;

    // Naming Settings Modal Controls
    const btnNamingSettings = document.getElementById('btn-naming-settings');
    const modalNamingSettings = document.getElementById('naming-settings-modal');
    const btnCloseNamingSettings = document.getElementById('close-naming-settings');
    const btnCloseNamingSettingsBtn = document.getElementById('close-naming-settings-btn');
    const btnResetNamingSettings = document.getElementById('reset-naming-settings');

    // Saved Modal Controls (Campaigns, Templates & History)
    const btnOpenSaved = document.getElementById('btn-open-saved');
    const modalSaved = document.getElementById('saved-modal');
    const btnCloseSaved = document.getElementById('close-saved-modal');
    const tabSavedCampaigns = document.getElementById('saved-tab-campaigns');
    const tabSavedHistory = document.getElementById('saved-tab-history');
    const tabSavedTemplates = document.getElementById('saved-tab-templates');
    const containerSavedCampaigns = document.getElementById('saved-campaigns-container');
    const containerSavedHistory = document.getElementById('saved-history-container');
    const containerSavedTemplates = document.getElementById('saved-templates-container');
    const btnClearHistoryOnly = document.getElementById('btn-clear-history-only');
    const btnSaveAsTemplate = document.getElementById('btn-save-as-template');

    // Template Name Modal Controls
    const modalTemplateName = document.getElementById('template-name-modal');
    const inputTemplateName = document.getElementById('template-name-input');
    const btnCancelTemplateName = document.getElementById('btn-cancel-template-name');
    const btnConfirmTemplateName = document.getElementById('btn-confirm-template-name');
    let pendingTemplateData = null;

    // Right Sidebar / Live URL Output
    const finalUrlDisplay = document.getElementById('final-url-display');
    const utmHealthBadge = document.getElementById('utm-health-badge');
    const measurementPreview = document.getElementById('measurement-preview');
    const btnCopy = document.getElementById('btn-copy');
    const btnReset = document.getElementById('btn-reset');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    // Share Controls (Open URL & QR Code)
    const btnOpenUrl = document.getElementById('btn-open-url');
    const btnShowQr = document.getElementById('btn-show-qr');
    const modalQr = document.getElementById('qr-modal');
    const btnCloseQrModal = document.getElementById('close-qr-modal');
    const btnCloseQr = document.getElementById('btn-close-qr');
    const btnDownloadQr = document.getElementById('btn-download-qr');
    const btnDownloadQrSvg = document.getElementById('btn-download-qr-svg');
    const btnCopyQrUrl = document.getElementById('btn-copy-qr-url');
    const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
    const btnShareEmail = document.getElementById('btn-share-email');
    const btnShareNative = document.getElementById('btn-share-native');
    const qrSizeSelector = document.getElementById('qr-size-selector');
    const qrCanvas = document.getElementById('qr-canvas');
    const qrUrlText = document.getElementById('qr-url-text');
    const qrModalBadge = document.getElementById('qr-modal-badge');
    const qrModalSubtitle = document.getElementById('qr-modal-subtitle');
    let selectedQrSize = 1024;

    // Checker Inputs
    const checkerInput = document.getElementById('checker-input');
    const checkerParseBtn = document.getElementById('checker-parse-btn');
    const checkerError = document.getElementById('checker-error');
    const checkerErrorMsg = document.getElementById('checker-error-msg');
    const checkerResults = document.getElementById('checker-results');

    // Bulk Workspace & Modal Elements
    let bulkRows = [];
    let bulkRowSeq = 1;
    let activeDetailsRowId = null;
    let pendingCsvRows = [];

    const btnBulkAddRow = document.getElementById('btn-bulk-add-row');
    const btnBulkPaste = document.getElementById('btn-bulk-paste');
    const btnBulkImportCsv = document.getElementById('btn-bulk-import-csv');
    const inputBulkCsvFile = document.getElementById('bulk-csv-file-input');
    const btnBulkCopyAll = document.getElementById('btn-bulk-copy-all');
    const btnBulkExportCsv = document.getElementById('btn-bulk-export-csv');
    const btnBulkClearAll = document.getElementById('btn-bulk-clear-all');
    const bulkSummaryCounts = document.getElementById('bulk-summary-counts');
    const bulkNamingLabel = document.getElementById('bulk-naming-label');
    const bulkNamingShortcut = document.getElementById('bulk-naming-shortcut');
    const bulkTableBody = document.getElementById('bulk-table-body');
    const bulkMobileContainer = document.getElementById('bulk-mobile-container');

    const modalBulkPaste = document.getElementById('bulk-paste-modal');
    const closeBulkPaste = document.getElementById('close-bulk-paste');
    const btnCancelBulkPaste = document.getElementById('btn-cancel-bulk-paste');
    const btnConfirmBulkPaste = document.getElementById('btn-confirm-bulk-paste');
    const bulkPasteTextarea = document.getElementById('bulk-paste-textarea');
    const bulkPasteFeedback = document.getElementById('bulk-paste-feedback');
    const bulkPasteRowCount = document.getElementById('bulk-paste-row-count');

    const modalBulkCsv = document.getElementById('bulk-csv-modal');
    const closeBulkCsv = document.getElementById('close-bulk-csv');
    const btnCancelBulkCsv = document.getElementById('btn-cancel-bulk-csv');
    const btnConfirmBulkCsv = document.getElementById('btn-confirm-bulk-csv');
    const bulkCsvSummaryBox = document.getElementById('bulk-csv-summary-box');

    const modalBulkClear = document.getElementById('bulk-clear-modal');
    const btnCancelBulkClear = document.getElementById('btn-cancel-bulk-clear');
    const btnConfirmBulkClear = document.getElementById('btn-confirm-bulk-clear');

    const modalBulkDetails = document.getElementById('bulk-details-modal');
    const closeBulkDetails = document.getElementById('close-bulk-details');
    const btnCancelBulkDetails = document.getElementById('btn-cancel-bulk-details');
    const btnSaveBulkDetails = document.getElementById('btn-save-bulk-details');
    const inputBulkDetailId = document.getElementById('bulk-detail-id');
    const inputBulkDetailSourcePlatform = document.getElementById('bulk-detail-source-platform');
    const inputBulkDetailCreativeFormat = document.getElementById('bulk-detail-creative-format');
    const inputBulkDetailMarketingTactic = document.getElementById('bulk-detail-marketing-tactic');

    // Campaign Workspace & Modal Elements
    let activeCampaignId = null;
    let pendingCampaignModalMode = 'create';
    let pendingCampaignTargetId = null;
    let pendingLinkModalMode = 'create';
    let pendingEditingLinkId = null;
    let pendingDeleteCampaignId = null;
    let pendingDeleteLinkId = null;

    const campaignsListView = document.getElementById('campaigns-list-view');
    const campaignDetailView = document.getElementById('campaign-detail-view');
    const campaignsSearch = document.getElementById('campaigns-search-input') || document.getElementById('campaigns-search');
    const btnCreateCampaign = document.getElementById('btn-create-campaign');
    const btnEmptyCreateCampaign = document.getElementById('btn-empty-create-campaign');
    const campaignsEmptyState = document.getElementById('campaigns-empty-state');
    const campaignsGrid = document.getElementById('campaigns-items-container') || document.getElementById('campaigns-grid');

    const btnCampaignsBack = document.getElementById('btn-back-to-campaigns') || document.getElementById('btn-campaigns-back');
    const campaignDetailTitle = document.getElementById('campaign-detail-name') || document.getElementById('campaign-detail-title');
    const campaignDetailTrackingVal = document.getElementById('campaign-detail-tracking-value') || document.getElementById('campaign-detail-tracking-val');
    const campaignDetailIdContainer = document.getElementById('campaign-detail-id-container');
    const campaignDetailIdBadge = document.getElementById('campaign-detail-id-badge');
    const campaignDetailStatusCounts = document.getElementById('campaign-detail-status-counts');
    const btnAddTrackingLink = document.getElementById('btn-add-tracking-link');
    const btnEmptyAddLink = document.getElementById('btn-empty-add-link');
    const btnCampaignCopyAll = document.getElementById('btn-campaign-copy-all');
    const btnCampaignExportCsv = document.getElementById('btn-campaign-export-csv');
    const btnCampaignOpenBulk = document.getElementById('btn-campaign-open-bulk');
    const btnCampaignRenameHeader = document.getElementById('btn-campaign-rename-header');
    const btnCampaignDuplicateHeader = document.getElementById('btn-campaign-duplicate-header');
    const btnCampaignDeleteHeader = document.getElementById('btn-campaign-delete-header');
    const campaignLinksEmptyState = document.getElementById('campaign-links-empty-state');
    const campaignLinksContainer = document.getElementById('campaign-links-container');

    // Campaign Modal
    const modalCampaign = document.getElementById('campaign-modal');
    const modalCampaignTitle = document.getElementById('campaign-modal-title');
    const closeCampaignModal = document.getElementById('close-campaign-modal');
    const btnCancelCampaignModal = document.getElementById('btn-cancel-campaign-modal');
    const btnConfirmCampaignModal = document.getElementById('btn-confirm-campaign-modal');
    const campaignModalNameInput = document.getElementById('campaign-modal-name-input');
    const campaignModalIdInput = document.getElementById('campaign-modal-id-input');
    const campaignModalError = document.getElementById('campaign-modal-error');

    // Campaign Delete Modal
    const modalCampaignDelete = document.getElementById('campaign-delete-modal');
    const closeCampaignDeleteModal = document.getElementById('close-campaign-delete-modal');
    const btnCancelCampaignDelete = document.getElementById('btn-cancel-campaign-delete');
    const btnConfirmCampaignDelete = document.getElementById('btn-confirm-campaign-delete');

    // Tracking Link Modal
    const modalTrackingLink = document.getElementById('tracking-link-modal');
    const trackingLinkModalTitle = document.getElementById('tracking-link-modal-title');
    const trackingLinkParentName = document.getElementById('tracking-link-parent-name');
    const closeLinkModal = document.getElementById('close-link-modal');
    const btnCancelLinkModal = document.getElementById('btn-cancel-link-modal');
    const btnConfirmLinkModal = document.getElementById('btn-confirm-link-modal');
    const linkInputName = document.getElementById('link-input-name');
    const linkInputDest = document.getElementById('link-input-dest');
    const linkInputSource = document.getElementById('link-input-source');
    const linkInputMedium = document.getElementById('link-input-medium');
    const linkInputContent = document.getElementById('link-input-content');
    const linkInputTerm = document.getElementById('link-input-term');
    const linkInputSourcePlatform = document.getElementById('link-input-source-platform');
    const linkInputCreativeFormat = document.getElementById('link-input-creative-format');
    const linkInputMarketingTactic = document.getElementById('link-input-marketing-tactic');
    const trackingLinkModalError = document.getElementById('tracking-link-modal-error');

    // Tracking Link Delete Modal
    const modalLinkDelete = document.getElementById('link-delete-modal');
    const closeLinkDeleteModal = document.getElementById('close-link-delete-modal');
    const btnCancelLinkDelete = document.getElementById('btn-cancel-link-delete');
    const btnConfirmLinkDelete = document.getElementById('btn-confirm-link-delete');

    // ==========================================
    // INITIALIZATION
    // ==========================================
    loadNamingSettings();
    initPresets();
    setupEventListeners();
    updateLiveURL();
    initBulk();
    initCampaigns();
    document.addEventListener('utm-storage-error', e => {
        showToast(e.detail);
        const feedback = document.getElementById('preset-storage-feedback');
        if (feedback) feedback.textContent = e.detail;
    });
    placePresetSaveButton();
    document.querySelectorAll('[data-preset-load]').forEach(btn => btn.addEventListener('click', () => openSavedModal('templates')));
    document.querySelectorAll('[data-conflict-policy]').forEach(select => select.addEventListener('change', () => {
        updateLiveURL(); refreshBulkUrls();
    }));

    // ==========================================
    // NAMING SETTINGS PERSISTENCE & UI
    // ==========================================
    function loadNamingSettings() {
        try {
            const raw = localStorage.getItem('groniq_utm_naming_settings');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.casing === 'lowercase' || parsed.casing === 'preserve') {
                        runtimeNamingSettings.casing = parsed.casing;
                    }
                    if (parsed.separator === 'underscore' || parsed.separator === 'hyphen') {
                        runtimeNamingSettings.separator = parsed.separator;
                    }
                }
            }
        } catch (e) {
            runtimeNamingSettings = { ...DEFAULT_NAMING_SETTINGS };
        }
        syncNamingModalUI();
    }

    function saveNamingSettings() {
        try {
            localStorage.setItem('groniq_utm_naming_settings', JSON.stringify(runtimeNamingSettings));
        } catch (e) {}
    }

    function syncNamingModalUI() {
        const casingRadio = document.querySelector(`input[name="opt-casing"][value="${runtimeNamingSettings.casing}"]`);
        if (casingRadio) casingRadio.checked = true;

        const sepRadio = document.querySelector(`input[name="opt-separator"][value="${runtimeNamingSettings.separator}"]`);
        if (sepRadio) sepRadio.checked = true;
    }

    function openNamingModal() {
        if (!modalNamingSettings) return;
        syncNamingModalUI();
        modalNamingSettings.classList.remove('hidden');
        if (btnNamingSettings) btnNamingSettings.setAttribute('aria-expanded', 'true');
    }

    function closeNamingModal() {
        if (!modalNamingSettings) return;
        modalNamingSettings.classList.add('hidden');
        if (btnNamingSettings) btnNamingSettings.setAttribute('aria-expanded', 'false');
    }

    // ==========================================
    // SINGLE CANONICAL NORMALIZATION FUNCTION
    // ==========================================
    function normalizeTrackingValue(rawValue, settings) {
        if (rawValue === null || rawValue === undefined) return '';
        let res = String(rawValue).trim();
        try { res = decodeURIComponent(res); } catch { /* Preserve literal percent text. */ }
        if (!res) return '';

        const activeSettings = settings || runtimeNamingSettings;

        // 1. Casing preference
        if (activeSettings.casing === 'lowercase') {
            res = res.toLowerCase();
        }

        // 2. Separator preference & sanitization
        const isHyphen = activeSettings.separator === 'hyphen';
        if (isHyphen) {
            // Replace spaces, underscores, and hyphens with single hyphen
            res = res.replace(/[\s_\-]+/g, '-');
            // Sanitize: allow alphanumeric and hyphens
            // Keep Unicode and punctuation; URLSearchParams handles encoding.
            // Collapse repeated hyphens
            res = res.replace(/\-+/g, '-');
            // Trim leading/trailing hyphens
            res = res.replace(/^\-+|\-+$/g, '');
        } else {
            // Replace spaces, underscores, and hyphens with single underscore
            res = res.replace(/[\s_\-]+/g, '_');
            // Sanitize: allow alphanumeric and underscores
            // Keep Unicode and punctuation; URLSearchParams handles encoding.
            // Collapse repeated underscores
            res = res.replace(/_+/g, '_');
            // Trim leading/trailing underscores
            res = res.replace(/^_+|_+$/g, '');
        }

        return res;
    }

    // ==========================================
    // SHARED URL BUILDER ENGINE
    // ==========================================
    function parseDestination(raw) {
        const value = String(raw || '').trim();
        if (!value) throw new Error('Enter a destination URL.');
        if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) {
            throw new Error('Use an http:// or https:// URL.');
        }
        if (/[\\\r\n\t]/.test(value) || /%(?![0-9a-f]{2})/i.test(value)) {
            throw new Error('Fix the URL: remove backslashes or line breaks and use valid percent encoding.');
        }
        let url;
        try { url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value); }
        catch { throw new Error('Enter a valid destination URL.'); }
        if (!url.hostname || url.username || url.password ||
            (!url.hostname.includes('.') && url.hostname !== 'localhost' && !url.hostname.startsWith('['))) {
            throw new Error('Enter a valid hostname without login credentials.');
        }
        return url;
    }

    function conflictPolicy() {
        return document.getElementById(currentMode === 'bulk' ? 'bulk-conflict-policy' : 'single-conflict-policy')?.value || 'replace';
    }

    function buildCanonicalURL(rawDest, utmParams = {}, customPairs, policy = conflictPolicy()) {
        let urlObj;
        try { urlObj = parseDestination(rawDest); }
        catch (e) { return { error: 'INVALID_URL', message: e.message, url: '', warnings: [] }; }
        const existing = new Map();
        for (const [key, value] of urlObj.searchParams) {
            if (key.toLowerCase().startsWith('utm_')) {
                const lower = key.toLowerCase();
                if (!existing.has(lower)) existing.set(lower, []);
                existing.get(lower).push(value);
            }
        }
        const warnings = [];
        if (existing.size) {
            warnings.push('Existing values: ' + [...existing].map(([k,v]) => k + '=' + v.join(' | ')).join('; ') +
                (policy === 'keep' ? '. Keep: first non-empty value retained; entered values fill missing fields.' : '. Replace: entered campaign values replace existing values; blank fields remove old values.') +
                ' Change the existing-UTM policy above if needed.');
        }
        if ([...existing.values()].some(v => v.length > 1)) warnings.push('Repeated UTM parameters were consolidated to one value per field. Review the generated URL.');
        for (const key of [...urlObj.searchParams.keys()]) {
            if (key.toLowerCase().startsWith('utm_')) urlObj.searchParams.delete(key);
        }
        const keys = new Set([...STANDARD_UTM_KEYS, ...existing.keys()]);
        for (const key of keys) {
            const old = (existing.get(key) || []).find(v => v.trim());
            const entered = String(utmParams[key] || '').trim();
            const value = policy === 'keep' && old ? old : entered;
            if (value) urlObj.searchParams.set(key, value);
        }
        const seen = new Set();
        for (const pair of customPairs || []) {
            const key = String(pair.key || '').trim();
            const value = String(pair.value ?? '').trim();
            if (key && value && !key.toLowerCase().startsWith('utm_') && !seen.has(key.toLowerCase())) {
                urlObj.searchParams.set(key, value);
                seen.add(key.toLowerCase());
            }
        }
        return {error: null, url: urlObj.toString(), warnings};
    }
    window.buildCanonicalURL = buildCanonicalURL;

    // Helper: strip standard UTM parameters from a destination URL string
    function cleanDestinationURL(urlStr) {
        if (!urlStr) return '';
        try {
            const u = new URL(/^https?:\/\//i.test(urlStr) ? urlStr : 'https://' + urlStr);
            for (const key of [...u.searchParams.keys()]) {
                if (STANDARD_UTM_KEYS.includes(key.toLowerCase())) u.searchParams.delete(key);
            }
            return u.toString();
        } catch (e) {
            return urlStr;
        }
    }

    // ==========================================
    // LIVE URL UPDATE DISPATCHER
    // ==========================================
    function updateLiveURL() {
        // Refresh Guided Campaign preview (Entered vs Tracking value)
        const rawGCamp = gCampaign ? gCampaign.value : '';
        if (gCampaignPreviewContainer && gCampaignPreview) {
            if (rawGCamp && rawGCamp.trim()) {
                const stdGCamp = normalizeTrackingValue(rawGCamp);
                gCampaignPreviewContainer.classList.remove('hidden');
                if (rawGCamp.trim() !== stdGCamp) {
                    gCampaignPreview.textContent = `Entered: "${rawGCamp}" → Tracking value: "${stdGCamp}"`;
                    gCampaignPreview.innerText = `Entered: "${rawGCamp}" → Tracking value: "${stdGCamp}"`;
                } else {
                    gCampaignPreview.textContent = stdGCamp;
                    gCampaignPreview.innerText = stdGCamp;
                }
            } else {
                gCampaignPreviewContainer.classList.add('hidden');
            }
        }

        if (currentMode === 'checker') return;

        const rawDest = currentMode === 'guided' ? (gDest ? gDest.value : '') : (aDest ? aDest.value : '');

        if (!rawDest || !rawDest.trim()) {
            if (finalUrlDisplay) {
                finalUrlDisplay.textContent = 'Enter a destination URL to begin...';
                finalUrlDisplay.innerText = 'Enter a destination URL to begin...';
            }
            if (utmHealthBadge) {
                utmHealthBadge.innerText = 'Waiting';
                utmHealthBadge.className = 'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-[#1A1A1A] text-brand-muted border border-[#333]';
            }
            if (measurementPreview) {
                measurementPreview.innerHTML = '<p class="text-[#555] italic">Your tracking URL will appear here.</p>';
            }
            if (urlWarning) urlWarning.classList.add('hidden');
            const detail = document.getElementById('single-conflict-details'); if (detail) detail.textContent = '';
            syncShareButtons(null);
            return;
        }

        // Gather parameters
        let src = '';
        let med = '';
        let cmp = '';
        let cnt = '';
        let trm = '';
        let idVal = '';

        if (currentMode === 'guided') {
            if (activePreset) {
                if (activePreset.requiresPlacement) {
                    src = selectedPlacementSource || (activePreset.placements && activePreset.placements[0] ? activePreset.placements[0].source : '');
                } else {
                    src = activePreset.source || '';
                }
                med = activePreset.medium || '';
            }
            cmp = gCampaign ? gCampaign.value : '';
            cnt = gContent ? gContent.value : '';
            trm = gTerm ? gTerm.value : '';
        } else {
            src = aSource ? aSource.value : '';
            med = aMedium ? aMedium.value : '';
            cmp = aCampaign ? aCampaign.value : '';
            cnt = aContent ? aContent.value : '';
            trm = aTerm ? aTerm.value : '';
            idVal = aId ? aId.value : '';
        }

        // Apply naming standardization to supported UTM values only
        src = normalizeTrackingValue(src);
        med = normalizeTrackingValue(med);
        cmp = normalizeTrackingValue(cmp);
        cnt = normalizeTrackingValue(cnt);
        trm = normalizeTrackingValue(trm);
        idVal = normalizeTrackingValue(idVal);

        const utmParams = {
            utm_source: src,
            utm_medium: med,
            utm_campaign: cmp,
            utm_content: cnt,
            utm_term: trm,
            utm_id: idVal
        };

        // Custom parameters remain untransformed
        const customPairs = [];
        if (currentMode === 'advanced' && customParamsContainer) {
            customParamsContainer.querySelectorAll('.custom-pair-row').forEach(row => {
                const kInput = row.querySelector('.custom-key');
                const vInput = row.querySelector('.custom-val');
                if (kInput && vInput && kInput.value.trim()) {
                    customPairs.push({ key: kInput.value.trim(), value: vInput.value.trim() });
                }
            });
        }

        const buildResult = buildCanonicalURL(rawDest, utmParams, customPairs);
        const conflicts = document.getElementById('single-conflict-details');
        if (conflicts) conflicts.textContent = (buildResult.warnings || []).join(' ');
        if (urlWarning) urlWarning.classList.add('hidden');

        if (buildResult.error === 'INVALID_URL') {
            if (finalUrlDisplay) {
                finalUrlDisplay.textContent = buildResult.message;
                finalUrlDisplay.innerText = buildResult.message;
            }
            if (utmHealthBadge) {
                utmHealthBadge.innerText = 'Error';
                utmHealthBadge.className = 'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-red-900/30 text-red-500 border border-red-900/50';
            }
            syncShareButtons(null);
            return;
        }

        if (finalUrlDisplay) {
            finalUrlDisplay.textContent = buildResult.url;
            finalUrlDisplay.innerText = buildResult.url;
        }
        const effective = new URL(buildResult.url).searchParams;
        src = effective.get('utm_source') || ''; med = effective.get('utm_medium') || ''; cmp = effective.get('utm_campaign') || '';
        evaluateHealth(src, med, cmp);
        renderMeasurementPreview(src, med, cmp, effective.get('utm_content') || '', effective.get('utm_term') || '', effective.get('utm_id') || '', customPairs);
        syncShareButtons(getValidCurrentUrl());
    }

    window.updateLiveURL = updateLiveURL;

    // ==========================================
    // SHARE LAYER: OPEN URL & QR CODE
    // ==========================================
    // Helper: open URL reliably in new tab across all browsers without triggering popup blockers
    function openUrlInNewTab(url) {
        if (!url) return;
        let opened = false;
        try {
            const win = window.open(url, '_blank');
            if (win) {
                opened = true;
            }
        } catch (e) {}

        if (!opened) {
            try {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e) {
                try {
                    window.open(url, '_blank');
                } catch (err) {}
            }
        }
    }

    function getValidCurrentUrl() {
        const rawDest = currentMode === 'guided' ? (gDest ? gDest.value.trim() : '') : (aDest ? aDest.value.trim() : '');
        if (!rawDest) return null;

        const urlText = finalUrlDisplay ? (finalUrlDisplay.textContent || finalUrlDisplay.innerText || '').trim() : '';
        if (!urlText || urlText === 'Enter a destination URL to begin...' || urlText === 'Invalid URL format') {
            return null;
        }

        try {
            const u = new URL(urlText);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
            return urlText;
        } catch (e) {
            return null;
        }
    }

    function syncShareButtons(validUrl) {
        const isValid = !!validUrl;
        if (btnOpenUrl) {
            btnOpenUrl.removeAttribute('disabled');
            btnOpenUrl.disabled = false;
            btnOpenUrl.classList.toggle('opacity-40', !isValid);
            btnOpenUrl.classList.toggle('border-brand-green/40', isValid);
            btnOpenUrl.classList.toggle('text-white', isValid);
            btnOpenUrl.setAttribute('aria-disabled', String(!isValid));
        }
        if (btnShowQr) {
            btnShowQr.removeAttribute('disabled');
            btnShowQr.disabled = false;
            btnShowQr.classList.toggle('opacity-40', !isValid);
            btnShowQr.classList.toggle('border-brand-green/40', isValid);
            btnShowQr.classList.toggle('text-brand-green', isValid);
            btnShowQr.setAttribute('aria-disabled', String(!isValid));
        }
        if (modalQr && !modalQr.classList.contains('hidden')) {
            if (activeQrContext) {
                // QR is driven by an explicit context (e.g. Campaign Workspace link)
                return;
            }
            if (isValid) {
                renderActiveQr(validUrl);
            } else {
                closeQrModal();
            }
        }
    }

    function getSanitizedQrFilename(campaignName, linkName) {
        const sanitize = (str) => {
            if (!str || typeof str !== 'string') return '';
            return str
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        };

        const cSlug = sanitize(campaignName);
        const lSlug = sanitize(linkName);

        if (cSlug && lSlug) {
            return `${cSlug}-${lSlug}-qr.png`;
        }
        if (cSlug) {
            return `${cSlug}-qr.png`;
        }
        if (lSlug) {
            return `${lSlug}-qr.png`;
        }
        return 'groniq-campaign-qr.png';
    }

    function drawFallbackQr(canvas, url) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            canvas.width = 320;
            canvas.height = 320;
            canvas.style.width = '160px';
            canvas.style.height = '160px';
            ctx.drawImage(img, 0, 0, 320, 320);
        };
        img.onerror = function() {
            canvas.width = 320;
            canvas.height = 320;
            canvas.style.width = '160px';
            canvas.style.height = '160px';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 320, 320);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('QR Code Ready', 160, 150);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#666666';
            ctx.fillText('Click Download or Copy URL', 160, 175);
        };
        img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=' + encodeURIComponent(url);
    }

    function renderActiveQr(url) {
        if (!url) return;
        if (qrUrlText) {
            qrUrlText.textContent = url;
        }

        if (!qrCanvas) return;

        qrCanvas.style.width = '180px';
        qrCanvas.style.height = '180px';
        qrCanvas.style.maxWidth = '100%';
        qrCanvas.style.display = 'block';

        if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
            window.QRCode.toCanvas(qrCanvas, url, {
                width: 256,
                margin: 2,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function (error) {
                if (qrCanvas) {
                    qrCanvas.style.width = '180px';
                    qrCanvas.style.height = '180px';
                }
                if (error) {
                    console.error('QR code generation failed, using fallback:', error);
                    drawFallbackQr(qrCanvas, url);
                }
            });
        } else {
            drawFallbackQr(qrCanvas, url);
        }
    }

    function openQrModal(arg, maybeCmp) {
        if (arg && typeof arg === 'object') {
            activeQrContext = {
                url: arg.url || '',
                label: arg.label || arg.linkName || '',
                campaignName: arg.campaignName || '',
                linkName: arg.linkName || arg.label || '',
                campaignId: arg.campaignId || null,
                linkId: arg.linkId || null
            };
        } else if (typeof arg === 'string' && arg.trim()) {
            activeQrContext = {
                url: arg.trim(),
                label: '',
                campaignName: maybeCmp || '',
                linkName: '',
                campaignId: null,
                linkId: null
            };
        } else {
            activeQrContext = null;
        }

        const url = activeQrContext ? activeQrContext.url : getValidCurrentUrl();
        if (!url) {
            showToast('Enter a destination URL first');
            return;
        }

        // Modal Header Context updates
        if (qrModalBadge) {
            if (activeQrContext && activeQrContext.label) {
                qrModalBadge.textContent = activeQrContext.label;
                qrModalBadge.classList.remove('hidden');
            } else {
                qrModalBadge.textContent = '';
                qrModalBadge.classList.add('hidden');
            }
        }

        if (qrModalSubtitle) {
            if (activeQrContext && activeQrContext.campaignName) {
                qrModalSubtitle.textContent = `${activeQrContext.campaignName} · Scan to open this campaign URL.`;
            } else {
                qrModalSubtitle.textContent = 'Scan to open this URL on a mobile device or save for print materials.';
            }
        }

        if (modalQr) {
            modalQr.classList.remove('hidden');
            modalQr.style.display = 'flex';
            if (btnCloseQrModal) btnCloseQrModal.focus();
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }

        renderActiveQr(url);
    }

    function closeQrModal() {
        if (modalQr) {
            modalQr.classList.add('hidden');
            modalQr.style.display = 'none';
        }
        activeQrContext = null;
        if (qrModalBadge) {
            qrModalBadge.textContent = '';
            qrModalBadge.classList.add('hidden');
        }
        if (qrModalSubtitle) {
            qrModalSubtitle.textContent = 'Scan to open this URL on a mobile device or save for print materials.';
        }
        if (btnShowQr && !btnShowQr.disabled) {
            btnShowQr.focus();
        }
    }

    function downloadQrPng() {
        const url = activeQrContext ? activeQrContext.url : getValidCurrentUrl();
        if (!url) return;

        let cmp = '';
        let linkName = '';

        if (activeQrContext) {
            cmp = activeQrContext.campaignName || '';
            linkName = activeQrContext.linkName || activeQrContext.label || '';
        } else {
            if (currentMode === 'guided') {
                cmp = gCampaign ? gCampaign.value : '';
            } else if (currentMode === 'advanced') {
                cmp = aCampaign ? aCampaign.value : '';
            }
        }

        const filename = getSanitizedQrFilename(cmp, linkName);
        const exportWidth = parseInt(selectedQrSize, 10) || 1024;

        if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
            const offscreenCanvas = document.createElement('canvas');
            window.QRCode.toCanvas(offscreenCanvas, url, {
                width: exportWidth,
                margin: 4,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function (error) {
                if (error) {
                    showToast('Download failed');
                    return;
                }
                try {
                    const dataUrl = offscreenCanvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast(`QR code downloaded (${exportWidth}px)`);
                } catch (e) {
                    showToast('Download failed');
                }
            });
        } else if (qrCanvas) {
            try {
                const dataUrl = qrCanvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('QR code downloaded');
            } catch (e) {
                showToast('Download failed');
            }
        }
    }

    function downloadQrSvg() {
        const url = activeQrContext ? activeQrContext.url : getValidCurrentUrl();
        if (!url) return;

        let cmp = '';
        let linkName = '';

        if (activeQrContext) {
            cmp = activeQrContext.campaignName || '';
            linkName = activeQrContext.linkName || activeQrContext.label || '';
        } else {
            if (currentMode === 'guided') {
                cmp = gCampaign ? gCampaign.value : '';
            } else if (currentMode === 'advanced') {
                cmp = aCampaign ? aCampaign.value : '';
            }
        }

        const filename = getSanitizedQrFilename(cmp, linkName).replace(/\.png$/i, '.svg');

        if (window.QRCode && typeof window.QRCode.toString === 'function') {
            window.QRCode.toString(url, {
                type: 'svg',
                margin: 4,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function (err, svgString) {
                if (err || !svgString) {
                    showToast('SVG export failed');
                    return;
                }
                try {
                    const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
                    const link = document.createElement('a');
                    link.href = dataUri;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('Vector SVG downloaded');
                } catch (e) {
                    showToast('Download failed');
                }
            });
        } else {
            showToast('SVG export not supported in this browser');
        }
    }

    function shareQrWhatsApp() {
        const url = (activeQrContext && activeQrContext.url) ? activeQrContext.url : getValidCurrentUrl();
        if (!url) return;
        const text = `Check out this link: ${url}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    function shareQrEmail() {
        const url = (activeQrContext && activeQrContext.url) ? activeQrContext.url : getValidCurrentUrl();
        if (!url) return;
        const subject = (activeQrContext && activeQrContext.campaignName)
            ? `Campaign Link: ${activeQrContext.campaignName}`
            : 'Shared Campaign Link';
        const body = `Hi,\n\nHere is the tracking link:\n${url}\n\nGenerated with Groniq UTM Builder`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    function shareQrNative() {
        const url = (activeQrContext && activeQrContext.url) ? activeQrContext.url : getValidCurrentUrl();
        if (!url) return;
        const title = (activeQrContext && activeQrContext.campaignName)
            ? activeQrContext.campaignName
            : 'Groniq Campaign URL';

        if (navigator.share) {
            // If on a mobile device that supports sharing image files directly:
            if (qrCanvas && navigator.canShare && typeof qrCanvas.toBlob === 'function') {
                try {
                    let cmp = activeQrContext ? (activeQrContext.campaignName || '') : (currentMode === 'guided' ? (gCampaign ? gCampaign.value : '') : (aCampaign ? aCampaign.value : ''));
                    let linkName = activeQrContext ? (activeQrContext.linkName || activeQrContext.label || '') : '';
                    const filename = getSanitizedQrFilename(cmp, linkName);

                    qrCanvas.toBlob((blob) => {
                        if (blob) {
                            try {
                                const file = new File([blob], filename, { type: 'image/png' });
                                if (navigator.canShare({ files: [file] })) {
                                    navigator.share({
                                        title: title,
                                        text: `Campaign link: ${url}`,
                                        files: [file]
                                    }).catch((err) => {
                                        if (err.name !== 'AbortError') {
                                            navigator.share({ title: title, text: `Campaign link: ${url}`, url: url }).catch(() => {});
                                        }
                                    });
                                    return;
                                }
                            } catch (e) {
                                // Fall through to standard url share
                            }
                        }
                        navigator.share({
                            title: title,
                            text: `Campaign link: ${url}`,
                            url: url
                        }).catch((err) => {
                            if (err.name !== 'AbortError') {
                                if (!fallbackCopy(url)) return;
                                showToast('Link copied to clipboard');
                            }
                        });
                    }, 'image/png');
                    return;
                } catch (e) {
                    // Fall through
                }
            }

            navigator.share({
                title: title,
                text: `Campaign link: ${url}`,
                url: url
            }).catch((err) => {
                if (err.name !== 'AbortError') {
                    if (!fallbackCopy(url)) return;
                    showToast('Link copied to clipboard');
                }
            });
        } else {
            if (!fallbackCopy(url)) return;
            showToast('Link copied to clipboard');
        }
    }

    window.getValidCurrentUrl = getValidCurrentUrl;
    window.openQrModal = openQrModal;
    window.closeQrModal = closeQrModal;
    window.downloadQrPng = downloadQrPng;
    window.downloadQrSvg = downloadQrSvg;
    window.shareQrWhatsApp = shareQrWhatsApp;
    window.shareQrEmail = shareQrEmail;
    window.shareQrNative = shareQrNative;
    window.getSanitizedQrFilename = getSanitizedQrFilename;
    window.getActiveQrContext = () => activeQrContext;

    // ==========================================
    // HEALTH EVALUATION & BREAKDOWN
    // ==========================================
    function evaluateHealth(src, med, cmp) {
        if (!utmHealthBadge) return;
        let score = 3;
        if (!src) score -= 1;
        if (!med) score -= 1;
        if (!cmp) score -= 1;

        if (score === 3) {
            utmHealthBadge.innerText = 'Excellent';
            utmHealthBadge.className = 'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-brand-green/10 text-brand-green border border-brand-green/20';
        } else if (score > 0) {
            utmHealthBadge.innerText = 'Good / Needs Attention';
            utmHealthBadge.className = 'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
        } else {
            utmHealthBadge.innerText = 'Incomplete';
            utmHealthBadge.className = 'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20';
        }
    }

    function renderMeasurementPreview(src, med, cmp, cnt, trm, idVal, customPairs) {
        if (!measurementPreview) return;
        let html = '';
        const infoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;

        if (src) {
            html += `
            <div class="mb-4 relative">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white block">Source</span>
                    <button type="button" aria-label="Learn about Campaign Source" class="info-btn text-brand-muted hover:text-white transition-colors p-1 cursor-pointer" data-param="source" data-title="Campaign Source" data-desc="Identifies where the traffic comes from." data-example="utm_source=google">
                        ${infoIcon}
                    </button>
                </div>
                <span class="text-lg text-brand-green font-bold break-all">${escapeHtml(src)}</span>
                <span class="text-[10px] text-brand-muted font-mono block">utm_source</span>
            </div>`;
        }
        if (med) {
            html += `
            <div class="mb-4 relative">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white block">Medium</span>
                    <button type="button" aria-label="Learn about Campaign Medium" class="info-btn text-brand-muted hover:text-white transition-colors p-1 cursor-pointer" data-param="medium" data-title="Campaign Medium" data-desc="Identifies the marketing channel or traffic type." data-example="utm_medium=cpc">
                        ${infoIcon}
                    </button>
                </div>
                <span class="text-lg text-brand-green font-bold break-all">${escapeHtml(med)}</span>
                <span class="text-[10px] text-brand-muted font-mono block">utm_medium</span>
            </div>`;
        }
        if (cmp) {
            html += `
            <div class="mb-4 relative">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white block">Campaign</span>
                    <button type="button" aria-label="Learn about Campaign Name" class="info-btn text-brand-muted hover:text-white transition-colors p-1 cursor-pointer" data-param="campaign" data-title="Campaign Name" data-desc="Identifies the campaign this traffic belongs to." data-example="utm_campaign=summer_launch_2026">
                        ${infoIcon}
                    </button>
                </div>
                <span class="text-lg text-brand-green font-bold break-all">${escapeHtml(cmp)}</span>
                <span class="text-[10px] text-brand-muted font-mono block">utm_campaign</span>
            </div>`;
        }
        if (cnt) {
            html += `
            <div class="mb-4 relative">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white block">Content</span>
                    <button type="button" aria-label="Learn about Campaign Content" class="info-btn text-brand-muted hover:text-white transition-colors p-1 cursor-pointer" data-param="content" data-title="Campaign Content" data-desc="Distinguish creatives, ads, links, or variations." data-example="utm_content=video_ad_01">
                        ${infoIcon}
                    </button>
                </div>
                <span class="text-lg text-brand-green font-bold break-all">${escapeHtml(cnt)}</span>
                <span class="text-[10px] text-brand-muted font-mono block">utm_content</span>
            </div>`;
        }
        if (trm) {
            html += `
            <div class="mb-4 relative">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white block">Term</span>
                    <button type="button" aria-label="Learn about Campaign Term" class="info-btn text-brand-muted hover:text-white transition-colors p-1 cursor-pointer" data-param="term" data-title="Campaign Term" data-desc="Optionally identify a keyword, audience, or targeting detail." data-example="utm_term=search_keyword">
                        ${infoIcon}
                    </button>
                </div>
                <span class="text-lg text-brand-green font-bold break-all">${escapeHtml(trm)}</span>
                <span class="text-[10px] text-brand-muted font-mono block">utm_term</span>
            </div>`;
        }
        if (idVal) {
            html += `
            <div class="mb-4 relative">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white block">Campaign ID</span>
                    <button type="button" aria-label="Learn about Campaign ID" class="info-btn text-brand-muted hover:text-white transition-colors p-1 cursor-pointer" data-param="id" data-title="Campaign ID" data-desc="Optionally store an internal or platform campaign identifier." data-example="utm_id=CMP-001">
                        ${infoIcon}
                    </button>
                </div>
                <span class="text-lg text-brand-green font-bold break-all">${escapeHtml(idVal)}</span>
                <span class="text-[10px] text-brand-muted font-mono block">utm_id</span>
            </div>`;
        }
        if (Array.isArray(customPairs) && customPairs.length > 0) {
            customPairs.forEach(pair => {
                if (pair.key && pair.value) {
                    html += `
                    <div class="mb-4 relative">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-white block">${escapeHtml(pair.key)}</span>
                            <span class="text-[9px] font-mono uppercase text-brand-muted">custom</span>
                        </div>
                        <span class="text-sm font-mono text-brand-green font-semibold break-all">${escapeHtml(pair.value)}</span>
                    </div>`;
                }
            });
        }

        if (!html) html = '<p class="text-[#555] italic">Your tracking URL will appear here.</p>';
        measurementPreview.innerHTML = html;
    }

    // ==========================================
    // GUIDED PRESETS & PLACEMENTS
    // ==========================================
    function initPresets() {
        if (!presetContainer || typeof UTM_PRESETS === 'undefined') return;

        presetContainer.innerHTML = UTM_PRESETS.map(p => `
            <button class="preset-btn px-4 py-2.5 rounded-lg border border-[#333] bg-[#0A0A0A] hover:border-brand-green/50 hover:bg-[#141414] transition-all flex items-center justify-start gap-2 cursor-pointer" data-id="${p.id}">
                <i data-lucide="${p.icon || 'link'}" class="w-4 h-4 text-brand-muted pointer-events-none"></i>
                <span class="text-[11px] font-bold uppercase tracking-wider text-white pointer-events-none">${p.name}</span>
            </button>
        `).join('');

        presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                selectPreset(id);
                updateLiveURL();
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    function selectPreset(id) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            const icon = btn.querySelector('i, svg');
            if (btn.dataset.id === id) {
                btn.classList.add('border-brand-green', 'bg-brand-green/5');
                btn.classList.remove('border-[#333]', 'bg-[#0A0A0A]');
                if (icon) {
                    icon.classList.add('text-brand-green');
                    icon.classList.remove('text-brand-muted');
                }
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('border-brand-green', 'bg-brand-green/5');
                btn.classList.add('border-[#333]', 'bg-[#0A0A0A]');
                if (icon) {
                    icon.classList.remove('text-brand-green');
                    icon.classList.add('text-brand-muted');
                }
                btn.setAttribute('aria-pressed', 'false');
            }
        });

        activePreset = UTM_PRESETS.find(p => p.id === id);
        if (guidedChannelError) guidedChannelError.classList.add('hidden');
        selectedPlacementSource = null;

        if (activePreset && activePreset.requiresPlacement && activePreset.placements && activePreset.placements.length > 0) {
            dynamicPlacementContainer.innerHTML = `
                <label class="text-[10px] font-bold uppercase tracking-widest text-white block mb-1">Source</label>
                <p class="text-[10px] text-brand-muted mb-3">Choose the platform sending the traffic.</p>
                <div class="flex flex-wrap gap-2">
                    ${activePreset.placements.map((pl, i) => `
                        <button class="placement-btn px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${i === 0 ? 'border-brand-green text-brand-green bg-brand-green/5' : 'border-[#333] text-brand-muted hover:text-white bg-[#0A0A0A]'} transition-colors cursor-pointer" data-source="${pl.source}">
                            ${pl.name}
                        </button>
                    `).join('')}
                </div>
            `;
            dynamicPlacementContainer.classList.remove('hidden');

            // Default to first placement source
            selectedPlacementSource = activePreset.placements[0].source;
            if (aSource) aSource.value = selectedPlacementSource;
            if (aMedium) aMedium.value = activePreset.medium || '';

            dynamicPlacementContainer.querySelectorAll('.placement-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    dynamicPlacementContainer.querySelectorAll('.placement-btn').forEach(b => {
                        b.classList.remove('border-brand-green', 'text-brand-green', 'bg-brand-green/5');
                        b.classList.add('border-[#333]', 'text-brand-muted', 'bg-[#0A0A0A]');
                        b.setAttribute('aria-pressed', 'false');
                    });
                    e.currentTarget.classList.add('border-brand-green', 'text-brand-green', 'bg-brand-green/5');
                    e.currentTarget.classList.remove('border-[#333]', 'text-brand-muted', 'bg-[#0A0A0A]');
                    e.currentTarget.setAttribute('aria-pressed', 'true');

                    selectedPlacementSource = e.currentTarget.dataset.source;
                    if (aSource) aSource.value = selectedPlacementSource;
                    updateLiveURL();
                });
            });
        } else if (activePreset) {
            dynamicPlacementContainer.classList.add('hidden');
            dynamicPlacementContainer.innerHTML = '';
            selectedPlacementSource = activePreset.source || '';
            if (aSource) aSource.value = selectedPlacementSource;
            if (aMedium) aMedium.value = activePreset.medium || '';
        } else {
            dynamicPlacementContainer.classList.add('hidden');
            dynamicPlacementContainer.innerHTML = '';
        }
    }

    // ==========================================
    // MODE SWITCHING
    // ==========================================
    function placePresetSaveButton() {
        const slot = containers[currentMode]?.querySelector('[data-preset-save-slot]');
        if (slot && btnSaveAsTemplate) slot.appendChild(btnSaveAsTemplate);
    }

    function switchMode(mode) {
        if (currentMode !== mode) {
            window.groniqTrack?.('utm_builder_mode_select', { mode });
        }
        currentMode = mode;
        placePresetSaveButton();
        Object.keys(modes).forEach(k => {
            if (modes[k]) {
                if (k === mode) {
                    modes[k].classList.add('bg-brand-green', 'text-black');
                    modes[k].classList.remove('text-brand-muted');
                } else {
                    modes[k].classList.remove('bg-brand-green', 'text-black');
                    modes[k].classList.add('text-brand-muted');
                }
            }
            if (containers[k]) {
                if (k === mode) {
                    containers[k].classList.remove('hidden');
                } else {
                    containers[k].classList.add('hidden');
                }
            }
        });

        if (mode === 'bulk' || mode === 'campaigns') {
            if (workspaceLeft) workspaceLeft.classList.add('hidden');
            if (workspaceRight) workspaceRight.classList.add('hidden');
            if (mode === 'bulk' && typeof renderBulkRows === 'function') renderBulkRows();
            if (mode === 'campaigns' && typeof renderCampaignsUI === 'function') renderCampaignsUI();
        } else {
            if (workspaceLeft) workspaceLeft.classList.remove('hidden');
            if (workspaceRight) workspaceRight.classList.remove('hidden');
        }

        // Sync values across Guided and Advanced
        if (mode === 'advanced') {
            if (gDest && aDest) aDest.value = gDest.value;
            if (gCampaign && aCampaign) aCampaign.value = gCampaign.value;
            if (gContent && aContent) aContent.value = gContent.value;
            if (gTerm && aTerm) aTerm.value = gTerm.value;
            if (activePreset) {
                if (aSource && selectedPlacementSource) aSource.value = selectedPlacementSource;
                if (aMedium && activePreset.medium) aMedium.value = activePreset.medium;
            }
        } else if (mode === 'guided') {
            if (gDest && aDest) gDest.value = aDest.value;
            if (gCampaign && aCampaign) gCampaign.value = aCampaign.value;
            if (gContent && aContent) gContent.value = aContent.value;
            if (gTerm && aTerm) gTerm.value = aTerm.value;
        }

        if (mode !== 'bulk') {
            updateLiveURL();
        }
    }

    window.switchMode = switchMode;

    // ==========================================
    // SAVED: CAMPAIGNS, TEMPLATES & HISTORY
    // ==========================================
    function openSavedModal(defaultTab = 'campaigns') {
        if (!modalSaved) return;
        renderSavedCampaigns();
        renderSavedTemplates();
        renderSavedHistory();
        switchSavedTab(defaultTab);
        modalSaved.classList.remove('hidden');
        if (btnOpenSaved) btnOpenSaved.setAttribute('aria-expanded', 'true');
    }

    function closeSavedModal() {
        if (!modalSaved) return;
        modalSaved.classList.add('hidden');
        if (btnOpenSaved) btnOpenSaved.setAttribute('aria-expanded', 'false');
    }

    function switchSavedTab(tab) {
        if (tab === 'templates') {
            tabSavedTemplates?.classList.add('text-brand-green', 'border-brand-green');
            tabSavedTemplates?.classList.remove('text-brand-muted', 'border-transparent');
            tabSavedCampaigns?.classList.remove('text-brand-green', 'border-brand-green');
            tabSavedCampaigns?.classList.add('text-brand-muted', 'border-transparent');
            tabSavedHistory?.classList.remove('text-brand-green', 'border-brand-green');
            tabSavedHistory?.classList.add('text-brand-muted', 'border-transparent');
            containerSavedTemplates?.classList.remove('hidden');
            containerSavedCampaigns?.classList.add('hidden');
            containerSavedHistory?.classList.add('hidden');
            if (btnClearHistoryOnly) btnClearHistoryOnly.classList.add('hidden');
            renderSavedTemplates();
        } else if (tab === 'history') {
            tabSavedHistory?.classList.add('text-brand-green', 'border-brand-green');
            tabSavedHistory?.classList.remove('text-brand-muted', 'border-transparent');
            tabSavedCampaigns?.classList.remove('text-brand-green', 'border-brand-green');
            tabSavedCampaigns?.classList.add('text-brand-muted', 'border-transparent');
            tabSavedTemplates?.classList.remove('text-brand-green', 'border-brand-green');
            tabSavedTemplates?.classList.add('text-brand-muted', 'border-transparent');
            containerSavedHistory?.classList.remove('hidden');
            containerSavedCampaigns?.classList.add('hidden');
            containerSavedTemplates?.classList.add('hidden');
            if (btnClearHistoryOnly) btnClearHistoryOnly.classList.remove('hidden');
            renderSavedHistory();
        } else {
            // Default: 'campaigns'
            tabSavedCampaigns?.classList.add('text-brand-green', 'border-brand-green');
            tabSavedCampaigns?.classList.remove('text-brand-muted', 'border-transparent');
            tabSavedTemplates?.classList.remove('text-brand-green', 'border-brand-green');
            tabSavedTemplates?.classList.add('text-brand-muted', 'border-transparent');
            tabSavedHistory?.classList.remove('text-brand-green', 'border-brand-green');
            tabSavedHistory?.classList.add('text-brand-muted', 'border-transparent');
            containerSavedCampaigns?.classList.remove('hidden');
            containerSavedTemplates?.classList.add('hidden');
            containerSavedHistory?.classList.add('hidden');
            if (btnClearHistoryOnly) btnClearHistoryOnly.classList.add('hidden');
            renderSavedCampaigns();
        }
    }

    function addCustomParamRow(key = '', val = '') {
        if (!customParamsContainer) return;
        const row = document.createElement('div');
        row.className = 'custom-pair-row flex gap-2 items-center';
        row.innerHTML = `
            <input type="text" class="custom-key w-1/3 bg-[#111] border border-[#222] focus:border-brand-green rounded-lg px-3 py-2 text-white outline-none text-xs font-mono" placeholder="Parameter name" value="${escapeHtml(key)}">
            <input type="text" class="custom-val flex-1 bg-[#111] border border-[#222] focus:border-brand-green rounded-lg px-3 py-2 text-white outline-none text-xs font-mono" placeholder="Parameter value" value="${escapeHtml(val)}">
            <button type="button" class="btn-remove-custom text-brand-muted hover:text-red-500 p-1 transition-colors cursor-pointer" aria-label="Remove parameter">
                <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
            </button>
        `;
        customParamsContainer.appendChild(row);

        row.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', () => {
                inp.classList.remove('border-red-500');
                if (customParamsError) customParamsError.classList.add('hidden');
                updateLiveURL();
            });
        });

        row.querySelector('.btn-remove-custom').addEventListener('click', () => {
            row.remove();
            if (customParamsError) customParamsError.classList.add('hidden');
            updateLiveURL();
        });

        if (window.lucide) lucide.createIcons();
    }

    function clearAllInlineErrors() {
        [guidedDestError, guidedChannelError, advUrlError, advSourceError, advMediumError, customParamsError].forEach(el => {
            if (el) el.classList.add('hidden');
        });
        [gDest, aDest, aSource, aMedium].forEach(inp => {
            if (inp) inp.classList.remove('border-red-500');
        });
        if (customParamsContainer) {
            customParamsContainer.querySelectorAll('.custom-key').forEach(inp => {
                inp.classList.remove('border-red-500');
            });
        }
    }

    function validateCampaignForm() {
        clearAllInlineErrors();
        let isValid = true;
        const errors = {};

        const rawDest = currentMode === 'guided' ? (gDest ? gDest.value.trim() : '') : (aDest ? aDest.value.trim() : '');
        let src = '';
        let med = '';
        let cmp = '';
        let cnt = '';
        let trm = '';
        let idVal = '';

        if (currentMode === 'guided') {
            if (!rawDest) {
                isValid = false;
                errors.dest = 'Destination URL is required.';
                if (guidedDestError && guidedDestErrorMsg) {
                    guidedDestErrorMsg.textContent = errors.dest;
                    guidedDestError.classList.remove('hidden');
                }
                if (gDest) gDest.classList.add('border-red-500');
            } else {
                try {
                    const u = new URL(/^https?:\/\//i.test(rawDest) ? rawDest : 'https://' + rawDest);
                    if (!u.hostname) throw new Error();
                } catch (e) {
                    isValid = false;
                    errors.dest = 'Please enter a valid URL (e.g. https://example.com/landing-page).';
                    if (guidedDestError && guidedDestErrorMsg) {
                        guidedDestErrorMsg.textContent = errors.dest;
                        guidedDestError.classList.remove('hidden');
                    }
                    if (gDest) gDest.classList.add('border-red-500');
                }
            }

            if (activePreset) {
                if (activePreset.requiresPlacement) {
                    src = selectedPlacementSource || (activePreset.placements && activePreset.placements[0] ? activePreset.placements[0].source : '');
                } else {
                    src = activePreset.source || '';
                }
                med = activePreset.medium || '';
            }

            if (!src || !med) {
                isValid = false;
                errors.channel = 'Please select a channel preset.';
                if (guidedChannelError) guidedChannelError.classList.remove('hidden');
            }

            cmp = gCampaign ? gCampaign.value.trim() : '';
            cnt = gContent ? gContent.value.trim() : '';
            trm = gTerm ? gTerm.value.trim() : '';
        } else {
            // Advanced Mode
            if (!rawDest) {
                isValid = false;
                errors.dest = 'Destination URL is required.';
                if (advUrlError && advUrlErrorMsg) {
                    advUrlErrorMsg.textContent = errors.dest;
                    advUrlError.classList.remove('hidden');
                }
                if (aDest) aDest.classList.add('border-red-500');
            } else {
                try {
                    const u = new URL(/^https?:\/\//i.test(rawDest) ? rawDest : 'https://' + rawDest);
                    if (!u.hostname) throw new Error();
                } catch (e) {
                    isValid = false;
                    errors.dest = 'Please enter a valid URL (e.g. https://example.com/landing-page).';
                    if (advUrlError && advUrlErrorMsg) {
                        advUrlErrorMsg.textContent = errors.dest;
                        advUrlError.classList.remove('hidden');
                    }
                    if (aDest) aDest.classList.add('border-red-500');
                }
            }

            src = aSource ? aSource.value.trim() : '';
            if (!src) {
                isValid = false;
                errors.source = 'Campaign Source (utm_source) is required.';
                if (advSourceError) advSourceError.classList.remove('hidden');
                if (aSource) aSource.classList.add('border-red-500');
            }

            med = aMedium ? aMedium.value.trim() : '';
            if (!med) {
                isValid = false;
                errors.medium = 'Campaign Medium (utm_medium) is required.';
                if (advMediumError) advMediumError.classList.remove('hidden');
                if (aMedium) aMedium.classList.add('border-red-500');
            }

            cmp = aCampaign ? aCampaign.value.trim() : '';
            cnt = aContent ? aContent.value.trim() : '';
            trm = aTerm ? aTerm.value.trim() : '';
            idVal = aId ? aId.value.trim() : '';
        }

        // Custom parameters validation
        const customPairs = [];
        const seenKeys = new Set();
        if (customParamsContainer) {
            const rows = customParamsContainer.querySelectorAll('.custom-pair-row');
            let customParamErrorMessage = '';

            rows.forEach(row => {
                const kInput = row.querySelector('.custom-key');
                const vInput = row.querySelector('.custom-val');
                const k = kInput ? kInput.value.trim() : '';
                const v = vInput ? vInput.value.trim() : '';

                // Completely empty row: ignore
                if (!k && !v) return;

                if (!k && v) {
                    isValid = false;
                    customParamErrorMessage = 'Custom parameter name cannot be empty when value is provided.';
                    if (kInput) kInput.classList.add('border-red-500');
                    return;
                }

                // Character validation: alphanumeric, _, -, .
                if (!/^[a-zA-Z0-9_\-\.]+$/.test(k)) {
                    isValid = false;
                    customParamErrorMessage = `Invalid parameter name "${k}". Use letters, numbers, underscores, or hyphens (no spaces, =, &, ?, #).`;
                    if (kInput) kInput.classList.add('border-red-500');
                    return;
                }

                // Standard UTM parameter validation
                if (STANDARD_UTM_KEYS.includes(k.toLowerCase())) {
                    isValid = false;
                    customParamErrorMessage = `"${k}" is a standard UTM parameter. Use the dedicated field above instead.`;
                    if (kInput) kInput.classList.add('border-red-500');
                    return;
                }

                // Duplicate key validation
                const lowerK = k.toLowerCase();
                if (seenKeys.has(lowerK)) {
                    isValid = false;
                    customParamErrorMessage = `Duplicate parameter name "${k}". Each custom parameter must be unique.`;
                    if (kInput) kInput.classList.add('border-red-500');
                    return;
                }

                seenKeys.add(lowerK);
                if (kInput) kInput.classList.remove('border-red-500');
                customPairs.push({ key: k, value: v });
            });

            if (customParamErrorMessage) {
                if (customParamsError && customParamsErrorMsg) {
                    customParamsErrorMsg.textContent = customParamErrorMessage;
                    customParamsError.classList.remove('hidden');
                }
            }
        }

        return {
            isValid,
            errors,
            data: {
                destinationUrl: cleanDestinationURL(rawDest),
                source: src,
                medium: med,
                campaign: cmp,
                content: cnt,
                term: trm,
                campaignId: idVal,
                customParams: customPairs,
                namingSettings: { ...runtimeNamingSettings }
            }
        };
    }

    function saveCampaignFromWorkspace() {
        const valResult = validateCampaignForm();
        if (!valResult.isValid) {
            const firstErrMsg = Object.values(valResult.errors)[0] || 'Please fix the highlighted errors before saving.';
            showToast(firstErrMsg);
            if (valResult.errors.dest) {
                (currentMode === 'guided' ? gDest : aDest)?.focus();
            } else if (valResult.errors.source) {
                aSource?.focus();
            } else if (valResult.errors.medium) {
                aMedium?.focus();
            }
            return;
        }

        const { data } = valResult;

        // Apply naming standardization to tracking values
        const normSrc = normalizeTrackingValue(data.source, data.namingSettings);
        const normMed = normalizeTrackingValue(data.medium, data.namingSettings);
        const normCmp = normalizeTrackingValue(data.campaign, data.namingSettings);
        const normCnt = normalizeTrackingValue(data.content, data.namingSettings);
        const normTrm = normalizeTrackingValue(data.term, data.namingSettings);
        const normId = normalizeTrackingValue(data.campaignId, data.namingSettings);

        const utmParams = {
            utm_source: normSrc,
            utm_medium: normMed,
            utm_campaign: normCmp,
            utm_content: normCnt,
            utm_term: normTrm,
            utm_id: normId
        };

        const buildRes = buildCanonicalURL(data.destinationUrl, utmParams, data.customParams);
        data.generatedUrl = buildRes.url;

        const campName = data.campaign && data.campaign.trim() 
            ? data.campaign.trim() 
            : `${data.source} / ${data.medium} Campaign`;
        data.name = campName;

        // Provide compatibility link object for mode-campaigns
        const linkItem = {
            id: 'lnk_' + Date.now().toString(),
            name: campName,
            destinationUrl: data.destinationUrl,
            source: data.source,
            medium: data.medium,
            content: data.content,
            term: data.term,
            sourcePlatform: '',
            creativeFormat: '',
            marketingTactic: '',
            customParams: data.customParams
        };
        data.links = [linkItem];

        if (activeEditingCampaignId) {
            const updated = UTMStorage.updateCampaign(activeEditingCampaignId, data);
            if (updated) {
                showToast('Campaign updated successfully!');
                if (campaignEditingName) campaignEditingName.textContent = updated.name;
            } else {
                const created = UTMStorage.createCampaign(data);
                if (created) activeEditingCampaignId = created.id;
                showToast('Campaign saved successfully!');
            }
        } else {
            const created = UTMStorage.createCampaign(data);
            if (created) {
                activeEditingCampaignId = created.id;
                if (campaignEditingBanner && campaignEditingName) {
                    campaignEditingName.textContent = created.name;
                    campaignEditingBanner.classList.remove('hidden');
                }
                if (btnSaveCampaignText) btnSaveCampaignText.textContent = 'Save Changes';
                showToast('Campaign saved successfully!');
            }
        }

        saveCurrentToHistory();
        renderSavedCampaigns();
        if (typeof refreshCampaignsUI === 'function') refreshCampaignsUI();
        openSavedModal('campaigns');
    }

    function reopenSavedCampaign(id) {
        if (!id || typeof UTMStorage === 'undefined') return;
        const campaigns = UTMStorage.getCampaigns();
        const camp = campaigns.find(c => c.id === id);
        if (!camp) return;

        activeEditingCampaignId = camp.id;
        switchMode('advanced');

        if (aDest) aDest.value = cleanDestinationURL(camp.destinationUrl || '');
        if (aSource) aSource.value = camp.source || '';
        if (aMedium) aMedium.value = camp.medium || '';
        if (aCampaign) aCampaign.value = camp.campaign || camp.name || '';
        if (aContent) aContent.value = camp.content || '';
        if (aTerm) aTerm.value = camp.term || '';
        if (aId) aId.value = camp.campaignId || '';

        if (customParamsContainer) {
            customParamsContainer.innerHTML = '';
            if (Array.isArray(camp.customParams)) {
                camp.customParams.forEach(cp => {
                    addCustomParamRow(cp.key, cp.value);
                });
            }
        }

        if (camp.namingSettings) {
            runtimeNamingSettings.casing = camp.namingSettings.casing || 'lowercase';
            runtimeNamingSettings.separator = camp.namingSettings.separator || 'underscore';
            syncNamingModalUI();
            saveNamingSettings();
        }

        if (campaignEditingBanner && campaignEditingName) {
            campaignEditingName.textContent = camp.name || camp.campaign || 'Campaign';
            campaignEditingBanner.classList.remove('hidden');
        }
        if (btnSaveCampaignText) {
            btnSaveCampaignText.textContent = 'Save Changes';
        }

        clearAllInlineErrors();
        updateLiveURL();
        closeSavedModal();
        showToast(`Loaded "${camp.name || 'Campaign'}" for editing`);
    }

    function cancelEditingCampaign() {
        activeEditingCampaignId = null;
        if (campaignEditingBanner) campaignEditingBanner.classList.add('hidden');
        if (btnSaveCampaignText) btnSaveCampaignText.textContent = 'Save Campaign';
        showToast('Exited campaign editing mode');
    }

    function renderSavedCampaigns() {
        if (!containerSavedCampaigns || typeof UTMStorage === 'undefined') return;
        const campaigns = UTMStorage.getCampaigns();

        if (!campaigns || campaigns.length === 0) {
            containerSavedCampaigns.innerHTML = `
                <div class="p-8 text-center text-brand-muted border border-dashed border-[#222] rounded-xl space-y-3">
                    <div class="w-10 h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mx-auto text-brand-green">
                        <i data-lucide="bookmark" class="w-5 h-5"></i>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs font-bold text-white">No saved campaigns yet.</p>
                        <p class="text-[10px] text-brand-muted max-w-xs mx-auto">Create and save a campaign in the workspace to access it here.</p>
                    </div>
                    <div>
                        <button type="button" class="btn-goto-create-campaign px-3.5 py-1.5 rounded-lg bg-brand-green text-black font-extrabold text-[11px] uppercase tracking-wider hover:bg-brand-greenHover transition-all cursor-pointer">
                            Create campaign
                        </button>
                    </div>
                </div>
            `;
            const gotoBtn = containerSavedCampaigns.querySelector('.btn-goto-create-campaign');
            if (gotoBtn) {
                gotoBtn.addEventListener('click', () => {
                    closeSavedModal();
                    if (currentMode !== 'guided' && currentMode !== 'advanced') {
                        switchMode('advanced');
                    }
                    const target = currentMode === 'guided' ? gDest : aDest;
                    if (target) target.focus();
                });
            }
            if (window.lucide) lucide.createIcons();
            return;
        }

        containerSavedCampaigns.innerHTML = campaigns.map(c => {
            const title = c.name || c.campaign || 'Untitled Campaign';
            const normSrc = normalizeTrackingValue(c.source, c.namingSettings);
            const normMed = normalizeTrackingValue(c.medium, c.namingSettings);
            const relTime = formatRelativeTime(c.updatedAt || c.createdAt);
            const host = formatHostPath(c.destinationUrl);
            const genUrl = c.generatedUrl || (buildCanonicalURL(c.destinationUrl, {
                utm_source: normSrc,
                utm_medium: normMed,
                utm_campaign: normalizeTrackingValue(c.campaign || c.name, c.namingSettings),
                utm_content: normalizeTrackingValue(c.content, c.namingSettings),
                utm_term: normalizeTrackingValue(c.term, c.namingSettings),
                utm_id: normalizeTrackingValue(c.campaignId, c.namingSettings)
            }, c.customParams).url);

            return `
                <div class="p-4 rounded-xl bg-[#141414] border border-[#222] hover:border-[#333] transition-all flex flex-col gap-3 group" data-campaign-id="${escapeHtml(c.id)}">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="text-xs font-bold text-white uppercase tracking-wider">${escapeHtml(title)}</h4>
                                ${normSrc || normMed ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1A1A1A] border border-[#2A2A2A] text-brand-green">${escapeHtml(normSrc || 'source')} / ${escapeHtml(normMed || 'medium')}</span>` : ''}
                                ${c.campaignId ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1A1A1A] border border-[#2A2A2A] text-brand-muted">id: ${escapeHtml(c.campaignId)}</span>` : ''}
                            </div>
                            <div class="flex items-center gap-2 text-[10px] font-mono text-brand-muted flex-wrap">
                                ${host ? `<span class="truncate max-w-xs text-brand-mutedLight">${escapeHtml(host)}</span><span>&bull;</span>` : ''}
                                <span>Updated ${escapeHtml(relTime)}</span>
                            </div>
                        </div>
                    </div>

                    ${genUrl ? `
                    <div class="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1C1C1C] font-mono text-[11px] text-brand-mutedLight break-all">
                        ${escapeHtml(genUrl)}
                    </div>` : ''}

                    <div class="pt-2 border-t border-[#1C1C1C] flex items-center justify-between flex-wrap gap-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <button type="button" class="btn-saved-camp-reopen px-3 py-1.5 bg-brand-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:bg-brand-greenHover transition-colors cursor-pointer flex items-center gap-1">
                                <i data-lucide="edit" class="w-3 h-3 pointer-events-none"></i>
                                <span class="pointer-events-none">Edit / Reopen</span>
                            </button>
                            <button type="button" class="btn-saved-camp-copy px-2.5 py-1.5 bg-[#1F1F1F] text-brand-muted hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                                <i data-lucide="copy" class="w-3 h-3 pointer-events-none"></i>
                                <span class="pointer-events-none">Copy URL</span>
                            </button>
                            <button type="button" class="btn-saved-camp-qr p-1.5 text-brand-muted hover:text-white hover:bg-[#222] rounded-lg transition-colors cursor-pointer" title="QR Code" aria-label="QR Code">
                                <i data-lucide="qr-code" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-1">
                            <button type="button" class="btn-saved-camp-dup p-1.5 text-brand-muted hover:text-white hover:bg-[#222] rounded-lg transition-colors cursor-pointer" title="Duplicate campaign" aria-label="Duplicate campaign">
                                <i data-lucide="copy-plus" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                            <button type="button" class="btn-saved-camp-delete p-1.5 text-brand-muted hover:text-red-400 hover:bg-[#222] rounded-lg transition-colors cursor-pointer" title="Delete campaign" aria-label="Delete campaign">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        containerSavedCampaigns.querySelectorAll('.btn-saved-camp-reopen').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-campaign-id]');
                if (card) reopenSavedCampaign(card.dataset.campaignId);
            });
        });

        containerSavedCampaigns.querySelectorAll('.btn-saved-camp-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-campaign-id]');
                const camp = campaigns.find(c => c.id === card.dataset.campaignId);
                if (camp) {
                    const urlToCopy = camp.generatedUrl || (buildCanonicalURL(camp.destinationUrl, {
                        utm_source: normalizeTrackingValue(camp.source, camp.namingSettings),
                        utm_medium: normalizeTrackingValue(camp.medium, camp.namingSettings),
                        utm_campaign: normalizeTrackingValue(camp.campaign || camp.name, camp.namingSettings),
                        utm_content: normalizeTrackingValue(camp.content, camp.namingSettings),
                        utm_term: normalizeTrackingValue(camp.term, camp.namingSettings),
                        utm_id: normalizeTrackingValue(camp.campaignId, camp.namingSettings)
                    }, camp.customParams).url);

                    if (urlToCopy) {
                        navigator.clipboard.writeText(urlToCopy).then(() => {
                            showToast('Campaign URL copied to clipboard');
                        }).catch(() => {
                            showToast('Copied to clipboard');
                        });
                    }
                }
            });
        });

        containerSavedCampaigns.querySelectorAll('.btn-saved-camp-qr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-campaign-id]');
                const camp = campaigns.find(c => c.id === card.dataset.campaignId);
                if (camp) {
                    const url = camp.generatedUrl || (buildCanonicalURL(camp.destinationUrl, {
                        utm_source: normalizeTrackingValue(camp.source, camp.namingSettings),
                        utm_medium: normalizeTrackingValue(camp.medium, camp.namingSettings),
                        utm_campaign: normalizeTrackingValue(camp.campaign || camp.name, camp.namingSettings),
                        utm_content: normalizeTrackingValue(camp.content, camp.namingSettings),
                        utm_term: normalizeTrackingValue(camp.term, camp.namingSettings),
                        utm_id: normalizeTrackingValue(camp.campaignId, camp.namingSettings)
                    }, camp.customParams).url);

                    if (url) {
                        openQrModal({
                            url: url,
                            label: camp.name || 'Campaign QR',
                            campaignName: camp.name || '',
                            campaignId: camp.id
                        });
                    }
                }
            });
        });

        containerSavedCampaigns.querySelectorAll('.btn-saved-camp-dup').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-campaign-id]');
                if (card) {
                    const dup = UTMStorage.duplicateCampaign(card.dataset.campaignId);
                    if (dup) {
                        renderSavedCampaigns();
                        showToast('Campaign duplicated');
                    }
                }
            });
        });

        containerSavedCampaigns.querySelectorAll('.btn-saved-camp-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-campaign-id]');
                if (card) {
                    openCampaignDeleteModal(card.dataset.campaignId);
                }
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    function formatRelativeTime(isoString) {
        if (!isoString) return 'Recently';
        try {
            const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
            if (diffSec < 60) return 'Just now';
            if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
            if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
            return new Date(isoString).toLocaleDateString();
        } catch (e) {
            return 'Recently';
        }
    }

    function formatHostPath(urlStr) {
        if (!urlStr) return '';
        try {
            const u = new URL(/^https?:\/\//i.test(urlStr) ? urlStr : 'https://' + urlStr);
            return u.hostname + (u.pathname === '/' ? '' : u.pathname);
        } catch (e) {
            return urlStr;
        }
    }

    function saveCurrentToHistory() {
        const finalUrl = finalUrlDisplay ? (finalUrlDisplay.textContent || finalUrlDisplay.innerText || '').trim() : '';
        if (!finalUrl || finalUrl === 'Enter a destination URL to begin...' || finalUrl === 'Invalid URL format') return;

        const rawDest = currentMode === 'guided' ? (gDest ? gDest.value.trim() : '') : (aDest ? aDest.value.trim() : '');
        let src = '', med = '', cmp = '', cnt = '', trm = '', idVal = '';

        if (currentMode === 'guided') {
            if (activePreset) {
                src = selectedPlacementSource || activePreset.source || '';
                med = activePreset.medium || '';
            }
            cmp = gCampaign ? gCampaign.value.trim() : '';
            cnt = gContent ? gContent.value.trim() : '';
            trm = gTerm ? gTerm.value.trim() : '';
        } else {
            src = aSource ? aSource.value.trim() : '';
            med = aMedium ? aMedium.value.trim() : '';
            cmp = aCampaign ? aCampaign.value.trim() : '';
            cnt = aContent ? aContent.value.trim() : '';
            trm = aTerm ? aTerm.value.trim() : '';
            idVal = aId ? aId.value.trim() : '';
        }

        const customPairs = [];
        if (currentMode === 'advanced' && customParamsContainer) {
            customParamsContainer.querySelectorAll('.custom-pair-row').forEach(row => {
                const kInput = row.querySelector('.custom-key');
                const vInput = row.querySelector('.custom-val');
                if (kInput && vInput && kInput.value.trim()) {
                    customPairs.push({ key: kInput.value.trim(), value: vInput.value.trim() });
                }
            });
        }

        const entry = {
            destinationUrl: cleanDestinationURL(rawDest),
            source: src,
            medium: med,
            campaign: cmp,
            content: cnt,
            term: trm,
            id_param: idVal,
            customParams: customPairs,
            namingSettings: { ...runtimeNamingSettings },
            generatedUrl: finalUrl
        };

        if (typeof UTMStorage !== 'undefined') {
            UTMStorage.saveToHistory(entry);
        }
    }

    function renderSavedHistory() {
        if (!containerSavedHistory || typeof UTMStorage === 'undefined') return;
        const history = UTMStorage.getHistory();

        if (!history || history.length === 0) {
            containerSavedHistory.innerHTML = `
                <div class="p-8 text-center text-brand-muted border border-dashed border-[#222] rounded-xl">
                    <p class="text-xs font-semibold">No campaign URLs yet.</p>
                    <p class="text-[10px] mt-1 text-brand-muted/70">URLs you copy will appear here for quick reuse.</p>
                </div>
            `;
            return;
        }

        containerSavedHistory.innerHTML = history.map(item => {
            const title = item.campaign || (item.source || item.medium ? `${item.source || 'Direct'} · ${item.medium || 'Custom'}` : 'Tracked Link');
            const platformSub = `${item.source ? (item.source.charAt(0).toUpperCase() + item.source.slice(1)) : 'Direct'} · ${item.medium || 'Custom'}${item.content ? ` · ${item.content}` : ''}`;
            const hostPath = formatHostPath(item.destinationUrl || item.generatedUrl);
            const timeAgo = formatRelativeTime(item.createdAt);

            return `
                <div class="p-4 rounded-xl bg-[#141414] border border-[#222] hover:border-[#333] transition-all flex flex-col gap-3 group" data-id="${item.id}">
                    <div class="flex items-start justify-between">
                        <div>
                            <h4 class="text-xs font-bold text-white uppercase tracking-wider">${title}</h4>
                            <p class="text-[11px] text-brand-green font-semibold mt-0.5">${escapeHtml(platformSub)}</p>
                            <p class="text-[11px] text-brand-muted font-mono truncate max-w-sm sm:max-w-md mt-1">${hostPath}</p>
                        </div>
                        <span class="text-[9px] font-mono uppercase tracking-widest text-brand-muted/70 bg-[#0D0D0D] px-2 py-1 rounded border border-[#222]">${timeAgo}</span>
                    </div>

                    <div class="pt-2 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between gap-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <button type="button" class="btn-history-use px-3 py-1.5 bg-brand-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:bg-brand-greenHover transition-colors cursor-pointer">
                                Use again
                            </button>
                            <button type="button" class="btn-history-copy px-3 py-1.5 bg-[#1F1F1F] text-white hover:text-brand-green font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer">
                                Copy URL
                            </button>
                            <button type="button" class="btn-history-template px-3 py-1.5 bg-[#1F1F1F] text-brand-muted hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer">
                                Save as template
                            </button>
                        </div>
                        <button type="button" class="btn-history-delete text-brand-muted hover:text-red-500 p-1.5 transition-colors cursor-pointer" aria-label="Delete history item">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach action events for history cards
        containerSavedHistory.querySelectorAll('.btn-history-use').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]');
                const item = history.find(h => h.id === card.dataset.id);
                if (item) applyHistoryItem(item);
            });
        });

        containerSavedHistory.querySelectorAll('.btn-history-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]');
                const item = history.find(h => h.id === card.dataset.id);
                if (item && item.generatedUrl) {
                    navigator.clipboard.writeText(item.generatedUrl).then(() => {
                        showToast('URL copied');
                    }).catch(() => showToast('Could not copy. Select and copy the URL manually.'));
                }
            });
        });

        containerSavedHistory.querySelectorAll('.btn-history-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]');
                const item = history.find(h => h.id === card.dataset.id);
                if (item) promptSaveAsTemplate(item);
            });
        });

        containerSavedHistory.querySelectorAll('.btn-history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]');
                UTMStorage.deleteHistoryItem(card.dataset.id);
                renderSavedHistory();
                showToast('Item removed');
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    function applyHistoryItem(item) {
        switchMode('advanced');

        // Restore clean destination URL (UTMs not duplicated inside dest)
        if (aDest) aDest.value = cleanDestinationURL(item.destinationUrl || '');
        if (aSource) aSource.value = item.source || '';
        if (aMedium) aMedium.value = item.medium || '';
        if (aCampaign) aCampaign.value = item.campaign || '';
        if (aContent) aContent.value = item.content || '';
        if (aTerm) aTerm.value = item.term || '';
        if (aId) aId.value = item.id_param || '';

        // Restore custom params
        if (customParamsContainer) {
            customParamsContainer.innerHTML = '';
            if (Array.isArray(item.customParams)) {
                item.customParams.forEach(cp => {
                    const row = document.createElement('div');
                    row.className = 'custom-pair-row flex gap-2 items-center';
                    row.innerHTML = `
                        <input type="text" class="custom-key w-1/3 bg-[#111] border border-[#222] focus:border-brand-green rounded-lg px-3 py-2 text-white outline-none text-xs font-mono" value="${cp.key || ''}">
                        <input type="text" class="custom-val flex-1 bg-[#111] border border-[#222] focus:border-brand-green rounded-lg px-3 py-2 text-white outline-none text-xs font-mono" value="${cp.value || ''}">
                        <button type="button" class="btn-remove-custom text-brand-muted hover:text-red-500 p-1 transition-colors cursor-pointer">
                            <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                        </button>
                    `;
                    customParamsContainer.appendChild(row);
                    row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateLiveURL));
                    row.querySelector('.btn-remove-custom').addEventListener('click', () => {
                        row.remove();
                        updateLiveURL();
                    });
                });
            }
        }

        // Restore naming settings
        if (item.namingSettings) {
            runtimeNamingSettings.casing = item.namingSettings.casing || 'lowercase';
            runtimeNamingSettings.separator = item.namingSettings.separator || 'underscore';
            syncNamingModalUI();
            saveNamingSettings();
        }

        updateLiveURL();
        closeSavedModal();
        showToast('Loaded into Advanced mode');
    }

    function renderSavedTemplates() {
        if (!containerSavedTemplates || typeof UTMStorage === 'undefined') return;
        const templates = UTMStorage.getTemplates();

        if (!templates || templates.length === 0) {
            containerSavedTemplates.innerHTML = `
                <div class="p-8 text-center text-brand-muted border border-dashed border-[#222] rounded-xl">
                    <p class="text-xs font-semibold">No templates yet.</p>
                    <p class="text-[10px] mt-1 text-brand-muted/70">Save a frequently used campaign setup to reuse it later.</p>
                </div>
            `;
            return;
        }

        containerSavedTemplates.innerHTML = templates.map(tpl => {
            const platformSub = `${tpl.source || 'Any Source'} · ${tpl.medium || 'Any Medium'}`;
            const settingsTag = `${tpl.namingSettings?.casing || 'lowercase'} · ${tpl.namingSettings?.separator || 'underscore'}`;

            return `
                <div class="p-4 rounded-xl bg-[#141414] border border-[#222] hover:border-[#333] transition-all flex flex-col gap-3 group" data-id="${escapeHtml(tpl.id)}">
                    <div class="flex items-start justify-between">
                        <div>
                            <h4 class="text-xs font-bold text-white uppercase tracking-wider">${escapeHtml(tpl.name)}</h4>
                            <p class="text-[11px] text-brand-green font-semibold mt-0.5">${escapeHtml(platformSub)}</p>
                            <p class="text-[10px] font-mono text-brand-muted/80 mt-1">${escapeHtml(settingsTag)}</p>
                        </div>
                    </div>

                    <div class="pt-2 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between gap-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <button type="button" class="btn-template-use px-3 py-1.5 bg-brand-green text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:bg-brand-greenHover transition-colors cursor-pointer">
                                Load preset
                            </button>
                            <button type="button" class="btn-template-update px-3 py-1.5 text-xs text-brand-green">Update from fields</button>
                            <button class="btn-template-bulk px-3 py-1.5 text-xs text-brand-green" type="button">Fill missing bulk fields</button>
                            <button type="button" class="btn-template-rename px-3 py-1.5 bg-[#1F1F1F] text-brand-muted hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer">
                                Rename
                            </button>
                        </div>
                        <button type="button" class="btn-template-delete text-brand-muted hover:text-red-500 p-1.5 transition-colors cursor-pointer" aria-label="Delete template">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        containerSavedTemplates.querySelectorAll('.btn-template-update').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.closest('[data-id]').dataset.id;
            if (!window.confirm('Update this saved preset using the current campaign fields?')) return;
            if (!UTMStorage.updateTemplate(id, currentPresetData())) return;
            renderSavedTemplates(); showToast('Preset updated');
        }));
        containerSavedTemplates.querySelectorAll('.btn-template-bulk').forEach(btn => btn.addEventListener('click', () => {
            const tpl = templates.find(t => t.id === btn.closest('[data-id]').dataset.id);
            for (const row of bulkRows) for (const key of ['source','medium','campaign','term','content']) {
                if (!row[key]?.trim()) row[key] = tpl[key] || '';
            }
            refreshBulkUrls(); closeSavedModal(); switchMode('bulk');
            showToast('Preset filled missing bulk fields; existing values preserved');
        }));
        // Attach action events for templates
        containerSavedTemplates.querySelectorAll('.btn-template-use').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]');
                const tpl = templates.find(t => t.id === card.dataset.id);
                if (tpl) applyTemplateItem(tpl);
            });
        });

        containerSavedTemplates.querySelectorAll('.btn-template-rename').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]');
                const tpl = templates.find(t => t.id === card.dataset.id);
                if (tpl) {
                    const newName = window.prompt('Enter new template name:', tpl.name);
                    if (newName && newName.trim()) {
                        if (!UTMStorage.renameTemplate(tpl.id, newName.trim())) return;
                        renderSavedTemplates();
                        showToast('Template renamed');
                    }
                }
            });
        });

        containerSavedTemplates.querySelectorAll('.btn-template-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]');
                if (!UTMStorage.deleteTemplate(card.dataset.id)) return;
                renderSavedTemplates();
                showToast('Template deleted');
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    function currentPresetData() {
        const guided = currentMode === 'guided';
        return {
            source: guided ? (selectedPlacementSource || activePreset?.source || '') : aSource.value,
            medium: guided ? (activePreset?.medium || '') : aMedium.value,
            campaign: (guided ? gCampaign : aCampaign).value,
            content: (guided ? gContent : aContent).value,
            term: (guided ? gTerm : aTerm).value
        };
    }

    function applyTemplateItem(tpl) {
        const current = currentPresetData();
        const changed = Object.keys(current).some(k => current[k] && current[k] !== (tpl[k] || ''));
        if (changed && !window.confirm('Replace the current campaign fields with this preset? Your landing URL and extra fields will stay unchanged. Cancel keeps your current work.')) return;
        const destination = currentMode === 'guided' ? gDest.value : aDest.value;
        // Avoid the existing mode switch synchronization overwriting advanced work.
        if (currentMode !== 'advanced') switchMode('advanced');
        aDest.value = destination;
        for (const [key, input] of Object.entries({source:aSource, medium:aMedium, campaign:aCampaign, content:aContent, term:aTerm})) input.value = tpl[key] || '';
        updateLiveURL();
        closeSavedModal();
        showToast('Campaign preset loaded; landing URL preserved');
    }

    function promptSaveAsTemplate(data) {
        pendingTemplateData = data;
        if (modalTemplateName && inputTemplateName) {
            inputTemplateName.value = data.campaign || data.name || (data.source ? `${data.source} Campaign` : '');
            modalTemplateName.classList.remove('hidden');
            inputTemplateName.focus();
        } else {
            const name = window.prompt('Enter template name:', data.campaign || 'Custom Template');
            if (name && name.trim()) {
                if (!UTMStorage.saveTemplate(name.trim(), data)) return;
                openSavedModal('templates');
                showToast('Template saved');
            }
        }
    }

    // ==========================================
    // EVENT LISTENERS SETUP
    // ==========================================
    function setupEventListeners() {
        // Mode buttons
        if (modes.guided) modes.guided.addEventListener('click', () => switchMode('guided'));
        if (modes.advanced) modes.advanced.addEventListener('click', () => switchMode('advanced'));
        if (modes.bulk) modes.bulk.addEventListener('click', () => switchMode('bulk'));
        if (modes.campaigns) modes.campaigns.addEventListener('click', () => switchMode('campaigns'));
        if (modes.checker) modes.checker.addEventListener('click', () => switchMode('checker'));

        // Guided inputs
        [gDest, gCampaign, gContent, gTerm].forEach(el => {
            if (el) el.addEventListener('input', () => {
                if (el === gDest) {
                    if (guidedDestError) guidedDestError.classList.add('hidden');
                    gDest.classList.remove('border-red-500');
                }
                updateLiveURL();
            });
        });

        // Advanced inputs
        [aDest, aSource, aMedium, aCampaign, aContent, aTerm, aId].forEach(el => {
            if (el) el.addEventListener('input', () => {
                if (el === aDest) {
                    if (advUrlError) advUrlError.classList.add('hidden');
                    aDest.classList.remove('border-red-500');
                } else if (el === aSource) {
                    if (advSourceError) advSourceError.classList.add('hidden');
                    aSource.classList.remove('border-red-500');
                } else if (el === aMedium) {
                    if (advMediumError) advMediumError.classList.add('hidden');
                    aMedium.classList.remove('border-red-500');
                }
                updateLiveURL();
            });
        });

        // Campaign Workspace Save & Edit controls
        if (btnSaveCampaign) {
            btnSaveCampaign.addEventListener('click', (e) => {
                e.preventDefault();
                saveCampaignFromWorkspace();
            });
        }

        if (btnCancelCampaignEdit) {
            btnCancelCampaignEdit.addEventListener('click', (e) => {
                e.preventDefault();
                cancelEditingCampaign();
            });
        }

        // Naming Settings Modal Events
        if (btnNamingSettings) {
            btnNamingSettings.addEventListener('click', (e) => {
                e.preventDefault();
                openNamingModal();
            });
        }

        if (btnCloseNamingSettings) btnCloseNamingSettings.addEventListener('click', closeNamingModal);
        if (btnCloseNamingSettingsBtn) btnCloseNamingSettingsBtn.addEventListener('click', closeNamingModal);

        if (modalNamingSettings) {
            modalNamingSettings.addEventListener('click', (e) => {
                if (e.target === modalNamingSettings) closeNamingModal();
            });
        }

        // Saved Modal Events
        if (btnOpenSaved) {
            btnOpenSaved.addEventListener('click', (e) => {
                e.preventDefault();
                openSavedModal('campaigns');
            });
        }

        if (btnCloseSaved) btnCloseSaved.addEventListener('click', closeSavedModal);

        if (modalSaved) {
            modalSaved.addEventListener('click', (e) => {
                if (e.target === modalSaved) closeSavedModal();
            });
        }

        if (tabSavedCampaigns) tabSavedCampaigns.addEventListener('click', () => switchSavedTab('campaigns'));
        if (tabSavedHistory) tabSavedHistory.addEventListener('click', () => switchSavedTab('history'));
        if (tabSavedTemplates) tabSavedTemplates.addEventListener('click', () => switchSavedTab('templates'));

        if (btnClearHistoryOnly) {
            btnClearHistoryOnly.addEventListener('click', () => {
                if (typeof UTMStorage !== 'undefined') {
                    UTMStorage.clearHistory();
                    renderSavedHistory();
                    showToast('History cleared');
                }
            });
        }

        // Live Sidebar "Save as template" Button
        if (btnSaveAsTemplate) {
            btnSaveAsTemplate.addEventListener('click', () => {
                const rawDest = currentMode === 'guided' ? (gDest ? gDest.value.trim() : '') : (aDest ? aDest.value.trim() : '');
                let src = '', med = '', cmp = '', cnt = '', trm = '', idVal = '';

                if (currentMode === 'guided') {
                    if (activePreset) {
                        src = selectedPlacementSource || activePreset.source || '';
                        med = activePreset.medium || '';
                    }
                    cmp = gCampaign ? gCampaign.value.trim() : '';
                    cnt = gContent ? gContent.value.trim() : '';
                    trm = gTerm ? gTerm.value.trim() : '';
                } else {
                    src = aSource ? aSource.value.trim() : '';
                    med = aMedium ? aMedium.value.trim() : '';
                    cmp = aCampaign ? aCampaign.value.trim() : '';
                    cnt = aContent ? aContent.value.trim() : '';
                    trm = aTerm ? aTerm.value.trim() : '';
                    idVal = aId ? aId.value.trim() : '';
                }

                const customPairs = [];
                if (currentMode === 'advanced' && customParamsContainer) {
                    customParamsContainer.querySelectorAll('.custom-pair-row').forEach(row => {
                        const kInput = row.querySelector('.custom-key');
                        const vInput = row.querySelector('.custom-val');
                        if (kInput && vInput && kInput.value.trim()) {
                            customPairs.push({ key: kInput.value.trim(), value: vInput.value.trim() });
                        }
                    });
                }

                promptSaveAsTemplate({
                    destinationUrl: cleanDestinationURL(rawDest),
                    source: src,
                    medium: med,
                    campaign: cmp,
                    content: cnt,
                    term: trm,
                    id_param: idVal,
                    customParams: customPairs,
                    namingSettings: { ...runtimeNamingSettings }
                });
            });
        }

        // Template Name Confirmation Modal
        if (btnCancelTemplateName) {
            btnCancelTemplateName.addEventListener('click', () => {
                if (modalTemplateName) modalTemplateName.classList.add('hidden');
                pendingTemplateData = null;
            });
        }

        if (btnConfirmTemplateName) {
            btnConfirmTemplateName.addEventListener('click', () => {
                const name = inputTemplateName ? inputTemplateName.value.trim() : '';
                if (name && pendingTemplateData) {
                    if (!UTMStorage.saveTemplate(name, pendingTemplateData)) return;
                    if (modalTemplateName) modalTemplateName.classList.add('hidden');
                    pendingTemplateData = null;
                    openSavedModal('templates');
                    showToast('Template Saved!');
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modalTemplateName && !modalTemplateName.classList.contains('hidden')) {
                    modalTemplateName.classList.add('hidden');
                    pendingTemplateData = null;
                } else if (modalSaved && !modalSaved.classList.contains('hidden')) {
                    closeSavedModal();
                } else if (modalNamingSettings && !modalNamingSettings.classList.contains('hidden')) {
                    closeNamingModal();
                } else if (modalBulkPaste && !modalBulkPaste.classList.contains('hidden')) {
                    closeBulkPasteModal();
                } else if (modalBulkCsv && !modalBulkCsv.classList.contains('hidden')) {
                    closeBulkCsvModal();
                } else if (modalBulkClear && !modalBulkClear.classList.contains('hidden')) {
                    closeBulkClearModal();
                } else if (modalBulkDetails && !modalBulkDetails.classList.contains('hidden')) {
                    closeBulkDetailsModal();
                } else if (modalQr && !modalQr.classList.contains('hidden')) {
                    closeQrModal();
                } else if (modalCampaign && !modalCampaign.classList.contains('hidden')) {
                    closeCampaignModalHandler();
                } else if (modalCampaignDelete && !modalCampaignDelete.classList.contains('hidden')) {
                    closeCampaignDeleteModalHandler();
                } else if (modalTrackingLink && !modalTrackingLink.classList.contains('hidden')) {
                    closeLinkModalHandler();
                } else if (modalLinkDelete && !modalLinkDelete.classList.contains('hidden')) {
                    closeLinkDeleteModalHandler();
                }
            }
        });

        // Naming Settings Radio Change
        document.querySelectorAll('input[name="opt-casing"]').forEach(r => {
            r.addEventListener('change', (e) => {
                runtimeNamingSettings.casing = e.target.value;
                saveNamingSettings();
                updateLiveURL();
                if (typeof refreshBulkUrls === 'function') refreshBulkUrls();
                if (typeof refreshCampaignsUI === 'function') refreshCampaignsUI();
            });
        });

        document.querySelectorAll('input[name="opt-separator"]').forEach(r => {
            r.addEventListener('change', (e) => {
                runtimeNamingSettings.separator = e.target.value;
                saveNamingSettings();
                updateLiveURL();
                if (typeof refreshBulkUrls === 'function') refreshBulkUrls();
                if (typeof refreshCampaignsUI === 'function') refreshCampaignsUI();
            });
        });

        if (btnResetNamingSettings) {
            btnResetNamingSettings.addEventListener('click', () => {
                runtimeNamingSettings = { ...DEFAULT_NAMING_SETTINGS };
                syncNamingModalUI();
                saveNamingSettings();
                updateLiveURL();
                if (typeof refreshBulkUrls === 'function') refreshBulkUrls();
                if (typeof refreshCampaignsUI === 'function') refreshCampaignsUI();
                showToast('Reset to recommended defaults');
            });
        }

        // Custom parameters (+ Add Pair)
        if (btnAddCustomParam) {
            btnAddCustomParam.addEventListener('click', () => {
                addCustomParamRow('', '');
            });
        }

        // Copy URL Action (Saves to History on copy)
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                const url = getValidCurrentUrl();
                if (!url || url === 'Enter a destination URL to begin...' || url === 'Invalid URL format') {
                    showToast('Enter a destination URL first');
                    const target = currentMode === 'guided' ? gDest : aDest;
                    if (target) {
                        target.focus();
                        target.classList.add('border-brand-green');
                        setTimeout(() => target.classList.remove('border-brand-green'), 1200);
                    }
                    return;
                }

                // Trigger History save
                saveCurrentToHistory();

                const onCopySuccess = () => {
                    window.groniqTrack?.('utm_url_copied', { mode: currentMode });
                    showToast('URL copied to clipboard!');
                    btnCopy.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-brand-green"></i> <span class="text-brand-green font-extrabold">Copied!</span>';
                    if (window.lucide && typeof window.lucide.createIcons === 'function') lucide.createIcons();
                    setTimeout(() => {
                        btnCopy.innerHTML = '<i data-lucide="copy" class="w-4 h-4 pointer-events-none"></i> <span class="pointer-events-none">Copy URL</span>';
                        if (window.lucide && typeof window.lucide.createIcons === 'function') lucide.createIcons();
                    }, 1800);
                };

                const doFallbackCopy = (text) => {
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.focus();
                        ta.select();
                        const copied = document.execCommand('copy');
                        document.body.removeChild(ta);
                        if (copied) onCopySuccess();
                        else showToast('Could not copy. Select and copy the URL manually.');
                    } catch (e) {
                        showToast('Couldn’t copy URL');
                    }
                };

                const clip = (typeof window !== 'undefined' && window.navigator && window.navigator.clipboard) ? window.navigator.clipboard : (typeof navigator !== 'undefined' ? navigator.clipboard : null);
                if (clip && typeof clip.writeText === 'function') {
                    clip.writeText(url).then(onCopySuccess).catch(() => {
                        doFallbackCopy(url);
                    });
                } else {
                    doFallbackCopy(url);
                }
            });
        }

        // Share Controls Listeners
        if (btnOpenUrl) {
            btnOpenUrl.addEventListener('click', (e) => {
                e.preventDefault();
                const url = getValidCurrentUrl();
                if (url) {
                    openUrlInNewTab(url);
                } else {
                    showToast('Enter a destination URL first');
                    const target = currentMode === 'guided' ? gDest : aDest;
                    if (target) {
                        target.focus();
                        target.classList.add('border-brand-green');
                        setTimeout(() => target.classList.remove('border-brand-green'), 1200);
                    }
                }
            });
        }

        if (btnShowQr) {
            btnShowQr.addEventListener('click', (e) => {
                e.preventDefault();
                const url = getValidCurrentUrl();
                if (url) {
                    openQrModal();
                } else {
                    showToast('Enter a destination URL first');
                    const target = currentMode === 'guided' ? gDest : aDest;
                    if (target) {
                        target.focus();
                        target.classList.add('border-brand-green');
                        setTimeout(() => target.classList.remove('border-brand-green'), 1200);
                    }
                }
            });
        }

        // Quick sample URL chips
        document.querySelectorAll('.btn-sample-url').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const sampleUrl = btn.dataset.url;
                if (gDest) gDest.value = sampleUrl;
                if (aDest) aDest.value = sampleUrl;
                if (!activePreset && typeof selectPreset === 'function') {
                    selectPreset('google_search');
                }
                if (gCampaign && !gCampaign.value) gCampaign.value = 'Summer Promo';
                if (aCampaign && !aCampaign.value) aCampaign.value = 'Summer Promo';
                updateLiveURL();
                showToast('Sample campaign loaded');
            });
        });

        if (btnCloseQrModal) btnCloseQrModal.addEventListener('click', closeQrModal);
        if (btnCloseQr) btnCloseQr.addEventListener('click', closeQrModal);

        if (modalQr) {
            modalQr.classList.add('hidden');
            modalQr.style.display = 'none';
            modalQr.addEventListener('click', (e) => {
                if (e.target === modalQr) closeQrModal();
            });
        }

        if (btnDownloadQr) {
            btnDownloadQr.addEventListener('click', downloadQrPng);
        }

        if (btnDownloadQrSvg) {
            btnDownloadQrSvg.addEventListener('click', downloadQrSvg);
        }

        if (btnShareWhatsapp) {
            btnShareWhatsapp.addEventListener('click', shareQrWhatsApp);
        }

        if (btnShareEmail) {
            btnShareEmail.addEventListener('click', shareQrEmail);
        }

        if (btnShareNative) {
            btnShareNative.addEventListener('click', shareQrNative);
        }

        if (qrSizeSelector) {
            qrSizeSelector.addEventListener('click', (e) => {
                const btn = e.target.closest('.qr-size-btn');
                if (!btn) return;
                selectedQrSize = parseInt(btn.dataset.qrSize, 10) || 1024;
                qrSizeSelector.querySelectorAll('.qr-size-btn').forEach(b => {
                    b.classList.remove('active', 'bg-brand-green/10', 'border-brand-green/30', 'text-brand-green');
                    b.classList.add('bg-[#141414]', 'border-[#262626]', 'text-brand-muted');
                });
                btn.classList.add('active', 'bg-brand-green/10', 'border-brand-green/30', 'text-brand-green');
                btn.classList.remove('bg-[#141414]', 'border-[#262626]', 'text-brand-muted');

                const resLabel = document.getElementById('qr-resolution-label');
                if (resLabel) {
                    const labelText = selectedQrSize === 2048 ? '2048px Print' : (selectedQrSize === 1024 ? '1024px HD' : '512px PNG');
                    resLabel.textContent = labelText;
                }
            });
        }

        if (btnCopyQrUrl) {
            btnCopyQrUrl.addEventListener('click', () => {
                const url = (activeQrContext && activeQrContext.url) ? activeQrContext.url : getValidCurrentUrl();
                if (url) {
                    if (activeQrContext && activeQrContext.campaignId && activeQrContext.linkId) {
                        const campaigns = (typeof UTMStorage !== 'undefined' && typeof UTMStorage.getCampaigns === 'function') 
                            ? UTMStorage.getCampaigns() 
                            : [];
                        const c = campaigns.find(x => x.id === activeQrContext.campaignId);
                        const l = c ? (c.links || []).find(link => link.id === activeQrContext.linkId) : null;
                        if (c && l) {
                            UTMStorage.saveToHistory({
                                destinationUrl: l.destinationUrl,
                                source: normalizeTrackingValue(l.source),
                                medium: normalizeTrackingValue(l.medium),
                                campaign: normalizeTrackingValue(c.name),
                                content: normalizeTrackingValue(l.content),
                                term: normalizeTrackingValue(l.term),
                                id_param: normalizeTrackingValue(c.campaignId),
                                namingSettings: { ...runtimeNamingSettings },
                                generatedUrl: url
                            });
                            renderSavedHistory();
                        }
                    } else {
                        saveCurrentToHistory();
                    }
                    const clip = (typeof window !== 'undefined' && window.navigator && window.navigator.clipboard) ? window.navigator.clipboard : (typeof navigator !== 'undefined' ? navigator.clipboard : null);
                    if (clip && typeof clip.writeText === 'function') {
                        clip.writeText(url).then(() => {
                            showToast('URL copied');
                        }).catch(() => {
                            if (!fallbackCopy(url)) return;
                            showToast('URL copied');
                        });
                    } else {
                        if (!fallbackCopy(url)) return;
                        showToast('URL copied');
                    }
                }
            });
        }

        // Reset Action
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                cancelEditingCampaign();
                clearAllInlineErrors();
                if (gDest) gDest.value = '';
                if (gCampaign) gCampaign.value = '';
                if (gContent) gContent.value = '';
                if (gTerm) gTerm.value = '';
                if (aDest) aDest.value = '';
                if (aSource) aSource.value = '';
                if (aMedium) aMedium.value = '';
                if (aCampaign) aCampaign.value = '';
                if (aContent) aContent.value = '';
                if (aTerm) aTerm.value = '';
                if (aId) aId.value = '';
                if (customParamsContainer) customParamsContainer.innerHTML = '';
                activePreset = null;
                selectedPlacementSource = null;
                initPresets();
                if (dynamicPlacementContainer) {
                    dynamicPlacementContainer.classList.add('hidden');
                    dynamicPlacementContainer.innerHTML = '';
                }
                if (urlWarning) urlWarning.classList.add('hidden');
                if (gCampaignPreviewContainer) gCampaignPreviewContainer.classList.add('hidden');
                updateLiveURL();
                showToast('Reset complete');
            });
        }

        // Checker Trigger
        if (checkerParseBtn) checkerParseBtn.addEventListener('click', parseCheckerURL);
        if (checkerInput) {
            checkerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    parseCheckerURL();
                }
            });
        }
    }

    // ==========================================
    // CHECKER ENGINE
    // ==========================================
    function parseCheckerURL() {
        if (!checkerInput || !checkerError || !checkerErrorMsg || !checkerResults) return;

        const rawInput = checkerInput.value.trim();

        // Reset display
        checkerError.classList.add('hidden');

        if (!rawInput) {
            checkerErrorMsg.innerText = 'Enter a URL to check.';
            checkerError.classList.remove('hidden');
            checkerResults.classList.add('hidden');
            return;
        }

        let urlString = rawInput;
        if (!/^https?:\/\//i.test(urlString)) {
            urlString = 'https://' + urlString;
        }

        let urlObj;
        try {
            urlObj = parseDestination(rawInput);
            if (!urlObj.hostname || (!urlObj.hostname.includes('.') && urlObj.hostname !== 'localhost' && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname))) {
                throw new Error('Invalid domain name');
            }
        } catch (e) {
            checkerErrorMsg.innerText = 'Enter a valid destination URL (e.g. https://example.com/landing-page).';
            checkerError.classList.remove('hidden');
            checkerResults.classList.add('hidden');
            return;
        }

        const allParams = Object.create(null);
        urlObj.searchParams.forEach((value, key) => {
            (allParams[key] ||= []).push(value);
        });

        // Separate Tracking vs Other parameters (Checker DOES NOT mutate with Naming Settings)
        const trackingParams = Object.create(null);
        const otherParams = Object.create(null);

        Object.keys(allParams).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (STANDARD_UTM_KEYS.includes(lowerKey)) {
                if (!trackingParams[lowerKey]) trackingParams[lowerKey] = [];
                trackingParams[lowerKey].push(...allParams[key]);
            } else {
                if (!otherParams[key]) otherParams[key] = [];
                otherParams[key].push(...allParams[key]);
            }
        });

        // Status analysis (PASS, WARNING, ERROR, SUGGESTION)
        const statusItems = [];

        // Check missing required tracking
        ['utm_source', 'utm_medium', 'utm_campaign'].forEach(reqKey => {
            const vals = trackingParams[reqKey];
            if (!vals || vals.length === 0) {
                let msg = `${reqKey} is missing.`;
                if (reqKey === 'utm_source') msg = 'Campaign source is missing. utm_source helps identify where traffic comes from.';
                if (reqKey === 'utm_medium') msg = 'Campaign medium is missing. utm_medium helps identify the marketing channel.';
                if (reqKey === 'utm_campaign') msg = 'Campaign name is missing. utm_campaign helps identify the campaign this traffic belongs to.';
                statusItems.push({
                    type: 'WARNING',
                    key: reqKey,
                    message: msg
                });
            }
        });

        // Analyze tracking parameters
        Object.keys(trackingParams).forEach(key => {
            const vals = trackingParams[key];

            // Duplicate detection (ERROR)
            if (vals.length > 1) {
                statusItems.push({
                    type: 'ERROR',
                    key: key,
                    message: `Duplicate campaign parameter: More than one ${key} parameter was found.`
                });
            }

            vals.forEach(val => {
                if (!val) {
                    statusItems.push({
                        type: 'WARNING',
                        key: key,
                        message: `Empty value detected for parameter "${key}".`
                    });
                } else {
                    if (/\s/.test(val)) {
                        statusItems.push({
                            type: 'WARNING',
                            key: key,
                            message: `Parameter "${key}" value "${val}" contains spaces. Standardize by replacing spaces with underscores or hyphens.`
                        });
                    }
                    if (/[A-Z]/.test(val)) {
                        statusItems.push({
                            type: 'SUGGESTION',
                            key: key,
                            message: `Parameter "${key}" value "${val}" contains uppercase letters. A consistent naming convention can make campaign reporting easier to manage.`
                        });
                    }
                }
            });
        });

        // Overall PASS check
        const hasSource = trackingParams['utm_source'] && trackingParams['utm_source'].length > 0;
        const hasMedium = trackingParams['utm_medium'] && trackingParams['utm_medium'].length > 0;
        const hasCampaign = trackingParams['utm_campaign'] && trackingParams['utm_campaign'].length > 0;
        const hasDuplicates = Object.values(trackingParams).some(vals => vals.length > 1);

        if (hasSource && hasMedium && hasCampaign && !hasDuplicates) {
            statusItems.unshift({
                type: 'PASS',
                message: 'Campaign parameters verified. utm_source, utm_medium, and utm_campaign are present with no duplicate keys.'
            });
        }

        // Render Results HTML
        const destDisplay = urlObj.hostname + (urlObj.pathname === '/' ? '' : urlObj.pathname);
        const infoMap = {
            'utm_source': { title: 'Campaign Source', desc: 'Identifies where the traffic comes from.', example: 'utm_source=google' },
            'utm_medium': { title: 'Campaign Medium', desc: 'Identifies the marketing channel or traffic type.', example: 'utm_medium=cpc' },
            'utm_campaign': { title: 'Campaign Name', desc: 'Identifies the campaign this traffic belongs to.', example: 'utm_campaign=summer_launch_2026' },
            'utm_content': { title: 'Campaign Content', desc: 'Distinguish creatives, ads, links, or variations.', example: 'utm_content=video_ad_01' },
            'utm_term': { title: 'Campaign Term', desc: 'Optionally identify a keyword, audience, or targeting detail.', example: 'utm_term=search_keyword' },
            'utm_id': { title: 'Campaign ID', desc: 'Optionally store an internal or platform campaign identifier.', example: 'utm_id=CMP-001' }
        };

        const infoIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;

        let html = '';

        // 1. Destination
        html += `
            <div class="bg-[#141414] p-4 sm:p-5 rounded-xl border border-[#222]">
                <span class="text-[10px] font-bold uppercase tracking-widest text-brand-green block mb-1">Destination</span>
                <span class="font-mono text-sm text-white break-all font-bold">${destDisplay}</span>
                ${urlObj.hash ? `<span class="block text-xs font-mono text-brand-muted mt-1">Hash/Fragment: ${urlObj.hash}</span>` : ''}
            </div>
        `;

        // 2. Status system
        if (statusItems.length > 0) {
            html += `<div class="space-y-2">`;
            statusItems.forEach(item => {
                let badgeStyle = '';
                if (item.type === 'ERROR') badgeStyle = 'bg-red-950/40 text-red-400 border-red-900/50';
                else if (item.type === 'WARNING') badgeStyle = 'bg-yellow-950/40 text-yellow-400 border-yellow-900/50';
                else if (item.type === 'SUGGESTION') badgeStyle = 'bg-blue-950/40 text-blue-400 border-blue-900/50';
                else if (item.type === 'PASS') badgeStyle = 'bg-brand-green/10 text-brand-green border-brand-green/20';

                html += `
                    <div class="p-3 rounded-xl border text-xs flex items-start gap-2.5 ${badgeStyle}">
                        <span class="font-mono font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/40 border border-current shrink-0 mt-0.5">${item.type}</span>
                        <span class="leading-relaxed">${escapeHtml(item.message)}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // 3. Tracking parameters
        html += `
            <div>
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-3">Tracking Parameters</h3>
        `;

        const trackingKeysPresent = Object.keys(trackingParams);
        if (trackingKeysPresent.length === 0) {
            html += `<p class="text-xs text-brand-muted italic">No standard UTM parameters detected in this URL.</p>`;
        } else {
            html += `<div class="space-y-3">`;
            trackingKeysPresent.forEach(key => {
                const vals = trackingParams[key];
                const isDup = vals.length > 1;
                const info = infoMap[key] || { title: key, desc: `Parameter: ${key}`, example: `${key}=value` };

                html += `
                    <div class="p-4 rounded-xl bg-[#141414] border ${isDup ? 'border-red-900/60' : 'border-[#222]'} font-mono text-xs">
                        <div class="flex items-center justify-between mb-1.5">
                            <div class="flex items-center gap-2">
                                <span class="text-white font-bold">${info.title || key}</span>
                                <button type="button" aria-label="Learn about ${key}" class="info-btn text-brand-muted hover:text-white transition-colors p-1 cursor-pointer" data-param="${key.replace('utm_', '')}" data-title="${info.title || key}" data-desc="${info.desc}" data-example="${info.example}">
                                    ${infoIconSvg}
                                </button>
                            </div>
                            <span class="text-[10px] text-brand-muted font-mono">${escapeHtml(key)}</span>
                        </div>
                        ${vals.map(v => `
                            <div class="text-brand-green font-bold text-sm break-all ${isDup ? 'bg-red-950/30 p-2 rounded border border-red-900/40 my-1 text-red-300' : ''}">${escapeHtml(v) || '<span class="text-yellow-500 italic">(empty)</span>'}</div>
                        `).join('')}
                    </div>
                `;
            });
            html += `</div>`;
        }
        html += `</div>`;

        // 4. Other parameters
        const otherKeysPresent = Object.keys(otherParams);
        if (otherKeysPresent.length > 0) {
            html += `
                <div>
                    <h3 class="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-3">Other Parameters</h3>
                    <div class="space-y-2">
            `;
            otherKeysPresent.forEach(key => {
                const vals = otherParams[key];
                vals.forEach(v => {
                    html += `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#222] font-mono text-xs">
                            <span class="text-brand-muted font-bold">${escapeHtml(key)}</span>
                            <span class="text-white break-all ml-4 font-bold bg-[#1E1E1E] px-2.5 py-1 rounded">${escapeHtml(v)}</span>
                        </div>
                    `;
                });
            });
            html += `
                    </div>
                </div>
            `;
        }

        // 5. Actions: Edit in Advanced & Copy Inspected URL
        html += `
            <div class="pt-4 flex flex-col sm:flex-row gap-3 border-t border-[#1C1C1C]">
                <button id="checker-edit-btn" class="flex-1 py-3 bg-brand-green text-black font-extrabold uppercase tracking-wider text-xs rounded-xl hover:bg-brand-greenHover transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <i data-lucide="sliders" class="w-4 h-4 pointer-events-none"></i>
                    <span class="pointer-events-none">Edit in Advanced</span>
                </button>
                <button id="checker-copy-btn" class="py-3 px-5 bg-[#141414] hover:bg-[#1E1E1E] text-white font-bold uppercase tracking-wider text-xs rounded-xl border border-[#2A2A2A] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <i data-lucide="copy" class="w-4 h-4 pointer-events-none"></i>
                    <span class="pointer-events-none">Copy Inspected URL</span>
                </button>
            </div>
        `;

        checkerResults.innerHTML = html;
        checkerResults.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();

        // 1. Edit in Advanced Action
        const editBtn = document.getElementById('checker-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                switchMode('advanced');

                // Reconstruct destination URL with non-UTM query params and hash intact, but UTMs removed
                let cleanDest = urlObj.origin + urlObj.pathname;
                if (otherKeysPresent.length > 0) {
                    const otherSearchParams = new URLSearchParams();
                    otherKeysPresent.forEach(k => {
                        otherParams[k].forEach(v => otherSearchParams.append(k, v));
                    });
                    cleanDest += '?' + otherSearchParams.toString();
                }
                if (urlObj.hash) {
                    cleanDest += urlObj.hash;
                }

                if (aDest) aDest.value = cleanDest;
                if (aSource) aSource.value = (trackingParams['utm_source'] && trackingParams['utm_source'][0]) || '';
                if (aMedium) aMedium.value = (trackingParams['utm_medium'] && trackingParams['utm_medium'][0]) || '';
                if (aCampaign) aCampaign.value = (trackingParams['utm_campaign'] && trackingParams['utm_campaign'][0]) || '';
                if (aContent) aContent.value = (trackingParams['utm_content'] && trackingParams['utm_content'][0]) || '';
                if (aTerm) aTerm.value = (trackingParams['utm_term'] && trackingParams['utm_term'][0]) || '';
                if (aId) aId.value = (trackingParams['utm_id'] && trackingParams['utm_id'][0]) || '';

                updateLiveURL();
                showToast('Loaded into Advanced mode');
            });
        }

        // 2. Copy Inspected URL Action
        const copyInspectedBtn = document.getElementById('checker-copy-btn');
        if (copyInspectedBtn) {
            copyInspectedBtn.addEventListener('click', () => {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText(rawInput).then(() => {
                        showToast('URL copied');
                    }).catch(() => { if (fallbackCopy(rawInput)) showToast('URL copied'); });
                } else {
                    if (fallbackCopy(rawInput)) showToast('URL copied');
                }
            });
        }
    }

    // ==========================================
    // INFO POPOVER SYSTEM
    // ==========================================
    let currentPopover = null;

    function closePopover() {
        if (currentPopover) {
            currentPopover.remove();
            currentPopover = null;
        }
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.info-btn');
        if (btn) {
            e.stopPropagation();
            closePopover();

            const title = btn.dataset.title;
            const desc = btn.dataset.desc;
            const example = btn.dataset.example;
            const param = btn.dataset.param;

            const popover = document.createElement('div');
            popover.id = 'info-popover';
            popover.className = 'absolute z-50 right-0 top-6 w-64 bg-[#111] border border-[#333] shadow-2xl rounded-xl p-4 text-left';
            popover.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">${title}</h4>
                    <button type="button" class="text-brand-muted hover:text-white popover-close p-1 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <p class="text-[11px] text-[#A3A3A3] mb-3 leading-relaxed">${desc}</p>
                <div class="bg-[#0A0A0A] border border-[#222] rounded-md p-2 mb-3">
                    <span class="text-[10px] font-mono text-brand-green">${example}</span>
                </div>
                <a href="/learn/utm-tracking/#${param}" target="_blank" class="text-[10px] font-bold text-white hover:text-brand-green uppercase tracking-widest inline-flex items-center gap-1 transition-colors">
                    Learn more <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
            `;

            btn.parentElement.appendChild(popover);
            currentPopover = popover;

            popover.querySelector('.popover-close').addEventListener('click', (ev) => {
                ev.stopPropagation();
                closePopover();
            });
        } else if (!e.target.closest('#info-popover')) {
            closePopover();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopover();
    });

    // ==========================================
    // BULK UTM BUILDER MODULE
    // ==========================================
    function createEmptyBulkRow(overrides = {}) {
        const id = 'brow_' + Date.now() + '_' + (bulkRowSeq++);
        return {
            id,
            destinationUrl: '',
            source: '',
            medium: '',
            campaign: '',
            content: '',
            term: '',
            campaignId: '',
            sourcePlatform: '',
            creativeFormat: '',
            marketingTactic: '',
            generatedUrl: '',
            isValid: false,
            firstError: 'Enter a valid destination URL.',
            ...overrides
        };
    }

    function evaluateBulkRow(row) {
        const rawDest = (row.destinationUrl || '').trim();
        const rawSrc = (row.source || '').trim();
        const rawMed = (row.medium || '').trim();
        const rawCmp = (row.campaign || '').trim();

        let firstError = null;

        row.warnings = [];
        let destination;
        try { destination = parseDestination(rawDest); } catch (e) { firstError = e.message; }
        for (const [key, raw, label] of [['source',rawSrc,'source'], ['medium',rawMed,'medium'], ['campaign',rawCmp,'name']]) {
            const existing = destination && [...destination.searchParams].some(([k,v]) => k.toLowerCase() === 'utm_' + key && v.trim());
            if (!firstError && !raw && !(document.getElementById('bulk-conflict-policy')?.value === 'keep' && existing)) firstError = 'Campaign ' + label + ' is required.';
        }

        if (firstError) {
            row.isValid = false;
            row.generatedUrl = '';
            row.firstError = firstError;
            return row;
        }

        const utmParams = {
            utm_source: normalizeTrackingValue(row.source),
            utm_medium: normalizeTrackingValue(row.medium),
            utm_campaign: normalizeTrackingValue(row.campaign),
            utm_content: normalizeTrackingValue(row.content),
            utm_term: normalizeTrackingValue(row.term),
            utm_id: normalizeTrackingValue(row.campaignId),
            utm_source_platform: normalizeTrackingValue(row.sourcePlatform),
            utm_creative_format: normalizeTrackingValue(row.creativeFormat),
            utm_marketing_tactic: normalizeTrackingValue(row.marketingTactic)
        };

        const res = buildCanonicalURL(row.destinationUrl, utmParams, row.customParams || [], document.getElementById('bulk-conflict-policy')?.value || 'replace');
        if (res.error) {
            row.isValid = false;
            row.generatedUrl = '';
            row.firstError = res.message;
        } else {
            row.isValid = true;
            row.generatedUrl = res.url;
            row.warnings = res.warnings;
            row.firstError = null;
        }
        return row;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeCsvCell(val) {
        if (val === null || val === undefined) return '';
        let str = String(val);
        // Formula injection protection: if starts with =, +, -, @, prepend '
        if (/^[=\+\-@]/.test(str)) {
            str = "'" + str;
        }
        str = str.replace(/"/g, '""');
        if (/[",\r\n]/.test(str)) {
            str = `"${str}"`;
        }
        return str;
    }

    function fallbackCopy(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(ta);
            if (!copied) throw new Error('Copy failed');
            return true;
        } catch (e) { showToast('Could not copy. Select and copy the URL manually.'); return false; }
    }

    function renderRowResultCell(row) {
        const status = row.isValid ? (row.warnings?.length ? 'Warning' : 'Valid') : 'Invalid';
        return `<div class="text-xs break-all whitespace-normal"><strong class="${row.isValid && !row.warnings?.length ? 'text-brand-green' : 'text-amber-400'}">${status}</strong><p>${escapeHtml(row.generatedUrl || row.firstError)}</p>${(row.warnings || []).map(w => `<p class="text-amber-400 mt-2">${escapeHtml(w)}</p>`).join('')}</div>`;
    }

    function renderMobileCardResult(row) {
        if (row.isValid && row.generatedUrl) {
            return `
                <div class="space-y-2">
                    ${renderRowResultCell(row)}
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" class="btn-bulk-row-copy py-2 bg-white text-black font-extrabold uppercase tracking-wider text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer" data-id="${row.id}">
                            <i data-lucide="copy" class="w-3.5 h-3.5 pointer-events-none"></i>
                            <span class="pointer-events-none">Copy</span>
                        </button>
                        <button type="button" class="btn-bulk-row-open py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-brand-green/40 font-bold uppercase tracking-wider text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer" data-id="${row.id}">
                            <i data-lucide="external-link" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                            <span class="pointer-events-none">Open</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-400 text-xs flex items-center gap-2">
                    <i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i>
                    <span>Invalid: ${escapeHtml(row.firstError || 'Incomplete row')}</span>
                </div>
            `;
        }
    }

    function updateBulkSummary() {
        const total = bulkRows.length;
        const ready = bulkRows.filter(r => r.isValid).length;
        const attention = total - ready;

        if (bulkSummaryCounts) {
            const warnings = bulkRows.filter(r => r.isValid && r.warnings?.length).length;
            const excluded = bulkRows.flatMap((r, i) => r.isValid ? [] : [i + 1]);
            bulkSummaryCounts.textContent = `${total} rows  -  ${ready} valid (${warnings} with warnings)  -  ${attention} invalid. CSV includes every row with its status. Copy includes valid URLs only.${excluded.length ? ' Copy excludes rows: ' + excluded.join(', ') + '.' : ''}`;
        }

        if (bulkNamingLabel) {
            bulkNamingLabel.textContent = `Naming: ${runtimeNamingSettings.casing}, ${runtimeNamingSettings.separator}`;
        }
    }

    function renderBulkRows() {
        window.bulkRows = bulkRows;
        if (bulkTableBody) {
            bulkTableBody.innerHTML = bulkRows.map((row, idx) => `
                <tr data-row-id="${row.id}" class="hover:bg-[#111] transition-colors border-b border-[#1A1A1A]">
                    <td class="p-3 text-center text-brand-muted font-mono text-[11px]">${idx + 1}</td>
                    <td class="p-2">
                        <input type="text" data-field="destinationUrl" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="https://example.com/landing-page" value="${escapeHtml(row.destinationUrl)}">
                    </td>
                    <td class="p-2">
                        <input type="text" data-field="source" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. google" value="${escapeHtml(row.source)}">
                    </td>
                    <td class="p-2">
                        <input type="text" data-field="medium" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. cpc" value="${escapeHtml(row.medium)}">
                    </td>
                    <td class="p-2">
                        <input type="text" data-field="campaign" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. Summer Launch 2026" value="${escapeHtml(row.campaign)}">
                    </td>
                    <td class="p-2">
                        <input type="text" data-field="content" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. Video Ad 01" value="${escapeHtml(row.content)}">
                    </td>
                    <td class="p-2">
                        <input type="text" data-field="term" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. Search Keyword" value="${escapeHtml(row.term)}">
                    </td>
                    <td class="p-3 bulk-result-cell min-w-[200px]">
                        ${renderRowResultCell(row)}
                    </td>
                    <td class="p-2 text-right pr-3 whitespace-nowrap">
                        <button type="button" class="btn-bulk-row-copy p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" data-id="${row.id}" title="Copy URL" aria-label="Copy URL" ${row.isValid ? '' : 'disabled style="opacity:0.35;cursor:not-allowed;"'}>
                            <i data-lucide="copy" class="w-3.5 h-3.5 pointer-events-none"></i>
                        </button>
                        <button type="button" class="btn-bulk-row-open p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" data-id="${row.id}" title="Open URL" aria-label="Open URL" ${row.isValid ? '' : 'disabled style="opacity:0.35;cursor:not-allowed;"'}>
                            <i data-lucide="external-link" class="w-3.5 h-3.5 pointer-events-none"></i>
                        </button>
                        <button type="button" class="btn-bulk-row-dup p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" data-id="${row.id}" title="Duplicate row" aria-label="Duplicate row">
                            <i data-lucide="copy-plus" class="w-3.5 h-3.5 pointer-events-none"></i>
                        </button>
                        <button type="button" class="btn-bulk-row-details p-1 text-brand-muted hover:text-brand-green transition-colors cursor-pointer" data-id="${row.id}" title="More fields" aria-label="More fields">
                            <i data-lucide="sliders" class="w-3.5 h-3.5 pointer-events-none"></i>
                        </button>
                        <button type="button" class="btn-bulk-row-del p-1 text-red-500/70 hover:text-red-400 transition-colors cursor-pointer" data-id="${row.id}" title="Delete row" aria-label="Delete row">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        if (bulkMobileContainer) {
            bulkMobileContainer.innerHTML = bulkRows.map((row, idx) => `
                <div data-row-id="${row.id}" class="p-4 rounded-xl bg-[#111] border border-[#222] space-y-3 bulk-mobile-card">
                    <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-2">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-white text-xs">Row ${idx + 1}</span>
                            ${row.isValid 
                                ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green border border-brand-green/20">Ready</span>' 
                                : '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">Needs attention</span>'}
                        </div>
                        <div class="flex items-center gap-1">
                            <button type="button" class="btn-bulk-row-dup p-1.5 text-brand-muted hover:text-white transition-colors cursor-pointer" data-id="${row.id}" title="Duplicate row" aria-label="Duplicate row">
                                <i data-lucide="copy-plus" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                            <button type="button" class="btn-bulk-row-del p-1.5 text-red-500/70 hover:text-red-400 transition-colors cursor-pointer" data-id="${row.id}" title="Delete row" aria-label="Delete row">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Destination URL *</label>
                        <input type="text" data-field="destinationUrl" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="https://example.com/landing-page" value="${escapeHtml(row.destinationUrl)}">
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Source *</label>
                            <input type="text" data-field="source" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. google" value="${escapeHtml(row.source)}">
                        </div>
                        <div>
                            <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Medium *</label>
                            <input type="text" data-field="medium" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. cpc" value="${escapeHtml(row.medium)}">
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Campaign *</label>
                        <input type="text" data-field="campaign" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. Summer Launch 2026" value="${escapeHtml(row.campaign)}">
                    </div>

                    <details class="group pt-1">
                        <summary class="text-[11px] font-bold text-brand-muted hover:text-white cursor-pointer list-none flex items-center gap-1.5">
                            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-brand-green group-open:rotate-90 transition-transform"></i>
                            <span>Optional details</span>
                        </summary>
                        <div class="pt-2 space-y-2 border-t border-[#1C1C1C] mt-2">
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Content</label>
                                <input type="text" data-field="content" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. Video Ad 01" value="${escapeHtml(row.content)}">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Term</label>
                                <input type="text" data-field="term" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-lg px-2.5 py-1.5 text-white outline-none text-xs font-mono" placeholder="e.g. Search Keyword" value="${escapeHtml(row.term)}">
                            </div>
                            <button type="button" class="btn-bulk-row-details text-[10px] font-bold uppercase tracking-wider text-brand-green hover:underline flex items-center gap-1 mt-1 cursor-pointer" data-id="${row.id}">
                                <i data-lucide="sliders" class="w-3 h-3"></i> More fields...
                            </button>
                        </div>
                    </details>

                    <div class="bulk-mobile-result-box pt-2 border-t border-[#1C1C1C]">
                        ${renderMobileCardResult(row)}
                    </div>
                </div>
            `).join('');
        }

        updateBulkSummary();
        for (const host of [bulkTableBody, bulkMobileContainer]) host?.querySelectorAll('[data-field]').forEach(input => {
            input.setAttribute('aria-label', input.dataset.field);
        });
        if (window.lucide) lucide.createIcons();
    }

    function addBulkRow() {
        const newRow = createEmptyBulkRow();
        bulkRows.push(evaluateBulkRow(newRow));
        renderBulkRows();

        // Focus destination input of new row
        setTimeout(() => {
            const tableInput = bulkTableBody ? bulkTableBody.querySelector(`tr[data-row-id="${newRow.id}"] input[data-field="destinationUrl"]`) : null;
            if (tableInput && window.innerWidth >= 1024) {
                tableInput.focus();
            } else if (bulkMobileContainer) {
                const mobileInput = bulkMobileContainer.querySelector(`[data-row-id="${newRow.id}"] input[data-field="destinationUrl"]`);
                if (mobileInput) mobileInput.focus();
            }
        }, 50);
    }

    function duplicateBulkRow(rowId) {
        const idx = bulkRows.findIndex(r => r.id === rowId);
        if (idx === -1) return;

        const orig = bulkRows[idx];
        const clone = createEmptyBulkRow({
            destinationUrl: orig.destinationUrl,
            source: orig.source,
            medium: orig.medium,
            campaign: orig.campaign,
            content: orig.content,
            term: orig.term,
            campaignId: orig.campaignId,
            sourcePlatform: orig.sourcePlatform,
            creativeFormat: orig.creativeFormat,
            marketingTactic: orig.marketingTactic
        });

        evaluateBulkRow(clone);
        bulkRows.splice(idx + 1, 0, clone);
        renderBulkRows();
        showToast('Row duplicated');
    }

    function deleteBulkRow(rowId) {
        bulkRows = bulkRows.filter(r => r.id !== rowId);
        if (bulkRows.length === 0) {
            bulkRows = [evaluateBulkRow(createEmptyBulkRow())];
        }
        renderBulkRows();
        showToast('Row deleted');
    }

    function clearBulkRows() {
        const hasContent = bulkRows.some(r => r.destinationUrl || r.source || r.medium || r.campaign || r.content || r.term);
        if (hasContent && modalBulkClear) {
            modalBulkClear.classList.remove('hidden');
        } else {
            bulkRows = [evaluateBulkRow(createEmptyBulkRow())];
            renderBulkRows();
        }
    }

    function closeBulkClearModal() {
        if (modalBulkClear) modalBulkClear.classList.add('hidden');
    }

    function copyBulkRow(rowId) {
        const row = bulkRows.find(r => r.id === rowId);
        if (!row || !row.isValid || !row.generatedUrl) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(row.generatedUrl).then(() => {
                showToast('URL copied');
            }).catch(() => {
                if (!fallbackCopy(row.generatedUrl)) return;
                showToast('URL copied');
            });
        } else {
            if (!fallbackCopy(row.generatedUrl)) return;
            showToast('URL copied');
        }
    }

    function copyAllBulkRows() {
        const validRows = bulkRows.filter(r => r.isValid && r.generatedUrl);
        const attentionCount = bulkRows.length - validRows.length;

        if (validRows.length === 0) {
            showToast('No valid URLs to copy');
            return;
        }

        const textToCopy = validRows.map(r => r.generatedUrl).join('\n');
        const onCopied = () => {
            window.groniqTrack?.('utm_bulk_urls_copied', { count: validRows.length });
            if (attentionCount > 0) {
                showToast(`${validRows.length} URLs copied · ${attentionCount} ${attentionCount === 1 ? 'row needs' : 'rows need'} attention`);
            } else {
                showToast(`${validRows.length} URLs copied`);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(onCopied).catch(() => {
                if (!fallbackCopy(textToCopy)) return;
                onCopied();
            });
        } else {
            if (!fallbackCopy(textToCopy)) return;
            onCopied();
        }
    }

    function exportBulkCsv() {
        const headers = [
            'destination_url',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'utm_term',
            'utm_id',
            'utm_source_platform',
            'utm_creative_format',
            'utm_marketing_tactic',
            'generated_url',
            'status'
        ];

        const lines = [headers.join(',')];

        bulkRows.forEach(row => {
            const statusVal = row.isValid ? (row.warnings?.length ? 'Warning: ' + row.warnings.join(' ') : 'Valid') : `Invalid: ${row.firstError || 'Incomplete'}`;
            const genUrlVal = row.isValid ? row.generatedUrl : '';

            const cols = [
                escapeCsvCell(row.destinationUrl),
                escapeCsvCell(normalizeTrackingValue(row.source)),
                escapeCsvCell(normalizeTrackingValue(row.medium)),
                escapeCsvCell(normalizeTrackingValue(row.campaign)),
                escapeCsvCell(normalizeTrackingValue(row.content)),
                escapeCsvCell(normalizeTrackingValue(row.term)),
                escapeCsvCell(normalizeTrackingValue(row.campaignId)),
                escapeCsvCell(normalizeTrackingValue(row.sourcePlatform)),
                escapeCsvCell(normalizeTrackingValue(row.creativeFormat)),
                escapeCsvCell(normalizeTrackingValue(row.marketingTactic)),
                escapeCsvCell(genUrlVal),
                escapeCsvCell(statusVal)
            ];

            lines.push(cols.join(','));
        });

        const csvContent = lines.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'bulk-campaign-urls.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`CSV exported: ${bulkRows.length} rows, including ${bulkRows.filter(r => !r.isValid).length} invalid rows with issues`);
    }

    function refreshBulkUrls() {
        bulkRows.forEach(row => evaluateBulkRow(row));
        renderBulkRows();
    }

    // ==========================================
    // SPREADSHEET TSV PASTE & CSV PARSING
    // ==========================================
    function parseTSV(text) {
        if (!text || !text.trim()) return [];
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        return lines.map(line => line.split('\t').map(col => col.trim()));
    }

    function parseCSV(text) {
        if (!text) return [];
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        currentField += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    currentRow.push(currentField);
                    currentField = '';
                } else if (char === '\r') {
                    if (nextChar === '\n') i++;
                    currentRow.push(currentField);
                    currentField = '';
                    if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                } else if (char === '\n') {
                    currentRow.push(currentField);
                    currentField = '';
                    if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                } else {
                    currentField += char;
                }
            }
        }
        if (inQuotes) throw new Error('CSV has an unclosed quoted field. Close the quote and import again.');
        if (currentField || currentRow.length > 0) {
            currentRow.push(currentField);
            if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === '')) {
                rows.push(currentRow);
            }
        }
        return rows;
    }

    function detectColumnMapping(headers) {
        const mapping = {
            destinationUrl: -1,
            source: -1,
            medium: -1,
            campaign: -1,
            content: -1,
            term: -1,
            campaignId: -1,
            sourcePlatform: -1,
            creativeFormat: -1,
            marketingTactic: -1
        };

        const recognizedCols = [];
        const unrecognizedCols = [];

        headers.forEach((h, idx) => {
            const clean = h.trim().toLowerCase().replace(/[\s\-_]+/g, '');
            if (['destinationurl', 'destination', 'url', 'page', 'landingpage', 'desturl'].includes(clean)) {
                mapping.destinationUrl = idx;
                recognizedCols.push(h);
            } else if (['source', 'utmsource', 'campaignsource', 'trafficsource'].includes(clean)) {
                mapping.source = idx;
                recognizedCols.push(h);
            } else if (['medium', 'utmmedium', 'campaignmedium', 'channel'].includes(clean)) {
                mapping.medium = idx;
                recognizedCols.push(h);
            } else if (['campaign', 'campaignname', 'utmcampaign', 'campaigntitle'].includes(clean)) {
                mapping.campaign = idx;
                recognizedCols.push(h);
            } else if (['content', 'utmcontent', 'campaigncontent', 'creative'].includes(clean)) {
                mapping.content = idx;
                recognizedCols.push(h);
            } else if (['term', 'utmterm', 'campaignterm', 'keyword'].includes(clean)) {
                mapping.term = idx;
                recognizedCols.push(h);
            } else if (['campaignid', 'utmid', 'id', 'cmpid'].includes(clean)) {
                mapping.campaignId = idx;
                recognizedCols.push(h);
            } else if (['sourceplatform', 'utmsourceplatform', 'platform'].includes(clean)) {
                mapping.sourcePlatform = idx;
                recognizedCols.push(h);
            } else if (['creativeformat', 'utmcreativeformat', 'format'].includes(clean)) {
                mapping.creativeFormat = idx;
                recognizedCols.push(h);
            } else if (['marketingtactic', 'utmmarketingtactic', 'tactic'].includes(clean)) {
                mapping.marketingTactic = idx;
                recognizedCols.push(h);
            } else {
                unrecognizedCols.push(h);
            }
        });

        const hasRecognized = Object.values(mapping).some(idx => idx !== -1);
        return { mapping, recognizedCols, unrecognizedCols, hasRecognized };
    }

    function openBulkPasteModal() {
        if (!modalBulkPaste) return;
        if (bulkPasteTextarea) bulkPasteTextarea.value = '';
        if (bulkPasteFeedback) {
            bulkPasteFeedback.innerHTML = '';
            bulkPasteFeedback.classList.add('hidden');
        }
        if (bulkPasteRowCount) bulkPasteRowCount.textContent = '0 rows detected';
        modalBulkPaste.classList.remove('hidden');
        if (bulkPasteTextarea) bulkPasteTextarea.focus();
    }

    function closeBulkPasteModal() {
        if (modalBulkPaste) modalBulkPaste.classList.add('hidden');
    }

    function closeBulkCsvModal() {
        if (modalBulkCsv) modalBulkCsv.classList.add('hidden');
        pendingCsvRows = [];
    }

    function openBulkDetailsModal(rowId) {
        activeDetailsRowId = rowId;
        const row = bulkRows.find(r => r.id === rowId);
        if (!row || !modalBulkDetails) return;

        if (inputBulkDetailId) inputBulkDetailId.value = row.campaignId || '';
        if (inputBulkDetailSourcePlatform) inputBulkDetailSourcePlatform.value = row.sourcePlatform || '';
        if (inputBulkDetailCreativeFormat) inputBulkDetailCreativeFormat.value = row.creativeFormat || '';
        if (inputBulkDetailMarketingTactic) inputBulkDetailMarketingTactic.value = row.marketingTactic || '';

        modalBulkDetails.classList.remove('hidden');
    }

    function closeBulkDetailsModal() {
        if (modalBulkDetails) modalBulkDetails.classList.add('hidden');
        activeDetailsRowId = null;
    }

    // ==========================================
    // INITIALIZE BULK BUILDER
    // ==========================================
    function initBulk() {
        // Initialize state with 1 empty row
        bulkRows = [evaluateBulkRow(createEmptyBulkRow())];
        renderBulkRows();

        // Toolbar Buttons
        if (btnBulkAddRow) btnBulkAddRow.addEventListener('click', addBulkRow);
        if (btnBulkPaste) btnBulkPaste.addEventListener('click', openBulkPasteModal);
        if (btnBulkCopyAll) btnBulkCopyAll.addEventListener('click', copyAllBulkRows);
        if (btnBulkExportCsv) btnBulkExportCsv.addEventListener('click', exportBulkCsv);
        if (btnBulkClearAll) btnBulkClearAll.addEventListener('click', clearBulkRows);
        if (bulkNamingShortcut) bulkNamingShortcut.addEventListener('click', openNamingModal);

        // CSV Import Trigger
        if (btnBulkImportCsv && inputBulkCsvFile) {
            btnBulkImportCsv.addEventListener('click', () => {
                inputBulkCsvFile.value = '';
                inputBulkCsvFile.click();
            });

            inputBulkCsvFile.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const text = evt.target.result;
                    let parsed;
                    try { parsed = parseCSV(text); } catch (error) { showToast(error.message); return; }
                    if (parsed.length === 0) {
                        showToast('CSV file is empty');
                        return;
                    }

                    const headers = parsed[0];
                    const { mapping, recognizedCols, unrecognizedCols, hasRecognized } = detectColumnMapping(headers);

                    let dataRows = hasRecognized ? parsed.slice(1) : parsed;
                    const totalFound = dataRows.length;
                    const willImport = Math.min(totalFound, 500);

                    pendingCsvRows = dataRows.slice(0, 500).map(r => {
                        if (hasRecognized) {
                            return createEmptyBulkRow({
                                destinationUrl: mapping.destinationUrl !== -1 ? (r[mapping.destinationUrl] || '') : '',
                                source: mapping.source !== -1 ? (r[mapping.source] || '') : '',
                                medium: mapping.medium !== -1 ? (r[mapping.medium] || '') : '',
                                campaign: mapping.campaign !== -1 ? (r[mapping.campaign] || '') : '',
                                content: mapping.content !== -1 ? (r[mapping.content] || '') : '',
                                term: mapping.term !== -1 ? (r[mapping.term] || '') : '',
                                campaignId: mapping.campaignId !== -1 ? (r[mapping.campaignId] || '') : '',
                                sourcePlatform: mapping.sourcePlatform !== -1 ? (r[mapping.sourcePlatform] || '') : '',
                                creativeFormat: mapping.creativeFormat !== -1 ? (r[mapping.creativeFormat] || '') : '',
                                marketingTactic: mapping.marketingTactic !== -1 ? (r[mapping.marketingTactic] || '') : ''
                            });
                        } else {
                            return createEmptyBulkRow({
                                destinationUrl: r[0] || '',
                                source: r[1] || '',
                                medium: r[2] || '',
                                campaign: r[3] || '',
                                content: r[4] || '',
                                term: r[5] || ''
                            });
                        }
                    });

                    if (bulkCsvSummaryBox && modalBulkCsv) {
                        let html = `
                            <div class="p-3 bg-[#141414] border border-[#222] rounded-xl space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-brand-muted">Rows found:</span>
                                    <span class="font-bold text-white">${totalFound}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-brand-muted">Recognized columns:</span>
                                    <span class="font-bold text-brand-green">${recognizedCols.length > 0 ? escapeHtml(recognizedCols.join(', ')) : 'Default order used'}</span>
                                </div>
                                ${unrecognizedCols.length > 0 ? `
                                    <div class="flex items-center justify-between text-[11px]">
                                        <span class="text-brand-muted">Unrecognized (ignored):</span>
                                        <span class="text-brand-muted">${escapeHtml(unrecognizedCols.join(', '))}</span>
                                    </div>
                                ` : ''}
                            </div>
                        `;

                        if (totalFound > 500) {
                            html += `
                                <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-400 text-xs">
                                    Bulk Builder supports up to 500 rows at a time. The first 500 rows will be imported.
                                </div>
                            `;
                        }

                        bulkCsvSummaryBox.innerHTML = html;
                        modalBulkCsv.classList.remove('hidden');
                    }
                };
                reader.readAsText(file, 'UTF-8');
            });
        }

        if (closeBulkCsv) closeBulkCsv.addEventListener('click', closeBulkCsvModal);
        if (btnCancelBulkCsv) btnCancelBulkCsv.addEventListener('click', closeBulkCsvModal);
        if (btnConfirmBulkCsv) {
            btnConfirmBulkCsv.addEventListener('click', () => {
                if (pendingCsvRows.length > 0) {
                    const evaluated = pendingCsvRows.map(r => evaluateBulkRow(r));
                    bulkRows = evaluated;
                    renderBulkRows();
                    showToast(`Imported ${evaluated.length} rows`);
                }
                closeBulkCsvModal();
            });
        }

        // Paste Modal Listeners
        if (closeBulkPaste) closeBulkPaste.addEventListener('click', closeBulkPasteModal);
        if (btnCancelBulkPaste) btnCancelBulkPaste.addEventListener('click', closeBulkPasteModal);

        if (bulkPasteTextarea) {
            bulkPasteTextarea.addEventListener('input', () => {
                const text = bulkPasteTextarea.value;
                const parsed = parseTSV(text);
                const count = parsed.length;
                if (bulkPasteRowCount) {
                    bulkPasteRowCount.textContent = `${count} ${count === 1 ? 'row' : 'rows'} detected`;
                }

                if (count > 0 && bulkPasteFeedback) {
                    const firstRow = parsed[0];
                    const { hasRecognized, recognizedCols } = detectColumnMapping(firstRow);
                    bulkPasteFeedback.innerHTML = `
                        <div class="p-2.5 bg-[#141414] border border-[#222] rounded-lg">
                            <span class="text-brand-muted">Preview: </span>
                            <span class="text-white">${count} rows parsed. ${hasRecognized ? `Header detected (${escapeHtml(recognizedCols.join(', '))})` : 'Using standard column order.'}</span>
                        </div>
                    `;
                    bulkPasteFeedback.classList.remove('hidden');
                } else if (bulkPasteFeedback) {
                    bulkPasteFeedback.classList.add('hidden');
                }
            });
        }

        if (btnConfirmBulkPaste && bulkPasteTextarea) {
            btnConfirmBulkPaste.addEventListener('click', () => {
                const text = bulkPasteTextarea.value;
                const parsed = parseTSV(text);
                if (parsed.length === 0) {
                    showToast('No rows to import');
                    return;
                }

                const firstRow = parsed[0];
                const { mapping, hasRecognized } = detectColumnMapping(firstRow);
                const dataRows = hasRecognized ? parsed.slice(1) : parsed;
                const capped = dataRows.slice(0, 500);

                const newRows = capped.map(r => {
                    if (hasRecognized) {
                        return createEmptyBulkRow({
                            destinationUrl: mapping.destinationUrl !== -1 ? (r[mapping.destinationUrl] || '') : '',
                            source: mapping.source !== -1 ? (r[mapping.source] || '') : '',
                            medium: mapping.medium !== -1 ? (r[mapping.medium] || '') : '',
                            campaign: mapping.campaign !== -1 ? (r[mapping.campaign] || '') : '',
                            content: mapping.content !== -1 ? (r[mapping.content] || '') : '',
                            term: mapping.term !== -1 ? (r[mapping.term] || '') : ''
                        });
                    } else {
                        return createEmptyBulkRow({
                            destinationUrl: r[0] || '',
                            source: r[1] || '',
                            medium: r[2] || '',
                            campaign: r[3] || '',
                            content: r[4] || '',
                            term: r[5] || ''
                        });
                    }
                });

                const evaluated = newRows.map(r => evaluateBulkRow(r));

                const beforeCount = bulkRows.length;
                // If currently just 1 blank row, replace it
                const isSingleBlank = bulkRows.length === 1 && !bulkRows[0].destinationUrl && !bulkRows[0].source && !bulkRows[0].medium && !bulkRows[0].campaign;
                if (isSingleBlank) {
                    bulkRows = evaluated;
                } else {
                    bulkRows = bulkRows.concat(evaluated).slice(0, 500);
                }

                renderBulkRows();
                closeBulkPasteModal();
                const imported = isSingleBlank ? bulkRows.length : bulkRows.length - beforeCount;
                showToast(`Imported ${imported} rows${dataRows.length > imported ? '; excluded input rows ' + (imported + 1) + '-' + dataRows.length + ' (500-row limit)' : ''}`);
            });
        }

        // Clear Modal Listeners
        if (btnCancelBulkClear) btnCancelBulkClear.addEventListener('click', closeBulkClearModal);
        if (btnConfirmBulkClear) {
            btnConfirmBulkClear.addEventListener('click', () => {
                bulkRows = [evaluateBulkRow(createEmptyBulkRow())];
                renderBulkRows();
                closeBulkClearModal();
                showToast('Rows cleared');
            });
        }

        // Details Modal Listeners
        if (closeBulkDetails) closeBulkDetails.addEventListener('click', closeBulkDetailsModal);
        if (btnCancelBulkDetails) btnCancelBulkDetails.addEventListener('click', closeBulkDetailsModal);
        if (btnSaveBulkDetails) {
            btnSaveBulkDetails.addEventListener('click', () => {
                if (!activeDetailsRowId) return;
                const row = bulkRows.find(r => r.id === activeDetailsRowId);
                if (row) {
                    row.campaignId = inputBulkDetailId ? inputBulkDetailId.value.trim() : '';
                    row.sourcePlatform = inputBulkDetailSourcePlatform ? inputBulkDetailSourcePlatform.value.trim() : '';
                    row.creativeFormat = inputBulkDetailCreativeFormat ? inputBulkDetailCreativeFormat.value.trim() : '';
                    row.marketingTactic = inputBulkDetailMarketingTactic ? inputBulkDetailMarketingTactic.value.trim() : '';
                    evaluateBulkRow(row);
                    renderBulkRows();
                    showToast('Details saved');
                }
                closeBulkDetailsModal();
            });
        }

        // EVENT DELEGATION: Desktop Table Body
        if (bulkTableBody) {
            bulkTableBody.addEventListener('input', (e) => {
                const target = e.target;
                const field = target.dataset.field;
                if (!field) return;

                const tr = target.closest('tr[data-row-id]');
                if (!tr) return;
                const rowId = tr.dataset.rowId;

                const row = bulkRows.find(r => r.id === rowId);
                if (!row) return;

                tr.querySelectorAll('input[data-field]').forEach(inp => {
                    row[inp.dataset.field] = inp.value;
                });
                evaluateBulkRow(row);

                // Update result cell without full re-render
                const resultCell = tr.querySelector('.bulk-result-cell');
                if (resultCell) resultCell.innerHTML = renderRowResultCell(row);

                // Update copy button state
                const copyBtn = tr.querySelector('.btn-bulk-row-copy');
                if (copyBtn) {
                    if (row.isValid) {
                        copyBtn.removeAttribute('disabled');
                        copyBtn.style.opacity = '1';
                        copyBtn.style.cursor = 'pointer';
                    } else {
                        copyBtn.setAttribute('disabled', 'true');
                        copyBtn.style.opacity = '0.35';
                        copyBtn.style.cursor = 'not-allowed';
                    }
                }
                const openBtn = tr.querySelector('.btn-bulk-row-open');
                if (openBtn) {
                    if (row.isValid) {
                        openBtn.removeAttribute('disabled');
                        openBtn.style.opacity = '1';
                        openBtn.style.cursor = 'pointer';
                    } else {
                        openBtn.setAttribute('disabled', 'true');
                        openBtn.style.opacity = '0.35';
                        openBtn.style.cursor = 'not-allowed';
                    }
                }

                // Sync mobile card if present
                if (bulkMobileContainer) {
                    const card = bulkMobileContainer.querySelector(`[data-row-id="${rowId}"]`);
                    if (card) {
                        const mInput = card.querySelector(`[data-field="${field}"]`);
                        if (mInput && mInput !== target) mInput.value = target.value;
                        const mResult = card.querySelector('.bulk-mobile-result-box');
                        if (mResult) mResult.innerHTML = renderMobileCardResult(row);
                    }
                }

                updateBulkSummary();
            });

            bulkTableBody.addEventListener('click', (e) => {
                const copyBtn = e.target.closest('.btn-bulk-row-copy');
                if (copyBtn) {
                    copyBulkRow(copyBtn.dataset.id);
                    return;
                }
                const openBtn = e.target.closest('.btn-bulk-row-open');
                if (openBtn) {
                    const row = bulkRows.find(r => r.id === openBtn.dataset.id);
                    if (row && row.isValid && row.generatedUrl) {
                        openUrlInNewTab(row.generatedUrl);
                    } else {
                        showToast('Row URL is incomplete');
                    }
                    return;
                }
                const dupBtn = e.target.closest('.btn-bulk-row-dup');
                if (dupBtn) {
                    duplicateBulkRow(dupBtn.dataset.id);
                    return;
                }
                const detailsBtn = e.target.closest('.btn-bulk-row-details');
                if (detailsBtn) {
                    openBulkDetailsModal(detailsBtn.dataset.id);
                    return;
                }
                const delBtn = e.target.closest('.btn-bulk-row-del');
                if (delBtn) {
                    deleteBulkRow(delBtn.dataset.id);
                    return;
                }
            });
        }

        // EVENT DELEGATION: Mobile Container
        if (bulkMobileContainer) {
            bulkMobileContainer.addEventListener('input', (e) => {
                const target = e.target;
                const field = target.dataset.field;
                if (!field) return;

                const card = target.closest('[data-row-id]');
                if (!card) return;
                const rowId = card.dataset.rowId;

                card.querySelectorAll('input[data-field]').forEach(inp => {
                    row[inp.dataset.field] = inp.value;
                });
                evaluateBulkRow(row);

                const mResult = card.querySelector('.bulk-mobile-result-box');
                if (mResult) mResult.innerHTML = renderMobileCardResult(row);

                // Sync desktop table
                if (bulkTableBody) {
                    const tr = bulkTableBody.querySelector(`tr[data-row-id="${rowId}"]`);
                    if (tr) {
                        const dInput = tr.querySelector(`[data-field="${field}"]`);
                        if (dInput && dInput !== target) dInput.value = target.value;
                        const resultCell = tr.querySelector('.bulk-result-cell');
                        if (resultCell) resultCell.innerHTML = renderRowResultCell(row);
                        const copyBtn = tr.querySelector('.btn-bulk-row-copy');
                        if (copyBtn) {
                            if (row.isValid) {
                                copyBtn.removeAttribute('disabled');
                                copyBtn.style.opacity = '1';
                                copyBtn.style.cursor = 'pointer';
                            } else {
                                copyBtn.setAttribute('disabled', 'true');
                                copyBtn.style.opacity = '0.35';
                                copyBtn.style.cursor = 'not-allowed';
                            }
                        }
                    }
                }

                updateBulkSummary();
            });

            bulkMobileContainer.addEventListener('click', (e) => {
                const copyBtn = e.target.closest('.btn-bulk-row-copy');
                if (copyBtn) {
                    copyBulkRow(copyBtn.dataset.id);
                    return;
                }
                const openBtn = e.target.closest('.btn-bulk-row-open');
                if (openBtn) {
                    const row = bulkRows.find(r => r.id === openBtn.dataset.id);
                    if (row && row.isValid && row.generatedUrl) {
                        openUrlInNewTab(row.generatedUrl);
                    } else {
                        showToast('Row URL is incomplete');
                    }
                    return;
                }
                const dupBtn = e.target.closest('.btn-bulk-row-dup');
                if (dupBtn) {
                    duplicateBulkRow(dupBtn.dataset.id);
                    return;
                }
                const detailsBtn = e.target.closest('.btn-bulk-row-details');
                if (detailsBtn) {
                    openBulkDetailsModal(detailsBtn.dataset.id);
                    return;
                }
                const delBtn = e.target.closest('.btn-bulk-row-del');
                if (delBtn) {
                    deleteBulkRow(delBtn.dataset.id);
                    return;
                }
            });
        }
    }

    // Expose helpers for testing
    window.bulkRows = bulkRows;
    window.refreshBulkUrls = refreshBulkUrls;
    window.addBulkRow = addBulkRow;
    window.duplicateBulkRow = duplicateBulkRow;
    window.deleteBulkRow = deleteBulkRow;
    window.clearBulkRows = clearBulkRows;
    window.copyBulkRow = copyBulkRow;
    window.copyAllBulkRows = copyAllBulkRows;
    window.exportBulkCsv = exportBulkCsv;
    window.parseCSV = parseCSV;
    window.parseTSV = parseTSV;

    // ==========================================
    // CAMPAIGN WORKSPACE IMPLEMENTATION
    // ==========================================


    function buildCampaignLinkUrl(link, campaign) {
        if (!link || !campaign) return { error: 'MISSING_DATA', url: '' };
        if (!link.destinationUrl || !link.destinationUrl.trim()) {
            return { error: 'MISSING_DEST', url: '' };
        }
        if (!link.source || !link.source.trim() || !link.medium || !link.medium.trim()) {
            return { error: 'MISSING_REQUIRED', url: '' };
        }

        const rawCmp = campaign.name || '';
        const rawId = campaign.campaignId || '';

        const normSrc = normalizeTrackingValue(link.source);
        const normMed = normalizeTrackingValue(link.medium);
        const normCmp = normalizeTrackingValue(rawCmp);
        const normCnt = normalizeTrackingValue(link.content);
        const normTrm = normalizeTrackingValue(link.term);
        const normId = normalizeTrackingValue(rawId);
        const normSp = normalizeTrackingValue(link.sourcePlatform);
        const normCf = normalizeTrackingValue(link.creativeFormat);
        const normMt = normalizeTrackingValue(link.marketingTactic);

        const utmParams = {
            utm_source: normSrc,
            utm_medium: normMed,
            utm_campaign: normCmp,
            utm_content: normCnt,
            utm_term: normTrm,
            utm_id: normId,
            utm_source_platform: normSp,
            utm_creative_format: normCf,
            utm_marketing_tactic: normMt
        };

        return buildCanonicalURL(link.destinationUrl, utmParams, link.customParams || []);
    }

    function renderCampaignsUI() {
        if (activeCampaignId) {
            renderCampaignDetail(activeCampaignId);
        } else {
            renderCampaignList();
        }
    }

    function refreshCampaignsUI() {
        if (currentMode === 'campaigns') {
            renderCampaignsUI();
        }
        if (activeQrContext && activeQrContext.campaignId && activeQrContext.linkId && modalQr && !modalQr.classList.contains('hidden')) {
            const campaigns = (typeof UTMStorage !== 'undefined' && typeof UTMStorage.getCampaigns === 'function') 
                ? UTMStorage.getCampaigns() 
                : [];
            const c = campaigns.find(x => x.id === activeQrContext.campaignId);
            if (c) {
                const link = (c.links || []).find(l => l.id === activeQrContext.linkId);
                if (link) {
                    const buildRes = buildCampaignLinkUrl(link, c);
                    if (!buildRes.error && buildRes.url) {
                        openQrModal({
                            url: buildRes.url,
                            label: link.name,
                            campaignName: c.name,
                            linkName: link.name,
                            campaignId: c.id,
                            linkId: link.id
                        });
                    }
                }
            }
        }
    }

    function renderCampaignList() {
        if (!campaignsListView || !campaignDetailView) return;
        campaignsListView.classList.remove('hidden');
        campaignDetailView.classList.add('hidden');

        const allCampaigns = (typeof UTMStorage !== 'undefined' && typeof UTMStorage.getCampaigns === 'function') 
            ? UTMStorage.getCampaigns() 
            : [];
        const query = campaignsSearch ? campaignsSearch.value.trim().toLowerCase() : '';
        const filtered = query ? allCampaigns.filter(c => {
            const nameMatch = (c.name || '').toLowerCase().includes(query);
            const idMatch = (c.campaignId || '').toLowerCase().includes(query);
            return nameMatch || idMatch;
        }) : allCampaigns;

        if (filtered.length === 0) {
            if (campaignsEmptyState) campaignsEmptyState.classList.remove('hidden');
            if (campaignsGrid) {
                campaignsGrid.classList.add('hidden');
                campaignsGrid.innerHTML = '';
            }
            return;
        }

        if (campaignsEmptyState) campaignsEmptyState.classList.add('hidden');
        if (campaignsGrid) {
            campaignsGrid.classList.remove('hidden');
            campaignsGrid.innerHTML = filtered.map(c => {
                const normCmp = normalizeTrackingValue(c.name);
                const linkCount = (c.links || []).length;
                const linkText = linkCount === 1 ? '1 tracking link' : `${linkCount} tracking links`;
                const relTime = formatRelativeTime(c.updatedAt);
                const hasId = c.campaignId && c.campaignId.trim();

                return `
                    <div class="p-5 rounded-2xl bg-[#0D0D0D] border border-[#222] hover:border-brand-green/30 transition-all flex flex-col justify-between group space-y-4" data-campaign-id="${escapeHtml(c.id)}">
                        <div class="space-y-2">
                            <div class="flex items-start justify-between gap-3">
                                <h3 class="text-base font-extrabold text-white group-hover:text-brand-green transition-colors break-words">${escapeHtml(c.name)}</h3>
                                ${hasId ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181818] border border-[#333] text-brand-muted shrink-0">utm_id: ${escapeHtml(normalizeTrackingValue(c.campaignId))}</span>` : ''}
                            </div>
                            <div class="flex items-center gap-1.5 text-xs font-mono text-brand-green">
                                <span class="text-brand-muted text-[10px]">utm_campaign:</span>
                                <span class="break-all font-semibold">${escapeHtml(normCmp)}</span>
                            </div>
                            <div class="flex items-center gap-3 text-xs text-brand-muted pt-1">
                                <span>${escapeHtml(linkText)}</span>
                                <span>&bull;</span>
                                <span>Updated ${escapeHtml(relTime)}</span>
                            </div>
                        </div>

                        <div class="pt-3 border-t border-[#1C1C1C] flex items-center justify-between gap-2">
                            <button type="button" class="btn-open-campaign inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-greenHover transition-all cursor-pointer" data-id="${escapeHtml(c.id)}">
                                <span>Open</span>
                                <i data-lucide="arrow-right" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                            <div class="flex items-center gap-1">
                                <button type="button" class="btn-dup-campaign p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#181818] transition-colors cursor-pointer" data-id="${escapeHtml(c.id)}" title="Duplicate campaign" aria-label="Duplicate campaign">
                                    <i data-lucide="copy-plus" class="w-4 h-4 pointer-events-none"></i>
                                </button>
                                <button type="button" class="btn-rename-campaign p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#181818] transition-colors cursor-pointer" data-id="${escapeHtml(c.id)}" title="Rename campaign" aria-label="Rename campaign">
                                    <i data-lucide="pencil" class="w-4 h-4 pointer-events-none"></i>
                                </button>
                                <button type="button" class="btn-delete-campaign p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-[#181818] transition-colors cursor-pointer" data-id="${escapeHtml(c.id)}" title="Delete campaign" aria-label="Delete campaign">
                                    <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
        }
    }

    function renderCampaignDetail(campaignId) {
        if (!campaignsListView || !campaignDetailView) return;
        const allCampaigns = (typeof UTMStorage !== 'undefined' && typeof UTMStorage.getCampaigns === 'function') 
            ? UTMStorage.getCampaigns() 
            : [];
        const c = allCampaigns.find(x => x.id === campaignId);
        if (!c) {
            activeCampaignId = null;
            renderCampaignList();
            return;
        }

        activeCampaignId = c.id;
        campaignsListView.classList.add('hidden');
        campaignDetailView.classList.remove('hidden');

        if (campaignDetailTitle) campaignDetailTitle.textContent = c.name;
        if (campaignDetailTrackingVal) campaignDetailTrackingVal.textContent = normalizeTrackingValue(c.name);

        if (c.campaignId && c.campaignId.trim()) {
            if (campaignDetailIdContainer) campaignDetailIdContainer.classList.remove('hidden');
            if (campaignDetailIdBadge) campaignDetailIdBadge.textContent = normalizeTrackingValue(c.campaignId);
        } else {
            if (campaignDetailIdContainer) campaignDetailIdContainer.classList.add('hidden');
        }

        const links = c.links || [];
        let readyCount = 0;
        let needsAttentionCount = 0;

        const linkCardsHtml = links.map(link => {
            const buildRes = buildCampaignLinkUrl(link, c);
            const isValid = !buildRes.error && !!buildRes.url;
            if (isValid) {
                readyCount++;
            } else {
                needsAttentionCount++;
            }

            const normSource = normalizeTrackingValue(link.source);
            const normMedium = normalizeTrackingValue(link.medium);
            const hostPath = formatHostPath(link.destinationUrl);
            const linkNameDisplay = link.name && link.name.trim() ? link.name.trim() : 'Untitled link';

            return `
                <div class="campaign-link-card p-4 sm:p-5 rounded-2xl bg-[#0D0D0D] border border-[#222] hover:border-[#333] transition-all space-y-3" data-link-id="${escapeHtml(link.id)}">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2.5 flex-wrap">
                                <h4 class="text-sm font-bold text-white">${escapeHtml(linkNameDisplay)}</h4>
                                ${isValid 
                                    ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green border border-brand-green/20">Ready</span>`
                                    : `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Needs attention</span>`
                                }
                            </div>
                            <div class="flex items-center gap-2 text-xs text-brand-muted flex-wrap">
                                <span class="font-mono text-white">${escapeHtml(normSource || '—')}</span>
                                <span>&bull;</span>
                                <span class="font-mono text-white">${escapeHtml(normMedium || '—')}</span>
                                ${link.content ? `<span>&bull;</span><span class="font-mono text-brand-mutedLight">${escapeHtml(normalizeTrackingValue(link.content))}</span>` : ''}
                                ${hostPath ? `<span>&bull;</span><span class="font-mono text-brand-muted truncate max-w-xs" title="${escapeHtml(link.destinationUrl)}">${escapeHtml(hostPath)}</span>` : ''}
                            </div>
                        </div>

                        <!-- Card Action Buttons -->
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" class="btn-link-copy inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isValid ? 'bg-white text-black font-extrabold hover:bg-gray-200 cursor-pointer' : 'bg-[#181818] text-brand-muted cursor-not-allowed opacity-40'} text-xs uppercase tracking-wider transition-all" data-link-id="${escapeHtml(link.id)}" ${isValid ? '' : 'disabled'}>
                                <i data-lucide="copy" class="w-3.5 h-3.5 pointer-events-none"></i>
                                <span class="pointer-events-none">Copy URL</span>
                            </button>
                            <button type="button" class="btn-link-open p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#181818] transition-colors ${isValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}" data-link-id="${escapeHtml(link.id)}" title="Open URL in new tab" aria-label="Open URL" ${isValid ? '' : 'disabled'}>
                                <i data-lucide="external-link" class="w-4 h-4 pointer-events-none"></i>
                            </button>
                            <button type="button" class="btn-link-qr p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#181818] transition-colors ${isValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}" data-link-id="${escapeHtml(link.id)}" title="View QR Code" aria-label="View QR Code" ${isValid ? '' : 'disabled'}>
                                <i data-lucide="qr-code" class="w-4 h-4 pointer-events-none"></i>
                            </button>
                            <div class="h-4 w-[1px] bg-[#222] mx-0.5"></div>
                            <button type="button" class="btn-link-edit p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#181818] transition-colors cursor-pointer" data-link-id="${escapeHtml(link.id)}" title="Edit link" aria-label="Edit link">
                                <i data-lucide="pencil" class="w-4 h-4 pointer-events-none"></i>
                            </button>
                            <button type="button" class="btn-link-dup p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#181818] transition-colors cursor-pointer" data-link-id="${escapeHtml(link.id)}" title="Duplicate link" aria-label="Duplicate link">
                                <i data-lucide="copy-plus" class="w-4 h-4 pointer-events-none"></i>
                            </button>
                            <button type="button" class="btn-link-del p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-[#181818] transition-colors cursor-pointer" data-link-id="${escapeHtml(link.id)}" title="Delete link" aria-label="Delete link">
                                <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                            </button>
                        </div>
                    </div>

                    <!-- URL / Error display box -->
                    <div class="p-3 rounded-xl bg-[#050505] border border-[#1C1C1C] flex items-center justify-between gap-3 font-mono text-xs overflow-hidden">
                        ${isValid 
                            ? `<span class="text-brand-green break-all">${escapeHtml(buildRes.url)}</span>`
                            : `<span class="text-yellow-500 italic text-[11px]">Configuration incomplete. Destination URL, Source, and Medium are required.</span>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        if (campaignDetailStatusCounts) {
            const total = links.length;
            if (total === 0) {
                campaignDetailStatusCounts.textContent = '0 tracking links';
            } else if (needsAttentionCount > 0) {
                campaignDetailStatusCounts.textContent = `${total} tracking link${total === 1 ? '' : 's'} · ${readyCount} ready · ${needsAttentionCount} needs attention`;
            } else {
                campaignDetailStatusCounts.textContent = `${total} tracking link${total === 1 ? '' : 's'} · ${readyCount} ready`;
            }
        }

        if (links.length === 0) {
            if (campaignLinksEmptyState) campaignLinksEmptyState.classList.remove('hidden');
            if (campaignLinksContainer) {
                campaignLinksContainer.classList.add('hidden');
                campaignLinksContainer.innerHTML = '';
            }
        } else {
            if (campaignLinksEmptyState) campaignLinksEmptyState.classList.add('hidden');
            if (campaignLinksContainer) {
                campaignLinksContainer.classList.remove('hidden');
                campaignLinksContainer.innerHTML = linkCardsHtml;
            }
        }

        if (window.lucide) lucide.createIcons();
    }

    function openCreateCampaignModal() {
        pendingCampaignModalMode = 'create';
        pendingCampaignTargetId = null;
        if (modalCampaignTitle) modalCampaignTitle.textContent = 'Create campaign';
        if (campaignModalNameInput) campaignModalNameInput.value = '';
        if (campaignModalIdInput) campaignModalIdInput.value = '';
        if (btnConfirmCampaignModal) btnConfirmCampaignModal.textContent = 'Create campaign';
        if (campaignModalError) campaignModalError.classList.add('hidden');
        if (modalCampaign) {
            modalCampaign.classList.remove('hidden');
            if (campaignModalNameInput) campaignModalNameInput.focus();
        }
    }

    function openRenameCampaignModal(campaignId) {
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === campaignId);
        if (!c) return;

        pendingCampaignModalMode = 'rename';
        pendingCampaignTargetId = campaignId;
        if (modalCampaignTitle) modalCampaignTitle.textContent = 'Rename campaign';
        if (campaignModalNameInput) campaignModalNameInput.value = c.name || '';
        if (campaignModalIdInput) campaignModalIdInput.value = c.campaignId || '';
        if (btnConfirmCampaignModal) btnConfirmCampaignModal.textContent = 'Save changes';
        if (campaignModalError) campaignModalError.classList.add('hidden');
        if (modalCampaign) {
            modalCampaign.classList.remove('hidden');
            if (campaignModalNameInput) campaignModalNameInput.focus();
        }
    }

    function closeCampaignModalHandler() {
        if (modalCampaign) modalCampaign.classList.add('hidden');
        if (campaignModalError) campaignModalError.classList.add('hidden');
        pendingCampaignModalMode = 'create';
        pendingCampaignTargetId = null;
    }

    function saveCampaignModalHandler() {
        const rawName = campaignModalNameInput ? campaignModalNameInput.value.trim() : '';
        const rawId = campaignModalIdInput ? campaignModalIdInput.value.trim() : '';

        if (!rawName) {
            if (campaignModalError) {
                campaignModalError.textContent = 'Please enter a campaign name.';
                campaignModalError.classList.remove('hidden');
            }
            if (campaignModalNameInput) campaignModalNameInput.focus();
            return;
        }

        if (pendingCampaignModalMode === 'create') {
            const newCamp = UTMStorage.createCampaign(rawName, rawId);
            closeCampaignModalHandler();
            if (newCamp) {
                activeCampaignId = newCamp.id;
                renderCampaignDetail(newCamp.id);
                showToast('Campaign created');
            } else {
                renderCampaignList();
            }
        } else if (pendingCampaignModalMode === 'rename' && pendingCampaignTargetId) {
            UTMStorage.updateCampaign(pendingCampaignTargetId, { name: rawName, campaignId: rawId });
            closeCampaignModalHandler();
            renderCampaignsUI();
            refreshCampaignsUI();
            showToast('Campaign updated');
        }
    }

    function openCampaignDeleteModal(campaignId) {
        pendingDeleteCampaignId = campaignId;
        if (modalCampaignDelete) modalCampaignDelete.classList.remove('hidden');
    }

    function closeCampaignDeleteModalHandler() {
        if (modalCampaignDelete) modalCampaignDelete.classList.add('hidden');
        pendingDeleteCampaignId = null;
    }

    function confirmCampaignDeleteHandler() {
        if (pendingDeleteCampaignId) {
            const deletedId = pendingDeleteCampaignId;
            UTMStorage.deleteCampaign(deletedId);
            if (activeCampaignId === deletedId) {
                activeCampaignId = null;
            }
            if (activeEditingCampaignId === deletedId) {
                cancelEditingCampaign();
            }
            closeCampaignDeleteModalHandler();
            renderCampaignList();
            renderSavedCampaigns();
            showToast('Campaign deleted');
        }
    }

    function openAddLinkModal() {
        if (!activeCampaignId) return;
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === activeCampaignId);
        if (!c) return;

        pendingLinkModalMode = 'create';
        pendingEditingLinkId = null;
        if (trackingLinkModalTitle) trackingLinkModalTitle.textContent = 'Add tracking link';
        if (trackingLinkParentName) trackingLinkParentName.textContent = `Campaign: ${c.name}`;
        if (linkInputName) linkInputName.value = '';
        if (linkInputDest) linkInputDest.value = '';
        if (linkInputSource) linkInputSource.value = '';
        if (linkInputMedium) linkInputMedium.value = '';
        if (linkInputContent) linkInputContent.value = '';
        if (linkInputTerm) linkInputTerm.value = '';
        if (linkInputSourcePlatform) linkInputSourcePlatform.value = '';
        if (linkInputCreativeFormat) linkInputCreativeFormat.value = '';
        if (linkInputMarketingTactic) linkInputMarketingTactic.value = '';
        if (trackingLinkModalError) trackingLinkModalError.classList.add('hidden');
        if (btnConfirmLinkModal) btnConfirmLinkModal.textContent = 'Save link';

        if (modalTrackingLink) {
            modalTrackingLink.classList.remove('hidden');
            if (linkInputName) linkInputName.focus();
        }
    }

    function openEditLinkModal(linkId) {
        if (!activeCampaignId) return;
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === activeCampaignId);
        if (!c) return;
        const link = (c.links || []).find(l => l.id === linkId);
        if (!link) return;

        pendingLinkModalMode = 'edit';
        pendingEditingLinkId = linkId;
        if (trackingLinkModalTitle) trackingLinkModalTitle.textContent = 'Edit tracking link';
        if (trackingLinkParentName) trackingLinkParentName.textContent = `Campaign: ${c.name}`;
        if (linkInputName) linkInputName.value = link.name || '';
        if (linkInputDest) linkInputDest.value = link.destinationUrl || '';
        if (linkInputSource) linkInputSource.value = link.source || '';
        if (linkInputMedium) linkInputMedium.value = link.medium || '';
        if (linkInputContent) linkInputContent.value = link.content || '';
        if (linkInputTerm) linkInputTerm.value = link.term || '';
        if (linkInputSourcePlatform) linkInputSourcePlatform.value = link.sourcePlatform || '';
        if (linkInputCreativeFormat) linkInputCreativeFormat.value = link.creativeFormat || '';
        if (linkInputMarketingTactic) linkInputMarketingTactic.value = link.marketingTactic || '';
        if (trackingLinkModalError) trackingLinkModalError.classList.add('hidden');
        if (btnConfirmLinkModal) btnConfirmLinkModal.textContent = 'Save changes';

        if (modalTrackingLink) {
            modalTrackingLink.classList.remove('hidden');
            if (linkInputName) linkInputName.focus();
        }
    }

    function closeLinkModalHandler() {
        if (modalTrackingLink) modalTrackingLink.classList.add('hidden');
        if (trackingLinkModalError) trackingLinkModalError.classList.add('hidden');
        pendingLinkModalMode = 'create';
        pendingEditingLinkId = null;
    }

    function saveLinkModalHandler() {
        if (!activeCampaignId) return;
        const linkData = {
            name: linkInputName ? linkInputName.value.trim() : '',
            destinationUrl: linkInputDest ? linkInputDest.value.trim() : '',
            source: linkInputSource ? linkInputSource.value.trim() : '',
            medium: linkInputMedium ? linkInputMedium.value.trim() : '',
            content: linkInputContent ? linkInputContent.value.trim() : '',
            term: linkInputTerm ? linkInputTerm.value.trim() : '',
            sourcePlatform: linkInputSourcePlatform ? linkInputSourcePlatform.value.trim() : '',
            creativeFormat: linkInputCreativeFormat ? linkInputCreativeFormat.value.trim() : '',
            marketingTactic: linkInputMarketingTactic ? linkInputMarketingTactic.value.trim() : ''
        };

        if (pendingLinkModalMode === 'create') {
            UTMStorage.addTrackingLink(activeCampaignId, linkData);
            closeLinkModalHandler();
            renderCampaignDetail(activeCampaignId);
            showToast('Tracking link added');
        } else if (pendingLinkModalMode === 'edit' && pendingEditingLinkId) {
            UTMStorage.updateTrackingLink(activeCampaignId, pendingEditingLinkId, linkData);
            closeLinkModalHandler();
            renderCampaignDetail(activeCampaignId);
            refreshCampaignsUI();
            showToast('Tracking link updated');
        }
    }

    function openLinkDeleteModal(linkId) {
        pendingDeleteLinkId = linkId;
        if (modalLinkDelete) modalLinkDelete.classList.remove('hidden');
    }

    function closeLinkDeleteModalHandler() {
        if (modalLinkDelete) modalLinkDelete.classList.add('hidden');
        pendingDeleteLinkId = null;
    }

    function confirmLinkDeleteHandler() {
        if (activeCampaignId && pendingDeleteLinkId) {
            UTMStorage.deleteTrackingLink(activeCampaignId, pendingDeleteLinkId);
            closeLinkDeleteModalHandler();
            renderCampaignDetail(activeCampaignId);
            showToast('Tracking link deleted');
        }
    }

    function copyCampaignLinkUrl(linkId) {
        if (!activeCampaignId) return;
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === activeCampaignId);
        if (!c) return;
        const link = (c.links || []).find(l => l.id === linkId);
        if (!link) return;

        const buildRes = buildCampaignLinkUrl(link, c);
        if (buildRes.error || !buildRes.url) {
            showToast('Cannot copy incomplete link');
            return;
        }

        const url = buildRes.url;
        UTMStorage.saveToHistory({
            destinationUrl: link.destinationUrl,
            source: normalizeTrackingValue(link.source),
            medium: normalizeTrackingValue(link.medium),
            campaign: normalizeTrackingValue(c.name),
            content: normalizeTrackingValue(link.content),
            term: normalizeTrackingValue(link.term),
            id_param: normalizeTrackingValue(c.campaignId),
            namingSettings: { ...runtimeNamingSettings },
            generatedUrl: url
        });

        const clip = (typeof window !== 'undefined' && window.navigator && window.navigator.clipboard) ? window.navigator.clipboard : (typeof navigator !== 'undefined' ? navigator.clipboard : null);
        if (clip && typeof clip.writeText === 'function') {
            clip.writeText(url).then(() => {
                showToast('URL copied');
            }).catch(() => {
                if (!fallbackCopy(url)) return;
                showToast('URL copied');
            });
        } else {
            if (!fallbackCopy(url)) return;
            showToast('URL copied');
        }
    }

    function openCampaignLinkInNewTab(linkId) {
        if (!activeCampaignId) return;
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === activeCampaignId);
        if (!c) return;
        const link = (c.links || []).find(l => l.id === linkId);
        if (!link) return;
        const buildRes = buildCampaignLinkUrl(link, c);
        if (!buildRes.error && buildRes.url) {
            openUrlInNewTab(buildRes.url);
        } else {
            showToast('Complete destination, source, and medium first');
        }
    }

    function copyAllCampaignUrls() {
        if (!activeCampaignId) return;
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === activeCampaignId);
        if (!c) return;

        const links = c.links || [];
        if (links.length === 0) {
            showToast('No links in campaign');
            return;
        }

        const validUrls = [];
        let needsAttentionCount = 0;

        links.forEach(l => {
            const res = buildCampaignLinkUrl(l, c);
            if (!res.error && res.url) {
                validUrls.push(res.url);
            } else {
                needsAttentionCount++;
            }
        });

        if (validUrls.length === 0) {
            showToast('No ready URLs to copy');
            return;
        }

        const combinedText = validUrls.join('\r\n');
        const clip = (typeof window !== 'undefined' && window.navigator && window.navigator.clipboard) ? window.navigator.clipboard : (typeof navigator !== 'undefined' ? navigator.clipboard : null);
        const onCopied = () => {
            window.groniqTrack?.('utm_campaign_urls_copied', { count: validUrls.length });
            if (needsAttentionCount > 0) {
                showToast(`${validUrls.length} URLs copied · ${needsAttentionCount} link${needsAttentionCount === 1 ? '' : 's'} need attention`);
            } else {
                showToast(`${validUrls.length} URLs copied`);
            }
        };

        if (clip && typeof clip.writeText === 'function') {
            clip.writeText(combinedText).then(onCopied).catch(() => {
                if (!fallbackCopy(combinedText)) return;
                onCopied();
            });
        } else {
            if (!fallbackCopy(combinedText)) return;
            onCopied();
        }
    }

    function exportCampaignCsv() {
        if (!activeCampaignId) return;
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === activeCampaignId);
        if (!c) return;

        const links = c.links || [];
        const headers = [
            'link_name',
            'destination_url',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'utm_term',
            'utm_id',
            'utm_source_platform',
            'utm_creative_format',
            'utm_marketing_tactic',
            'generated_url',
            'status'
        ];

        const lines = [headers.join(',')];

        links.forEach(l => {
            const buildRes = buildCampaignLinkUrl(l, c);
            const isValid = !buildRes.error && !!buildRes.url;
            const statusVal = isValid ? 'Ready' : 'Needs attention';
            const genUrlVal = isValid ? buildRes.url : '';

            const cols = [
                escapeCsvCell(l.name || ''),
                escapeCsvCell(l.destinationUrl || ''),
                escapeCsvCell(normalizeTrackingValue(l.source || '')),
                escapeCsvCell(normalizeTrackingValue(l.medium || '')),
                escapeCsvCell(normalizeTrackingValue(c.name || '')),
                escapeCsvCell(normalizeTrackingValue(l.content || '')),
                escapeCsvCell(normalizeTrackingValue(l.term || '')),
                escapeCsvCell(normalizeTrackingValue(c.campaignId || '')),
                escapeCsvCell(normalizeTrackingValue(l.sourcePlatform || '')),
                escapeCsvCell(normalizeTrackingValue(l.creativeFormat || '')),
                escapeCsvCell(normalizeTrackingValue(l.marketingTactic || '')),
                escapeCsvCell(genUrlVal),
                escapeCsvCell(statusVal)
            ];

            lines.push(cols.join(','));
        });

        const csvContent = lines.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const globalUrl = (typeof window !== 'undefined' && window.URL) ? window.URL : (typeof URL !== 'undefined' ? URL : null);
        if (globalUrl && typeof globalUrl.createObjectURL === 'function') {
            const url = globalUrl.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = `${getSanitizedQrFilename(c.name).replace('-qr.png', '')}-tracking-links.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (typeof globalUrl.revokeObjectURL === 'function') {
                globalUrl.revokeObjectURL(url);
            }
        }
        showToast('CSV exported');
    }

    function openCampaignInBulk() {
        if (!activeCampaignId) return;
        const campaigns = UTMStorage.getCampaigns() || [];
        const c = campaigns.find(x => x.id === activeCampaignId);
        if (!c) return;

        const links = c.links || [];
        if (links.length === 0) {
            showToast('No tracking links in campaign');
            return;
        }

        bulkRows.length = 0;
        links.forEach(l => {
            const row = {
                id: 'row-' + (bulkRowSeq++),
                destinationUrl: l.destinationUrl || '',
                source: l.source || '',
                medium: l.medium || '',
                campaign: c.name || '',
                content: l.content || '',
                term: l.term || '',
                campaignId: c.campaignId || '',
                sourcePlatform: l.sourcePlatform || '',
                creativeFormat: l.creativeFormat || '',
                marketingTactic: l.marketingTactic || '',
                customParams: l.customParams ? JSON.parse(JSON.stringify(l.customParams)) : []
            };
            bulkRows.push(evaluateBulkRow(row));
        });
        window.bulkRows = bulkRows;
        if (typeof renderBulkRows === 'function') renderBulkRows();
        switchMode('bulk');
        showToast(`${bulkRows.length} links loaded into Bulk`);
    }

    function initCampaigns() {
        // Search
        if (campaignsSearch) {
            campaignsSearch.addEventListener('input', () => {
                renderCampaignList();
            });
        }

        // List View buttons
        if (btnCreateCampaign) btnCreateCampaign.addEventListener('click', openCreateCampaignModal);
        if (btnEmptyCreateCampaign) btnEmptyCreateCampaign.addEventListener('click', openCreateCampaignModal);

        // Detail View buttons
        if (btnCampaignsBack) {
            btnCampaignsBack.addEventListener('click', () => {
                activeCampaignId = null;
                renderCampaignList();
            });
        }
        if (btnAddTrackingLink) btnAddTrackingLink.addEventListener('click', openAddLinkModal);
        if (btnEmptyAddLink) btnEmptyAddLink.addEventListener('click', openAddLinkModal);
        if (btnCampaignCopyAll) btnCampaignCopyAll.addEventListener('click', copyAllCampaignUrls);
        if (btnCampaignExportCsv) btnCampaignExportCsv.addEventListener('click', exportCampaignCsv);
        if (btnCampaignOpenBulk) btnCampaignOpenBulk.addEventListener('click', openCampaignInBulk);
        if (btnCampaignRenameHeader) {
            btnCampaignRenameHeader.addEventListener('click', () => {
                if (activeCampaignId) openRenameCampaignModal(activeCampaignId);
            });
        }
        if (btnCampaignDuplicateHeader) {
            btnCampaignDuplicateHeader.addEventListener('click', () => {
                if (activeCampaignId) {
                    const dup = UTMStorage.duplicateCampaign(activeCampaignId);
                    if (dup) {
                        renderCampaignDetail(dup.id);
                        showToast('Campaign duplicated');
                    }
                }
            });
        }
        if (btnCampaignDeleteHeader) {
            btnCampaignDeleteHeader.addEventListener('click', () => {
                if (activeCampaignId) openCampaignDeleteModal(activeCampaignId);
            });
        }

        // Campaigns Grid Event Delegation
        if (campaignsGrid) {
            campaignsGrid.addEventListener('click', (e) => {
                const openBtn = e.target.closest('.btn-open-campaign');
                if (openBtn) {
                    const id = openBtn.dataset.id;
                    renderCampaignDetail(id);
                    return;
                }
                const dupBtn = e.target.closest('.btn-dup-campaign');
                if (dupBtn) {
                    const id = dupBtn.dataset.id;
                    UTMStorage.duplicateCampaign(id);
                    renderCampaignList();
                    showToast('Campaign duplicated');
                    return;
                }
                const renameBtn = e.target.closest('.btn-rename-campaign');
                if (renameBtn) {
                    const id = renameBtn.dataset.id;
                    openRenameCampaignModal(id);
                    return;
                }
                const delBtn = e.target.closest('.btn-delete-campaign');
                if (delBtn) {
                    const id = delBtn.dataset.id;
                    openCampaignDeleteModal(id);
                    return;
                }
            });
        }

        // Links Container Event Delegation
        if (campaignLinksContainer) {
            campaignLinksContainer.addEventListener('click', (e) => {
                const copyBtn = e.target.closest('.btn-link-copy');
                if (copyBtn) {
                    copyCampaignLinkUrl(copyBtn.dataset.linkId);
                    return;
                }
                const openBtn = e.target.closest('.btn-link-open');
                if (openBtn) {
                    openCampaignLinkInNewTab(openBtn.dataset.linkId);
                    return;
                }
                const qrBtn = e.target.closest('.btn-link-qr');
                if (qrBtn) {
                    if (!activeCampaignId) return;
                    const campaigns = (typeof UTMStorage !== 'undefined' && typeof UTMStorage.getCampaigns === 'function') 
                        ? UTMStorage.getCampaigns() 
                        : [];
                    const c = campaigns.find(x => x.id === activeCampaignId);
                    if (!c) return;
                    const link = (c.links || []).find(l => l.id === qrBtn.dataset.linkId);
                    if (!link) return;
                    const buildRes = buildCampaignLinkUrl(link, c);
                    if (buildRes.error || !buildRes.url) {
                        showToast('Complete destination, source, and medium first');
                        return;
                    }
                    openQrModal({
                        url: buildRes.url,
                        label: link.name,
                        campaignName: c.name,
                        linkName: link.name,
                        campaignId: c.id,
                        linkId: link.id
                    });
                    return;
                }
                const editBtn = e.target.closest('.btn-link-edit');
                if (editBtn) {
                    openEditLinkModal(editBtn.dataset.linkId);
                    return;
                }
                const dupBtn = e.target.closest('.btn-link-dup');
                if (dupBtn) {
                    if (!activeCampaignId) return;
                    UTMStorage.duplicateTrackingLink(activeCampaignId, dupBtn.dataset.linkId);
                    renderCampaignDetail(activeCampaignId);
                    showToast('Tracking link duplicated');
                    return;
                }
                const delBtn = e.target.closest('.btn-link-del');
                if (delBtn) {
                    openLinkDeleteModal(delBtn.dataset.linkId);
                    return;
                }
            });
        }

        // Modal event bindings: Campaign
        if (closeCampaignModal) closeCampaignModal.addEventListener('click', closeCampaignModalHandler);
        if (btnCancelCampaignModal) btnCancelCampaignModal.addEventListener('click', closeCampaignModalHandler);
        if (btnConfirmCampaignModal) btnConfirmCampaignModal.addEventListener('click', saveCampaignModalHandler);
        if (modalCampaign) {
            modalCampaign.addEventListener('click', (e) => {
                if (e.target === modalCampaign) closeCampaignModalHandler();
            });
        }
        if (campaignModalNameInput) {
            campaignModalNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveCampaignModalHandler();
                }
            });
        }
        if (campaignModalIdInput) {
            campaignModalIdInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveCampaignModalHandler();
                }
            });
        }

        // Modal event bindings: Campaign Delete
        if (closeCampaignDeleteModal) closeCampaignDeleteModal.addEventListener('click', closeCampaignDeleteModalHandler);
        if (btnCancelCampaignDelete) btnCancelCampaignDelete.addEventListener('click', closeCampaignDeleteModalHandler);
        if (btnConfirmCampaignDelete) btnConfirmCampaignDelete.addEventListener('click', confirmCampaignDeleteHandler);
        if (modalCampaignDelete) {
            modalCampaignDelete.addEventListener('click', (e) => {
                if (e.target === modalCampaignDelete) closeCampaignDeleteModalHandler();
            });
        }

        // Modal event bindings: Tracking Link
        if (closeLinkModal) closeLinkModal.addEventListener('click', closeLinkModalHandler);
        if (btnCancelLinkModal) btnCancelLinkModal.addEventListener('click', closeLinkModalHandler);
        if (btnConfirmLinkModal) btnConfirmLinkModal.addEventListener('click', saveLinkModalHandler);
        if (modalTrackingLink) {
            modalTrackingLink.addEventListener('click', (e) => {
                if (e.target === modalTrackingLink) closeLinkModalHandler();
            });
        }

        // Modal event bindings: Link Delete
        if (closeLinkDeleteModal) closeLinkDeleteModal.addEventListener('click', closeLinkDeleteModalHandler);
        if (btnCancelLinkDelete) btnCancelLinkDelete.addEventListener('click', closeLinkDeleteModalHandler);
        if (btnConfirmLinkDelete) btnConfirmLinkDelete.addEventListener('click', confirmLinkDeleteHandler);
        if (modalLinkDelete) {
            modalLinkDelete.addEventListener('click', (e) => {
                if (e.target === modalLinkDelete) closeLinkDeleteModalHandler();
            });
        }
    }

    // Expose helpers for testing and external access
    window.initCampaigns = initCampaigns;
    window.renderCampaignsUI = renderCampaignsUI;
    window.renderCampaignList = renderCampaignList;
    window.renderCampaignDetail = renderCampaignDetail;
    window.buildCampaignLinkUrl = buildCampaignLinkUrl;
    window.copyCampaignLinkUrl = copyCampaignLinkUrl;
    window.copyAllCampaignUrls = copyAllCampaignUrls;
    window.exportCampaignCsv = exportCampaignCsv;
    window.openCampaignInBulk = openCampaignInBulk;
    window.refreshCampaignsUI = refreshCampaignsUI;
    window.getActiveCampaignId = () => activeCampaignId;
    window.setActiveCampaignId = (id) => { activeCampaignId = id; };
    window.getCurrentMode = () => currentMode;

    // Campaign Workspace helpers
    window.validateCampaignForm = validateCampaignForm;
    window.saveCampaignFromWorkspace = saveCampaignFromWorkspace;
    window.reopenSavedCampaign = reopenSavedCampaign;
    window.cancelEditingCampaign = cancelEditingCampaign;
    window.renderSavedCampaigns = renderSavedCampaigns;
    window.openSavedModal = openSavedModal;
    window.closeSavedModal = closeSavedModal;
    window.switchSavedTab = switchSavedTab;
    window.addCustomParamRow = addCustomParamRow;
    window.clearAllInlineErrors = clearAllInlineErrors;
    window.getActiveEditingCampaignId = () => activeEditingCampaignId;

    // ==========================================
    // TOAST UTILITY
    // ==========================================
    function showToast(msg) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg;
        toastMsg.innerText = msg;
        toast.classList.remove('opacity-0', 'translate-y-24');
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-24');
        }, 3000);
    }
});
