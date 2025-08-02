class UIManager {
    constructor() {
        this.currentView = 'admin';
        this.openModals = new Set();
        this.dropdownState = {
            manage: false
        };
    }

    showView(viewName) {
        this.currentView = viewName;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const navBtn = document.getElementById(`${viewName}-btn`);
        if (navBtn) navBtn.classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        const view = document.getElementById(`${viewName}-view`);
        if (view) view.classList.add('active');

        // Reset instructions to collapsed state when switching views
        this.hideFullInstructions();

        return viewName;
    }

    getCurrentView() {
        return this.currentView;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.openModals.add(modalId);
        }
        return modalId;
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            this.openModals.delete(modalId);
            
            // Reset forms in the modal
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    hideAllModals() {
        this.openModals.forEach(modalId => {
            this.hideModal(modalId);
        });
        this.openModals.clear();
    }

    isModalOpen(modalId) {
        return this.openModals.has(modalId);
    }

    toggleManageDropdown() {
        this.dropdownState.manage = !this.dropdownState.manage;
        const dropdown = document.getElementById('manage-dropdown-menu');
        if (dropdown) {
            dropdown.classList.toggle('show', this.dropdownState.manage);
        }
    }

    hideManageDropdown() {
        this.dropdownState.manage = false;
        const dropdown = document.getElementById('manage-dropdown-menu');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    toggleElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    isElementVisible(elementId) {
        const element = document.getElementById(elementId);
        return element && !element.classList.contains('hidden');
    }

    showFullInstructions() {
        this.hideElement('event-instructions');
        this.showElement('event-instructions-full');
    }

    hideFullInstructions() {
        this.showElement('event-instructions');
        this.hideElement('event-instructions-full');
    }

    toggleDescription(eventId) {
        const truncatedDesc = document.getElementById(`desc-${eventId}`);
        const fullDesc = document.getElementById(`desc-full-${eventId}`);
        
        if (truncatedDesc && fullDesc) {
            if (truncatedDesc.classList.contains('hidden')) {
                // Currently showing full, switch to truncated
                truncatedDesc.classList.remove('hidden');
                fullDesc.classList.add('hidden');
            } else {
                // Currently showing truncated, switch to full
                truncatedDesc.classList.add('hidden');
                fullDesc.classList.remove('hidden');
            }
        }
    }

    toggleAttendees(eventId) {
        const attendeesDiv = document.getElementById(`attendees-${eventId}`);
        const toggleButton = attendeesDiv?.previousElementSibling;
        
        if (attendeesDiv && toggleButton) {
            if (attendeesDiv.classList.contains('show')) {
                attendeesDiv.classList.remove('show');
                toggleButton.innerHTML = toggleButton.innerHTML.replace('▲', '▼').replace('Hide', 'Show');
            } else {
                attendeesDiv.classList.add('show');
                toggleButton.innerHTML = toggleButton.innerHTML.replace('▼', '▲').replace('Show', 'Hide');
            }
        }
    }

    updateDropdowns(type, options, includeAll = false) {
        const selectors = ConfigManager.getDropdownSelectors();
        const targetSelectors = type === 'den' ? selectors.denSelectors : selectors.eventTypeSelectors;
        
        targetSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                const currentValue = element.value;
                
                let html = '';
                if (includeAll && (selector.includes('filter') || selector.includes('checkin'))) {
                    html += '<option value="">All Dens</option>';
                }
                
                html += options.map(option => {
                    const value = type === 'den' ? option.name : option.value;
                    const label = option.name;
                    return `<option value="${value}">${label}</option>`;
                }).join('');
                
                element.innerHTML = html;
                
                // Restore previous selection if it still exists
                if (currentValue && options.some(opt => 
                    type === 'den' ? opt.name === currentValue : opt.value === currentValue
                )) {
                    element.value = currentValue;
                }
            }
        });
    }

    updateDenDropdowns(dens) {
        const sortedDens = Utils.sortByOrder(dens);
        this.updateDropdowns('den', sortedDens, true);
    }

    updateEventTypeDropdowns(eventTypes) {
        const sortedEventTypes = Utils.sortByOrder(eventTypes);
        this.updateDropdowns('eventType', sortedEventTypes, false);
    }

    setElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    }

    getElementValue(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            if (element.type === 'checkbox' || element.type === 'radio') {
                return element.checked;
            }
            return element.value;
        }
        return null;
    }

    setRadioValue(name, value) {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
        }
    }

    getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : null;
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    setFormData(formId, data) {
        Object.keys(data).forEach(key => {
            const element = document.querySelector(`#${formId} [name="${key}"], #${formId} #${key}`);
            if (element) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = data[key];
                } else {
                    element.value = data[key];
                }
            }
        });
    }

    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    disableElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = true;
        }
    }

    enableElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = false;
        }
    }

    addClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
        }
    }

    removeClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
        }
    }

    toggleClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle(className);
        }
    }

    hasClass(elementId, className) {
        const element = document.getElementById(elementId);
        return element ? element.classList.contains(className) : false;
    }

    setTextContent(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    setInnerHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }

    addEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    removeEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.removeEventListener(event, handler);
        }
    }

    focusElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.focus();
        }
    }

    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    reset() {
        this.hideAllModals();
        this.hideManageDropdown();
        this.hideFullInstructions();
    }
}