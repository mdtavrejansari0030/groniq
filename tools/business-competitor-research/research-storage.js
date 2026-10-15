/**
 * Groniq Research - Storage & Data Model Layer
 * Business & Competitor Research Tool
 * Version: 1.0.0
 * 
 * Manages local persistence for research projects with clear data models.
 * Decoupled from UI so it can easily connect to a backend API in future versions.
 */

const RESEARCH_STORAGE_KEY = 'groniq_research_projects';
const RESEARCH_STORAGE_VERSION = 1;

class ResearchStorage {
    /**
     * Get all research projects from localStorage safely
     * @returns {Array} List of research projects
     */
    static getProjects() {
        if (typeof window === 'undefined' || !window.localStorage) return [];
        try {
            const raw = localStorage.getItem(RESEARCH_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (e) {
            console.error('Failed to parse saved research projects from localStorage:', e);
            return [];
        }
    }

    /**
     * Get a single project by ID
     * @param {string} id Project ID
     * @returns {Object|null} Project object or null
     */
    static getProject(id) {
        if (!id) return null;
        const list = this.getProjects();
        return list.find(p => p.id === id) || null;
    }

    /**
     * Persist list of projects to localStorage
     * @param {Array} projects 
     * @returns {boolean} Success status
     */
    static saveProjects(projects) {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        try {
            localStorage.setItem(RESEARCH_STORAGE_KEY, JSON.stringify(projects));
            return true;
        } catch (e) {
            console.error('Failed to write research projects to localStorage:', e);
            return false;
        }
    }

    /**
     * Create a new research project
     * @param {Object} meta Initial metadata (name, website, industry, businessType, market, goal)
     * @returns {Object} Newly created project
     */
    static createProject(meta = {}) {
        const now = new Date().toISOString();
        const id = 'proj_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);

        const project = {
            schemaVersion: RESEARCH_STORAGE_VERSION,
            id,
            name: (meta.name || '').trim() || 'Untitled Research',
            website: (meta.website || '').trim(),
            industry: (meta.industry || '').trim(),
            businessType: (meta.businessType || '').trim(),
            market: (meta.market || '').trim(),
            goal: (meta.goal || '').trim(),
            createdAt: now,
            updatedAt: now,

            // Section 1: Business Profile
            business: {
                description: '',
                productsServices: '',
                businessModel: '',
                primaryProducts: '',
                priceRange: '',
                geography: '',
                channelType: 'Online', // Online | Offline | Hybrid
                primaryConversion: '',
                positioning: '',
                differentiators: '',
                currentOffers: '',
                marketingChannels: '',
                businessGoals: '',
                constraints: '',
                economics: '',
                additionalNotes: ''
            },

            // Section 2: Customer Understanding
            customers: {
                buyerProfile: '',
                endUserProfile: '',
                segments: '',
                problemsNeeds: '',
                motivations: '',
                purchaseTriggers: '',
                objections: '',
                trustFactors: '',
                decisionCriteria: '',
                searchBehavior: '',
                discoveryBehavior: '',
                buyingJourney: '',
                customerQuestions: '',
                customerLanguage: '',
                additionalNotes: ''
            },

            // Section 3: Market Research
            marketResearch: {
                categoryDefinition: '',
                geographyDynamics: '',
                demandObservations: '',
                searchBehavior: '',
                discoveryBehavior: '',
                seasonality: '',
                trends: '',
                priceBands: '',
                commonOffers: '',
                categoryTerminology: '',
                commercialThemes: '',
                marketOpportunities: '',
                marketRisks: '',
                unknownsQuestions: ''
            },

            // Section 4: Competitor Profiles
            competitors: [],

            // Section 5: Traceable Evidence Library
            evidence: [],

            // Section 6: 4-Pillar Insights & Hypotheses
            insights: {
                facts: [],
                insights: [],
                gaps: [],
                hypotheses: []
            },

            // Section 7: Action Brief (Paid Advertising)
            actionBrief: {
                paidAds: {
                    businessObjective: meta.goal ? meta.goal.trim() : '',
                    relevantProducts: '',
                    customerSummary: '',
                    demandSummary: '',
                    channelPriorities: '',
                    channelRationale: '',
                    messagingAngles: '',
                    creativeHypotheses: '',
                    searchIntentThemes: '',
                    offerHypotheses: '',
                    landingPageRequirements: '',
                    conversionActions: '',
                    measurementRequirements: '',
                    knownRisks: '',
                    unknownsBeforeLaunch: '',
                    recommendedTests: ''
                }
            }
        };

        const projects = this.getProjects();
        projects.unshift(project);
        this.saveProjects(projects);
        return project;
    }

    /**
     * Update an existing project
     * @param {string} id Project ID
     * @param {Object} updates Partial or full project updates
     * @returns {Object|null} Updated project or null
     */
    static updateProject(id, updates = {}) {
        if (!id) return null;
        let projects = this.getProjects();
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1) return null;

        const current = projects[idx];
        const updated = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Deep merge sub-sections if provided
        if (updates.business) updated.business = { ...current.business, ...updates.business };
        if (updates.customers) updated.customers = { ...current.customers, ...updates.customers };
        if (updates.marketResearch) updated.marketResearch = { ...current.marketResearch, ...updates.marketResearch };
        if (updates.insights) updated.insights = { ...current.insights, ...updates.insights };
        if (updates.actionBrief && updates.actionBrief.paidAds) {
            updated.actionBrief = {
                ...current.actionBrief,
                paidAds: {
                    ...(current.actionBrief?.paidAds || {}),
                    ...updates.actionBrief.paidAds
                }
            };
        }

        projects[idx] = updated;
        this.saveProjects(projects);
        return updated;
    }

    /**
     * Duplicate a research project
     * @param {string} id Project ID
     * @returns {Object|null} Duplicated project
     */
    static duplicateProject(id) {
        const original = this.getProject(id);
        if (!original) return null;

        const now = new Date().toISOString();
        const duplicate = JSON.parse(JSON.stringify(original));
        duplicate.id = 'proj_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);
        duplicate.name = `${original.name} (Copy)`;
        duplicate.createdAt = now;
        duplicate.updatedAt = now;

        // Give new unique IDs to internal competitors and evidence
        if (Array.isArray(duplicate.competitors)) {
            duplicate.competitors = duplicate.competitors.map(c => ({
                ...c,
                id: 'comp_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7)
            }));
        }
        if (Array.isArray(duplicate.evidence)) {
            duplicate.evidence = duplicate.evidence.map(e => ({
                ...e,
                id: 'ev_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7)
            }));
        }

        const projects = this.getProjects();
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) {
            projects.splice(idx + 1, 0, duplicate);
        } else {
            projects.unshift(duplicate);
        }
        this.saveProjects(projects);
        return duplicate;
    }

