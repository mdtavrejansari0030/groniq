const STORAGE_KEYS = {
    HISTORY: 'groniq_utm_history',
    TEMPLATES: 'groniq_utm_templates',
    NAMING: 'groniq_utm_naming_settings',
    CAMPAIGNS: 'groniq_utm_campaigns'
};

const MAX_HISTORY = 50;

class UTMStorage {
    static getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    static saveToHistory(entry) {
        if (!entry || !entry.generatedUrl) return this.getHistory();
        let history = this.getHistory();
        
        // Deduplication: Remove existing item if generatedUrl or url matches exact string
        history = history.filter(h => h.generatedUrl !== entry.generatedUrl && h.url !== entry.generatedUrl);
        
        const newItem = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            destinationUrl: entry.destinationUrl || '',
            source: entry.source || '',
            medium: entry.medium || '',
            campaign: entry.campaign || '',
            content: entry.content || '',
            term: entry.term || '',
            id_param: entry.id_param || '',
            customParams: entry.customParams || [],
            namingSettings: entry.namingSettings || { casing: 'lowercase', separator: 'underscore' },
            generatedUrl: entry.generatedUrl
        };
        
        history.unshift(newItem);
        
        // Evict oldest history items if > 50 (does NOT affect Templates!)
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }
        
        try {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        } catch (e) {}
        
        return history;
    }

    static deleteHistoryItem(id) {
        let history = this.getHistory().filter(h => h.id !== id);
        try {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        } catch (e) {}
        return history;
    }

    static clearHistory() {
        try {
            localStorage.removeItem(STORAGE_KEYS.HISTORY);
        } catch (e) {}
    }

    static presetKey = 'groniq_utm_builder_presets_v1';
    static presetError(message) {
        document.dispatchEvent(new CustomEvent('utm-storage-error', {detail: message}));
    }
    static getTemplates() {
        try {
            const saved = localStorage.getItem(this.presetKey);
            const legacy = saved === null;
            const raw = legacy ? localStorage.getItem(STORAGE_KEYS.TEMPLATES) : saved;
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            const items = legacy ? parsed : (parsed.version === 1 ? parsed.presets : null);
            if (!Array.isArray(items)) throw new Error('Invalid presets');
            const valid = items.filter(t => t && typeof t.id === 'string' && typeof t.name === 'string' && t.name.trim() &&
                ['source','medium','campaign','term','content'].every(k => t[k] === undefined || typeof t[k] === 'string'));
            if (valid.length !== items.length) this.presetError('Some saved presets are invalid and could not be loaded. Valid presets are still available.');
            return valid;
        } catch (e) {
            this.presetError('Saved presets could not be read. Browser storage may be blocked or saved data may be invalid.');
            return [];
        }
    }
    static writeTemplates(items) {
        try {
            localStorage.setItem(this.presetKey, JSON.stringify({version:1, presets:items}));
            return items;
        } catch (e) {
            this.presetError('Preset not saved. Browser storage is unavailable or full. Allow site storage or free space, then try again.');
            return null;
        }
    }
    static saveTemplate(name, data) {
        if (!name?.trim()) return null;
        const item = {id: 'tpl_' + crypto.randomUUID(), name:name.trim(), createdAt:new Date().toISOString()};
        for (const key of ['source','medium','campaign','term','content']) item[key] = String(data[key] || '');
        return this.writeTemplates([item, ...this.getTemplates()]);
    }
    static updateTemplate(id, data) {
        return this.writeTemplates(this.getTemplates().map(t => {
            if (t.id !== id) return t;
            const next = {...t};
            for (const key of ['source','medium','campaign','term','content']) next[key] = String(data[key] || '');
            return next;
        }));
    }
    static renameTemplate(id, name) {
        if (!name?.trim()) return null;
        return this.writeTemplates(this.getTemplates().map(t => t.id === id ? {...t,name:name.trim()} : t));
    }
    static deleteTemplate(id) {
        return this.writeTemplates(this.getTemplates().filter(t => t.id !== id));
    }

    static getNamingSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.NAMING);
            return data ? JSON.parse(data) : { casing: 'lowercase', separator: 'underscore' };
        } catch (e) {
            return { casing: 'lowercase', separator: 'underscore' };
        }
    }

    static saveNamingSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.NAMING, JSON.stringify(settings));
        } catch (e) {}
    }

    static resetNamingSettings() {
        const defaultSettings = { casing: 'lowercase', separator: 'underscore' };
        try {
            localStorage.setItem(STORAGE_KEYS.NAMING, JSON.stringify(defaultSettings));
        } catch (e) {}
        return defaultSettings;
    }

    // ==========================================
    // CAMPAIGN WORKSPACE STORAGE
    // ==========================================
    static getCampaigns() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.campaigns)) {
                return parsed.campaigns;
            }
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [];
        } catch (e) {
            return [];
        }
    }

    static saveCampaigns(campaigns) {
        try {
            const payload = {
                version: 1,
                campaigns: Array.isArray(campaigns) ? campaigns : []
            };
            localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(payload));
        } catch (e) {}
    }

    static createCampaign(dataOrName, maybeCampaignId) {
        if (!dataOrName) return null;
        const campaigns = this.getCampaigns();
        const now = new Date().toISOString();

        let newCampaign;
        if (typeof dataOrName === 'object') {
            const data = dataOrName;
            const rawName = (data.name || data.campaign || (data.source ? `${data.source} / ${data.medium || ''} Campaign`.trim() : 'Untitled Campaign')).trim();
            const rawCamp = typeof data.campaign === 'string' ? data.campaign.trim() : rawName;
            const rawId = typeof data.campaignId === 'string' ? data.campaignId.trim() : (typeof data.id_param === 'string' ? data.id_param.trim() : '');

            newCampaign = {
                id: 'cmp_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
                name: rawName,
                campaign: rawCamp,
                campaignId: rawId,
                destinationUrl: typeof data.destinationUrl === 'string' ? data.destinationUrl.trim() : '',
                source: typeof data.source === 'string' ? data.source.trim() : '',
                medium: typeof data.medium === 'string' ? data.medium.trim() : '',
                content: typeof data.content === 'string' ? data.content.trim() : '',
                term: typeof data.term === 'string' ? data.term.trim() : '',
                customParams: Array.isArray(data.customParams) ? data.customParams : [],
                generatedUrl: typeof data.generatedUrl === 'string' ? data.generatedUrl.trim() : '',
                namingSettings: data.namingSettings || { casing: 'lowercase', separator: 'underscore' },
                createdAt: now,
                updatedAt: now,
                links: Array.isArray(data.links) ? data.links : []
            };
        } else {
            const name = String(dataOrName).trim();
            if (!name) return null;
            newCampaign = {
                id: 'cmp_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
                name: name,
                campaign: name,
                campaignId: (maybeCampaignId || '').trim(),
                destinationUrl: '',
                source: '',
                medium: '',
                content: '',
                term: '',
                customParams: [],
                generatedUrl: '',
                namingSettings: { casing: 'lowercase', separator: 'underscore' },
                createdAt: now,
                updatedAt: now,
                links: []
            };
        }

        campaigns.unshift(newCampaign);
        this.saveCampaigns(campaigns);
        return newCampaign;
    }

    static updateCampaign(id, updates) {
        if (!id || !updates) return null;
        let campaigns = this.getCampaigns();
        let updatedCampaign = null;
        campaigns = campaigns.map(c => {
            if (c.id === id) {
                const name = typeof updates.name === 'string' && updates.name.trim() 
                    ? updates.name.trim() 
                    : (typeof updates.campaign === 'string' && updates.campaign.trim() ? updates.campaign.trim() : c.name);
                const campaign = typeof updates.campaign === 'string' 
                    ? updates.campaign.trim() 
                    : (typeof updates.name === 'string' && updates.name.trim() ? updates.name.trim() : c.campaign);
                const campaignId = typeof updates.campaignId === 'string' 
                    ? updates.campaignId.trim() 
                    : (typeof updates.id_param === 'string' ? updates.id_param.trim() : c.campaignId);

                updatedCampaign = {
                    ...c,
                    name: name,
                    campaign: campaign,
                    campaignId: campaignId,
                    destinationUrl: typeof updates.destinationUrl === 'string' ? updates.destinationUrl.trim() : (c.destinationUrl || ''),
                    source: typeof updates.source === 'string' ? updates.source.trim() : (c.source || ''),
                    medium: typeof updates.medium === 'string' ? updates.medium.trim() : (c.medium || ''),
                    content: typeof updates.content === 'string' ? updates.content.trim() : (c.content || ''),
                    term: typeof updates.term === 'string' ? updates.term.trim() : (c.term || ''),
                    customParams: Array.isArray(updates.customParams) ? updates.customParams : (c.customParams || []),
                    generatedUrl: typeof updates.generatedUrl === 'string' ? updates.generatedUrl.trim() : (c.generatedUrl || ''),
                    namingSettings: updates.namingSettings || c.namingSettings || { casing: 'lowercase', separator: 'underscore' },
                    links: Array.isArray(updates.links) ? updates.links : (c.links || []),
                    updatedAt: new Date().toISOString()
                };
                return updatedCampaign;
            }
            return c;
        });
        this.saveCampaigns(campaigns);
        return updatedCampaign;
    }

    static duplicateCampaign(id) {
        if (!id) return null;
        const campaigns = this.getCampaigns();
        const original = campaigns.find(c => c.id === id);
        if (!original) return null;

        const now = new Date().toISOString();
        const duplicate = {
            ...JSON.parse(JSON.stringify(original)),
            id: 'cmp_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
            name: (original.name || original.campaign || 'Campaign') + ' copy',
            campaign: original.campaign ? (original.campaign + ' copy') : (original.name ? original.name + ' copy' : ''),
            createdAt: now,
            updatedAt: now,
            links: (original.links || []).map(lnk => ({
                ...lnk,
                id: 'lnk_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7)
            }))
        };

        const idx = campaigns.findIndex(c => c.id === id);
        if (idx !== -1) {
            campaigns.splice(idx + 1, 0, duplicate);
        } else {
            campaigns.unshift(duplicate);
        }
        this.saveCampaigns(campaigns);
        return duplicate;
    }

    static deleteCampaign(id) {
        if (!id) return this.getCampaigns();
        let campaigns = this.getCampaigns().filter(c => c.id !== id);
        this.saveCampaigns(campaigns);
        return campaigns;
    }

    static clearCampaigns() {
        this.saveCampaigns([]);
        return [];
    }

    static addTrackingLink(campaignId, linkData) {
        if (!campaignId || !linkData) return null;
        let campaigns = this.getCampaigns();
        let addedLink = null;
        campaigns = campaigns.map(c => {
            if (c.id === campaignId) {
                const newLink = {
                    id: 'lnk_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
                    name: (linkData.name || '').trim(),
                    destinationUrl: (linkData.destinationUrl || '').trim(),
                    source: (linkData.source || '').trim(),
                    medium: (linkData.medium || '').trim(),
                    content: (linkData.content || '').trim(),
                    term: (linkData.term || '').trim(),
                    sourcePlatform: (linkData.sourcePlatform || '').trim(),
                    creativeFormat: (linkData.creativeFormat || '').trim(),
                    marketingTactic: (linkData.marketingTactic || '').trim(),
                    customParams: Array.isArray(linkData.customParams) ? linkData.customParams : []
                };
                addedLink = newLink;
                const links = Array.isArray(c.links) ? c.links : [];
                return {
                    ...c,
                    links: [...links, newLink],
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        });
        this.saveCampaigns(campaigns);
        return addedLink;
    }

    static updateTrackingLink(campaignId, linkId, linkData) {
        if (!campaignId || !linkId || !linkData) return null;
        let campaigns = this.getCampaigns();
        let updatedLink = null;
        campaigns = campaigns.map(c => {
            if (c.id === campaignId) {
                const links = (c.links || []).map(lnk => {
                    if (lnk.id === linkId) {
                        updatedLink = {
                            ...lnk,
                            name: (linkData.name || '').trim(),
                            destinationUrl: (linkData.destinationUrl || '').trim(),
                            source: (linkData.source || '').trim(),
                            medium: (linkData.medium || '').trim(),
                            content: (linkData.content || '').trim(),
                            term: (linkData.term || '').trim(),
                            sourcePlatform: (linkData.sourcePlatform || '').trim(),
                            creativeFormat: (linkData.creativeFormat || '').trim(),
                            marketingTactic: (linkData.marketingTactic || '').trim(),
                            customParams: Array.isArray(linkData.customParams) ? linkData.customParams : (lnk.customParams || [])
                        };
                        return updatedLink;
                    }
                    return lnk;
                });
                return {
                    ...c,
                    links,
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        });
        this.saveCampaigns(campaigns);
        return updatedLink;
    }

    static duplicateTrackingLink(campaignId, linkId) {
        if (!campaignId || !linkId) return null;
        let campaigns = this.getCampaigns();
        let newLink = null;
        campaigns = campaigns.map(c => {
            if (c.id === campaignId) {
                const links = c.links || [];
                const origLink = links.find(l => l.id === linkId);
                if (!origLink) return c;
                newLink = {
                    ...JSON.parse(JSON.stringify(origLink)),
                    id: 'lnk_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
                    name: origLink.name + ' copy'
                };
                const idx = links.findIndex(l => l.id === linkId);
                const updatedLinks = [...links];
                updatedLinks.splice(idx + 1, 0, newLink);
                return {
                    ...c,
                    links: updatedLinks,
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        });
        this.saveCampaigns(campaigns);
        return newLink;
    }

    static deleteTrackingLink(campaignId, linkId) {
        if (!campaignId || !linkId) return null;
        let campaigns = this.getCampaigns();
        campaigns = campaigns.map(c => {
            if (c.id === campaignId) {
                return {
                    ...c,
                    links: (c.links || []).filter(l => l.id !== linkId),
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        });
        this.saveCampaigns(campaigns);
        return campaigns;
    }
}

if (typeof window !== 'undefined') {
    window.UTMStorage = UTMStorage;
}
