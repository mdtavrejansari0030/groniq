/**
 * Groniq Research - Main Application Controller
 * Business & Competitor Research Tool
 * Version: 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================
    // STATE
    // =========================================================
    let currentProjectId = null;
    let currentTab = 'overview'; // 'overview' | 'business' | 'customers' | 'market' | 'competitors' | 'evidence' | 'insights' | 'action-brief'
    let activeCompetitorId = null;
    let pendingDeleteProjectId = null;
    let pendingDeleteCompetitorId = null;
    let autoSaveTimeout = null;

    // =========================================================
    // DOM CACHE
    // =========================================================
    const viewDashboard = document.getElementById('view-dashboard');
    const viewWorkspace = document.getElementById('view-workspace');

    // Dashboard Elements
    const btnNewResearchHero = document.getElementById('btn-new-research-hero');
    const btnNewResearchDash = document.getElementById('btn-new-research-dash');
    const btnOpenSavedDash = document.getElementById('btn-open-saved-dash');
    const projectsListContainer = document.getElementById('projects-list-container');
    const dashboardEmptyState = document.getElementById('dashboard-empty-state');
    const savedProjectsCount = document.getElementById('saved-projects-count');
    const btnExportAll = document.getElementById('btn-export-all');
    const btnImportAll = document.getElementById('btn-import-all');
    const fileImportInput = document.getElementById('file-import-input');

    // Workspace Header Elements
    const btnBackToDashboard = document.getElementById('btn-back-dashboard');
    const headerProjectName = document.getElementById('header-project-name');
    const headerProjectWebsite = document.getElementById('header-project-website');
    const headerProjectMeta = document.getElementById('header-project-meta');
    const saveStatusIndicator = document.getElementById('save-status-indicator');
    const btnWorkspaceDuplicate = document.getElementById('btn-workspace-duplicate');
    const btnWorkspaceDelete = document.getElementById('btn-workspace-delete');
    const btnWorkspaceExport = document.getElementById('btn-workspace-export');

    // Workspace Nav Tabs
    const workspaceTabs = document.querySelectorAll('.workspace-tab-btn');
    const workspaceSections = document.querySelectorAll('.workspace-section-pane');

    // Overview Elements
    const overviewBizName = document.getElementById('overview-biz-name');
    const overviewBizWebsite = document.getElementById('overview-biz-website');
    const overviewBizIndustry = document.getElementById('overview-biz-industry');
    const overviewBizMarket = document.getElementById('overview-biz-market');
    const overviewBizType = document.getElementById('overview-biz-type');
    const overviewLastUpdated = document.getElementById('overview-last-updated');
    const overviewGoalText = document.getElementById('overview-goal-text');
    const statBizFilled = document.getElementById('stat-biz-filled');
    const statCustFilled = document.getElementById('stat-cust-filled');
    const statMktFilled = document.getElementById('stat-mkt-filled');
    const statCompCount = document.getElementById('stat-comp-count');
    const statEvCount = document.getElementById('stat-ev-count');
    const statGapsCount = document.getElementById('stat-gaps-count');
    const statHypCount = document.getElementById('stat-hyp-count');

    // Competitors Elements
    const btnAddCompetitor = document.getElementById('btn-add-competitor');
    const competitorsListNav = document.getElementById('competitors-list-nav');
    const competitorDetailContainer = document.getElementById('competitor-detail-container');
    const competitorsEmptyState = document.getElementById('competitors-empty-state');
    const competitorTypeFilter = document.getElementById('competitor-type-filter');

    // Evidence Elements
    const btnAddEvidence = document.getElementById('btn-add-evidence');
    const evidenceListContainer = document.getElementById('evidence-list-container');
    const evidenceEmptyState = document.getElementById('evidence-empty-state');
    const evidenceStatusFilter = document.getElementById('evidence-status-filter');

    // Insights Elements
    const containerFacts = document.getElementById('container-facts');
    const containerInsights = document.getElementById('container-insights');
    const containerGaps = document.getElementById('container-gaps');
    const containerHypotheses = document.getElementById('container-hypotheses');
    const btnAddFact = document.getElementById('btn-add-fact');
    const btnAddInsight = document.getElementById('btn-add-insight');
    const btnAddGap = document.getElementById('btn-add-gap');
    const btnAddHypothesis = document.getElementById('btn-add-hypothesis');

    // Action Brief Elements
    const btnPullResearchToBrief = document.getElementById('btn-pull-research-brief');
    const btnCopyActionBrief = document.getElementById('btn-copy-action-brief');
    const btnExportActionBrief = document.getElementById('btn-export-action-brief');

    // Modals
    const modalCreate = document.getElementById('modal-create-project');
    const formCreate = document.getElementById('form-create-project');
    const btnCancelCreate = document.getElementById('btn-cancel-create');

    const modalAddEvidence = document.getElementById('modal-add-evidence');
    const formAddEvidence = document.getElementById('form-add-evidence');
    const btnCancelEvidence = document.getElementById('btn-cancel-evidence');

    const modalDeleteProject = document.getElementById('modal-delete-project');
    const btnConfirmDeleteProject = document.getElementById('btn-confirm-delete-project');
    const btnCancelDeleteProject = document.getElementById('btn-cancel-delete-project');

    const modalDeleteCompetitor = document.getElementById('modal-delete-competitor');
    const btnConfirmDeleteCompetitor = document.getElementById('btn-confirm-delete-competitor');
    const btnCancelDeleteCompetitor = document.getElementById('btn-cancel-delete-competitor');

    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    // =========================================================
    // INITIALIZATION
    // =========================================================
    initApp();

    function initApp() {
        setupEventListeners();
        renderDashboard();

        // Check URL hash or query params for direct project opening
        const urlParams = new URLSearchParams(window.location.search);
        const reqProjectId = urlParams.get('id');
        if (reqProjectId) {
            const exists = ResearchStorage.getProject(reqProjectId);
            if (exists) {
                openProject(reqProjectId);
            }
        }
    }

    // =========================================================
    // NAVIGATION & VIEW SWITCHING
    // =========================================================
    function showDashboard() {
        currentProjectId = null;
        if (viewDashboard) viewDashboard.classList.remove('hidden');
        if (viewWorkspace) viewWorkspace.classList.add('hidden');
        renderDashboard();
        window.history.replaceState(null, '', window.location.pathname);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openProject(projectId, defaultTab = 'overview') {
        const project = ResearchStorage.getProject(projectId);
        if (!project) {
            showToast('Project not found');
            showDashboard();
            return;
        }

        currentProjectId = projectId;
        if (viewDashboard) viewDashboard.classList.add('hidden');
        if (viewWorkspace) viewWorkspace.classList.remove('hidden');

        // Update URL
        const newUrl = `${window.location.pathname}?id=${encodeURIComponent(projectId)}`;
        window.history.replaceState(null, '', newUrl);

        renderWorkspaceHeader(project);
        populateWorkspaceForms(project);
        switchWorkspaceTab(defaultTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function switchWorkspaceTab(tabId) {
        currentTab = tabId;

        // Update Tab Buttons
        workspaceTabs.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('border-brand-green', 'text-brand-green', 'bg-brand-green/10');
                btn.classList.remove('border-transparent', 'text-brand-muted', 'hover:text-white');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('border-brand-green', 'text-brand-green', 'bg-brand-green/10');
                btn.classList.add('border-transparent', 'text-brand-muted', 'hover:text-white');
                btn.setAttribute('aria-selected', 'false');
            }
        });

        // Update Section Panes
        workspaceSections.forEach(sec => {
            if (sec.id === `section-${tabId}`) {
                sec.classList.remove('hidden');
            } else {
                sec.classList.add('hidden');
            }
        });

        const project = ResearchStorage.getProject(currentProjectId);
        if (project) {
            if (tabId === 'overview') renderOverview(project);
            if (tabId === 'competitors') renderCompetitors(project);
            if (tabId === 'evidence') renderEvidence(project);
            if (tabId === 'insights') renderInsights(project);
            if (tabId === 'action-brief') renderActionBrief(project);
        }

        if (window.lucide) lucide.createIcons();
    }

    // =========================================================
    // DASHBOARD RENDERING
    // =========================================================
    function renderDashboard() {
        const projects = ResearchStorage.getProjects();

        if (savedProjectsCount) {
            savedProjectsCount.textContent = `${projects.length} saved`;
        }

        if (!projects || projects.length === 0) {
            if (projectsListContainer) projectsListContainer.innerHTML = '';
            if (dashboardEmptyState) dashboardEmptyState.classList.remove('hidden');
            return;
        }

        if (dashboardEmptyState) dashboardEmptyState.classList.add('hidden');

        if (projectsListContainer) {
            projectsListContainer.innerHTML = projects.map(p => {
                const progress = ResearchStorage.calculateProgress(p);
                const relTime = formatRelativeTime(p.updatedAt || p.createdAt);
                const webClean = p.website ? p.website.replace(/^https?:\/\//i, '').replace(/\/$/, '') : '';

                return `
                    <div class="p-5 sm:p-6 rounded-2xl bg-[#0D0D0D] border border-[#1E1E1E] hover:border-[#333] transition-all flex flex-col justify-between group" data-project-id="${escapeHtml(p.id)}">
                        <div class="space-y-3">
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <div class="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 class="text-base font-black uppercase text-white tracking-wide group-hover:text-brand-green transition-colors">${escapeHtml(p.name)}</h3>
                                        ${p.businessType ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#141414] border border-[#262626] text-brand-mutedLight">${escapeHtml(p.businessType)}</span>` : ''}
                                    </div>
                                    <div class="flex items-center gap-2 text-xs font-mono text-brand-muted flex-wrap">
                                        ${webClean ? `<span class="text-brand-green truncate max-w-[200px] flex items-center gap-1"><i data-lucide="globe" class="w-3 h-3"></i> ${escapeHtml(webClean)}</span><span>•</span>` : ''}
                                        ${p.industry ? `<span>${escapeHtml(p.industry)}</span><span>•</span>` : ''}
                                        ${p.market ? `<span>${escapeHtml(p.market)}</span>` : ''}
                                    </div>
                                </div>
                                <div class="flex items-center gap-1 shrink-0">
                                    <button type="button" class="btn-dup-project p-2 rounded-lg text-brand-muted hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer" title="Duplicate research" aria-label="Duplicate research">
                                        <i data-lucide="copy" class="w-4 h-4 pointer-events-none"></i>
                                    </button>
                                    <button type="button" class="btn-delete-project p-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-[#1E1E1E] transition-colors cursor-pointer" title="Delete research" aria-label="Delete research">
                                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                    </button>
                                </div>
                            </div>

                            ${p.goal ? `
                                <div class="p-3 rounded-xl bg-[#080808] border border-[#161616]">
                                    <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-0.5">Goal</span>
                                    <p class="text-xs text-brand-mutedLight line-clamp-2 leading-relaxed">${escapeHtml(p.goal)}</p>
                                </div>
                            ` : ''}

                            <!-- Progress Breakdown Badges -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
                                <div class="px-2 py-1 rounded bg-[#111] border border-[#1F1F1F] text-brand-muted">
                                    <span class="text-white font-bold">${progress.competitorCount}</span> Competitors
                                </div>
                                <div class="px-2 py-1 rounded bg-[#111] border border-[#1F1F1F] text-brand-muted">
                                    <span class="text-white font-bold">${progress.evidenceCount}</span> Sources
                                </div>
                                <div class="px-2 py-1 rounded bg-[#111] border border-[#1F1F1F] text-brand-muted">
                                    <span class="text-white font-bold">${progress.hypothesesCount}</span> Hypotheses
                                </div>
                                <div class="px-2 py-1 rounded bg-[#111] border border-[#1F1F1F] text-brand-muted">
                                    <span class="text-white font-bold">${progress.gapsCount}</span> Gaps
                                </div>
                            </div>
                        </div>

                        <div class="pt-4 mt-4 border-t border-[#1C1C1C] flex items-center justify-between">
                            <span class="text-[10px] text-brand-muted">Updated ${escapeHtml(relTime)}</span>
                            <button type="button" class="btn-open-workspace px-4 py-2 bg-white text-black font-extrabold uppercase text-[11px] tracking-wider rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer">
                                <span>Open Workspace</span>
                                <i data-lucide="arrow-right" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind card event handlers
            projectsListContainer.querySelectorAll('.btn-open-workspace').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.target.closest('[data-project-id]');
                    if (card) openProject(card.dataset.projectId);
                });
            });

            projectsListContainer.querySelectorAll('.btn-dup-project').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = e.target.closest('[data-project-id]');
                    if (card) {
                        const dup = ResearchStorage.duplicateProject(card.dataset.projectId);
                        if (dup) {
                            showToast(`Duplicated "${dup.name}"`);
                            renderDashboard();
                        }
                    }
                });
            });

            projectsListContainer.querySelectorAll('.btn-delete-project').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = e.target.closest('[data-project-id]');
                    if (card) {
                        openDeleteProjectModal(card.dataset.projectId);
                    }
                });
            });
        }

        if (window.lucide) lucide.createIcons();
    }

    // =========================================================
    // WORKSPACE HEADER & FORM POPULATION
    // =========================================================
    function renderWorkspaceHeader(project) {
        if (headerProjectName) headerProjectName.textContent = project.name || 'Untitled Research';
        if (headerProjectWebsite) {
            if (project.website) {
                const clean = project.website.replace(/^https?:\/\//i, '').replace(/\/$/, '');
                headerProjectWebsite.textContent = clean;
                headerProjectWebsite.href = /^https?:\/\//i.test(project.website) ? project.website : `https://${project.website}`;
                headerProjectWebsite.classList.remove('hidden');
            } else {
                headerProjectWebsite.classList.add('hidden');
            }
        }
        if (headerProjectMeta) {
            const parts = [project.industry, project.market, project.businessType].filter(Boolean);
            headerProjectMeta.textContent = parts.join(' • ');
        }
    }

    function populateWorkspaceForms(project) {
        // Section: Business
        const biz = project.business || {};
        setInputValue('biz-description', biz.description);
        setInputValue('biz-products-services', biz.productsServices);
        setInputValue('biz-model', biz.businessModel);
        setInputValue('biz-primary-products', biz.primaryProducts);
        setInputValue('biz-price-range', biz.priceRange);
        setInputValue('biz-geography', biz.geography);
        setInputValue('biz-channel-type', biz.channelType || 'Online');
        setInputValue('biz-primary-conversion', biz.primaryConversion);
        setInputValue('biz-positioning', biz.positioning);
        setInputValue('biz-differentiators', biz.differentiators);
        setInputValue('biz-offers', biz.currentOffers);
        setInputValue('biz-marketing-channels', biz.marketingChannels);
        setInputValue('biz-goals', biz.businessGoals);
        setInputValue('biz-constraints', biz.constraints);
        setInputValue('biz-economics', biz.economics);
        setInputValue('biz-notes', biz.additionalNotes);

        // Section: Customers
        const cust = project.customers || {};
        setInputValue('cust-buyer-profile', cust.buyerProfile);
        setInputValue('cust-end-user-profile', cust.endUserProfile);
        setInputValue('cust-segments', cust.segments);
        setInputValue('cust-problems-needs', cust.problemsNeeds);
        setInputValue('cust-motivations', cust.motivations);
        setInputValue('cust-purchase-triggers', cust.purchaseTriggers);
        setInputValue('cust-objections', cust.objections);
        setInputValue('cust-trust-factors', cust.trustFactors);
        setInputValue('cust-decision-criteria', cust.decisionCriteria);
        setInputValue('cust-search-behavior', cust.searchBehavior);
        setInputValue('cust-discovery-behavior', cust.discoveryBehavior);
        setInputValue('cust-buying-journey', cust.buyingJourney);
        setInputValue('cust-questions', cust.customerQuestions);
        setInputValue('cust-language', cust.customerLanguage);
        setInputValue('cust-notes', cust.additionalNotes);

        // Section: Market
        const mkt = project.marketResearch || {};
        setInputValue('mkt-category', mkt.categoryDefinition);
        setInputValue('mkt-geography', mkt.geographyDynamics);
        setInputValue('mkt-demand', mkt.demandObservations);
        setInputValue('mkt-search', mkt.searchBehavior);
        setInputValue('mkt-discovery', mkt.discoveryBehavior);
        setInputValue('mkt-seasonality', mkt.seasonality);
        setInputValue('mkt-trends', mkt.trends);
        setInputValue('mkt-price-bands', mkt.priceBands);
        setInputValue('mkt-offers', mkt.commonOffers);
        setInputValue('mkt-terminology', mkt.categoryTerminology);
        setInputValue('mkt-commercial-themes', mkt.commercialThemes);
        setInputValue('mkt-opportunities', mkt.marketOpportunities);
        setInputValue('mkt-risks', mkt.marketRisks);
        setInputValue('mkt-unknowns', mkt.unknownsQuestions);

        // Section: Action Brief (Paid Ads)
        const pa = project.actionBrief?.paidAds || {};
        setInputValue('ab-objective', pa.businessObjective);
        setInputValue('ab-products', pa.relevantProducts);
        setInputValue('ab-customer-summary', pa.customerSummary);
        setInputValue('ab-demand-summary', pa.demandSummary);
        setInputValue('ab-channel-priorities', pa.channelPriorities);
        setInputValue('ab-channel-rationale', pa.channelRationale);
        setInputValue('ab-messaging-angles', pa.messagingAngles);
        setInputValue('ab-creative-hypotheses', pa.creativeHypotheses);
        setInputValue('ab-search-intent', pa.searchIntentThemes);
        setInputValue('ab-offer-hypotheses', pa.offerHypotheses);
        setInputValue('ab-landing-page', pa.landingPageRequirements);
        setInputValue('ab-conversion-actions', pa.conversionActions);
        setInputValue('ab-measurement', pa.measurementRequirements);
        setInputValue('ab-known-risks', pa.knownRisks);
        setInputValue('ab-unknowns', pa.unknownsBeforeLaunch);
        setInputValue('ab-recommended-tests', pa.recommendedTests);
    }

    function setInputValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    }

    function getInputValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    // =========================================================
    // AUTO-SAVE HANDLER
    // =========================================================
    function triggerAutoSave() {
        if (!currentProjectId) return;

        if (saveStatusIndicator) {
            saveStatusIndicator.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Saving...';
            saveStatusIndicator.classList.remove('text-brand-green');
            saveStatusIndicator.classList.add('text-amber-400');
        }

        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            collectAndSaveActiveProject();
        }, 400);
    }

    function collectAndSaveActiveProject() {
        if (!currentProjectId) return;

        const updates = {
            business: {
                description: getInputValue('biz-description'),
                productsServices: getInputValue('biz-products-services'),
                businessModel: getInputValue('biz-model'),
                primaryProducts: getInputValue('biz-primary-products'),
                priceRange: getInputValue('biz-price-range'),
                geography: getInputValue('biz-geography'),
                channelType: getInputValue('biz-channel-type'),
                primaryConversion: getInputValue('biz-primary-conversion'),
                positioning: getInputValue('biz-positioning'),
                differentiators: getInputValue('biz-differentiators'),
                currentOffers: getInputValue('biz-offers'),
                marketingChannels: getInputValue('biz-marketing-channels'),
                businessGoals: getInputValue('biz-goals'),
                constraints: getInputValue('biz-constraints'),
                economics: getInputValue('biz-economics'),
                additionalNotes: getInputValue('biz-notes')
            },
            customers: {
                buyerProfile: getInputValue('cust-buyer-profile'),
                endUserProfile: getInputValue('cust-end-user-profile'),
                segments: getInputValue('cust-segments'),
                problemsNeeds: getInputValue('cust-problems-needs'),
                motivations: getInputValue('cust-motivations'),
                purchaseTriggers: getInputValue('cust-purchase-triggers'),
                objections: getInputValue('cust-objections'),
                trustFactors: getInputValue('cust-trust-factors'),
                decisionCriteria: getInputValue('cust-decision-criteria'),
                searchBehavior: getInputValue('cust-search-behavior'),
                discoveryBehavior: getInputValue('cust-discovery-behavior'),
                buyingJourney: getInputValue('cust-buying-journey'),
                customerQuestions: getInputValue('cust-questions'),
                customerLanguage: getInputValue('cust-language'),
                additionalNotes: getInputValue('cust-notes')
            },
            marketResearch: {
                categoryDefinition: getInputValue('mkt-category'),
                geographyDynamics: getInputValue('mkt-geography'),
                demandObservations: getInputValue('mkt-demand'),
                searchBehavior: getInputValue('mkt-search'),
                discoveryBehavior: getInputValue('mkt-discovery'),
                seasonality: getInputValue('mkt-seasonality'),
                trends: getInputValue('mkt-trends'),
                priceBands: getInputValue('mkt-price-bands'),
                commonOffers: getInputValue('mkt-offers'),
                categoryTerminology: getInputValue('mkt-terminology'),
                commercialThemes: getInputValue('mkt-commercial-themes'),
                marketOpportunities: getInputValue('mkt-opportunities'),
                marketRisks: getInputValue('mkt-risks'),
                unknownsQuestions: getInputValue('mkt-unknowns')
            },
            actionBrief: {
                paidAds: {
                    businessObjective: getInputValue('ab-objective'),
                    relevantProducts: getInputValue('ab-products'),
                    customerSummary: getInputValue('ab-customer-summary'),
                    demandSummary: getInputValue('ab-demand-summary'),
                    channelPriorities: getInputValue('ab-channel-priorities'),
                    channelRationale: getInputValue('ab-channel-rationale'),
                    messagingAngles: getInputValue('ab-messaging-angles'),
                    creativeHypotheses: getInputValue('ab-creative-hypotheses'),
                    searchIntentThemes: getInputValue('ab-search-intent'),
                    offerHypotheses: getInputValue('ab-offer-hypotheses'),
                    landingPageRequirements: getInputValue('ab-landing-page'),
                    conversionActions: getInputValue('ab-conversion-actions'),
                    measurementRequirements: getInputValue('ab-measurement'),
                    knownRisks: getInputValue('ab-known-risks'),
                    unknownsBeforeLaunch: getInputValue('ab-unknowns'),
                    recommendedTests: getInputValue('ab-recommended-tests')
                }
            }
        };

        const updated = ResearchStorage.updateProject(currentProjectId, updates);
        if (updated && saveStatusIndicator) {
            saveStatusIndicator.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-brand-green"></span> Saved locally';
            saveStatusIndicator.classList.remove('text-amber-400');
            saveStatusIndicator.classList.add('text-brand-green');
        }
    }

    // =========================================================
    // SECTION: OVERVIEW
    // =========================================================
    function renderOverview(project) {
        if (!project) return;
        const progress = ResearchStorage.calculateProgress(project);

        if (overviewBizName) overviewBizName.textContent = project.name || 'Untitled';
        if (overviewBizWebsite) {
            overviewBizWebsite.textContent = project.website || 'Not specified';
            if (project.website) {
                overviewBizWebsite.href = /^https?:\/\//i.test(project.website) ? project.website : `https://${project.website}`;
            } else {
                overviewBizWebsite.removeAttribute('href');
            }
        }
        if (overviewBizIndustry) overviewBizIndustry.textContent = project.industry || 'Not specified';
        if (overviewBizMarket) overviewBizMarket.textContent = project.market || 'Not specified';
        if (overviewBizType) overviewBizType.textContent = project.businessType || 'Not specified';
        if (overviewLastUpdated) overviewLastUpdated.textContent = formatRelativeTime(project.updatedAt || project.createdAt);

        if (overviewGoalText) {
            overviewGoalText.textContent = project.goal || 'No specific decision goal defined yet.';
        }

        // Rule-based Progress counts
        if (statBizFilled) statBizFilled.textContent = `${progress.businessFilled} / ${progress.businessTotal}`;
        if (statCustFilled) statCustFilled.textContent = `${progress.customersFilled} / ${progress.customersTotal}`;
        if (statMktFilled) statMktFilled.textContent = `${progress.marketFilled} / ${progress.marketTotal}`;
        if (statCompCount) statCompCount.textContent = progress.competitorCount;
        if (statEvCount) statEvCount.textContent = progress.evidenceCount;
        if (statGapsCount) statGapsCount.textContent = progress.gapsCount;
        if (statHypCount) statHypCount.textContent = progress.hypothesesCount;
    }

    // =========================================================
    // SECTION: COMPETITORS
    // =========================================================
    function renderCompetitors(project) {
        if (!project) return;
        const comps = Array.isArray(project.competitors) ? project.competitors : [];

        // Filter competitors if type filter applied
        const filterType = competitorTypeFilter ? competitorTypeFilter.value : 'all';
        const filteredComps = filterType === 'all' ? comps : comps.filter(c => c.type === filterType);

        if (comps.length === 0) {
            if (competitorsEmptyState) competitorsEmptyState.classList.remove('hidden');
            if (competitorDetailContainer) competitorDetailContainer.classList.add('hidden');
            if (competitorsListNav) competitorsListNav.innerHTML = '';
            return;
        }

        if (competitorsEmptyState) competitorsEmptyState.classList.add('hidden');
        if (competitorDetailContainer) competitorDetailContainer.classList.remove('hidden');

        // Select first competitor if none currently active or invalid
        if (!activeCompetitorId || !comps.some(c => c.id === activeCompetitorId)) {
            activeCompetitorId = filteredComps[0] ? filteredComps[0].id : comps[0].id;
        }

        // Render Competitor List / Tabs
        if (competitorsListNav) {
            competitorsListNav.innerHTML = comps.map(c => {
                const isActive = c.id === activeCompetitorId;
                const typeBadgeClass = c.type === 'Direct' ? 'text-brand-green border-brand-green/30 bg-brand-green/10' :
                    (c.type === 'Indirect' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-amber-400 border-amber-400/30 bg-amber-400/10');

                return `
                    <button type="button" class="btn-select-competitor w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${isActive ? 'bg-[#181818] border-brand-green text-white' : 'bg-[#0E0E0E] border-[#222] text-brand-muted hover:text-white hover:border-[#333]'}" data-competitor-id="${escapeHtml(c.id)}">
                        <div class="truncate">
                            <h4 class="text-xs font-bold uppercase tracking-wide truncate ${isActive ? 'text-white' : ''}">${escapeHtml(c.name)}</h4>
                            <span class="text-[10px] text-brand-muted truncate block">${escapeHtml(c.website || 'No website')}</span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 border ${typeBadgeClass}">${escapeHtml(c.type || 'Direct')}</span>
                    </button>
                `;
            }).join('');

            competitorsListNav.querySelectorAll('.btn-select-competitor').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.competitorId;
                    if (id) {
                        saveActiveCompetitorForm();
                        activeCompetitorId = id;
                        renderCompetitors(ResearchStorage.getProject(currentProjectId));
                    }
                });
            });
        }

        // Render Active Competitor Profile Form
        const activeComp = comps.find(c => c.id === activeCompetitorId);
        if (activeComp) {
            renderCompetitorDetailForm(activeComp);
        }

        if (window.lucide) lucide.createIcons();
    }

    function renderCompetitorDetailForm(comp) {
        if (!competitorDetailContainer) return;

        competitorDetailContainer.innerHTML = `
            <div class="p-6 rounded-2xl bg-[#0D0D0D] border border-[#1E1E1E] space-y-6">
                <!-- Competitor Header & Actions -->
                <div class="flex items-start justify-between gap-4 pb-4 border-b border-[#1E1E1E] flex-wrap">
                    <div class="space-y-1 flex-1 min-w-[240px]">
                        <div class="flex items-center gap-3">
                            <input type="text" id="comp-name" class="bg-transparent text-lg font-black uppercase text-white tracking-wide border-b border-dashed border-[#444] focus:border-brand-green outline-none py-1 w-full" value="${escapeHtml(comp.name)}" placeholder="Competitor Name">
                        </div>
                        <div class="flex items-center gap-3 pt-1">
                            <input type="text" id="comp-website" class="bg-transparent text-xs font-mono text-brand-green border-b border-dashed border-[#333] focus:border-brand-green outline-none py-0.5 w-72" value="${escapeHtml(comp.website)}" placeholder="https://examplecompetitor.com">
                            <div class="flex items-center gap-1.5">
                                <select id="comp-type" class="bg-[#141414] border border-[#262626] rounded-lg px-2.5 py-1 text-xs font-bold uppercase text-white outline-none">
                                    <option value="Direct" ${comp.type === 'Direct' ? 'selected' : ''}>Direct</option>
                                    <option value="Indirect" ${comp.type === 'Indirect' ? 'selected' : ''}>Indirect</option>
                                    <option value="Substitute" ${comp.type === 'Substitute' ? 'selected' : ''}>Substitute</option>
                                </select>
                                <button type="button" class="btn-field-help text-brand-muted hover:text-brand-green p-0.5 rounded cursor-pointer transition-colors" data-help="comp-type" aria-label="Help: Competitor classification" title="Learn about direct, indirect, and substitute competitors">
                                    <i data-lucide="info" class="w-3 h-3 pointer-events-none"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" id="btn-delete-active-comp" class="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                            <span>Delete Competitor</span>
                        </button>
                    </div>
                </div>

                <!-- Sub-sections with tabs / collapsibles -->
                <div class="space-y-6">
                    <!-- Core Positioning & Offering -->
                    <div class="p-4 rounded-xl bg-[#090909] border border-[#181818] space-y-3">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <i data-lucide="target" class="w-3.5 h-3.5 text-brand-green"></i> Overview & Positioning
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Company Overview</label>
                                <textarea id="comp-overview" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="What they do, scale, market presence...">${escapeHtml(comp.overview)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Target Customer</label>
                                <textarea id="comp-target-customer" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Who they specifically sell to...">${escapeHtml(comp.targetCustomer)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Products / Services</label>
                                <textarea id="comp-products" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Core offerings and product lines...">${escapeHtml(comp.productsServices)}</textarea>
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5 mb-1">
                                    <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Pricing & Price Position</label>
                                    <button type="button" class="btn-field-help text-brand-muted hover:text-brand-green p-0.5 rounded cursor-pointer transition-colors" data-help="comp-pricing" aria-label="Help: Competitor pricing" title="Learn about competitor pricing and economics">
                                        <i data-lucide="info" class="w-3 h-3 pointer-events-none"></i>
                                    </button>
                                </div>
                                <textarea id="comp-pricing" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Low-cost, premium, subscription tiers, pricing transparency...">${escapeHtml(comp.pricingPosition)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Core Positioning & USP</label>
                                <textarea id="comp-usp" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Primary claim, differentiator or brand promise...">${escapeHtml(comp.uspMessaging)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Current Active Offers</label>
                                <textarea id="comp-offers" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Lead magnets, discounts, free trials, bundles...">${escapeHtml(comp.offers)}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Website / CRO Observations -->
                    <div class="p-4 rounded-xl bg-[#090909] border border-[#181818] space-y-3">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <i data-lucide="layout" class="w-3.5 h-3.5 text-brand-green"></i> Website & CRO Observations
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Hero Message & Value Prop</label>
                                <textarea id="comp-cro-hero" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Headline, subheadline, above-the-fold focus...">${escapeHtml(comp.websiteCro?.heroMessage)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Primary CTA</label>
                                <textarea id="comp-cro-cta" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Button text, color, placement, friction level...">${escapeHtml(comp.websiteCro?.cta)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Trust Signals & Proof</label>
                                <textarea id="comp-cro-trust" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Badges, press logos, guarantees, certifications...">${escapeHtml(comp.websiteCro?.trustSignals)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Reviews & Social Proof</label>
                                <textarea id="comp-cro-reviews" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Star ratings, video testimonials, customer volume...">${escapeHtml(comp.websiteCro?.reviewsSocialProof)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Conversion Flow & Steps</label>
                                <textarea id="comp-cro-flow" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Checkout steps, form fields, quiz, booking calendar...">${escapeHtml(comp.websiteCro?.conversionFlow)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Landing Page Observations</label>
                                <textarea id="comp-cro-lp" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Dedicated campaign pages, structure, strengths...">${escapeHtml(comp.websiteCro?.landingPageObservations)}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Paid Media Observations -->
                    <div class="p-4 rounded-xl bg-[#090909] border border-[#181818] space-y-3">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                <i data-lucide="megaphone" class="w-3.5 h-3.5 text-brand-green"></i> Paid Media Observations
                            </h4>
                            <span class="text-[10px] text-amber-400 font-mono">Note: Observation does not prove profitability</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Observed Channels</label>
                                <input type="text" id="comp-pm-channels" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none" value="${escapeHtml(comp.paidMedia?.observedChannels)}" placeholder="e.g. Google Search (Commercial), Meta Ads (Video / Social), YouTube">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Messaging Themes in Ads</label>
                                <input type="text" id="comp-pm-messaging" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none" value="${escapeHtml(comp.paidMedia?.messaging)}" placeholder="e.g. Cost efficiency, verified ROI, turnkey setup, satisfaction guarantee...">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Creative Formats & Angles</label>
                                <input type="text" id="comp-pm-creative" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none" value="${escapeHtml(comp.paidMedia?.creativeObservations)}" placeholder="e.g. Comparison static cards, customer case studies, workflow demos...">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Observed Ad Offers</label>
                                <input type="text" id="comp-pm-offers" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none" value="${escapeHtml(comp.paidMedia?.offerObservations)}" placeholder="e.g. 14-day zero-risk trial, free diagnostic audit, volume pricing discount...">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Landing Destinations</label>
                                <input type="text" id="comp-pm-destinations" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none" value="${escapeHtml(comp.paidMedia?.landingDestinations)}" placeholder="e.g. Dedicated comparison landing page, interactive evaluation tool, direct product page...">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Paid Media Notes</label>
                                <input type="text" id="comp-pm-notes" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none" value="${escapeHtml(comp.paidMedia?.notes)}" placeholder="e.g. Top 3 video variants live for 90+ days indicating sustained performance...">
                            </div>
                        </div>
                    </div>

                    <!-- SEO & Organic Observations -->
                    <div class="p-4 rounded-xl bg-[#090909] border border-[#181818] space-y-3">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <i data-lucide="search" class="w-3.5 h-3.5 text-brand-green"></i> SEO & Organic Search Observations
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Visible Commercial Pages</label>
                                <textarea id="comp-seo-pages" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Category hubs, comparison pages, location pages...">${escapeHtml(comp.seo?.visiblePages)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Content Themes & Keyword Observations</label>
                                <textarea id="comp-seo-themes" rows="2" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Topics they rank for, blog strategy, informational guides...">${escapeHtml(comp.seo?.contentThemes)}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Synthesis & Opportunities -->
                    <div class="p-4 rounded-xl bg-[#090909] border border-[#181818] space-y-3">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-brand-green"></i> Synthesis: Strengths & Exploitable Gaps
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Observed Strengths</label>
                                <textarea id="comp-strengths" rows="3" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Where they appear strong or dominant...">${escapeHtml(comp.strengths)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Observed Weaknesses / Friction</label>
                                <textarea id="comp-weaknesses" rows="3" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Customer complaints, site friction, weak positioning...">${escapeHtml(comp.weaknesses)}</textarea>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-1">Opportunities Noticed</label>
                                <textarea id="comp-opportunities" rows="3" class="w-full bg-[#111] border border-[#222] focus:border-brand-green rounded-lg p-2.5 text-xs text-white outline-none resize-none" placeholder="Where our business can counter-position or outperform...">${escapeHtml(comp.opportunitiesNoticed)}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind auto-save on input for all competitor fields
        competitorDetailContainer.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => {
                triggerAutoSaveCompetitor();
            });
        });

        // Bind Delete Competitor Button
        const btnDel = competitorDetailContainer.querySelector('#btn-delete-active-comp');
        if (btnDel) {
            btnDel.addEventListener('click', () => {
                openDeleteCompetitorModal(activeCompetitorId);
            });
        }

        if (window.lucide) lucide.createIcons();
    }

    function triggerAutoSaveCompetitor() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveActiveCompetitorForm();
        }, 400);
    }

    function saveActiveCompetitorForm() {
        if (!currentProjectId || !activeCompetitorId) return;
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project || !Array.isArray(project.competitors)) return;

        const idx = project.competitors.findIndex(c => c.id === activeCompetitorId);
        if (idx === -1) return;

        const comp = project.competitors[idx];
        comp.name = getInputValue('comp-name') || comp.name;
        comp.website = getInputValue('comp-website');
        comp.type = getInputValue('comp-type') || 'Direct';
        comp.overview = getInputValue('comp-overview');
        comp.targetCustomer = getInputValue('comp-target-customer');
        comp.productsServices = getInputValue('comp-products');
        comp.pricingPosition = getInputValue('comp-pricing');
        comp.uspMessaging = getInputValue('comp-usp');
        comp.offers = getInputValue('comp-offers');

        comp.websiteCro = {
            heroMessage: getInputValue('comp-cro-hero'),
            cta: getInputValue('comp-cro-cta'),
            trustSignals: getInputValue('comp-cro-trust'),
            reviewsSocialProof: getInputValue('comp-cro-reviews'),
            conversionFlow: getInputValue('comp-cro-flow'),
            landingPageObservations: getInputValue('comp-cro-lp')
        };

        comp.paidMedia = {
            observedChannels: getInputValue('comp-pm-channels'),
            messaging: getInputValue('comp-pm-messaging'),
            creativeObservations: getInputValue('comp-pm-creative'),
            offerObservations: getInputValue('comp-pm-offers'),
            landingDestinations: getInputValue('comp-pm-destinations'),
            notes: getInputValue('comp-pm-notes')
        };

        comp.seo = {
            visiblePages: getInputValue('comp-seo-pages'),
            contentThemes: getInputValue('comp-seo-themes'),
            searchObservations: '',
            keywordObservations: ''
        };

        comp.strengths = getInputValue('comp-strengths');
        comp.weaknesses = getInputValue('comp-weaknesses');
        comp.opportunitiesNoticed = getInputValue('comp-opportunities');
        comp.updatedAt = new Date().toISOString();

        project.competitors[idx] = comp;
        ResearchStorage.saveProjects(ResearchStorage.getProjects().map(p => p.id === currentProjectId ? project : p));

        // Update name badge in competitor list
        const navBtn = competitorsListNav?.querySelector(`[data-competitor-id="${activeCompetitorId}"] h4`);
        if (navBtn) navBtn.textContent = comp.name;

        if (saveStatusIndicator) {
            saveStatusIndicator.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-brand-green"></span> Saved locally';
        }
    }

    // =========================================================
    // SECTION: EVIDENCE LIBRARY
    // =========================================================
    function renderEvidence(project) {
        if (!project) return;
        const evidence = Array.isArray(project.evidence) ? project.evidence : [];

        const filterStatus = evidenceStatusFilter ? evidenceStatusFilter.value : 'all';
        const filteredEvidence = filterStatus === 'all' ? evidence : evidence.filter(e => e.status === filterStatus);

        if (evidence.length === 0) {
            if (evidenceEmptyState) evidenceEmptyState.classList.remove('hidden');
            if (evidenceListContainer) evidenceListContainer.innerHTML = '';
            return;
        }

        if (evidenceEmptyState) evidenceEmptyState.classList.add('hidden');

        if (evidenceListContainer) {
            if (filteredEvidence.length === 0) {
                evidenceListContainer.innerHTML = '<p class="text-xs text-brand-muted py-6 text-center">No evidence matches the selected filter.</p>';
                return;
            }

            evidenceListContainer.innerHTML = filteredEvidence.map(ev => {
                const statusBadge = getEvidenceStatusBadge(ev.status);
                const safeUrl = ev.sourceUrl && /^https?:\/\//i.test(ev.sourceUrl) ? ev.sourceUrl : (ev.sourceUrl ? `https://${ev.sourceUrl}` : '');

                return `
                    <div class="p-4 rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] hover:border-[#333] transition-all space-y-3" data-evidence-id="${escapeHtml(ev.id)}">
                        <div class="flex items-start justify-between gap-3">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h4 class="text-xs font-bold text-white uppercase tracking-wide">${escapeHtml(ev.title)}</h4>
                                    ${statusBadge}
                                    <span class="px-2 py-0.5 rounded text-[9px] font-mono bg-[#141414] border border-[#222] text-brand-muted">${escapeHtml(ev.sourceType || 'Source')}</span>
                                    ${ev.association ? `<span class="px-2 py-0.5 rounded text-[9px] font-mono bg-[#141414] border border-[#222] text-brand-green">${escapeHtml(ev.association)}</span>` : ''}
                                </div>
                                ${safeUrl ? `
                                    <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener" class="text-xs font-mono text-brand-green hover:underline inline-flex items-center gap-1">
                                        <i data-lucide="external-link" class="w-3 h-3"></i> ${escapeHtml(ev.sourceUrl)}
                                    </a>
                                ` : ''}
                            </div>
                            <button type="button" class="btn-delete-evidence p-1.5 text-brand-muted hover:text-red-400 rounded-lg transition-colors cursor-pointer" title="Delete evidence" aria-label="Delete evidence">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                            </button>
                        </div>

                        ${ev.notes ? `
                            <div class="p-3 rounded-lg bg-[#080808] border border-[#161616] text-xs text-brand-mutedLight leading-relaxed">
                                <p>${escapeHtml(ev.notes)}</p>
                            </div>
                        ` : ''}

                        <div class="flex items-center justify-between text-[10px] text-brand-muted font-mono pt-1 border-t border-[#161616]">
                            <span>Observed: ${escapeHtml(ev.dateObserved || 'Recent')}</span>
                            ${ev.screenshotRef ? `<span class="text-brand-muted truncate max-w-xs">Ref: ${escapeHtml(ev.screenshotRef)}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            evidenceListContainer.querySelectorAll('.btn-delete-evidence').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.target.closest('[data-evidence-id]');
                    if (card) {
                        deleteEvidence(card.dataset.evidenceId);
                    }
                });
            });
        }

        if (window.lucide) lucide.createIcons();
    }

    function getEvidenceStatusBadge(status) {
        if (status === 'Verified from source') {
            return `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green border border-brand-green/30">Verified</span>`;
        } else if (status === 'User provided') {
            return `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">User Provided</span>`;
        } else if (status === 'Inference') {
            return `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">Inference</span>`;
        } else {
            return `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/30">Needs Verification</span>`;
        }
    }

    function deleteEvidence(evId) {
        if (!currentProjectId || !evId) return;
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project || !Array.isArray(project.evidence)) return;

        project.evidence = project.evidence.filter(e => e.id !== evId);
        ResearchStorage.saveProjects(ResearchStorage.getProjects().map(p => p.id === currentProjectId ? project : p));
        showToast('Evidence deleted');
        renderEvidence(project);
    }

    // =========================================================
    // SECTION: INSIGHTS (4 PILLARS)
    // =========================================================
    function renderInsights(project) {
        if (!project) return;
        const ins = project.insights || { facts: [], insights: [], gaps: [], hypotheses: [] };

        renderInsightPillar(containerFacts, ins.facts, 'fact', 'No facts added yet. Record observations strictly backed by evidence.');
        renderInsightPillar(containerInsights, ins.insights, 'insight', 'No insights yet. What do the facts mean for positioning or channels?');
        renderInsightPillar(containerGaps, ins.gaps, 'gap', 'No research gaps yet. What critical unknowns still need investigation?');
        renderInsightPillar(containerHypotheses, ins.hypotheses, 'hypothesis', 'No hypotheses yet. Formulate ideas worth testing as marketing experiments.');

        if (window.lucide) lucide.createIcons();
    }

    function renderInsightPillar(container, items, type, emptyMsg) {
        if (!container) return;
        const list = Array.isArray(items) ? items : [];

        if (list.length === 0) {
            container.innerHTML = `<p class="text-[11px] text-brand-muted p-4 text-center border border-dashed border-[#1E1E1E] rounded-xl">${escapeHtml(emptyMsg)}</p>`;
            return;
        }

        container.innerHTML = list.map(item => `
            <div class="p-3 rounded-xl bg-[#0E0E0E] border border-[#222] hover:border-[#333] transition-all flex items-start justify-between gap-2 group" data-item-id="${escapeHtml(item.id)}" data-item-type="${escapeHtml(type)}">
                <p class="text-xs text-white leading-relaxed flex-1">${escapeHtml(item.text)}</p>
                <button type="button" class="btn-delete-insight-item text-brand-muted hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" aria-label="Delete item">
                    <i data-lucide="x" class="w-3.5 h-3.5 pointer-events-none"></i>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete-insight-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('[data-item-id]');
                if (card) {
                    deleteInsightItem(card.dataset.itemType, card.dataset.itemId);
                }
            });
        });
    }

    function addInsightItem(type) {
        if (!currentProjectId) return;
        const labelMap = {
            fact: 'Fact (Supported by available evidence)',
            insight: 'Insight (What this fact means for marketing)',
            gap: 'Research Gap (Important unknown that needs verification)',
            hypothesis: 'Hypothesis (Idea worth testing as an experiment)'
        };

        const input = prompt(`Enter ${labelMap[type] || 'item'}:`);
        if (!input || !input.trim()) return;

        const project = ResearchStorage.getProject(currentProjectId);
        if (!project) return;
        if (!project.insights) project.insights = { facts: [], insights: [], gaps: [], hypotheses: [] };

        const newItem = {
            id: 'ins_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
            text: input.trim(),
            createdAt: new Date().toISOString()
        };

        const pluralKey = type === 'fact' ? 'facts' : (type === 'insight' ? 'insights' : (type === 'gap' ? 'gaps' : 'hypotheses'));
        if (!Array.isArray(project.insights[pluralKey])) project.insights[pluralKey] = [];
        project.insights[pluralKey].push(newItem);

        ResearchStorage.saveProjects(ResearchStorage.getProjects().map(p => p.id === currentProjectId ? project : p));
        showToast(`Added ${type}`);
        renderInsights(project);
    }

    function deleteInsightItem(type, itemId) {
        if (!currentProjectId || !itemId) return;
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project || !project.insights) return;

        const pluralKey = type === 'fact' ? 'facts' : (type === 'insight' ? 'insights' : (type === 'gap' ? 'gaps' : 'hypotheses'));
        if (Array.isArray(project.insights[pluralKey])) {
            project.insights[pluralKey] = project.insights[pluralKey].filter(it => it.id !== itemId);
            ResearchStorage.saveProjects(ResearchStorage.getProjects().map(p => p.id === currentProjectId ? project : p));
            renderInsights(project);
        }
    }

    // =========================================================
    // SECTION: ACTION BRIEF
    // =========================================================
    function renderActionBrief(project) {
        if (!project) return;
        const pa = project.actionBrief?.paidAds || {};
        populateWorkspaceForms(project);
    }

    function pullResearchToBrief() {
        if (!currentProjectId) return;
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project) return;

        // Auto-summarize fields where appropriate
        const biz = project.business || {};
        const cust = project.customers || {};
        const mkt = project.marketResearch || {};

        if (!getInputValue('ab-objective') && project.goal) {
            setInputValue('ab-objective', project.goal);
        }
        if (!getInputValue('ab-products') && biz.primaryProducts) {
            setInputValue('ab-products', biz.primaryProducts);
        }
        if (!getInputValue('ab-customer-summary')) {
            const custParts = [
                cust.buyerProfile ? `Buyer: ${cust.buyerProfile}` : '',
                cust.purchaseTriggers ? `Triggers: ${cust.purchaseTriggers}` : '',
                cust.objections ? `Objections: ${cust.objections}` : ''
            ].filter(Boolean);
            if (custParts.length > 0) setInputValue('ab-customer-summary', custParts.join('\n'));
        }
        if (!getInputValue('ab-demand-summary')) {
            const mktParts = [
                mkt.demandObservations ? `Demand: ${mkt.demandObservations}` : '',
                mkt.searchBehavior ? `Search Intent: ${mkt.searchBehavior}` : '',
                mkt.discoveryBehavior ? `Discovery: ${mkt.discoveryBehavior}` : ''
            ].filter(Boolean);
            if (mktParts.length > 0) setInputValue('ab-demand-summary', mktParts.join('\n'));
        }
        if (!getInputValue('ab-conversion-actions') && biz.primaryConversion) {
            setInputValue('ab-conversion-actions', `Primary Conversion Action: ${biz.primaryConversion}`);
        }

        collectAndSaveActiveProject();
        showToast('Synthesized research notes into Action Brief');
    }

    function generateActionBriefMarkdown(project) {
        if (!project) return '';
        const pa = project.actionBrief?.paidAds || {};
        const biz = project.business || {};

        return `# PAID MEDIA ACTION BRIEF
Business: ${project.name}
Website: ${project.website || 'N/A'}
Market: ${project.market || 'N/A'}
Generated: ${new Date().toLocaleDateString()}

## 1. BUSINESS OBJECTIVE
${pa.businessObjective || project.goal || 'Not specified'}

## 2. RELEVANT PRODUCTS / SERVICES
${pa.relevantProducts || biz.primaryProducts || 'Not specified'}

## 3. CUSTOMER UNDERSTANDING
${pa.customerSummary || 'Not specified'}

## 4. DEMAND BEHAVIOR
${pa.demandSummary || 'Not specified'}

## 5. POTENTIAL CHANNEL PRIORITIES
${pa.channelPriorities || 'Not specified'}

## 6. WHY THESE CHANNELS ARE RELEVANT (HYPOTHESIS)
${pa.channelRationale || 'Not specified'}

## 7. MESSAGING ANGLES (OBSERVATION-BASED)
${pa.messagingAngles || 'Not specified'}

## 8. CREATIVE HYPOTHESES
${pa.creativeHypotheses || 'Not specified'}

## 9. SEARCH INTENT & KEYWORD THEMES
${pa.searchIntentThemes || 'Not specified'}

## 10. OFFER HYPOTHESES
${pa.offerHypotheses || 'Not specified'}

## 11. LANDING PAGE REQUIREMENTS
${pa.landingPageRequirements || 'Not specified'}

## 12. CONVERSION ACTIONS
${pa.conversionActions || biz.primaryConversion || 'Not specified'}

## 13. MEASUREMENT REQUIREMENTS
${pa.measurementRequirements || 'UTM tagging required across all ad destination links.'}

## 14. KNOWN RISKS
${pa.knownRisks || 'None documented'}

## 15. UNKNOWNS BEFORE LAUNCH (GAPS)
${pa.unknownsBeforeLaunch || 'None documented'}

## 16. RECOMMENDED TESTS (FIRST EXPERIMENTS)
${pa.recommendedTests || 'Not specified'}
`;
    }

    function copyActionBrief() {
        if (!currentProjectId) return;
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project) return;

        collectAndSaveActiveProject();
        const md = generateActionBriefMarkdown(project);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(md).then(() => {
                showToast('Action brief copied as Markdown');
            }).catch(() => {
                showToast('Copied to clipboard');
            });
        }
    }

    function exportActionBriefFile() {
        if (!currentProjectId) return;
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project) return;

        collectAndSaveActiveProject();
        const md = generateActionBriefMarkdown(project);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (project.name || 'research').toLowerCase().replace(/[^a-z0-9]/g, '_');
        a.href = url;
        a.download = `${safeName}_paid_media_brief.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Brief downloaded');
    }

    // =========================================================
    // MODAL HANDLERS
    // =========================================================
    function openCreateModal() {
        if (modalCreate) {
            modalCreate.classList.remove('hidden');
            const nameInput = document.getElementById('new-project-name');
            if (nameInput) {
                nameInput.value = '';
                nameInput.focus();
            }
            if (formCreate) formCreate.reset();
        }
    }

    function closeCreateModal() {
        if (modalCreate) modalCreate.classList.add('hidden');
    }

    function handleCreateProject(e) {
        e.preventDefault();
        const name = (document.getElementById('new-project-name')?.value || '').trim();
        const goal = (document.getElementById('new-project-goal')?.value || '').trim();
        const website = (document.getElementById('new-project-website')?.value || '').trim();
        const industry = (document.getElementById('new-project-industry')?.value || '').trim();
        const businessType = (document.getElementById('new-project-type')?.value || '').trim();
        const market = (document.getElementById('new-project-market')?.value || '').trim();

        if (!name) {
            showToast('Business Name is required');
            document.getElementById('new-project-name')?.focus();
            return;
        }

        if (!goal) {
            showToast('Please state what you are trying to understand or decide');
            document.getElementById('new-project-goal')?.focus();
            return;
        }

        const project = ResearchStorage.createProject({
            name,
            website,
            industry,
            businessType,
            market,
            goal
        });

        closeCreateModal();
        showToast(`Created research workspace for "${project.name}"`);
        openProject(project.id);
    }

    function openAddEvidenceModal() {
        if (!modalAddEvidence) return;
        const assocSelect = document.getElementById('ev-association');
        if (assocSelect && currentProjectId) {
            const project = ResearchStorage.getProject(currentProjectId);
            const comps = Array.isArray(project?.competitors) ? project.competitors : [];
            assocSelect.innerHTML = `
                <option value="Our Business">Our Business (${escapeHtml(project?.name || 'Self')})</option>
                ${comps.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (Competitor)</option>`).join('')}
            `;
        }

        if (formAddEvidence) formAddEvidence.reset();
        const dateInput = document.getElementById('ev-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        modalAddEvidence.classList.remove('hidden');
        document.getElementById('ev-title')?.focus();
    }

    function closeAddEvidenceModal() {
        if (modalAddEvidence) modalAddEvidence.classList.add('hidden');
    }

    function handleAddEvidenceSubmit(e) {
        e.preventDefault();
        if (!currentProjectId) return;

        const title = (document.getElementById('ev-title')?.value || '').trim();
        const url = (document.getElementById('ev-url')?.value || '').trim();
        const type = document.getElementById('ev-type')?.value;
        const status = document.getElementById('ev-status')?.value;
        const assoc = document.getElementById('ev-association')?.value;
        const date = document.getElementById('ev-date')?.value;
        const notes = (document.getElementById('ev-notes')?.value || '').trim();
        const ref = (document.getElementById('ev-ref')?.value || '').trim();

        if (!title) {
            showToast('Evidence title/finding is required');
            return;
        }

        const project = ResearchStorage.getProject(currentProjectId);
        if (!project) return;
        if (!Array.isArray(project.evidence)) project.evidence = [];

        const ev = ResearchStorage.createEvidence({
            title,
            sourceUrl: url,
            sourceType: type,
            status,
            association: assoc,
            dateObserved: date,
            notes,
            screenshotRef: ref
        });

        project.evidence.unshift(ev);
        ResearchStorage.saveProjects(ResearchStorage.getProjects().map(p => p.id === currentProjectId ? project : p));

        closeAddEvidenceModal();
        showToast('Evidence saved to library');
        renderEvidence(project);
    }

    function openDeleteProjectModal(projectId) {
        pendingDeleteProjectId = projectId;
        if (modalDeleteProject) modalDeleteProject.classList.remove('hidden');
    }

    function closeDeleteProjectModal() {
        pendingDeleteProjectId = null;
        if (modalDeleteProject) modalDeleteProject.classList.add('hidden');
    }

    function confirmDeleteProject() {
        if (pendingDeleteProjectId) {
            ResearchStorage.deleteProject(pendingDeleteProjectId);
            closeDeleteProjectModal();
            showToast('Research project deleted');
            if (currentProjectId === pendingDeleteProjectId) {
                showDashboard();
            } else {
                renderDashboard();
            }
        }
    }

    function openDeleteCompetitorModal(compId) {
        pendingDeleteCompetitorId = compId;
        if (modalDeleteCompetitor) modalDeleteCompetitor.classList.remove('hidden');
    }

    function closeDeleteCompetitorModal() {
        pendingDeleteCompetitorId = null;
        if (modalDeleteCompetitor) modalDeleteCompetitor.classList.add('hidden');
    }

    function confirmDeleteCompetitor() {
        if (!currentProjectId || !pendingDeleteCompetitorId) return;
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project || !Array.isArray(project.competitors)) return;

        project.competitors = project.competitors.filter(c => c.id !== pendingDeleteCompetitorId);
        ResearchStorage.saveProjects(ResearchStorage.getProjects().map(p => p.id === currentProjectId ? project : p));

        activeCompetitorId = project.competitors[0] ? project.competitors[0].id : null;
        closeDeleteCompetitorModal();
        showToast('Competitor removed');
        renderCompetitors(project);
    }

    function addNewCompetitor() {
        if (!currentProjectId) return;
        const name = prompt('Enter competitor business name:');
        if (!name || !name.trim()) return;

        const website = prompt('Enter competitor website URL (optional):') || '';
        const project = ResearchStorage.getProject(currentProjectId);
        if (!project) return;
        if (!Array.isArray(project.competitors)) project.competitors = [];

        const comp = ResearchStorage.createCompetitor(name.trim(), website.trim(), 'Direct');
        project.competitors.push(comp);
        ResearchStorage.saveProjects(ResearchStorage.getProjects().map(p => p.id === currentProjectId ? project : p));

        activeCompetitorId = comp.id;
        showToast(`Added competitor "${comp.name}"`);
        renderCompetitors(project);
    }

    // =========================================================
    // EVENT LISTENERS BINDING
    // =========================================================
    function setupEventListeners() {
        // Navigation Buttons
        if (btnNewResearchHero) btnNewResearchHero.addEventListener('click', openCreateModal);
        if (btnNewResearchDash) btnNewResearchDash.addEventListener('click', openCreateModal);
        if (btnOpenSavedDash) {
            btnOpenSavedDash.addEventListener('click', () => {
                const el = document.getElementById('saved-research-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            });
        }
        if (btnBackToDashboard) btnBackToDashboard.addEventListener('click', showDashboard);

        // Workspace Tabs Click
        workspaceTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                collectAndSaveActiveProject();
                switchWorkspaceTab(btn.dataset.tab);
            });
        });

        // Form Inputs Live Auto-Save
        document.querySelectorAll('#view-workspace input, #view-workspace textarea, #view-workspace select').forEach(inp => {
            inp.addEventListener('input', triggerAutoSave);
        });

        // Quick Link Buttons in Overview
        document.querySelectorAll('.btn-jump-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                if (tab) switchWorkspaceTab(tab);
            });
        });

        // Competitors Actions
        if (btnAddCompetitor) btnAddCompetitor.addEventListener('click', addNewCompetitor);
        if (competitorTypeFilter) {
            competitorTypeFilter.addEventListener('change', () => {
                renderCompetitors(ResearchStorage.getProject(currentProjectId));
            });
        }

        // Evidence Actions
        if (btnAddEvidence) btnAddEvidence.addEventListener('click', openAddEvidenceModal);
        if (evidenceStatusFilter) {
            evidenceStatusFilter.addEventListener('change', () => {
                renderEvidence(ResearchStorage.getProject(currentProjectId));
            });
        }

        // Insights 4-Pillar Actions
        if (btnAddFact) btnAddFact.addEventListener('click', () => addInsightItem('fact'));
        if (btnAddInsight) btnAddInsight.addEventListener('click', () => addInsightItem('insight'));
        if (btnAddGap) btnAddGap.addEventListener('click', () => addInsightItem('gap'));
        if (btnAddHypothesis) btnAddHypothesis.addEventListener('click', () => addInsightItem('hypothesis'));

        // Action Brief Actions
        if (btnPullResearchToBrief) btnPullResearchToBrief.addEventListener('click', pullResearchToBrief);
        if (btnCopyActionBrief) btnCopyActionBrief.addEventListener('click', copyActionBrief);
        if (btnExportActionBrief) btnExportActionBrief.addEventListener('click', exportActionBriefFile);

        // Workspace Header Actions
        if (btnWorkspaceDuplicate) {
            btnWorkspaceDuplicate.addEventListener('click', () => {
                if (currentProjectId) {
                    const dup = ResearchStorage.duplicateProject(currentProjectId);
                    if (dup) {
                        showToast(`Duplicated into "${dup.name}"`);
                        openProject(dup.id);
                    }
                }
            });
        }

        if (btnWorkspaceDelete) {
            btnWorkspaceDelete.addEventListener('click', () => {
                if (currentProjectId) openDeleteProjectModal(currentProjectId);
            });
        }

        if (btnWorkspaceExport) {
            btnWorkspaceExport.addEventListener('click', () => {
                if (currentProjectId) {
                    const p = ResearchStorage.getProject(currentProjectId);
                    if (p) {
                        const jsonStr = JSON.stringify(p, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(p.name || 'research').toLowerCase().replace(/[^a-z0-9]/g, '_')}_data.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        showToast('Project JSON exported');
                    }
                }
            });
        }

        // Global Export All & Import
        if (btnExportAll) {
            btnExportAll.addEventListener('click', () => {
                const jsonStr = ResearchStorage.exportProjectsJson();
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `groniq_research_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('All research projects exported');
            });
        }

        if (btnImportAll && fileImportInput) {
            btnImportAll.addEventListener('click', () => fileImportInput.click());
            fileImportInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const res = ResearchStorage.importProjectsJson(event.target.result);
                    if (res.success) {
                        showToast(`Successfully imported ${res.count} research projects`);
                        renderDashboard();
                    } else {
                        showToast(`Import error: ${res.error}`);
                    }
                };
                reader.readAsText(file);
                fileImportInput.value = '';
            });
        }

        // Modals Submit / Cancel
        if (formCreate) formCreate.addEventListener('submit', handleCreateProject);
        if (btnCancelCreate) btnCancelCreate.addEventListener('click', closeCreateModal);

        if (formAddEvidence) formAddEvidence.addEventListener('submit', handleAddEvidenceSubmit);
        if (btnCancelEvidence) btnCancelEvidence.addEventListener('click', closeAddEvidenceModal);

        if (btnConfirmDeleteProject) btnConfirmDeleteProject.addEventListener('click', confirmDeleteProject);
        if (btnCancelDeleteProject) btnCancelDeleteProject.addEventListener('click', closeDeleteProjectModal);

        if (btnConfirmDeleteCompetitor) btnConfirmDeleteCompetitor.addEventListener('click', confirmDeleteCompetitor);
        if (btnCancelDeleteCompetitor) btnCancelDeleteCompetitor.addEventListener('click', closeDeleteCompetitorModal);

        // Contextual (i) Field Help Popover Listener
        document.addEventListener('click', (e) => {
            const helpBtn = e.target.closest('.btn-field-help');
            if (helpBtn) {
                e.preventDefault();
                e.stopPropagation();
                const helpKey = helpBtn.dataset.help;
                if (helpKey) {
                    showFieldHelp(helpKey, helpBtn);
                }
            }
        });

        // Escape Key Modal Dismissal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCreateModal();
                closeAddEvidenceModal();
                closeDeleteProjectModal();
                closeDeleteCompetitorModal();
                closeFieldHelpModal();
            }
        });
    }

    // =========================================================
    // CONTEXTUAL (i) HELP SYSTEM
    // =========================================================
    const RESEARCH_HELP_TOPICS = {
        'biz-model': {
            title: 'Business Model',
            what: 'The fundamental commercial architecture explaining how the company creates, delivers, and captures financial value.',
            why: 'Dictates acceptable customer acquisition cost (CAC), sales cycle velocity, margin headroom, and viable advertising channels.',
            example: 'A B2B annual software subscription ($1,200/yr) operates on totally different cash flow and churn dynamics than a low-margin D2C consumer gadget ($35 one-time).',
            dontConfuse: 'A specific product feature or temporary marketing campaign.',
            anchor: 'understanding-the-business'
        },
        'biz-primary-conversion': {
            title: 'Primary Conversion Action',
            what: 'The decisive event indicating confirmed commercial progress (completed checkout, qualified discovery call, paid activation).',
            why: 'Media platform optimization algorithms and landing page architectures fail when optimizing for ambiguous vanity events.',
            example: 'E-commerce: Completed transaction with revenue value. B2B Services: Submitted discovery call application meeting qualification criteria.',
            dontConfuse: 'Top-of-funnel micro-engagements such as viewing a pricing page, reading a blog, or video views.',
            anchor: 'understanding-the-business'
        },
        'biz-positioning': {
            title: 'Market Positioning',
            what: 'The deliberate mental category and conceptual territory the business claims in customer minds relative to alternatives.',
            why: 'Governs ad messaging, copywriting angles, headline propositions, and customer willingness to pay.',
            example: 'Positioning as "The precision data-pipe for high-frequency trading" vs "An easy dashboard for marketing metrics".',
            dontConfuse: 'A catchy slogan, promotional tagline, or temporary ad hook.',
            anchor: 'understanding-the-business'
        },
        'biz-differentiators': {
            title: 'Real Differentiators',
            what: 'Verifiable operational, technical, or structural advantages that competitors cannot easily duplicate or claim.',
            why: 'Prevents wasting media spend on generic claims ("we care about customers") that fail to convince skeptical buyers.',
            example: 'Proprietary automated migration engine that transfers databases in 3 minutes with zero downtime vs competitor manual setups taking 48 hours.',
            dontConfuse: 'Generic table-stakes expectations like "good quality", "friendly support", or "fast shipping".',
            anchor: 'understanding-the-business'
        },
        'biz-economics': {
            title: 'Known Economics & Margins',
            what: 'Financial guardrails including gross margin, average order value (AOV), customer lifetime value (LTV), and allowable CAC.',
            why: 'Setting ad budgets without knowing contribution margin guarantees unprofitable customer acquisition.',
            example: 'AOV = $160, COGS = $50, Gross Margin = $110. Maximum break-even CPA is $110 before factoring in retention.',
            dontConfuse: 'Top-line gross revenue or vanity ROAS goals manufactured without margin context.',
            anchor: 'understanding-the-business'
        },
        'cust-buyer': {
            title: 'Buyer vs End User',
            what: 'The specific person holding purchasing authority, budget ownership, and payment responsibility.',
            why: 'Advertising and landing pages must resolve the buyer\'s commercial, compliance, and risk anxieties even if someone else uses the product.',
            example: 'In B2B SaaS, the VP of IT (buyer) cares about security compliance and licensing costs; software engineers (end users) care about API elegance. In kidswear, parents buy while children wear.',
            dontConfuse: 'The daily operator or consumer who interacts with the product without financial sign-off authority.',
            anchor: 'understanding-the-customer'
        },
        'cust-end-user': {
            title: 'End User',
            what: 'The individual who directly operates, wears, or consumes the product day-to-day.',
            why: 'End-user frustration drives churn, returns, and negative word-of-mouth, shaping product messaging and onboarding design.',
            example: 'The child wearing the apparel (needs comfort and fit) or the SDR using sales engagement software (needs fast dialing).',
            dontConfuse: 'The economic buyer with budget sign-off authority.',
            anchor: 'understanding-the-customer'
        },
        'cust-segments': {
            title: 'Customer Segments',
            what: 'Distinct subgroups of buyers characterized by shared commercial motivations, budgets, and operational contexts.',
            why: 'One generic value proposition pitched across diverse segments degrades ad relevance and conversion rates.',
            example: 'Segment A: Early-stage solo founders needing self-serve setup. Segment B: Enterprise compliance teams needing custom SLA contracts.',
            dontConfuse: 'Superficial demographic personas (e.g. "Sarah is 32 and likes iced lattes") lacking commercial decision context.',
            anchor: 'understanding-the-customer'
        },
        'cust-motivations': {
            title: 'Core Customer Motivations',
            what: 'The underlying commercial, functional, or emotional outcomes the customer hopes to achieve by buying.',
            why: 'Customers do not buy software features or raw products; they buy a transformed, lower-risk future state.',
            example: '"Protect our quarterly revenue from disastrous server downtime" rather than "Continuous server pings".',
            dontConfuse: 'Temporary purchase triggers or product feature lists.',
            anchor: 'understanding-the-customer'
        },
        'cust-purchase-triggers': {
            title: 'Purchase Triggers',
            what: 'Specific external events, deadlines, or threshold crises that force a buyer to take action now.',
            why: 'Informs creative hook angles, seasonal ad timing, promotional urgency, and outbound sales cadence.',
            example: 'Kidswear: An upcoming family wedding in 2 weeks. B2B Software: A failed compliance audit or an imminent fiscal year-end budget flush.',
            dontConfuse: 'General customer motivation — motivation explains why they care; triggers explain why they act right now.',
            anchor: 'understanding-the-customer'
        },
        'cust-objections': {
            title: 'Buying Objections',
            what: 'Rational and emotional hesitations preventing prospects from completing checkout or submitting an inquiry.',
            why: 'Unaddressed objections stall conversion funnels; addressing them directly in ad copy, landing page FAQs, and guarantees unlocks conversions.',
            example: '"Will this fit my non-standard dimensions?", "Is migration going to take down our live production database?", "Can I cancel anytime?".',
            dontConfuse: 'Customer service complaints filed after purchasing.',
            anchor: 'understanding-the-customer'
        },
        'cust-trust-factors': {
            title: 'Trust Factors & Proof Points',
            what: 'Verifiable third-party signals, certifications, reviews, and risk-reversals that eliminate customer anxiety.',
            why: 'Skeptical prospects bouncing from landing pages usually lack sufficient trust in brand competence or security.',
            example: '1,400+ verified customer reviews, SOC2 Type II compliance badge, 30-day money-back guarantee, transparent leadership team.',
            dontConfuse: 'Unsubstantiated brand bravado or generic slogans like "trust our expertise".',
            anchor: 'understanding-the-customer'
        },
        'cust-decision-criteria': {
            title: 'Decision Criteria',
            what: 'The exact evaluation checklist and ranking factors buyers use to compare solutions before choosing.',
            why: 'Highlights what needs to appear above the fold on landing pages and in product comparison tables.',
            example: '1. API throughput reliability, 2. Transparent monthly pricing, 3. Responsive human support, 4. Implementation speed.',
            dontConfuse: 'Internal technical specifications that the customer doesn\'t evaluate.',
            anchor: 'understanding-the-customer'
        },
        'cust-search-behavior': {
            title: 'Search Behavior',
            what: 'How buyers proactively query search engines when experiencing an acute problem or looking for specific vendors.',
            why: 'Shapes high-intent Google Search campaigns, SEO architecture, commercial landing page content, and negative keyword lists.',
            example: 'Searching "hipaa compliant form builder" or "best pricing for enterprise data warehouse migration".',
            dontConfuse: 'Casual social media browsing or passive feed consumption.',
            anchor: 'understanding-the-customer'
        },
        'cust-discovery-behavior': {
            title: 'Discovery Behavior',
            what: 'How prospective customers encounter solutions passively while browsing feeds, social media, industry newsletters, or peer groups.',
            why: 'Guides Meta, TikTok, and YouTube video ad hooks, UGC framing, and native problem-agitation creative.',
            example: 'Scrolling Instagram reels and discovering a novel ergonomic desk accessory through a creator workspace setup video.',
            dontConfuse: 'Active intent search queries where the buyer already knows what category they need.',
            anchor: 'understanding-the-customer'
        },
        'cust-language': {
            title: 'Customer Voice & Language',
            what: 'Verbatim vocabulary, phrasing, and idioms real customers use in reviews, support calls, and community forums.',
            why: 'Replacing corporate marketing speak with actual customer phrasing dramatically improves ad CTR and landing page resonance.',
            example: 'Customers repeatedly saying "our team was drowning in spreadsheet sync errors" rather than "disparate data silos".',
            dontConfuse: 'Internal corporate jargon invented in marketing brainstorms.',
            anchor: 'customer-voice'
        },
        'mkt-demand': {
            title: 'Demand Dynamics (Search vs Discovery)',
            what: 'Assessing whether market demand is predominantly search-driven (active buyers seeking solutions) or discovery-driven (latent demand unlocked through interruption).',
            why: 'Dictates initial ad channel selection (Google Ads vs Meta Ads) and prevents misallocating budget into dry channels.',
            example: 'Emergency plumbing has high search demand and low discovery potential; an innovative luxury fashion accessory relies on visual discovery.',
            dontConfuse: 'The simplistic false rule that "Google is always bottom-funnel and Meta is only awareness".',
            anchor: 'understanding-the-market'
        },
        'mkt-seasonality': {
            title: 'Market Seasonality & Peaks',
            what: 'Predictable cyclical fluctuations in purchasing intent driven by calendar milestones, quarters, weather, or cultural festivals.',
            why: 'Prevents overspending during dead troughs and under-capitalizing during peak conversion windows.',
            example: 'B2B enterprise software surges during November/December fiscal budget flushes; D2C fitness equipment peaks in early January.',
            dontConfuse: 'Day-to-day conversion rate anomalies or short-term ad platform volatility.',
            anchor: 'understanding-the-market'
        },
        'mkt-price-bands': {
            title: 'Category Price Bands',
            what: 'The established pricing landscape across budget, mid-market, premium, and luxury tiers in the category.',
            why: 'Clarifies positioning headroom, customer budget expectations, and required margin economics.',
            example: 'Category entry tier is $15–$25, standard mid-tier is $49–$79, enterprise custom tier is $500+/mo.',
            dontConfuse: 'A single competitor\'s temporary discount or promotional coupon.',
            anchor: 'understanding-the-market'
        },
        'mkt-commercial-themes': {
            title: 'Commercial-Intent Themes',
            what: 'High-priority problem clusters where customers have urgent purchasing intent and immediate willingness to pay.',
            why: 'Prevents creating informational content that attracts readers who have no budget or intent to purchase.',
            example: '"Urgent platform migration with zero data downtime" vs "History of cloud architecture".',
            dontConfuse: 'Purely educational, low-intent top-of-funnel curiosities.',
            anchor: 'understanding-the-market'
        },
        'mkt-opportunities': {
            title: 'Market Opportunities',
            what: 'Underserved customer needs, competitor blind spots, or neglected messaging angles supported by research evidence.',
            why: 'Provides competitive differentiation to win market share without entering an expensive race-to-the-bottom price war.',
            example: 'Competitors all charge expensive annual contracts with slow onboarding; an opportunity exists for monthly self-serve with instant migration.',
            dontConfuse: 'Unvalidated product feature wishlists without customer demand evidence.',
            anchor: 'understanding-the-market'
        },
        'comp-type': {
            title: 'Competitor Classification',
            what: 'Categorizing competitors into Direct (same solution & audience), Indirect (different solution for same problem), and Substitute (alternative customer choice).',
            why: 'Keeps you from obsessing solely over identical rivals while ignoring real budget substitutes (e.g. Excel spreadsheets vs custom software).',
            example: 'For an automated UTM Builder: Direct = another UTM builder app; Indirect = Google Sheets template; Substitute = not tracking campaign tags at all.',
            dontConfuse: 'Assuming anyone with a website in your industry is a direct competitor.',
            anchor: 'understanding-competitors'
        },
        'comp-pricing': {
            title: 'Competitor Price Positioning',
            what: 'Documented pricing models, tier structures, payment terms, and trial policies observed among competitors.',
            why: 'Informs our offer structure, unit economics, and value proposition messaging.',
            example: 'Competitor charges $99/mo with 14-day trial, hidden setup fee, and rigid annual lock-in.',
            dontConfuse: 'Assuming a competitor\'s pricing proves their profitability. Competitors frequently discount at unsustainable losses.',
            anchor: 'understanding-competitors'
        },
        'pillar-facts': {
            title: 'Verified Facts',
            what: 'Assertions directly substantiated by traceable, credible evidence (first-party data, confirmed website terms, verified receipts).',
            why: 'Keeps marketing strategy anchored in empirical reality rather than boardroom wishful thinking.',
            example: 'Competitor publishes transparent pricing at $49/mo; our checkout analytics show 68% mobile drop-off on shipping page.',
            dontConfuse: 'An observation or an inference. Competitors running ads is a fact; those ads being profitable is an inference or assumption.',
            anchor: 'facts-vs-inferences'
        },
        'pillar-insights': {
            title: 'Synthesized Insights',
            what: 'Meaningful interpretations and commercial patterns derived from connecting multiple verified facts.',
            why: 'Data collection without synthesis cannot guide marketing decisions. Insights explain the "so what?".',
            example: 'Fact: 40% of customer reviews cite setup frustration + Competitors charge for onboarding. Insight: Self-serve instant onboarding is a major conversion unlock.',
            dontConfuse: 'An isolated trivia point or raw data row without commercial interpretation.',
            anchor: 'turning-research-into-insights'
        },
        'pillar-gaps': {
            title: 'Research Gaps & Unknowns',
            what: 'Acknowledged blanks in knowledge where critical commercial evidence is currently missing.',
            why: 'Exposing gaps prevents making dangerous strategic commitments based on unverified assumptions. Unknown is a valid, healthy research status!',
            example: '"We currently do not know our lead-to-close rate by industry", "We do not know whether competitor video ads generate positive ROAS".',
            dontConfuse: 'A failed hypothesis or permanent failure. Gaps are targets for the next research cycle.',
            anchor: 'research-gaps'
        },
        'pillar-hypotheses': {
            title: 'Testable Hypotheses',
            what: 'Structured, testable propositions framed as: "Because we observed [evidence], we believe [reason], so we will test [change] and measure [metric]".',
            why: 'Eliminates endless debate by transforming opinions into concrete empirical marketing experiments.',
            example: 'Because customer reviews repeatedly mention sizing doubts, we believe sizing anxiety depresses cart additions; we will test inline sizing charts and measure add-to-cart rate.',
            dontConfuse: 'An ungrounded guess, a company dogma, or an unmeasurable wish.',
            anchor: 'hypothesis-building'
        },
        'ab-channel-priorities': {
            title: 'Channel Priorities',
            what: 'Strategic sequencing of advertising platforms based on verified customer behavior and demand dynamics.',
            why: 'Spreading limited budget across too many channels simultaneously guarantees statistical noise and insufficient learning.',
            example: 'Phase 1: Capture existing commercial search intent on Google Search. Phase 2: Scale visual problem-awareness creative on Meta.',
            dontConfuse: 'Blindly copying which platforms competitors appear on without understanding commercial intent.',
            anchor: 'research-for-paid-media'
        },
        'ab-creative-hypotheses': {
            title: 'Creative Hypotheses',
            what: 'Specific visual and narrative concepts designed to test distinct value propositions, hooks, and customer objections.',
            why: 'Creative is the primary performance lever in modern algorithmic advertising platforms; testing without hypotheses produces random guessing.',
            example: 'Test Angle 1 (Direct cost comparison vs legacy software) against Angle 2 (Speed of implementation / no engineering required).',
            dontConfuse: 'Minor visual tweaks like button colors or background gradients.',
            anchor: 'research-for-paid-media'
        },
        'ab-offer-hypotheses': {
            title: 'Offer Hypotheses',
            what: 'The specific commercial bundle, pricing incentive, trial terms, or risk-reversal presented to prospects to trigger immediate conversion.',
            why: 'A weak offer cannot be saved by brilliant ads. Testing offer structures often produces 3x-5x conversion improvements.',
            example: 'Testing "Free shipping on orders above $60" vs "Starter bundle with free travel pouch ($25 value)".',
            dontConfuse: 'Continually discounting prices until margins are completely destroyed.',
            anchor: 'research-for-paid-media'
        },
        'ab-measurement': {
            title: 'Measurement Requirements',
            what: 'The tracking taxonomy, UTM parameter conventions, GA4 conversion events, and server-side tracking required before launching spend.',
            why: 'Running campaigns without rigorous tracking makes it impossible to know which ads or channels drove profitable revenue.',
            example: 'Strict campaign naming taxonomy with utm_source, utm_medium, utm_campaign, utm_content, and verified server-side CAPI purchase events.',
            dontConfuse: 'Default platform-reported vanity metrics (e.g. clicks, impressions, video views).',
            anchor: 'research-for-paid-media'
        },
        'ev-type': {
            title: 'Evidence Source Type',
            what: 'Categorization of where the observation originated (ad library, review site, first-party CRM, customer call).',
            why: 'Allows weighting evidence credibility and auditing findings when market conditions change.',
            example: 'Primary customer review on Trustpilot vs secondary industry blog post.',
            dontConfuse: 'Unverified assumptions treated as source evidence.',
            anchor: 'evidence-and-sources'
        },
        'ev-status': {
            title: 'Verification Level',
            what: 'Transparency classification of how verified this finding is: Verified from Source, User Provided, Inference, or Needs Verification.',
            why: 'Prevents team members from treating unverified anecdotes with the same strategic weight as verified financial data.',
            example: 'Marking customer churn rate as "Needs Verification" until finance provides the exact cohort ledger.',
            dontConfuse: 'Binary true/false thinking; research certainty exists on a spectrum.',
            anchor: 'facts-vs-inferences'
        }
    };

    let fieldHelpModalEl = null;

    function getOrCreateFieldHelpModal() {
        if (fieldHelpModalEl) return fieldHelpModalEl;
        fieldHelpModalEl = document.createElement('div');
        fieldHelpModalEl.id = 'modal-field-help';
        fieldHelpModalEl.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity';
        fieldHelpModalEl.setAttribute('role', 'dialog');
        fieldHelpModalEl.setAttribute('aria-modal', 'true');
        fieldHelpModalEl.setAttribute('aria-labelledby', 'field-help-title');

        fieldHelpModalEl.innerHTML = `
            <div class="max-w-lg w-full bg-[#0D0D0D] border-t sm:border border-[#262626] rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 relative shadow-2xl overflow-y-auto max-h-[85vh] sm:max-h-[90vh] space-y-4">
                <div class="flex items-start justify-between gap-3 pb-3 border-b border-[#1E1E1E]">
                    <div class="space-y-1">
                        <span class="text-[9px] font-black uppercase tracking-widest text-brand-green block">Research Methodology</span>
                        <h3 id="field-help-title" class="text-base sm:text-lg font-black uppercase text-white tracking-wide"></h3>
                    </div>
                    <button type="button" id="btn-close-field-help" class="p-1.5 text-brand-muted hover:text-white rounded-lg transition-colors cursor-pointer" aria-label="Close help">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>

                <div class="space-y-3.5 text-xs text-brand-muted leading-relaxed">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-white block mb-0.5">What is this?</span>
                        <p id="field-help-what" class="text-white/90"></p>
                    </div>

                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-brand-green block mb-0.5">Why does it matter?</span>
                        <p id="field-help-why" class="text-white/90"></p>
                    </div>

                    <div class="p-3 rounded-xl bg-[#141414] border border-[#222]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-0.5">Concrete Example</span>
                        <p id="field-help-example" class="text-brand-mutedLight font-mono text-[11px]"></p>
                    </div>

                    <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">Don't confuse it with...</span>
                        <p id="field-help-dont-confuse" class="text-amber-200/90 text-[11px]"></p>
                    </div>
                </div>

                <div class="pt-2 border-t border-[#1E1E1E]">
                    <a id="field-help-learn-link" href="/learn/business-marketing-research/" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-3.5 rounded-xl bg-brand-green/10 border border-brand-green/30 hover:border-brand-green hover:bg-brand-green/20 text-brand-green font-bold text-xs transition-all group">
                        <span class="flex items-center gap-2">
                            <i data-lucide="book-open" class="w-4 h-4"></i>
                            <span id="field-help-learn-label">Read Full Section in Methodology Guide</span>
                        </span>
                        <i data-lucide="arrow-up-right" class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(fieldHelpModalEl);

        const closeBtn = fieldHelpModalEl.querySelector('#btn-close-field-help');
        if (closeBtn) closeBtn.addEventListener('click', closeFieldHelpModal);

        fieldHelpModalEl.addEventListener('click', (e) => {
            if (e.target === fieldHelpModalEl) closeFieldHelpModal();
        });

        return fieldHelpModalEl;
    }

    function showFieldHelp(helpKey, triggerEl) {
        const topic = RESEARCH_HELP_TOPICS[helpKey];
        if (!topic) return;

        const modal = getOrCreateFieldHelpModal();
        const titleEl = modal.querySelector('#field-help-title');
        const whatEl = modal.querySelector('#field-help-what');
        const whyEl = modal.querySelector('#field-help-why');
        const exampleEl = modal.querySelector('#field-help-example');
        const dontConfuseEl = modal.querySelector('#field-help-dont-confuse');
        const learnLink = modal.querySelector('#field-help-learn-link');
        const learnLabel = modal.querySelector('#field-help-learn-label');

        if (titleEl) titleEl.textContent = topic.title;
        if (whatEl) whatEl.textContent = topic.what;
        if (whyEl) whyEl.textContent = topic.why;
        if (exampleEl) exampleEl.textContent = topic.example;
        if (dontConfuseEl) dontConfuseEl.textContent = topic.dontConfuse;

        if (learnLink) {
            learnLink.href = `/learn/business-marketing-research/#${topic.anchor || ''}`;
        }
        if (learnLabel) {
            learnLabel.textContent = `Read in Learn: ${topic.title}`;
        }

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (window.lucide) lucide.createIcons();
    }

    function closeFieldHelpModal() {
        if (!fieldHelpModalEl || fieldHelpModalEl.classList.contains('hidden')) return;
        fieldHelpModalEl.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // =========================================================
    // UTILITIES
    // =========================================================
    function showToast(msg) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg;
        toast.classList.remove('opacity-0', 'translate-y-24');
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-24');
        }, 3200);
    }

    function formatRelativeTime(isoString) {
        if (!isoString) return 'recently';
        try {
            const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
            if (diffSec < 60) return 'just now';
            if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
            if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
            if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
            return new Date(isoString).toLocaleDateString();
        } catch (e) {
            return 'recently';
        }
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

    // Expose helpers for external access / testing
    window.ResearchApp = {
        openProject,
        showDashboard,
        switchWorkspaceTab,
        triggerAutoSave,
        collectAndSaveActiveProject,
        showFieldHelp,
        closeFieldHelpModal,
        helpTopics: RESEARCH_HELP_TOPICS,
        getCurrentProjectId: () => currentProjectId,
        getCurrentTab: () => currentTab
    };
});
