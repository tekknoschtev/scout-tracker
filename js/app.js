// Scout Attendance App - Refactored with Modular Architecture
class ScoutAttendanceApp {
    constructor() {
        // Initialize data properties
        this.scouts = [];
        this.parents = [];
        this.events = [];
        this.attendance = [];
        this.dens = [];
        this.eventTypes = [];
        
        // Initialize managers
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        this.notificationManager = new NotificationManager();
        this.renderManager = new RenderManager(this.dataManager, this.uiManager);
        this.eventManager = new EventManager(this.dataManager, this.notificationManager);
        this.attendanceManager = new AttendanceManager(this.dataManager, this.notificationManager);
        this.scoutManager = new ScoutManager(this.dataManager, this.notificationManager);
        this.denEventTypeManager = new DenEventTypeManager(this.dataManager, this.notificationManager, this.scoutManager);
        
        // State for editing
        this.editingEventId = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.initializeDefaultData();
        this.bindEvents();
        this.renderViews();
    }

    // Data Management
    loadData() {
        const data = this.dataManager.loadData();
        this.scouts = data.scouts;
        this.parents = data.parents;
        this.events = data.events;
        this.attendance = data.attendance;
        this.dens = data.dens;
        this.eventTypes = data.eventTypes;
        
        // Migrate data if needed
        this.dataManager.migrateData(data);
    }

    initializeDefaultData() {
        // Initialize with default dens if no dens exist
        if (this.dens.length === 0) {
            this.dens = ConfigManager.getDefaultDens();
            this.saveData();
        }
        
        // Initialize with default event types if no event types exist
        if (this.eventTypes.length === 0) {
            this.eventTypes = ConfigManager.getDefaultEventTypes();
            this.saveData();
        }

        // Initialize with sample data if everything is empty
        if (ConfigManager.shouldInitializeWithSampleData({
            scouts: this.scouts,
            events: this.events,
            attendance: this.attendance
        })) {
            const sampleData = ConfigManager.initializeWithSampleData();
            this.scouts = sampleData.scouts;
            this.parents = sampleData.parents;
            this.events = sampleData.events;
            this.attendance = sampleData.attendance;
            this.saveData();
        }
    }

    saveData() {
        this.dataManager.saveData({
            scouts: this.scouts,
            parents: this.parents,
            events: this.events,
            attendance: this.attendance,
            dens: this.dens,
            eventTypes: this.eventTypes
        });
    }

    // Event Binding
    bindEvents() {
        // Navigation
        this.uiManager.addEventListener('admin-btn', 'click', () => this.showView('admin'));
        this.uiManager.addEventListener('checkin-btn', 'click', () => this.showView('checkin'));

        // Admin actions
        this.uiManager.addEventListener('new-event-btn', 'click', () => this.uiManager.showModal('new-event-modal'));
        
        // Manage dropdown
        this.uiManager.addEventListener('manage-dropdown-btn', 'click', (e) => {
            e.stopPropagation();
            this.uiManager.toggleManageDropdown();
        });
        
        // Manage dropdown items
        this.uiManager.addEventListener('manage-scouts-btn', 'click', () => this.showManageModal('scouts'));
        this.uiManager.addEventListener('manage-parents-btn', 'click', () => this.showManageModal('parents'));
        this.uiManager.addEventListener('manage-dens-btn', 'click', () => this.showManageModal('dens'));
        this.uiManager.addEventListener('manage-event-types-btn', 'click', () => this.showManageModal('event-types'));
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => this.uiManager.hideManageDropdown());

        // Quick actions
        this.uiManager.addEventListener('export-csv-btn', 'click', () => this.exportToCSV());
        this.uiManager.addEventListener('backup-data-btn', 'click', () => this.backupData());
        this.uiManager.addEventListener('restore-data-btn', 'click', () => document.getElementById('restore-data-input').click());
        this.uiManager.addEventListener('restore-data-input', 'change', (e) => this.restoreData(e));
        this.uiManager.addEventListener('show-past-events', 'change', () => this.renderAdminView());

