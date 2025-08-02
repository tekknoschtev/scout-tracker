// Scout Attendance App
class ScoutAttendanceApp {
    constructor() {
        this.scouts = [];
        this.events = [];
        this.attendance = [];
        this.dens = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderViews();
        this.setupConfirmationModal();
    }

    // Data Management
    loadData() {
        this.scouts = JSON.parse(localStorage.getItem('scouts') || '[]');
        this.events = JSON.parse(localStorage.getItem('events') || '[]');
        this.attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        this.dens = JSON.parse(localStorage.getItem('dens') || '[]');
        
        // Initialize with standard Cub Scout dens if no dens exist
        if (this.dens.length === 0) {
            this.dens = [
                { id: 'den_tigers', name: 'Tigers', order: 1 },
                { id: 'den_wolves', name: 'Wolves', order: 2 },
                { id: 'den_bears', name: 'Bears', order: 3 },
                { id: 'den_webelos', name: 'Webelos', order: 4 },
                { id: 'den_aol', name: 'Arrow of Light', order: 5 }
            ];
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem('scouts', JSON.stringify(this.scouts));
        localStorage.setItem('events', JSON.stringify(this.events));
        localStorage.setItem('attendance', JSON.stringify(this.attendance));
        localStorage.setItem('dens', JSON.stringify(this.dens));
    }

    // Event Binding
    bindEvents() {
        // Navigation
        document.getElementById('admin-btn').addEventListener('click', () => this.showView('admin'));
        document.getElementById('checkin-btn').addEventListener('click', () => this.showView('checkin'));

        // Admin actions
        document.getElementById('new-event-btn').addEventListener('click', () => this.showModal('new-event-modal'));
        document.getElementById('manage-scouts-btn').addEventListener('click', () => this.showModal('manage-scouts-modal'));
        document.getElementById('manage-dens-btn').addEventListener('click', () => this.showModal('manage-dens-modal'));
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('backup-data-btn').addEventListener('click', () => this.backupData());
        document.getElementById('restore-data-btn').addEventListener('click', () => document.getElementById('restore-data-input').click());
        document.getElementById('restore-data-input').addEventListener('change', (e) => this.restoreData(e));
        document.getElementById('show-past-events').addEventListener('change', () => this.renderAdminView());

        // Modal close buttons
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.hideModal(modal.id);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modal.id);
            });
        });

        // Forms
        document.getElementById('new-event-form').addEventListener('submit', (e) => this.handleNewEvent(e));
        document.getElementById('edit-event-form').addEventListener('submit', (e) => this.handleEditEvent(e));
        document.getElementById('add-scout-form').addEventListener('submit', (e) => this.handleAddScout(e));
        document.getElementById('add-den-form').addEventListener('submit', (e) => this.handleAddDen(e));

        // Check-in functionality
        document.getElementById('event-select').addEventListener('change', (e) => this.handleEventSelect(e));
        
        // Check-in den filter
        document.getElementById('checkin-den-filter-select').addEventListener('change', () => {
            const eventId = document.getElementById('event-select').value;
            if (eventId) {
                this.renderScoutsChecklist(eventId);
            }
        });

        // Instructions toggle
        document.getElementById('toggle-instructions').addEventListener('click', () => this.showFullInstructions());
        document.getElementById('hide-instructions').addEventListener('click', () => this.hideFullInstructions());
    }

    // View Management
    showView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${viewName}-btn`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Refresh view content
        if (viewName === 'admin') {
            this.renderAdminView();
        } else if (viewName === 'checkin') {
            this.renderCheckinView();
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        if (modalId === 'manage-scouts-modal') {
            this.renderScoutsManagement();
            // Add den filter event listener when modal opens
            document.getElementById('den-filter-select').addEventListener('change', () => this.renderScoutsManagement());
        } else if (modalId === 'manage-dens-modal') {
            this.renderDensManagement();
        }
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        
        // Reset forms
        const form = document.querySelector(`#${modalId} form`);
        if (form) form.reset();
    }

    // Rendering Methods
    renderViews() {
        this.updateAllDenDropdowns();
        this.renderAdminView();
        this.renderCheckinView();
    }

    renderAdminView() {
        const eventsList = document.getElementById('events-list');
        
        if (this.events.length === 0) {
            eventsList.innerHTML = '<div class="empty-state">No events scheduled yet. Create your first event!</div>';
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const showPastEvents = document.getElementById('show-past-events').checked;
        
        let eventsToShow = this.events;
        if (!showPastEvents) {
            eventsToShow = this.events.filter(event => event.date >= today);
        }
        
        eventsToShow = eventsToShow.sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first

        eventsList.innerHTML = eventsToShow.map(event => {
            const attendanceRecords = this.attendance.filter(a => a.eventId === event.id);
            const attendanceCount = attendanceRecords.length;
            const totalScouts = this.scouts.filter(s => s.active).length;
            const isPastEvent = event.date < today;
            
            // Get attendee details
            const attendees = attendanceRecords.map(record => {
                const scout = this.scouts.find(s => s.id === record.scoutId);
                return scout ? { name: scout.name, den: scout.den } : null;
            }).filter(Boolean);
            
            // Handle description truncation
            const hasLongDescription = event.description && event.description.length > 100;
            const truncatedDescription = hasLongDescription ? this.truncateText(event.description, 100) : event.description;
            
            return `
                <div class="event-item ${isPastEvent ? 'event-past' : ''}">
                    <div class="event-info">
                        <h4>${event.name}</h4>
                        <p>${this.formatDate(event.date)} • ${this.capitalizeFirst(event.type)}</p>
                        ${event.description ? `
                            <p id="desc-${event.id}" class="event-description">
                                ${truncatedDescription}
                                ${hasLongDescription ? `<button class="expand-description" onclick="app.toggleDescription('${event.id}')">more</button>` : ''}
                            </p>
                            ${hasLongDescription ? `<p id="desc-full-${event.id}" class="event-description-full hidden">${event.description} <button class="expand-description" onclick="app.toggleDescription('${event.id}')">less</button></p>` : ''}
                        ` : ''}
                        ${attendanceCount > 0 ? `<button class="toggle-attendees" onclick="app.toggleAttendees('${event.id}')">
                            ${attendanceCount === 1 ? 'Show 1 attendee' : `Show ${attendanceCount} attendees`} ▼
                        </button>` : ''}
                        <div id="attendees-${event.id}" class="event-attendees">
                            <h5>Attendees:</h5>
                            <div class="attendee-list">
                                ${attendees.map(attendee => 
                                    `<span class="attendee-tag">${attendee.name} (${attendee.den})</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="event-controls">
                        <div class="event-attendance">
                            ${attendanceCount}/${totalScouts} scouts
                        </div>
                        <div class="event-actions">
                            <button class="btn btn-small btn-outline" onclick="app.editEvent('${event.id}')">Edit</button>
                            <button class="btn btn-small btn-outline btn-danger" onclick="app.deleteEvent('${event.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCheckinView() {
        const eventSelect = document.getElementById('event-select');
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's and upcoming events (within next 30 days for flexibility)
        const availableEvents = this.events
            .filter(event => event.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        eventSelect.innerHTML = '<option value="">Choose an event...</option>' +
            availableEvents.map(event => 
                `<option value="${event.id}">${event.name} - ${this.formatDate(event.date)}</option>`
            ).join('');

        // Hide checkin form initially
        document.getElementById('checkin-form').classList.add('hidden');
    }

    renderScoutsManagement() {
        const scoutsList = document.getElementById('manage-scouts-list');
        const denFilterSelect = document.getElementById('den-filter-select');
        const selectedDen = denFilterSelect ? denFilterSelect.value : '';
        
        let activeScouts = this.scouts.filter(s => s.active);
        
        if (activeScouts.length === 0) {
            scoutsList.innerHTML = '<div class="empty-state">No scouts added yet.</div>';
            return;
        }

        // Filter by den if selected
        if (selectedDen) {
            activeScouts = activeScouts.filter(s => s.den === selectedDen);
        }

        // Group scouts by den
        const scoutsByDen = {};
        activeScouts.forEach(scout => {
            if (!scoutsByDen[scout.den]) {
                scoutsByDen[scout.den] = [];
            }
            scoutsByDen[scout.den].push(scout);
        });

        // Sort dens by order
        const sortedDens = Object.keys(scoutsByDen).sort((a, b) => {
            const denA = this.dens.find(den => den.name === a);
            const denB = this.dens.find(den => den.name === b);
            const orderA = denA ? denA.order : 999;
            const orderB = denB ? denB.order : 999;
            return orderA - orderB;
        });

        if (sortedDens.length === 0) {
            scoutsList.innerHTML = '<div class="empty-state">No scouts found for the selected den.</div>';
            return;
        }

        scoutsList.innerHTML = sortedDens.map(den => {
            const denScouts = scoutsByDen[den].sort((a, b) => a.name.localeCompare(b.name));
            
            return `
                <div class="den-group">
                    <div class="den-group-header">
                        <div class="den-group-title">${den}</div>
                        <div class="den-group-count">${denScouts.length}</div>
                    </div>
                    <div class="den-scouts">
                        ${denScouts.map(scout => `
                            <div class="scout-item">
                                <div class="scout-info">
                                    <div class="scout-name">${scout.name}</div>
                                </div>
                                <button class="btn btn-outline btn-small" onclick="app.removeScout('${scout.id}')">
                                    Remove
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Event Handlers
    handleNewEvent(e) {
        e.preventDefault();
        
        const event = {
            id: 'event_' + Date.now(),
            name: document.getElementById('event-name').value,
            date: document.getElementById('new-event-date').value,
            type: document.getElementById('event-type').value,
            description: document.getElementById('event-description').value,
            instructions: document.getElementById('event-instructions').value
        };

        this.events.push(event);
        this.saveData();
        this.hideModal('new-event-modal');
        this.renderAdminView();
        this.renderCheckinView();
    }

    handleAddScout(e) {
        e.preventDefault();
        
        const name = document.getElementById('scout-name').value.trim();
        const den = document.getElementById('scout-den').value;
        
        if (!name) return;

        const scout = {
            id: 'scout_' + Date.now(),
            name: name,
            den: den,
            active: true
        };

        this.scouts.push(scout);
        this.saveData();
        this.renderScoutsManagement();
        this.renderAdminView();
        
        // Show success notification
        this.showNotification(`${name} has been added to ${den}!`, 'success', 3000);
        
        // Reset form
        document.getElementById('scout-name').value = '';
    }

    handleEventSelect(e) {
        const eventId = e.target.value;
        const checkinForm = document.getElementById('checkin-form');
        const eventInfo = document.getElementById('event-info');
        
        if (!eventId) {
            checkinForm.classList.add('hidden');
            eventInfo.classList.add('hidden');
            return;
        }

        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Update event info
        document.getElementById('event-title').textContent = event.name;
        document.getElementById('event-date').textContent = this.formatDate(event.date);

        // Handle instructions
        const instructionsCompact = document.getElementById('event-instructions');
        const instructionsTextCompact = document.getElementById('instructions-text');
        const instructionsTextFull = document.getElementById('instructions-text-full');
        
        if (event.instructions && event.instructions.trim()) {
            const instructions = event.instructions.trim();
            instructionsTextCompact.textContent = instructions;
            instructionsTextFull.textContent = instructions;
            instructionsCompact.classList.remove('hidden');
        } else {
            instructionsCompact.classList.add('hidden');
        }

        // Show event info and form
        eventInfo.classList.remove('hidden');
        
        // Render scouts list
        this.renderScoutsChecklist(eventId);
        
        checkinForm.classList.remove('hidden');
    }

    renderScoutsChecklist(eventId) {
        const scoutsList = document.getElementById('scouts-list');
        const checkinDenFilter = document.getElementById('checkin-den-filter-select');
        const selectedDen = checkinDenFilter ? checkinDenFilter.value : '';
        
        let activeScouts = this.scouts.filter(s => s.active);
        const alreadyCheckedIn = this.attendance
            .filter(a => a.eventId === eventId)
            .map(a => a.scoutId);

        // Filter by den if selected
        if (selectedDen) {
            activeScouts = activeScouts.filter(s => s.den === selectedDen);
        }

        // Group scouts by den
        const scoutsByDen = {};
        activeScouts.forEach(scout => {
            if (!scoutsByDen[scout.den]) {
                scoutsByDen[scout.den] = [];
            }
            scoutsByDen[scout.den].push(scout);
        });

        // Sort dens by order
        const sortedDens = Object.keys(scoutsByDen).sort((a, b) => {
            const denA = this.dens.find(den => den.name === a);
            const denB = this.dens.find(den => den.name === b);
            const orderA = denA ? denA.order : 999;
            const orderB = denB ? denB.order : 999;
            return orderA - orderB;
        });

        if (sortedDens.length === 0) {
            scoutsList.innerHTML = '<div class="empty-state">No scouts available for check-in.</div>';
            return;
        }

        scoutsList.innerHTML = sortedDens.map(den => {
            const denScouts = scoutsByDen[den].sort((a, b) => a.name.localeCompare(b.name));
            const checkedInCount = denScouts.filter(scout => alreadyCheckedIn.includes(scout.id)).length;
            
            return `
                <div class="checkin-den-group">
                    <div class="checkin-den-header">
                        <div class="checkin-den-title">${den}</div>
                        <div class="checkin-den-count">${checkedInCount}/${denScouts.length}</div>
                    </div>
                    <div class="checkin-den-scouts">
                        ${denScouts.map(scout => {
                            const isCheckedIn = alreadyCheckedIn.includes(scout.id);
                            return `
                                <div class="scout-checkbox ${isCheckedIn ? 'checked-in clickable' : 'clickable'}" 
                                     onclick="${isCheckedIn ? `app.undoCheckin('${eventId}', '${scout.id}')` : `app.instantCheckin('${eventId}', '${scout.id}')`}">
                                    <input type="checkbox" 
                                           id="scout-${scout.id}" 
                                           value="${scout.id}"
                                           ${isCheckedIn ? 'checked disabled' : 'disabled'}>
                                    <label for="scout-${scout.id}">
                                        ${scout.name}
                                        ${isCheckedIn ? ' ✓ Already checked in' : ''}
                                    </label>
                                    ${isCheckedIn ? `
                                        <button class="btn btn-small btn-outline undo-checkin" 
                                                onclick="app.undoCheckin('${eventId}', '${scout.id}')"
                                                title="Undo check-in for ${scout.name}">
                                            Undo
                                        </button>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    handleCheckin() {
        const eventId = document.getElementById('event-select').value;
        if (!eventId) return;

        const checkboxes = document.querySelectorAll('#scouts-list input[type="checkbox"]:checked:not(:disabled)');
        const checkedInScouts = Array.from(checkboxes).map(cb => cb.value);

        if (checkedInScouts.length === 0) {
            this.showNotification('Please select at least one scout to check in.', 'warning');
            return;
        }

        // Add attendance records
        const timestamp = new Date().toISOString();
        checkedInScouts.forEach(scoutId => {
            this.attendance.push({
                eventId: eventId,
                scoutId: scoutId,
                checkedInAt: timestamp
            });
        });

        this.saveData();
        
        // Refresh the checklist to show updated status
        this.renderScoutsChecklist(eventId);
        this.renderAdminView();
        
        // Show success message
        const scoutNames = checkedInScouts.map(id => {
            const scout = this.scouts.find(s => s.id === id);
            return scout ? scout.name : '';
        }).filter(Boolean);
        
        let message;
        let duration;
        
        if (scoutNames.length === 1) {
            message = `Successfully checked in: ${scoutNames[0]}`;
            duration = 3000;
        } else if (scoutNames.length <= 3) {
            message = `Successfully checked in: ${scoutNames.join(', ')}`;
            duration = 5000;
        } else {
            message = `Successfully checked in ${scoutNames.length} scouts: ${scoutNames.slice(0, 2).join(', ')}, and ${scoutNames.length - 2} more`;
            duration = 6000;
        }
        
        this.showNotification(message, 'success', duration);
    }

    instantCheckin(eventId, scoutId) {
        const scout = this.scouts.find(s => s.id === scoutId);
        if (!scout) return;

        // Add attendance record
        const timestamp = new Date().toISOString();
        this.attendance.push({
            eventId: eventId,
            scoutId: scoutId,
            checkedInAt: timestamp
        });

        this.saveData();
        this.renderScoutsChecklist(eventId);
        this.renderAdminView();

        this.showNotification(`${scout.name} checked in successfully!`, 'success', 3000);
    }

    undoCheckin(eventId, scoutId) {
        const scout = this.scouts.find(s => s.id === scoutId);
        const event = this.events.find(e => e.id === eventId);
        
        if (!scout || !event) return;

        this.showConfirmation(
            'Undo Check-in',
            `Are you sure you want to undo the check-in for "${scout.name}" from "${event.name}"?`,
            () => {
                // Remove the attendance record
                this.attendance = this.attendance.filter(a => 
                    !(a.eventId === eventId && a.scoutId === scoutId)
                );
                
                this.saveData();
                this.renderScoutsChecklist(eventId);
                this.renderAdminView(); // Update admin view counts
                
                this.showNotification(`${scout.name} has been unchecked from ${event.name}.`, 'info');
            },
            'Undo Check-in',
            'warning'
        );
    }

    // Den Management
    handleAddDen(e) {
        e.preventDefault();
        
        const name = document.getElementById('den-name').value.trim();
        
        if (!name) return;

        // Check if den name already exists
        if (this.dens.some(den => den.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('A den with this name already exists!', 'warning', 3000);
            return;
        }

        const den = {
            id: 'den_' + Date.now(),
            name: name,
            order: this.dens.length + 1
        };

        this.dens.push(den);
        this.saveData();
        this.renderDensManagement();
        this.updateAllDenDropdowns();
        
        // Show success notification
        this.showNotification(`${name} den has been added!`, 'success', 3000);
        
        // Reset form
        document.getElementById('den-name').value = '';
    }

    renderDensManagement() {
        const densList = document.getElementById('manage-dens-list');
        
        if (this.dens.length === 0) {
            densList.innerHTML = '<div class="empty-state">No dens created yet.</div>';
            return;
        }

        const sortedDens = this.getSortedDens();

        densList.innerHTML = sortedDens.map(den => {
            const scoutsInDen = this.scouts.filter(s => s.active && s.den === den.name).length;
            
            return `
                <div class="den-item">
                    <div class="den-info">
                        <div class="den-name">${den.name}</div>
                        <div class="den-stats">${scoutsInDen} scout${scoutsInDen !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="den-actions">
                        <button class="btn btn-outline btn-small" onclick="app.editDen('${den.id}')">Edit</button>
                        <button class="btn btn-outline btn-small btn-danger" onclick="app.deleteDen('${den.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    editDen(denId) {
        const den = this.dens.find(d => d.id === denId);
        if (!den) return;

        const newName = prompt('Enter new den name:', den.name);
        if (!newName || newName.trim() === '') return;
        
        const trimmedName = newName.trim();
        
        // Check if new name already exists (excluding current den)
        if (this.dens.some(d => d.id !== denId && d.name.toLowerCase() === trimmedName.toLowerCase())) {
            this.showNotification('A den with this name already exists!', 'warning', 3000);
            return;
        }

        const oldName = den.name;
        den.name = trimmedName;

        // Update all scouts that belong to this den
        this.scouts.forEach(scout => {
            if (scout.den === oldName) {
                scout.den = trimmedName;
            }
        });

        this.saveData();
        this.renderDensManagement();
        this.renderScoutsManagement();
        this.updateAllDenDropdowns();
        
        this.showNotification(`Den renamed from "${oldName}" to "${trimmedName}"!`, 'success', 3000);
    }

    deleteDen(denId) {
        const den = this.dens.find(d => d.id === denId);
        if (!den) return;

        const scoutsInDen = this.scouts.filter(s => s.active && s.den === den.name);
        
        let confirmMessage = `Are you sure you want to delete "${den.name}" den?`;
        if (scoutsInDen.length > 0) {
            confirmMessage += `\n\nThis den has ${scoutsInDen.length} scout${scoutsInDen.length !== 1 ? 's' : ''}. They will need to be reassigned to other dens.`;
        }

        this.showConfirmation(
            'Delete Den',
            confirmMessage,
            () => {
                // If there are scouts in this den, we need to handle reassignment
                if (scoutsInDen.length > 0) {
                    const remainingDens = this.dens.filter(d => d.id !== denId);
                    if (remainingDens.length === 0) {
                        this.showNotification('Cannot delete the last den. Create another den first.', 'error', 4000);
                        return;
                    }
                    
                    // For now, assign scouts to the first remaining den
                    const targetDen = remainingDens[0];
                    scoutsInDen.forEach(scout => {
                        scout.den = targetDen.name;
                    });
                    
                    this.showNotification(`${scoutsInDen.length} scout${scoutsInDen.length !== 1 ? 's' : ''} reassigned to ${targetDen.name}.`, 'info', 4000);
                }

                // Remove the den
                this.dens = this.dens.filter(d => d.id !== denId);
                
                this.saveData();
                this.renderDensManagement();
                this.renderScoutsManagement();
                this.updateAllDenDropdowns();
                
                this.showNotification(`Den "${den.name}" has been deleted.`, 'success', 3000);
            },
            'Delete Den',
            'danger'
        );
    }

    updateAllDenDropdowns() {
        const sortedDens = this.getSortedDens();
        const denOptions = sortedDens.map(den => `<option value="${den.name}">${den.name}</option>`).join('');
        
        // Update all den dropdowns
        const selectors = [
            '#scout-den',
            '#den-filter-select', 
            '#checkin-den-filter-select'
        ];
        
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                const currentValue = element.value;
                
                if (selector === '#den-filter-select' || selector === '#checkin-den-filter-select') {
                    element.innerHTML = '<option value="">All Dens</option>' + denOptions;
                } else {
                    element.innerHTML = denOptions;
                }
                
                // Restore previous selection if it still exists
                if (currentValue && sortedDens.some(den => den.name === currentValue)) {
                    element.value = currentValue;
                }
            }
        });
    }

    // Scout Management
    removeScout(scoutId) {
        const scout = this.scouts.find(s => s.id === scoutId);
        if (!scout) return;

        this.showConfirmation(
            'Remove Scout',
            `Are you sure you want to remove "${scout.name}" from the pack? This action can be undone by re-adding the scout.`,
            () => {
                scout.active = false;
                this.saveData();
                this.renderScoutsManagement();
                this.renderAdminView();
                this.showNotification(`${scout.name} has been removed from the pack.`, 'success');
            },
            'Remove Scout',
            'danger'
        );
    }

    // Event Management
    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Populate the edit form
        document.getElementById('edit-event-name').value = event.name;
        document.getElementById('edit-event-date').value = event.date;
        document.getElementById('edit-event-type').value = event.type;
        document.getElementById('edit-event-description').value = event.description || '';
        document.getElementById('edit-event-instructions').value = event.instructions || '';

        // Store the event ID for the update
        this.editingEventId = eventId;

        this.showModal('edit-event-modal');
    }

    handleEditEvent(e) {
        e.preventDefault();
        
        if (!this.editingEventId) return;

        const event = this.events.find(e => e.id === this.editingEventId);
        if (!event) return;

        // Update the event
        event.name = document.getElementById('edit-event-name').value;
        event.date = document.getElementById('edit-event-date').value;
        event.type = document.getElementById('edit-event-type').value;
        event.description = document.getElementById('edit-event-description').value;
        event.instructions = document.getElementById('edit-event-instructions').value;

        this.saveData();
        this.hideModal('edit-event-modal');
        this.renderAdminView();
        this.renderCheckinView();
        
        this.editingEventId = null;
    }

    deleteEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const attendanceCount = this.attendance.filter(a => a.eventId === eventId).length;
        let confirmMessage = `Are you sure you want to delete "${event.name}"?`;
        
        if (attendanceCount > 0) {
            confirmMessage += `\n\nThis will also delete ${attendanceCount} attendance record(s) for this event.`;
        }

        this.showConfirmation(
            'Delete Event',
            confirmMessage,
            () => {
                // Remove the event
                this.events = this.events.filter(e => e.id !== eventId);
                
                // Remove associated attendance records
                this.attendance = this.attendance.filter(a => a.eventId !== eventId);
                
                this.saveData();
                this.renderAdminView();
                this.renderCheckinView();
                
                this.showNotification(`Event "${event.name}" has been deleted.`, 'success');
            },
            'Delete Event',
            'danger'
        );
    }

    // UI Helper Methods
    toggleAttendees(eventId) {
        const attendeesDiv = document.getElementById(`attendees-${eventId}`);
        const toggleButton = attendeesDiv.previousElementSibling;
        
        if (attendeesDiv.classList.contains('show')) {
            attendeesDiv.classList.remove('show');
            toggleButton.innerHTML = toggleButton.innerHTML.replace('▲', '▼').replace('Hide', 'Show');
        } else {
            attendeesDiv.classList.add('show');
            toggleButton.innerHTML = toggleButton.innerHTML.replace('▼', '▲').replace('Show', 'Hide');
        }
    }

    showFullInstructions() {
        document.getElementById('event-instructions').classList.add('hidden');
        document.getElementById('event-instructions-full').classList.remove('hidden');
    }

    hideFullInstructions() {
        document.getElementById('event-instructions-full').classList.add('hidden');
        document.getElementById('event-instructions').classList.remove('hidden');
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

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    getSortedDens() {
        return this.dens.sort((a, b) => a.order - b.order);
    }

    // Export and Backup Methods
    exportToCSV() {
        const csvData = this.generateCSVData();
        this.downloadFile(csvData, 'scout-attendance.csv', 'text/csv');
    }

    generateCSVData() {
        const headers = ['Event Name', 'Event Date', 'Event Type', 'Scout Name', 'Scout Den', 'Check-in Time'];
        const rows = [headers];

        // Get all attendance records with event and scout details
        this.attendance.forEach(record => {
            const event = this.events.find(e => e.id === record.eventId);
            const scout = this.scouts.find(s => s.id === record.scoutId);
            
            if (event && scout) {
                rows.push([
                    event.name,
                    event.date,
                    this.capitalizeFirst(event.type),
                    scout.name,
                    scout.den,
                    new Date(record.checkedInAt).toLocaleString()
                ]);
            }
        });

        // Convert to CSV format
        return rows.map(row => 
            row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    backupData() {
        const backup = {
            scouts: this.scouts,
            events: this.events,
            attendance: this.attendance,
            dens: this.dens,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };

        const backupData = JSON.stringify(backup, null, 2);
        const filename = `scout-pack-backup-${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(backupData, filename, 'application/json');
    }

    restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                // Validate backup format
                if (!backup.scouts || !backup.events || !backup.attendance) {
                    this.showNotification('Invalid backup file format.', 'error');
                    return;
                }

                this.showConfirmation(
                    'Restore Data',
                    'This will replace all current data with the backup. Are you sure you want to continue?',
                    () => {
                        this.scouts = backup.scouts;
                        this.events = backup.events;
                        this.attendance = backup.attendance;
                        
                        // Handle den data (backwards compatibility)
                        if (backup.dens) {
                            this.dens = backup.dens;
                        } else {
                            // Old backup without dens - initialize with defaults
                            this.dens = [
                                { id: 'den_tigers', name: 'Tigers', order: 1 },
                                { id: 'den_wolves', name: 'Wolves', order: 2 },
                                { id: 'den_bears', name: 'Bears', order: 3 },
                                { id: 'den_webelos', name: 'Webelos', order: 4 },
                                { id: 'den_aol', name: 'Arrow of Light', order: 5 }
                            ];
                        }
                        
                        this.saveData();
                        this.renderViews();
                        
                        this.showNotification('Data restored successfully!', 'success');
                    },
                    'Restore Data',
                    'warning'
                );
            } catch (error) {
                this.showNotification('Error reading backup file. Please check the file format.', 'error');
                console.error('Restore error:', error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Custom Confirmation Modal System
    setupConfirmationModal() {
        const cancelBtn = document.getElementById('confirmation-cancel');
        const confirmBtn = document.getElementById('confirmation-confirm');
        const modal = document.getElementById('confirmation-modal');

        cancelBtn.addEventListener('click', () => {
            this.hideConfirmationModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideConfirmationModal();
        });
    }

    showConfirmation(title, message, onConfirm, confirmText = 'Confirm', confirmType = 'danger') {
        const modal = document.getElementById('confirmation-modal');
        const titleElement = document.getElementById('confirmation-title');
        const messageElement = document.getElementById('confirmation-message');
        const confirmBtn = document.getElementById('confirmation-confirm');

        titleElement.textContent = title;
        messageElement.textContent = message;
        confirmBtn.textContent = confirmText;
        
        // Reset button classes and add appropriate type
        confirmBtn.className = `btn btn-${confirmType}`;

        // Remove any existing event listeners and add new one
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            this.hideConfirmationModal();
            if (onConfirm) onConfirm();
        });

        modal.classList.add('active');
    }

    hideConfirmationModal() {
        document.getElementById('confirmation-modal').classList.remove('active');
    }

    // Notification System
    showNotification(message, type = 'success', duration = 4000) {
        const container = document.getElementById('notification-container');
        
        // Set icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${icons[type] || icons.success}</span>
                <span>${message}</span>
            </div>
        `;

        // Add to container
        container.appendChild(notification);

        // Show notification with slight delay for smooth animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification after duration
        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300); // Wait for removal animation
        }, duration);
    }
}

// Initialize the app
const app = new ScoutAttendanceApp();

// Add some sample data for demonstration
if (app.scouts.length === 0) {
    app.scouts = [
        { id: 'scout_1', name: 'Tommy Smith', den: 'Tigers', active: true },
        { id: 'scout_2', name: 'Sarah Johnson', den: 'Wolves', active: true },
        { id: 'scout_3', name: 'Mike Wilson', den: 'Bears', active: true },
        { id: 'scout_4', name: 'Emma Davis', den: 'Tigers', active: true },
        { id: 'scout_5', name: 'Jake Brown', den: 'Webelos', active: true }
    ];
    
    // Add a sample event for today
    const today = new Date().toISOString().split('T')[0];
    app.events = [
        {
            id: 'event_1',
            name: 'Den Meeting',
            date: today,
            type: 'meeting',
            description: 'Regular weekly den meeting',
            instructions: 'After checking in, please gather in the main hall. Bring your handbook and a pencil.'
        },
        {
            id: 'event_2',
            name: 'Summer Campout',
            date: '2025-08-15',
            type: 'campout',
            description: 'Weekend camping trip',
            instructions: 'Meet at the flagpole after check-in. Make sure you have your sleeping bag and camp gear!'
        }
    ];

    // Add some sample attendance data
    app.attendance = [
        {
            eventId: 'event_1',
            scoutId: 'scout_1',
            checkedInAt: new Date().toISOString()
        },
        {
            eventId: 'event_1',
            scoutId: 'scout_2',
            checkedInAt: new Date().toISOString()
        },
        {
            eventId: 'event_1',
            scoutId: 'scout_4',
            checkedInAt: new Date().toISOString()
        }
    ];
    
    app.saveData();
    app.renderViews();
}