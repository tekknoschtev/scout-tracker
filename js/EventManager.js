class EventManager {
    constructor(dataManager, notificationManager) {
        this.dataManager = dataManager;
        this.notificationManager = notificationManager;
    }

    createEvent(formData) {
        const { name, date, type, attendeeType, description, instructions } = formData;
        
        if (!Utils.validateName(name)) {
            this.notificationManager.showValidationError('Event name');
            return null;
        }

        if (!Utils.validateDate(date)) {
            this.notificationManager.showValidationError('Event date', 'must be a valid date');
            return null;
        }

        if (!type) {
            this.notificationManager.showValidationError('Event type');
            return null;
        }

        const event = ConfigManager.createEvent(
            name, 
            date, 
            type, 
            attendeeType || 'scouts', 
            description || '', 
            instructions || ''
        );

        return event;
    }

    updateEvent(eventId, formData, events) {
        const event = Utils.findById(events, eventId);
        if (!event) {
            this.notificationManager.showErrorMessage('Event not found');
            return null;
        }

        const { name, date, type, attendeeType, description, instructions } = formData;
        
        if (!Utils.validateName(name)) {
            this.notificationManager.showValidationError('Event name');
            return null;
        }

        if (!Utils.validateDate(date)) {
            this.notificationManager.showValidationError('Event date', 'must be a valid date');
            return null;
        }

        if (!type) {
            this.notificationManager.showValidationError('Event type');
            return null;
        }

        const updatedEvent = {
            ...event,
            name: name.trim(),
            date: date,
            type: type,
            attendeeType: attendeeType || 'scouts',
            description: (description || '').trim(),
            instructions: (instructions || '').trim()
        };

        const updatedEvents = Utils.updateById(events, eventId, updatedEvent);
        this.notificationManager.showItemUpdatedSuccess(updatedEvent.name);
        
        return updatedEvents;
    }

    deleteEvent(eventId, events, attendance) {
        const event = Utils.findById(events, eventId);
        if (!event) {
            this.notificationManager.showErrorMessage('Event not found');
            return { events, attendance };
        }

        const attendanceCount = this.dataManager.findAttendanceForEvent(attendance, eventId).length;
        let confirmMessage = `Are you sure you want to delete "${event.name}"?`;
        
        if (attendanceCount > 0) {
            confirmMessage += `\n\nThis will also delete ${attendanceCount} attendance record(s) for this event.`;
        }

        return new Promise((resolve) => {
            this.notificationManager.showConfirmation(
                'Delete Event',
                confirmMessage,
                () => {
                    const updatedEvents = Utils.removeById(events, eventId);
                    const updatedAttendance = attendance.filter(a => a.eventId !== eventId);
                    
                    this.notificationManager.showItemRemovedSuccess(`Event "${event.name}"`);
                    resolve({ events: updatedEvents, attendance: updatedAttendance });
                },
                'Delete Event',
                'danger'
            );
        });
    }

    getUpcomingEvents(events, daysAhead = 30) {
        const today = Utils.getTodayString();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureDateString = futureDate.toISOString().split('T')[0];

        return events
            .filter(event => event.date >= today && event.date <= futureDateString)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getPastEvents(events) {
        const today = Utils.getTodayString();
        return events
            .filter(event => event.date < today)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getTodaysEvents(events) {
        const today = Utils.getTodayString();
        return events.filter(event => event.date === today);
    }

    getEventsByType(events, eventType) {
        return events.filter(event => event.type === eventType);
    }

    getEventsByAttendeeType(events, attendeeType) {
        return events.filter(event => (event.attendeeType || 'scouts') === attendeeType);
    }

    getEventsWithAttendance(events, attendance) {
        return events.map(event => ({
            ...event,
            attendanceCount: this.dataManager.findAttendanceForEvent(attendance, event.id).length
        }));
    }

    getEventStatistics(events, attendance) {
        const stats = {
            totalEvents: events.length,
            upcomingEvents: this.getUpcomingEvents(events).length,
            pastEvents: this.getPastEvents(events).length,
            scoutEvents: this.getEventsByAttendeeType(events, 'scouts').length,
            parentEvents: this.getEventsByAttendeeType(events, 'parents').length,
            totalAttendance: attendance.length
        };

        const eventTypes = [...new Set(events.map(e => e.type))];
        eventTypes.forEach(type => {
            stats[`${type}Events`] = this.getEventsByType(events, type).length;
        });

        return stats;
    }

    validateEventForm(formData) {
        const errors = [];
        const { name, date, type, attendeeType } = formData;

        if (!Utils.validateName(name)) {
            errors.push('Event name is required');
        }

        if (!Utils.validateDate(date)) {
            errors.push('Valid event date is required');
        }

        if (!type) {
            errors.push('Event type is required');
        }

        if (!attendeeType || !['scouts', 'parents'].includes(attendeeType)) {
            errors.push('Valid attendee type is required (scouts or parents)');
        }

        return errors;
    }

    searchEvents(events, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return events;
        }

        const term = searchTerm.toLowerCase().trim();
        return events.filter(event => 
            event.name.toLowerCase().includes(term) ||
            event.description.toLowerCase().includes(term) ||
            event.type.toLowerCase().includes(term) ||
            Utils.formatDate(event.date).toLowerCase().includes(term)
        );
    }

    filterEventsByDateRange(events, startDate, endDate) {
        return events.filter(event => 
            event.date >= startDate && event.date <= endDate
        );
    }

    duplicateEvent(eventId, events, newDate = null) {
        const originalEvent = Utils.findById(events, eventId);
        if (!originalEvent) {
            this.notificationManager.showErrorMessage('Event not found');
            return events;
        }

        const duplicatedEvent = {
            ...originalEvent,
            id: Utils.generateSimpleId('event'),
            name: `${originalEvent.name} (Copy)`,
            date: newDate || Utils.getTodayString()
        };

        const updatedEvents = [...events, duplicatedEvent];
        this.notificationManager.showSuccessMessage(`Event "${duplicatedEvent.name}" created successfully!`);
        
        return updatedEvents;
    }

    getEventDetails(eventId, events, attendance, scouts, parents) {
        const event = Utils.findById(events, eventId);
        if (!event) return null;

        const eventAttendance = this.dataManager.findAttendanceForEvent(attendance, eventId);
        const isParentEvent = (event.attendeeType || 'scouts') === 'parents';
        
        const attendees = eventAttendance.map(record => {
            if (isParentEvent) {
                const parent = Utils.findById(parents, record.parentId);
                return parent ? { ...parent, type: 'parent', checkedInAt: record.checkedInAt } : null;
            } else {
                const scout = Utils.findById(scouts, record.scoutId);
                return scout ? { ...scout, type: 'scout', checkedInAt: record.checkedInAt } : null;
            }
        }).filter(Boolean);

        const totalEligible = isParentEvent ? 
            Utils.filterActiveItems(parents).length : 
            Utils.filterActiveItems(scouts).length;

        return {
            ...event,
            attendees,
            attendanceCount: eventAttendance.length,
            totalEligible,
            attendanceRate: totalEligible > 0 ? (eventAttendance.length / totalEligible * 100).toFixed(1) : 0
        };
    }

    canDeleteEvent(eventId, attendance) {
        const eventAttendance = this.dataManager.findAttendanceForEvent(attendance, eventId);
        return eventAttendance.length === 0;
    }

    archiveOldEvents(events, daysOld = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffDateString = cutoffDate.toISOString().split('T')[0];

        const eventsToKeep = events.filter(event => event.date >= cutoffDateString);
        const archivedCount = events.length - eventsToKeep.length;

        if (archivedCount > 0) {
            this.notificationManager.showInfoMessage(`Archived ${archivedCount} old events`);
        }

        return eventsToKeep;
    }

    getEventConflicts(events, newEventDate, excludeEventId = null) {
        return events.filter(event => 
            event.id !== excludeEventId && 
            event.date === newEventDate
        );
    }

    hasEventConflicts(events, eventDate, excludeEventId = null) {
        return this.getEventConflicts(events, eventDate, excludeEventId).length > 0;
    }

    getEventsForDateRange(events, startDate, endDate) {
        return events
            .filter(event => event.date >= startDate && event.date <= endDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getMonthlyEvents(events, year, month) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        
        return this.getEventsForDateRange(events, startDate, endDate);
    }

    getYearlyEvents(events, year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        return this.getEventsForDateRange(events, startDate, endDate);
    }
}