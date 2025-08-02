class RenderManager {
    constructor(dataManager, uiManager) {
        this.dataManager = dataManager;
        this.uiManager = uiManager;
    }

    renderAdminView(events, scouts, parents, dens, eventTypes, attendance) {
        const eventsList = document.getElementById('events-list');
        
        if (events.length === 0) {
            eventsList.innerHTML = '<div class="empty-state">No events scheduled yet. Create your first event!</div>';
            return;
        }

        const today = Utils.getTodayString();
        const showPastEvents = this.uiManager.getElementValue('show-past-events');
        
        let eventsToShow = showPastEvents ? events : events.filter(event => event.date >= today);
        eventsToShow = eventsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));

        eventsList.innerHTML = eventsToShow.map(event => 
            this.renderEventItem(event, scouts, parents, attendance, today)
        ).join('');
    }

    renderEventItem(event, scouts, parents, attendance, today) {
        const attendanceRecords = attendance.filter(a => a.eventId === event.id);
        const attendanceCount = attendanceRecords.length;
        const eventAttendeeType = event.attendeeType || 'scouts';
        const isParentEvent = eventAttendeeType === 'parents';
        const totalAttendees = isParentEvent ? 
            Utils.filterActiveItems(parents).length : 
            Utils.filterActiveItems(scouts).length;
        const isPastEvent = event.date < today;
        
        const attendees = attendanceRecords.map(record => {
            if (isParentEvent) {
                const parent = Utils.findById(parents, record.parentId);
                return parent ? { name: parent.name, den: parent.den } : null;
            } else {
                const scout = Utils.findById(scouts, record.scoutId);
                return scout ? { name: scout.name, den: scout.den } : null;
            }
        }).filter(Boolean);
        
        const hasLongDescription = event.description && event.description.length > 100;
        const truncatedDescription = hasLongDescription ? Utils.truncateText(event.description, 100) : event.description;
        
        return `
            <div class="event-item ${isPastEvent ? 'event-past' : ''}">
                <div class="event-info">
                    <h4>${Utils.escapeHtml(event.name)}</h4>
                    <p>${Utils.formatDate(event.date)} • ${Utils.capitalizeFirst(event.type)} • ${isParentEvent ? 'Parent' : 'Scout'} Event</p>
                    ${event.description ? `
                        <p id="desc-${event.id}" class="event-description">
                            ${Utils.escapeHtml(truncatedDescription)}
                            ${hasLongDescription ? `<button class="expand-description" onclick="app.uiManager.toggleDescription('${event.id}')">more</button>` : ''}
                        </p>
                        ${hasLongDescription ? `<p id="desc-full-${event.id}" class="event-description-full hidden">${Utils.escapeHtml(event.description)} <button class="expand-description" onclick="app.uiManager.toggleDescription('${event.id}')">less</button></p>` : ''}
                    ` : ''}
                    ${attendanceCount > 0 ? `<button class="toggle-attendees" onclick="app.uiManager.toggleAttendees('${event.id}')">
                        ${attendanceCount === 1 ? 'Show 1 attendee' : `Show ${attendanceCount} attendees`} ▼
                    </button>` : ''}
                    <div id="attendees-${event.id}" class="event-attendees">
                        <h5>Attendees:</h5>
                        <div class="attendee-list">
                            ${attendees.map(attendee => 
                                `<span class="attendee-tag">${Utils.escapeHtml(attendee.name)} (${Utils.escapeHtml(attendee.den)})</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                <div class="event-controls">
                    <div class="event-attendance">
                        ${attendanceCount}/${totalAttendees} ${isParentEvent ? 'parents' : 'scouts'}
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-small btn-outline" onclick="app.editEvent('${event.id}')">Edit</button>
                        <button class="btn btn-small btn-outline btn-danger" onclick="app.deleteEvent('${event.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCheckinView(events) {
        const eventSelect = document.getElementById('event-select');
        const today = Utils.getTodayString();
        
        const availableEvents = events
            .filter(event => event.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        eventSelect.innerHTML = '<option value="">Choose an event...</option>' +
            availableEvents.map(event => 
                `<option value="${event.id}">${Utils.escapeHtml(event.name)} - ${Utils.formatDate(event.date)}</option>`
            ).join('');

        eventSelect.value = '';
        this.uiManager.addClass('event-info', 'hidden');
        this.uiManager.addClass('checkin-form', 'hidden');
    }

    renderScoutsManagement(scouts, dens) {
        const scoutsList = document.getElementById('manage-scouts-list');
        const selectedDen = this.uiManager.getElementValue('den-filter-select');
        
        let activeScouts = Utils.filterActiveItems(scouts);
        
        if (activeScouts.length === 0) {
            scoutsList.innerHTML = '<div class="empty-state">No scouts added yet.</div>';
            return;
        }

        if (selectedDen) {
            activeScouts = activeScouts.filter(s => s.den === selectedDen);
        }

        const scoutsByDen = Utils.groupBy(activeScouts, 'den');
        const sortedDens = this.getSortedDenKeys(scoutsByDen, dens);

        if (sortedDens.length === 0) {
            scoutsList.innerHTML = '<div class="empty-state">No scouts found for the selected den.</div>';
            return;
        }

        scoutsList.innerHTML = sortedDens.map(den => 
            this.renderDenGroup(scoutsByDen[den], den, 'scout')
        ).join('');
    }

    renderParentsManagement(parents, dens) {
        const parentsList = document.getElementById('manage-parents-list');
        const selectedDen = this.uiManager.getElementValue('parent-den-filter-select');
        
        let activeParents = Utils.filterActiveItems(parents);
        
        if (activeParents.length === 0) {
            parentsList.innerHTML = '<div class="empty-state">No parents added yet.</div>';
            return;
        }

        if (selectedDen) {
            activeParents = activeParents.filter(p => p.den === selectedDen);
        }

        const parentsByDen = Utils.groupBy(activeParents, 'den');
        const sortedDens = this.getSortedDenKeys(parentsByDen, dens);

        if (sortedDens.length === 0) {
            parentsList.innerHTML = '<div class="empty-state">No parents found for the selected den.</div>';
            return;
        }

        parentsList.innerHTML = sortedDens.map(den => 
            this.renderDenGroup(parentsByDen[den], den, 'parent')
        ).join('');
    }

    renderDenGroup(people, denName, type) {
        const sortedPeople = Utils.sortByName(people);
        const typeClass = type === 'scout' ? 'scout' : 'parent';
        const groupClass = type === 'scout' ? 'den-group' : 'parent-group';
        const itemsClass = type === 'scout' ? 'den-scouts' : 'den-parents';
        
        return `
            <div class="${groupClass}">
                <div class="${groupClass}-header">
                    <div class="${groupClass}-title">${Utils.escapeHtml(denName)}</div>
                    <div class="${groupClass}-count">${sortedPeople.length}</div>
                </div>
                <div class="${itemsClass}">
                    ${sortedPeople.map(person => `
                        <div class="${typeClass}-item">
                            <div class="${typeClass}-info">
                                <div class="${typeClass}-name">${Utils.escapeHtml(person.name)}</div>
                            </div>
                            <button class="btn btn-outline btn-small" onclick="app.remove${Utils.capitalizeFirst(type)}('${person.id}')">
                                Remove
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDensManagement(dens, scouts) {
        const densList = document.getElementById('manage-dens-list');
        
        if (dens.length === 0) {
            densList.innerHTML = '<div class="empty-state">No dens created yet.</div>';
            return;
        }

        const sortedDens = Utils.sortByOrder(dens);

        densList.innerHTML = sortedDens.map(den => {
            const scoutsInDen = scouts.filter(s => s.active && s.den === den.name).length;
            
            return `
                <div class="den-item">
                    <div class="den-info">
                        <div class="den-name">${Utils.escapeHtml(den.name)}</div>
                        <div class="den-stats">${scoutsInDen} ${Utils.pluralize(scoutsInDen, 'scout')}</div>
                    </div>
                    <div class="den-actions">
                        <button class="btn btn-outline btn-small" onclick="app.editDen('${den.id}')">Edit</button>
                        <button class="btn btn-outline btn-small btn-danger" onclick="app.deleteDen('${den.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderEventTypesManagement(eventTypes, events) {
        const eventTypesList = document.getElementById('manage-event-types-list');
        
        if (eventTypes.length === 0) {
            eventTypesList.innerHTML = '<div class="empty-state">No event types created yet.</div>';
            return;
        }

        const sortedEventTypes = Utils.sortByOrder(eventTypes);

        eventTypesList.innerHTML = sortedEventTypes.map(eventType => {
            const eventsOfType = events.filter(e => e.type === eventType.value).length;
            
            return `
                <div class="event-type-item">
                    <div class="event-type-info">
                        <div class="event-type-name">${Utils.escapeHtml(eventType.name)}</div>
                        <div class="event-type-stats">${eventsOfType} ${Utils.pluralize(eventsOfType, 'event')}</div>
                    </div>
                    <div class="event-type-actions">
                        <button class="btn btn-outline btn-small" onclick="app.editEventType('${eventType.id}')">Edit</button>
                        <button class="btn btn-outline btn-small btn-danger" onclick="app.deleteEventType('${eventType.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAttendeesChecklist(event, scouts, parents, attendance, dens) {
        const attendeeType = event.attendeeType || 'scouts';
        const isParentEvent = attendeeType === 'parents';
        
        const checkinHeader = document.querySelector('.checkin-header h3');
        if (checkinHeader) {
            checkinHeader.textContent = `Select ${isParentEvent ? 'parents' : 'scouts'} to check in:`;
        }

        if (isParentEvent) {
            this.renderParentsChecklist(event.id, parents, attendance, dens);
        } else {
            this.renderScoutsChecklist(event.id, scouts, attendance, dens);
        }
    }

    renderScoutsChecklist(eventId, scouts, attendance, dens) {
        const scoutsList = document.getElementById('scouts-list');
        const selectedDen = this.uiManager.getElementValue('checkin-den-filter-select');
        
        let activeScouts = Utils.filterActiveItems(scouts);
        const alreadyCheckedIn = attendance
            .filter(a => a.eventId === eventId)
            .map(a => a.scoutId);

        if (selectedDen) {
            activeScouts = activeScouts.filter(s => s.den === selectedDen);
        }

        const scoutsByDen = Utils.groupBy(activeScouts, 'den');
        const sortedDens = this.getSortedDenKeys(scoutsByDen, dens);

        if (sortedDens.length === 0) {
            scoutsList.innerHTML = '<div class="empty-state">No scouts available for check-in.</div>';
            return;
        }

        scoutsList.innerHTML = sortedDens.map(den => 
            this.renderCheckinDenGroup(scoutsByDen[den], den, alreadyCheckedIn, eventId, 'scout')
        ).join('');
    }

    renderParentsChecklist(eventId, parents, attendance, dens) {
        const parentsList = document.getElementById('scouts-list');
        const selectedDen = this.uiManager.getElementValue('checkin-den-filter-select');
        
        let activeParents = Utils.filterActiveItems(parents);
        const alreadyCheckedIn = attendance
            .filter(a => a.eventId === eventId)
            .map(a => a.parentId || a.scoutId);

        if (selectedDen) {
            activeParents = activeParents.filter(p => p.den === selectedDen);
        }

        const parentsByDen = Utils.groupBy(activeParents, 'den');
        const sortedDens = this.getSortedDenKeys(parentsByDen, dens);

        if (sortedDens.length === 0) {
            parentsList.innerHTML = '<div class="empty-state">No parents available for check-in.</div>';
            return;
        }

        parentsList.innerHTML = sortedDens.map(den => 
            this.renderCheckinDenGroup(parentsByDen[den], den, alreadyCheckedIn, eventId, 'parent')
        ).join('');
    }

    renderCheckinDenGroup(people, denName, alreadyCheckedIn, eventId, type) {
        const sortedPeople = Utils.sortByName(people);
        const checkedInCount = sortedPeople.filter(person => alreadyCheckedIn.includes(person.id)).length;
        const actionPrefix = type === 'scout' ? '' : 'Parent';
        
        return `
            <div class="checkin-den-group">
                <div class="checkin-den-header">
                    <div class="checkin-den-title">${Utils.escapeHtml(denName)}</div>
                    <div class="checkin-den-count">${checkedInCount}/${sortedPeople.length}</div>
                </div>
                <div class="checkin-den-scouts">
                    ${sortedPeople.map(person => {
                        const isCheckedIn = alreadyCheckedIn.includes(person.id);
                        return `
                            <div class="scout-checkbox ${isCheckedIn ? 'checked-in clickable' : 'clickable'}" 
                                 onclick="${isCheckedIn ? `app.undo${actionPrefix}Checkin('${eventId}', '${person.id}')` : `app.instant${actionPrefix}Checkin('${eventId}', '${person.id}')`}">
                                <input type="checkbox" 
                                       id="${type}-${person.id}" 
                                       value="${person.id}"
                                       ${isCheckedIn ? 'checked disabled' : 'disabled'}>
                                <label for="${type}-${person.id}">
                                    ${Utils.escapeHtml(person.name)}
                                    ${isCheckedIn ? ' ✓ Already checked in' : ''}
                                </label>
                                ${isCheckedIn ? `
                                    <button class="btn btn-small btn-outline undo-checkin" 
                                            onclick="app.undo${actionPrefix}Checkin('${eventId}', '${person.id}')"
                                            title="Undo check-in for ${Utils.escapeHtml(person.name)}">
                                        Undo
                                    </button>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    getSortedDenKeys(groupedData, dens) {
        return Object.keys(groupedData).sort((a, b) => {
            const denA = dens.find(den => den.name === a);
            const denB = dens.find(den => den.name === b);
            const orderA = denA ? denA.order : 999;
            const orderB = denB ? denB.order : 999;
            return orderA - orderB;
        });
    }

    populateEventInfo(event) {
        this.uiManager.setTextContent('event-title', event.name);
        this.uiManager.setTextContent('event-date', Utils.formatDate(event.date));

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
    }
}