    /**
     * Delete a project
     * @param {string} id Project ID
     * @returns {boolean} Success status
     */
    static deleteProject(id) {
        if (!id) return false;
        let projects = this.getProjects();
        const before = projects.length;
        projects = projects.filter(p => p.id !== id);
        if (projects.length === before) return false;
        this.saveProjects(projects);
        return true;
    }

    /**
     * Factory for creating an empty competitor object
     */
    static createCompetitor(name = '', website = '', type = 'Direct') {
        const now = new Date().toISOString();
        return {
            id: 'comp_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
            name: (name || '').trim() || 'New Competitor',
            website: (website || '').trim(),
            type: type || 'Direct', // Direct | Indirect | Substitute
            createdAt: now,
            updatedAt: now,
            overview: '',
            productsServices: '',
            targetCustomer: '',
            geography: '',
            pricingPosition: '',
            positioning: '',
            uspMessaging: '',
            offers: '',
            websiteCro: {
                heroMessage: '',
                cta: '',
                trustSignals: '',
                reviewsSocialProof: '',
                conversionFlow: '',
                landingPageObservations: ''
            },
            paidMedia: {
                observedChannels: '',
                messaging: '',
                creativeObservations: '',
                offerObservations: '',
                landingDestinations: '',
                notes: ''
            },
            seo: {
                visiblePages: '',
                contentThemes: '',
                searchObservations: '',
                keywordObservations: ''
            },
            social: {
                platforms: '',
                contentFormats: '',
                messagingThemes: '',
                creativePatterns: ''
            },
            customerVoice: {
                praise: '',
                complaints: '',
                objections: '',
                recurringThemes: ''
            },
            strengths: '',
            weaknesses: '',
            opportunitiesNoticed: '',
            notes: ''
        };
    }