        // Modal close buttons
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.uiManager.hideModal(modal.id);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.uiManager.hideModal(modal.id);
            });
        });

        // Forms
        this.uiManager.addEventListener('new-event-form', 'submit', (e) => this.handleNewEvent(e));
        this.uiManager.addEventListener('edit-event-form', 'submit', (e) => this.handleEditEvent(e));
        this.uiManager.addEventListener('add-scout-form', 'submit', (e) => this.handleAddScout(e));
        this.uiManager.addEventListener('add-parent-form', 'submit', (e) => this.handleAddParent(e));
        this.uiManager.addEventListener('add-den-form', 'submit', (e) => this.handleAddDen(e));
        this.uiManager.addEventListener('add-event-type-form', 'submit', (e) => this.handleAddEventType(e));

        // Check-in functionality
        this.uiManager.addEventListener('event-select', 'change', (e) => this.handleEventSelect(e));
        this.uiManager.addEventListener('checkin-den-filter-select', 'change', () => {
            const eventId = this.uiManager.getElementValue('event-select');
            if (eventId) {
                this.renderAttendeesChecklist(eventId);
            }
        });

        // Instructions toggle
        this.uiManager.addEventListener('toggle-instructions', 'click', () => this.uiManager.showFullInstructions());
        this.uiManager.addEventListener('hide-instructions', 'click', () => this.uiManager.hideFullInstructions());
    }

    // View Management
    showView(viewName) {
        this.uiManager.showView(viewName);
        
        // Refresh view content
        if (viewName === 'admin') {
            this.renderAdminView();
        } else if (viewName === 'checkin') {
            this.renderCheckinView();
        }
    }

    showManageModal(type) {
        this.uiManager.hideManageDropdown();
        const modalId = `manage-${type}-modal`;
        this.uiManager.showModal(modalId);
        
        // Render the modal content based on type
        if (type === 'scouts') {
            this.renderScoutsManagement();
            this.uiManager.addEventListener('den-filter-select', 'change', () => this.renderScoutsManagement());
        } else if (type === 'parents') {
            this.renderParentsManagement();
            this.uiManager.addEventListener('parent-den-filter-select', 'change', () => this.renderParentsManagement());
        } else if (type === 'dens') {
            this.renderDensManagement();
        } else if (type === 'event-types') {
            this.renderEventTypesManagement();
        }
    }

    // Rendering Methods
    renderViews() {
        this.updateAllDropdowns();
        this.renderAdminView();
        this.renderCheckinView();
    }

    renderAdminView() {
        this.renderManager.renderAdminView(
            this.events, this.scouts, this.parents, 
            this.dens, this.eventTypes, this.attendance
        );
    }

    renderCheckinView() {
        this.renderManager.renderCheckinView(this.events);
    }

    renderScoutsManagement() {
        this.renderManager.renderScoutsManagement(this.scouts, this.dens);
    }

    renderParentsManagement() {
        this.renderManager.renderParentsManagement(this.parents, this.dens);
    }

    renderDensManagement() {
        this.renderManager.renderDensManagement(this.dens, this.scouts);
    }

    renderEventTypesManagement() {
        this.renderManager.renderEventTypesManagement(this.eventTypes, this.events);
    }

    renderAttendeesChecklist(eventId) {
        const event = Utils.findById(this.events, eventId);
        if (event) {
            this.renderManager.renderAttendeesChecklist(
                event, this.scouts, this.parents, this.attendance, this.dens
            );
        }
    }

    updateAllDropdowns() {
        this.uiManager.updateDenDropdowns(this.dens);
        this.uiManager.updateEventTypeDropdowns(this.eventTypes);
    }

    // Event Handlers
    handleNewEvent(e) {
        e.preventDefault();
        
        const formData = {
            name: this.uiManager.getElementValue('event-name'),
            date: this.uiManager.getElementValue('new-event-date'),
            type: this.uiManager.getElementValue('event-type'),
            attendeeType: this.uiManager.getRadioValue('attendee-type'),
            description: this.uiManager.getElementValue('event-description'),
            instructions: this.uiManager.getElementValue('event-instructions')
        };

        const event = this.eventManager.createEvent(formData);
        if (event) {
            this.events.push(event);
            this.saveData();
            this.uiManager.hideModal('new-event-modal');
            this.renderAdminView();
            this.renderCheckinView();
        }
    }

    handleEditEvent(e) {
        e.preventDefault();
        
        if (!this.editingEventId) return;

        const formData = {
            name: this.uiManager.getElementValue('edit-event-name'),
            date: this.uiManager.getElementValue('edit-event-date'),
            type: this.uiManager.getElementValue('edit-event-type'),
            attendeeType: this.uiManager.getRadioValue('edit-attendee-type'),
            description: this.uiManager.getElementValue('edit-event-description'),
            instructions: this.uiManager.getElementValue('edit-event-instructions')
        };

        const updatedEvents = this.eventManager.updateEvent(this.editingEventId, formData, this.events);
        if (updatedEvents) {
            this.events = updatedEvents;
            this.saveData();
            this.uiManager.hideModal('edit-event-modal');
            this.renderAdminView();
            this.renderCheckinView();
            this.editingEventId = null;
        }
    }

    handleAddScout(e) {
        e.preventDefault();
        
        const name = this.uiManager.getElementValue('scout-name');
        const den = this.uiManager.getElementValue('scout-den');
        
        const updatedScouts = this.scoutManager.addScout(name, den, this.scouts);
        if (updatedScouts !== this.scouts) {
            this.scouts = updatedScouts;
            this.saveData();
            this.renderScoutsManagement();
            this.renderAdminView();
            this.uiManager.setElementValue('scout-name', '');
        }
    }

    handleAddParent(e) {
        e.preventDefault();
        
        const name = this.uiManager.getElementValue('parent-name');
        const den = this.uiManager.getElementValue('parent-den');
        
        const updatedParents = this.scoutManager.addParent(name, den, this.parents);
        if (updatedParents !== this.parents) {
            this.parents = updatedParents;
            this.saveData();
            this.renderParentsManagement();
            this.renderAdminView();
            this.uiManager.setElementValue('parent-name', '');
        }
    }

    handleAddDen(e) {
        e.preventDefault();
        
        const name = this.uiManager.getElementValue('den-name');
        
        const updatedDens = this.denEventTypeManager.addDen(name, this.dens);
        if (updatedDens !== this.dens) {
            this.dens = updatedDens;
            this.saveData();
            this.renderDensManagement();
            this.updateAllDropdowns();
            this.uiManager.setElementValue('den-name', '');
        }
    }

    handleAddEventType(e) {
        e.preventDefault();
        
        const name = this.uiManager.getElementValue('event-type-name');
        
        const updatedEventTypes = this.denEventTypeManager.addEventType(name, this.eventTypes);
        if (updatedEventTypes !== this.eventTypes) {
            this.eventTypes = updatedEventTypes;
            this.saveData();
            this.renderEventTypesManagement();
            this.updateAllDropdowns();
            this.uiManager.setElementValue('event-type-name', '');
        }
    }

    handleEventSelect(e) {
        const eventId = e.target.value;
        
        this.uiManager.hideFullInstructions();
        
        if (!eventId) {
            this.uiManager.addClass('checkin-form', 'hidden');
            this.uiManager.addClass('event-info', 'hidden');
            return;
        }

        const event = Utils.findById(this.events, eventId);
        if (!event) return;

        // Update event info
        this.renderManager.populateEventInfo(event);
        this.uiManager.removeClass('event-info', 'hidden');
        
        // Render attendees list
        this.renderAttendeesChecklist(eventId);
        this.uiManager.removeClass('checkin-form', 'hidden');
    }

    // Check-in Methods
    instantCheckin(eventId, scoutId) {
        const updatedAttendance = this.attendanceManager.checkInScout(
            eventId, scoutId, this.attendance, this.scouts, this.events
        );
        
        if (updatedAttendance !== this.attendance) {
            this.attendance = updatedAttendance;
            this.saveData();
            this.renderAttendeesChecklist(eventId);
            this.renderAdminView();
        }
    }

    instantParentCheckin(eventId, parentId) {
        const updatedAttendance = this.attendanceManager.checkInParent(
            eventId, parentId, this.attendance, this.parents, this.events
        );
        
        if (updatedAttendance !== this.attendance) {
            this.attendance = updatedAttendance;
            this.saveData();
            this.renderAttendeesChecklist(eventId);
            this.renderAdminView();
        }
    }

    async undoCheckin(eventId, scoutId) {
        try {
            const updatedAttendance = await this.attendanceManager.undoScoutCheckin(
                eventId, scoutId, this.attendance, this.scouts, this.events
            );
            
            this.attendance = updatedAttendance;
            this.saveData();
            this.renderAttendeesChecklist(eventId);
            this.renderAdminView();
        } catch (error) {
            // User cancelled - do nothing
        }
    }

    async undoParentCheckin(eventId, parentId) {
        try {
            const updatedAttendance = await this.attendanceManager.undoParentCheckin(
                eventId, parentId, this.attendance, this.parents, this.events
            );
            
            this.attendance = updatedAttendance;
            this.saveData();
            this.renderAttendeesChecklist(eventId);
            this.renderAdminView();
        } catch (error) {
            // User cancelled - do nothing
        }
    }

    // Management Methods
    async removeScout(scoutId) {
        try {
            const updatedScouts = await this.scoutManager.removeScout(scoutId, this.scouts);
            this.scouts = updatedScouts;
            this.saveData();
            this.renderScoutsManagement();
            this.renderAdminView();
        } catch (error) {
            // User cancelled - do nothing
        }
    }

    async removeParent(parentId) {
        try {
            const updatedParents = await this.scoutManager.removeParent(parentId, this.parents);
            this.parents = updatedParents;
            this.saveData();
            this.renderParentsManagement();
            this.renderAdminView();
        } catch (error) {
            // User cancelled - do nothing
        }
    }

    editEvent(eventId) {
        const event = Utils.findById(this.events, eventId);
        if (!event) return;

        // Populate the edit form
        this.uiManager.setElementValue('edit-event-name', event.name);
        this.uiManager.setElementValue('edit-event-date', event.date);
        this.uiManager.setElementValue('edit-event-type', event.type);
        this.uiManager.setElementValue('edit-event-description', event.description || '');
        this.uiManager.setElementValue('edit-event-instructions', event.instructions || '');
        this.uiManager.setRadioValue('edit-attendee-type', event.attendeeType || 'scouts');

        this.editingEventId = eventId;
        this.uiManager.showModal('edit-event-modal');
    }

    async deleteEvent(eventId) {
        try {
            const result = await this.eventManager.deleteEvent(eventId, this.events, this.attendance);
            this.events = result.events;
            this.attendance = result.attendance;
            this.saveData();
            this.renderAdminView();
            this.renderCheckinView();
        } catch (error) {
            // User cancelled - do nothing
        }
    }

    editDen(denId) {
        const den = Utils.findById(this.dens, denId);
        if (!den) return;

        const newName = prompt('Enter new den name:', den.name);
        if (!newName || newName.trim() === '') return;
        
        const result = this.denEventTypeManager.updateDen(denId, newName, this.dens, this.scouts, this.parents);
        if (result.dens !== this.dens) {
            this.dens = result.dens;
            this.scouts = result.scouts;
            this.parents = result.parents;
            this.saveData();
            this.renderDensManagement();
            this.renderScoutsManagement();
            this.renderParentsManagement();
            this.updateAllDropdowns();
        }
    }

    async deleteDen(denId) {
        try {
            const result = await this.denEventTypeManager.deleteDen(denId, this.dens, this.scouts, this.parents);
            this.dens = result.dens;
            this.scouts = result.scouts;
            this.parents = result.parents;
            this.saveData();
            this.renderDensManagement();
            this.renderScoutsManagement();
            this.renderParentsManagement();
            this.updateAllDropdowns();
        } catch (error) {
            // User cancelled - do nothing
        }
    }

    editEventType(eventTypeId) {
        const eventType = Utils.findById(this.eventTypes, eventTypeId);
        if (!eventType) return;

        const newName = prompt('Enter new event type name:', eventType.name);
        if (!newName || newName.trim() === '') return;
        
        const result = this.denEventTypeManager.updateEventType(eventTypeId, newName, this.eventTypes, this.events);
        if (result.eventTypes !== this.eventTypes) {
            this.eventTypes = result.eventTypes;
            this.events = result.events;
            this.saveData();
            this.renderEventTypesManagement();
            this.renderAdminView();
            this.updateAllDropdowns();
        }
    }

    async deleteEventType(eventTypeId) {
        try {
            const result = await this.denEventTypeManager.deleteEventType(eventTypeId, this.eventTypes, this.events);
            this.eventTypes = result.eventTypes;
            this.events = result.events;
            this.saveData();
            this.renderEventTypesManagement();
            this.renderAdminView();
            this.updateAllDropdowns();
        } catch (error) {
            // User cancelled - do nothing
        }
    }

    // Export and Backup Methods
    exportToCSV() {
        this.dataManager.downloadCSV(this.events, this.scouts, this.parents, this.attendance, this.eventTypes);
    }

    backupData() {
        const data = {
            scouts: this.scouts,
            parents: this.parents,
            events: this.events,
            attendance: this.attendance,
            dens: this.dens,
            eventTypes: this.eventTypes
        };
        this.dataManager.downloadBackup(data);
    }

    async restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const restoredData = await this.dataManager.processBackupFile(file);
            
            this.notificationManager.showRestoreDataConfirmation(() => {
                this.scouts = restoredData.scouts;
                this.parents = restoredData.parents;
                this.events = restoredData.events;
                this.attendance = restoredData.attendance;
                this.dens = restoredData.dens;
                this.eventTypes = restoredData.eventTypes;
                
                this.saveData();
                this.renderViews();
                this.notificationManager.showSuccessMessage('Data restored successfully!');
            });
        } catch (error) {
            this.notificationManager.showFileError(error.message);
        }
        
        event.target.value = ''; // Reset file input
    }

    // Utility Methods (exposed for onclick handlers in HTML)
    toggleDescription(eventId) {
        this.uiManager.toggleDescription(eventId);
    }

    toggleAttendees(eventId) {
        this.uiManager.toggleAttendees(eventId);
    }

    showModal(modalId) {
        this.uiManager.showModal(modalId);
        
        // Setup modal-specific content
        if (modalId === 'manage-scouts-modal') {
            this.renderScoutsManagement();
            this.uiManager.addEventListener('den-filter-select', 'change', () => this.renderScoutsManagement());
        } else if (modalId === 'manage-parents-modal') {
            this.renderParentsManagement();
            this.uiManager.addEventListener('parent-den-filter-select', 'change', () => this.renderParentsManagement());
        } else if (modalId === 'manage-dens-modal') {
            this.renderDensManagement();
        } else if (modalId === 'manage-event-types-modal') {
            this.renderEventTypesManagement();
        }
    }

    hideModal(modalId) {
        this.uiManager.hideModal(modalId);
    }
}

// Initialize the app
const app = new ScoutAttendanceApp();