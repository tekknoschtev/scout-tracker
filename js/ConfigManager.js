class ConfigManager {
    static getDefaultDens() {
        return [
            { id: 'den_tigers', name: 'Tigers', order: 1 },
            { id: 'den_wolves', name: 'Wolves', order: 2 },
            { id: 'den_bears', name: 'Bears', order: 3 },
            { id: 'den_webelos', name: 'Webelos', order: 4 },
            { id: 'den_aol', name: 'Arrow of Light', order: 5 }
        ];
    }

    static getDefaultEventTypes() {
        return [
            { id: 'type_meeting', name: 'Den Meeting', value: 'meeting', order: 1 },
            { id: 'type_campout', name: 'Campout', value: 'campout', order: 2 },
            { id: 'type_service', name: 'Service Project', value: 'service', order: 3 },
            { id: 'type_other', name: 'Other', value: 'other', order: 4 }
        ];
    }

    static getSampleScouts() {
        return [
            { id: 'scout_1', name: 'Tommy Smith', den: 'Tigers', active: true },
            { id: 'scout_2', name: 'Sarah Johnson', den: 'Wolves', active: true },
            { id: 'scout_3', name: 'Mike Wilson', den: 'Bears', active: true },
            { id: 'scout_4', name: 'Emma Davis', den: 'Tigers', active: true },
            { id: 'scout_5', name: 'Jake Brown', den: 'Webelos', active: true }
        ];
    }

    static getSampleParents() {
        return [
            { id: 'parent_1', name: 'John Smith', den: 'Tigers', active: true },
            { id: 'parent_2', name: 'Lisa Johnson', den: 'Wolves', active: true },
            { id: 'parent_3', name: 'Mark Wilson', den: 'Bears', active: true },
            { id: 'parent_4', name: 'Jennifer Davis', den: 'Tigers', active: true },
            { id: 'parent_5', name: 'Robert Brown', den: 'Webelos', active: true }
        ];
    }

    static getSampleEvents() {
        const today = Utils.getTodayString();
        
        return [
            {
                id: 'event_1',
                name: 'Den Meeting',
                date: today,
                type: 'meeting',
                attendeeType: 'scouts',
                description: 'Regular weekly den meeting',
                instructions: 'After checking in, please gather in the main hall. Bring your handbook and a pencil.'
            },
            {
                id: 'event_2',
                name: 'Summer Campout',
                date: '2025-08-15',
                type: 'campout',
                attendeeType: 'scouts',
                description: 'Weekend camping trip',
                instructions: 'Meet at the flagpole after check-in. Make sure you have your sleeping bag and camp gear!'
            },
            {
                id: 'event_3',
                name: 'Parent Meeting',
                date: today,
                type: 'meeting',
                attendeeType: 'parents',
                description: 'Monthly parent planning meeting',
                instructions: 'After checking in, please proceed to the conference room.'
            }
        ];
    }

    static getSampleAttendance() {
        const timestamp = Utils.getCurrentTimestamp();
        
        return [
            {
                eventId: 'event_1',
                scoutId: 'scout_1',
                checkedInAt: timestamp
            },
            {
                eventId: 'event_1',
                scoutId: 'scout_2',
                checkedInAt: timestamp
            },
            {
                eventId: 'event_1',
                scoutId: 'scout_4',
                checkedInAt: timestamp
            },
            {
                eventId: 'event_3',
                parentId: 'parent_1',
                checkedInAt: timestamp
            },
            {
                eventId: 'event_3',
                parentId: 'parent_3',
                checkedInAt: timestamp
            }
        ];
    }

    static initializeDefaultData() {
        return {
            scouts: [],
            parents: [],
            events: [],
            attendance: [],
            dens: this.getDefaultDens(),
            eventTypes: this.getDefaultEventTypes()
        };
    }

    static initializeWithSampleData() {
        return {
            scouts: this.getSampleScouts(),
            parents: this.getSampleParents(),
            events: this.getSampleEvents(),
            attendance: this.getSampleAttendance(),
            dens: this.getDefaultDens(),
            eventTypes: this.getDefaultEventTypes()
        };
    }

    static getDropdownSelectors() {
        return {
            denSelectors: [
                '#scout-den',
                '#parent-den',
                '#den-filter-select', 
                '#parent-den-filter-select',
                '#checkin-den-filter-select'
            ],
            eventTypeSelectors: [
                '#event-type',
                '#edit-event-type'
            ]
        };
    }

    static getValidationRules() {
        return {
            scout: {
                name: { required: true, minLength: 1 },
                den: { required: true }
            },
            parent: {
                name: { required: true, minLength: 1 },
                den: { required: true }
            },
            event: {
                name: { required: true, minLength: 1 },
                date: { required: true },
                type: { required: true },
                attendeeType: { required: true, values: ['scouts', 'parents'] }
            },
            den: {
                name: { required: true, minLength: 1, unique: true }
            },
            eventType: {
                name: { required: true, minLength: 1, unique: true }
            }
        };
    }

    static getUIConfig() {
        return {
            truncationLength: 100,
            notificationDuration: {
                success: 3000,
                warning: 4000,
                error: 5000,
                info: 3000
            },
            animationDelays: {
                notificationShow: 100,
                notificationRemove: 300
            },
            csvExportHeaders: [
                'Event Name', 
                'Event Date', 
                'Event Type', 
                'Attendee Name', 
                'Attendee Den', 
                'Attendee Type', 
                'Check-in Time'
            ]
        };
    }

    static getNotificationIcons() {
        return {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
    }

    static getAppVersion() {
        return '4.1';
    }

    static getAppName() {
        return 'Scout Attendance App';
    }

    static shouldInitializeWithSampleData(data) {
        return data.scouts.length === 0 && 
               data.events.length === 0 && 
               data.attendance.length === 0;
    }

    static createDen(name, order = null) {
        return {
            id: Utils.generateSimpleId('den'),
            name: name.trim(),
            order: order || Date.now()
        };
    }

    static createEventType(name, order = null) {
        const trimmedName = name.trim();
        return {
            id: Utils.generateSimpleId('type'),
            name: trimmedName,
            value: Utils.createSlug(trimmedName),
            order: order || Date.now()
        };
    }

    static createScout(name, den) {
        return {
            id: Utils.generateSimpleId('scout'),
            name: name.trim(),
            den: den,
            active: true
        };
    }

    static createParent(name, den) {
        return {
            id: Utils.generateSimpleId('parent'),
            name: name.trim(),
            den: den,
            active: true
        };
    }

    static createEvent(name, date, type, attendeeType, description = '', instructions = '') {
        return {
            id: Utils.generateSimpleId('event'),
            name: name.trim(),
            date: date,
            type: type,
            attendeeType: attendeeType,
            description: description.trim(),
            instructions: instructions.trim()
        };
    }
}