    /**
     * Factory for creating an evidence object
     */
    static createEvidence(data = {}) {
        return {
            id: 'ev_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
            title: (data.title || '').trim(),
            sourceUrl: (data.sourceUrl || '').trim(),
            sourceType: data.sourceType || 'Website / Landing Page',
            status: data.status || 'Verified from source', // Verified from source | User provided | Inference | Unknown / Needs verification
            association: data.association || 'Our Business',
            dateObserved: data.dateObserved || new Date().toISOString().split('T')[0],
            notes: (data.notes || '').trim(),
            screenshotRef: (data.screenshotRef || '').trim(),
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Calculate objective, rule-based progress summary for a project
     * @param {Object} project
     * @returns {Object} Metric counts
     */
    static calculateProgress(project) {
        if (!project) return null;

        const countFilled = (obj, keys) => {
            if (!obj) return 0;
            return keys.reduce((acc, k) => {
                const val = obj[k];
                return (val && typeof val === 'string' && val.trim().length > 0) ? acc + 1 : acc;
            }, 0);
        };

        const bizKeys = [
            'description', 'productsServices', 'businessModel', 'primaryProducts',
            'priceRange', 'geography', 'channelType', 'primaryConversion',
            'positioning', 'differentiators', 'currentOffers', 'marketingChannels',
            'businessGoals', 'constraints', 'economics', 'additionalNotes'
        ];
        const custKeys = [
            'buyerProfile', 'endUserProfile', 'segments', 'problemsNeeds',
            'motivations', 'purchaseTriggers', 'objections', 'trustFactors',
            'decisionCriteria', 'searchBehavior', 'discoveryBehavior', 'buyingJourney',
            'customerQuestions', 'customerLanguage', 'additionalNotes'
        ];
        const mktKeys = [
            'categoryDefinition', 'geographyDynamics', 'demandObservations', 'searchBehavior',
            'discoveryBehavior', 'seasonality', 'trends', 'priceBands',
            'commonOffers', 'categoryTerminology', 'commercialThemes', 'marketOpportunities',
            'marketRisks', 'unknownsQuestions'
        ];
        const briefKeys = [
            'businessObjective', 'relevantProducts', 'customerSummary', 'demandSummary',
            'channelPriorities', 'channelRationale', 'messagingAngles', 'creativeHypotheses',
            'searchIntentThemes', 'offerHypotheses', 'landingPageRequirements', 'conversionActions',
            'measurementRequirements', 'knownRisks', 'unknownsBeforeLaunch', 'recommendedTests'
        ];

        const businessFilled = countFilled(project.business, bizKeys);
        const customersFilled = countFilled(project.customers, custKeys);
        const marketFilled = countFilled(project.marketResearch, mktKeys);
        const briefFilled = countFilled(project.actionBrief?.paidAds, briefKeys);

        const competitorCount = Array.isArray(project.competitors) ? project.competitors.length : 0;
        const evidenceCount = Array.isArray(project.evidence) ? project.evidence.length : 0;
        
        const factsCount = Array.isArray(project.insights?.facts) ? project.insights.facts.length : 0;
        const insightsCount = Array.isArray(project.insights?.insights) ? project.insights.insights.length : 0;
        const gapsCount = Array.isArray(project.insights?.gaps) ? project.insights.gaps.length : 0;
        const hypothesesCount = Array.isArray(project.insights?.hypotheses) ? project.insights.hypotheses.length : 0;

        // Sections touched: whether at least 1 field or item is present
        const sectionsExplored = [
            businessFilled > 0,
            customersFilled > 0,
            marketFilled > 0,
            competitorCount > 0,
            evidenceCount > 0,
            (factsCount + insightsCount + gapsCount + hypothesesCount) > 0,
            briefFilled > 0
        ].filter(Boolean).length;

        return {
            businessFilled,
            businessTotal: bizKeys.length,
            customersFilled,
            customersTotal: custKeys.length,
            marketFilled,
            marketTotal: mktKeys.length,
            competitorCount,
            evidenceCount,
            factsCount,
            insightsCount,
            gapsCount,
            hypothesesCount,
            briefFilled,
            briefTotal: briefKeys.length,
            sectionsExplored,
            sectionsTotal: 7
        };
    }

    /**
     * Export all projects as downloadable JSON string
     */
    static exportProjectsJson() {
        const projects = this.getProjects();
        return JSON.stringify({
            app: 'Groniq Research',
            exportedAt: new Date().toISOString(),
            schemaVersion: RESEARCH_STORAGE_VERSION,
            projects
        }, null, 2);
    }

    /**
     * Import projects from JSON string (merges or replaces safely)
     */
    static importProjectsJson(jsonString, replaceAll = false) {
        try {
            const data = JSON.parse(jsonString);
            const importedList = Array.isArray(data) ? data : (Array.isArray(data.projects) ? data.projects : null);
            if (!importedList) return { success: false, error: 'Invalid JSON format: missing projects list' };

            const validList = importedList.filter(p => p && p.id && p.name);
            if (validList.length === 0) return { success: false, error: 'No valid research projects found in JSON' };

            let existing = replaceAll ? [] : this.getProjects();
            // Merge deduplicating by ID
            const existingIds = new Set(existing.map(p => p.id));
            validList.forEach(p => {
                if (!existingIds.has(p.id)) {
                    existing.unshift(p);
                } else if (replaceAll) {
                    existing.push(p);
                }
            });

            this.saveProjects(existing);
            return { success: true, count: validList.length };
        } catch (e) {
            return { success: false, error: e.message || 'Invalid JSON file' };
        }
    }

    /**
     * Clear all projects
     */
    static clearAllProjects() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        localStorage.removeItem(RESEARCH_STORAGE_KEY);
    }
}

if (typeof window !== 'undefined') {
    window.ResearchStorage = ResearchStorage;
    window.RESEARCH_STORAGE_KEY = RESEARCH_STORAGE_KEY;
    window.RESEARCH_STORAGE_VERSION = RESEARCH_STORAGE_VERSION;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResearchStorage, RESEARCH_STORAGE_KEY, RESEARCH_STORAGE_VERSION };
}
