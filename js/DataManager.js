class DataManager {
    constructor() {
        this.storageKeys = {
            scouts: 'scouts',
            parents: 'parents',
            events: 'events',
            attendance: 'attendance',
            dens: 'dens',
            eventTypes: 'eventTypes'
        };
    }

    loadData() {
        const data = {};
        
        Object.keys(this.storageKeys).forEach(key => {
            const storageKey = this.storageKeys[key];
            data[key] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        });

        return data;
    }

    saveData(data) {
        Object.keys(this.storageKeys).forEach(key => {
            if (data[key] !== undefined) {
                const storageKey = this.storageKeys[key];
                localStorage.setItem(storageKey, JSON.stringify(data[key]));
            }
        });
    }

    savePartialData(key, value) {
        if (this.storageKeys[key]) {
            localStorage.setItem(this.storageKeys[key], JSON.stringify(value));
        }
    }

    clearAllData() {
        Object.values(this.storageKeys).forEach(storageKey => {
            localStorage.removeItem(storageKey);
        });
    }

    exportToCSV(events, scouts, parents, attendance, eventTypes) {
        const headers = ['Event Name', 'Event Date', 'Event Type', 'Attendee Name', 'Attendee Den', 'Attendee Type', 'Check-in Time'];
        const rows = [headers];

        attendance.forEach(record => {
            const event = Utils.findById(events, record.eventId);
            if (!event) return;

            let attendee = null;
            let attendeeType = 'Scout';

            if (record.scoutId) {
                attendee = Utils.findById(scouts, record.scoutId);
                attendeeType = 'Scout';
            } else if (record.parentId) {
                attendee = Utils.findById(parents, record.parentId);
                attendeeType = 'Parent';
            }

            if (attendee) {
                const eventType = Utils.findById(eventTypes, event.type);
                const eventTypeName = eventType ? eventType.name : Utils.capitalizeFirst(event.type);

                rows.push([
                    event.name,
                    event.date,
                    eventTypeName,
                    attendee.name,
                    attendee.den,
                    attendeeType,
                    new Date(record.checkedInAt).toLocaleString()
                ]);
            }
        });

        return rows.map(row => Utils.createCsvRow(row)).join('\n');
    }

    createBackup(data) {
        const backup = {
            ...data,
            exportDate: Utils.getCurrentTimestamp(),
            version: '4.1'
        };

        return JSON.stringify(backup, null, 2);
    }

    downloadBackup(data) {
        const backupData = this.createBackup(data);
        const filename = `scout-pack-backup-${Utils.getTodayString()}.json`;
        Utils.downloadFile(backupData, filename, 'application/json');
    }

    downloadCSV(events, scouts, parents, attendance, eventTypes) {
        const csvData = this.exportToCSV(events, scouts, parents, attendance, eventTypes);
        Utils.downloadFile(csvData, 'scout-attendance.csv', 'text/csv');
    }

    validateBackupFormat(backup) {
        const requiredFields = ['scouts', 'events', 'attendance'];
        return requiredFields.every(field => Array.isArray(backup[field]));
    }

    restoreFromBackup(backup) {
        if (!this.validateBackupFormat(backup)) {
            throw new Error('Invalid backup file format');
        }

        const restoredData = {
            scouts: backup.scouts || [],
            events: backup.events || [],
            attendance: backup.attendance || [],
            parents: backup.parents || [],
            dens: backup.dens || [],
            eventTypes: backup.eventTypes || []
        };

        this.ensureBackwardsCompatibility(restoredData);
        
        return restoredData;
    }

    ensureBackwardsCompatibility(data) {
        if (data.dens.length === 0) {
            data.dens = ConfigManager.getDefaultDens();
        }

        if (data.eventTypes.length === 0) {
            data.eventTypes = ConfigManager.getDefaultEventTypes();
        }

        data.events.forEach(event => {
            if (!event.attendeeType) {
                event.attendeeType = 'scouts';
            }
        });

        return data;
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async processBackupFile(file) {
        if (!Utils.isValidJsonFile(file)) {
            throw new Error('Please select a valid JSON backup file');
        }

        const fileContent = await this.readFileAsText(file);
        const backup = JSON.parse(fileContent);
        
        return this.restoreFromBackup(backup);
    }

    migrateData(data) {
        let migrated = false;

        data.scouts.forEach(scout => {
            if (!scout.hasOwnProperty('active')) {
                scout.active = true;
                migrated = true;
            }
        });

        if (data.parents) {
            data.parents.forEach(parent => {
                if (!parent.hasOwnProperty('active')) {
                    parent.active = true;
                    migrated = true;
                }
            });
        }

        data.events.forEach(event => {
            if (!event.attendeeType) {
                event.attendeeType = 'scouts';
                migrated = true;
            }
        });

        if (migrated) {
            this.saveData(data);
        }

        return data;
    }

    getDataSummary(data) {
        return {
            activeScouts: Utils.filterActiveItems(data.scouts).length,
            activeParents: Utils.filterActiveItems(data.parents).length,
            totalEvents: data.events.length,
            totalAttendance: data.attendance.length,
            dens: data.dens.length,
            eventTypes: data.eventTypes.length
        };
    }

    findAttendanceForEvent(attendance, eventId) {
        return attendance.filter(record => record.eventId === eventId);
    }

    findAttendanceForScout(attendance, scoutId) {
        return attendance.filter(record => record.scoutId === scoutId);
    }

    findAttendanceForParent(attendance, parentId) {
        return attendance.filter(record => record.parentId === parentId);
    }

    isAlreadyCheckedIn(attendance, eventId, scoutId = null, parentId = null) {
        return attendance.some(record => 
            record.eventId === eventId && 
            ((scoutId && record.scoutId === scoutId) || 
             (parentId && record.parentId === parentId))
        );
    }

    removeAttendanceRecord(attendance, eventId, scoutId = null, parentId = null) {
        return attendance.filter(record => 
            !(record.eventId === eventId && 
              ((scoutId && record.scoutId === scoutId) || 
               (parentId && record.parentId === parentId)))
        );
    }

    addAttendanceRecord(attendance, eventId, scoutId = null, parentId = null) {
        const timestamp = Utils.getCurrentTimestamp();
        const record = {
            eventId: eventId,
            checkedInAt: timestamp
        };

        if (scoutId) {
            record.scoutId = scoutId;
        } else if (parentId) {
            record.parentId = parentId;
        }

        return [...attendance, record];
    }
}