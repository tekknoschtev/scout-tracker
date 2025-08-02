class DenEventTypeManager {
    constructor(dataManager, notificationManager, scoutManager) {
        this.dataManager = dataManager;
        this.notificationManager = notificationManager;
        this.scoutManager = scoutManager;
    }

    // Den Management
    addDen(name, dens) {
        if (!Utils.validateName(name)) {
            this.notificationManager.showValidationError('Den name');
            return dens;
        }

        if (!Utils.isItemUnique(dens, { name: name.trim() }, 'name')) {
            this.notificationManager.showDuplicateError('den');
            return dens;
        }

        const den = ConfigManager.createDen(name, dens.length + 1);
        const updatedDens = [...dens, den];
        
        this.notificationManager.showItemAddedSuccess(`${den.name} den`);
        return updatedDens;
    }

    updateDen(denId, newName, dens, scouts, parents) {
        const den = Utils.findById(dens, denId);
        if (!den) {
            this.notificationManager.showErrorMessage('Den not found');
            return { dens, scouts, parents };
        }

        if (!Utils.validateName(newName)) {
            this.notificationManager.showValidationError('Den name');
            return { dens, scouts, parents };
        }

        const trimmedName = newName.trim();
        
        if (!Utils.isItemUnique(dens, { name: trimmedName }, 'name', denId)) {
            this.notificationManager.showDuplicateError('den');
            return { dens, scouts, parents };
        }

        const oldName = den.name;
        const updatedDens = Utils.updateById(dens, denId, { name: trimmedName });
        
        // Update all scouts and parents that belong to this den
        const { scouts: updatedScouts, parents: updatedParents } = 
            this.scoutManager.bulkUpdateDen(oldName, trimmedName, scouts, parents);

        this.notificationManager.showItemUpdatedSuccess(`Den renamed from "${oldName}" to "${trimmedName}"`);
        
        return { 
            dens: updatedDens, 
            scouts: updatedScouts, 
            parents: updatedParents 
        };
    }

    deleteDen(denId, dens, scouts, parents) {
        const den = Utils.findById(dens, denId);
        if (!den) {
            this.notificationManager.showErrorMessage('Den not found');
            return { dens, scouts, parents };
        }

        const scoutsInDen = scouts.filter(s => s.active && s.den === den.name);
        const parentsInDen = parents.filter(p => p.active && p.den === den.name);
        const totalPeople = scoutsInDen.length + parentsInDen.length;
        
        let confirmMessage = `Are you sure you want to delete "${den.name}" den?`;
        if (totalPeople > 0) {
            confirmMessage += `\n\nThis den has ${scoutsInDen.length} scouts and ${parentsInDen.length} parents. They will need to be reassigned to other dens.`;
        }

        return new Promise((resolve) => {
            this.notificationManager.showConfirmation(
                'Delete Den',
                confirmMessage,
                () => {
                    let updatedScouts = [...scouts];
                    let updatedParents = [...parents];

                    // If there are people in this den, we need to handle reassignment
                    if (totalPeople > 0) {
                        const remainingDens = dens.filter(d => d.id !== denId);
                        if (remainingDens.length === 0) {
                            this.notificationManager.showErrorMessage('Cannot delete the last den. Create another den first.');
                            resolve({ dens, scouts, parents });
                            return;
                        }
                        
                        // For now, assign people to the first remaining den
                        const targetDen = remainingDens[0];
                        const updateResult = this.scoutManager.bulkUpdateDen(den.name, targetDen.name, scouts, parents);
                        updatedScouts = updateResult.scouts;
                        updatedParents = updateResult.parents;
                    }

                    // Remove the den
                    const updatedDens = Utils.removeById(dens, denId);
                    
                    this.notificationManager.showItemRemovedSuccess(`Den "${den.name}"`);
                    resolve({ 
                        dens: updatedDens, 
                        scouts: updatedScouts, 
                        parents: updatedParents 
                    });
                },
                'Delete Den',
                'danger'
            );
        });
    }

    getDenStatistics(dens, scouts, parents) {
        return dens.map(den => {
            const denScouts = scouts.filter(s => s.active && s.den === den.name);
            const denParents = parents.filter(p => p.active && p.den === den.name);
            
            return {
                ...den,
                scoutCount: denScouts.length,
                parentCount: denParents.length,
                totalCount: denScouts.length + denParents.length
            };
        });
    }

    reorderDens(denIds, dens) {
        const updatedDens = dens.map(den => {
            const newOrder = denIds.indexOf(den.id) + 1;
            return { ...den, order: newOrder > 0 ? newOrder : den.order };
        });

        this.notificationManager.showSuccessMessage('Den order updated successfully');
        return Utils.sortByOrder(updatedDens);
    }

    // Event Type Management
    addEventType(name, eventTypes) {
        if (!Utils.validateName(name)) {
            this.notificationManager.showValidationError('Event type name');
            return eventTypes;
        }

        if (!Utils.isItemUnique(eventTypes, { name: name.trim() }, 'name')) {
            this.notificationManager.showDuplicateError('event type');
            return eventTypes;
        }

        const eventType = ConfigManager.createEventType(name, eventTypes.length + 1);
        const updatedEventTypes = [...eventTypes, eventType];
        
        this.notificationManager.showItemAddedSuccess(`${eventType.name} event type`);
        return updatedEventTypes;
    }

    updateEventType(eventTypeId, newName, eventTypes, events) {
        const eventType = Utils.findById(eventTypes, eventTypeId);
        if (!eventType) {
            this.notificationManager.showErrorMessage('Event type not found');
            return { eventTypes, events };
        }

        if (!Utils.validateName(newName)) {
            this.notificationManager.showValidationError('Event type name');
            return { eventTypes, events };
        }

        const trimmedName = newName.trim();
        
        if (!Utils.isItemUnique(eventTypes, { name: trimmedName }, 'name', eventTypeId)) {
            this.notificationManager.showDuplicateError('event type');
            return { eventTypes, events };
        }

        const oldName = eventType.name;
        const oldValue = eventType.value;
        const newValue = Utils.createSlug(trimmedName);
        
        const updatedEventTypes = Utils.updateById(eventTypes, eventTypeId, {
            name: trimmedName,
            value: newValue
        });

        // Update all events that use this event type
        const updatedEvents = events.map(event => 
            event.type === oldValue ? { ...event, type: newValue } : event
        );

        this.notificationManager.showItemUpdatedSuccess(`Event type renamed from "${oldName}" to "${trimmedName}"`);
        
        return { eventTypes: updatedEventTypes, events: updatedEvents };
    }

    deleteEventType(eventTypeId, eventTypes, events) {
        const eventType = Utils.findById(eventTypes, eventTypeId);
        if (!eventType) {
            this.notificationManager.showErrorMessage('Event type not found');
            return { eventTypes, events };
        }

        const eventsOfType = events.filter(e => e.type === eventType.value);
        
        let confirmMessage = `Are you sure you want to delete "${eventType.name}" event type?`;
        if (eventsOfType.length > 0) {
            confirmMessage += `\n\nThis event type has ${eventsOfType.length} event${eventsOfType.length !== 1 ? 's' : ''}. They will be changed to "Other" type.`;
        }

        return new Promise((resolve) => {
            this.notificationManager.showConfirmation(
                'Delete Event Type',
                confirmMessage,
                () => {
                    let updatedEvents = [...events];

                    // If there are events using this type, change them to "other"
                    if (eventsOfType.length > 0) {
                        const otherType = eventTypes.find(t => t.value === 'other');
                        const targetValue = otherType ? otherType.value : 'other';
                        
                        updatedEvents = events.map(event => 
                            event.type === eventType.value ? { ...event, type: targetValue } : event
                        );
                        
                        this.notificationManager.showInfoMessage(
                            `${eventsOfType.length} event${eventsOfType.length !== 1 ? 's' : ''} changed to "Other" type`
                        );
                    }

                    // Remove the event type
                    const updatedEventTypes = Utils.removeById(eventTypes, eventTypeId);
                    
                    this.notificationManager.showItemRemovedSuccess(`Event type "${eventType.name}"`);
                    resolve({ eventTypes: updatedEventTypes, events: updatedEvents });
                },
                'Delete Event Type',
                'danger'
            );
        });
    }

    getEventTypeStatistics(eventTypes, events) {
        return eventTypes.map(eventType => {
            const typeEvents = events.filter(e => e.type === eventType.value);
            
            return {
                ...eventType,
                eventCount: typeEvents.length,
                upcomingEvents: typeEvents.filter(e => e.date >= Utils.getTodayString()).length,
                pastEvents: typeEvents.filter(e => e.date < Utils.getTodayString()).length
            };
        });
    }

    reorderEventTypes(eventTypeIds, eventTypes) {
        const updatedEventTypes = eventTypes.map(eventType => {
            const newOrder = eventTypeIds.indexOf(eventType.id) + 1;
            return { ...eventType, order: newOrder > 0 ? newOrder : eventType.order };
        });

        this.notificationManager.showSuccessMessage('Event type order updated successfully');
        return Utils.sortByOrder(updatedEventTypes);
    }

    // Utility methods
    getSortedDens(dens) {
        return Utils.sortByOrder(dens);
    }

    getSortedEventTypes(eventTypes) {
        return Utils.sortByOrder(eventTypes);
    }

    findDenByName(dens, name) {
        return dens.find(den => den.name.toLowerCase() === name.toLowerCase());
    }

    findEventTypeByValue(eventTypes, value) {
        return eventTypes.find(type => type.value === value);
    }

    validateDenName(name, dens, excludeId = null) {
        if (!Utils.validateName(name)) {
            return 'Den name is required';
        }
        
        if (!Utils.isItemUnique(dens, { name: name.trim() }, 'name', excludeId)) {
            return 'A den with this name already exists';
        }
        
        return null;
    }

    validateEventTypeName(name, eventTypes, excludeId = null) {
        if (!Utils.validateName(name)) {
            return 'Event type name is required';
        }
        
        if (!Utils.isItemUnique(eventTypes, { name: name.trim() }, 'name', excludeId)) {
            return 'An event type with this name already exists';
        }
        
        return null;
    }

    exportDensToCSV(dens, scouts, parents) {
        const denStats = this.getDenStatistics(dens, scouts, parents);
        
        const csvData = [
            ['Den Name', 'Scout Count', 'Parent Count', 'Total Count', 'Order'],
            ...denStats.map(den => [
                den.name,
                den.scoutCount,
                den.parentCount,
                den.totalCount,
                den.order
            ])
        ];

        const csvContent = csvData.map(row => Utils.createCsvRow(row)).join('\n');
        const filename = `dens_statistics_${Utils.getTodayString()}.csv`;
        
        Utils.downloadFile(csvContent, filename, 'text/csv');
        return csvContent;
    }

    exportEventTypesToCSV(eventTypes, events) {
        const typeStats = this.getEventTypeStatistics(eventTypes, events);
        
        const csvData = [
            ['Event Type', 'Value', 'Total Events', 'Upcoming Events', 'Past Events', 'Order'],
            ...typeStats.map(type => [
                type.name,
                type.value,
                type.eventCount,
                type.upcomingEvents,
                type.pastEvents,
                type.order
            ])
        ];

        const csvContent = csvData.map(row => Utils.createCsvRow(row)).join('\n');
        const filename = `event_types_statistics_${Utils.getTodayString()}.csv`;
        
        Utils.downloadFile(csvContent, filename, 'text/csv');
        return csvContent;
    }
}