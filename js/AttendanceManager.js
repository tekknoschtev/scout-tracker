class AttendanceManager {
    constructor(dataManager, notificationManager) {
        this.dataManager = dataManager;
        this.notificationManager = notificationManager;
    }

    checkInScout(eventId, scoutId, attendance, scouts, events) {
        const scout = Utils.findById(scouts, scoutId);
        const event = Utils.findById(events, eventId);
        
        if (!scout) {
            this.notificationManager.showErrorMessage('Scout not found');
            return attendance;
        }

        if (!event) {
            this.notificationManager.showErrorMessage('Event not found');
            return attendance;
        }

        if (this.dataManager.isAlreadyCheckedIn(attendance, eventId, scoutId)) {
            this.notificationManager.showWarningMessage(`${scout.name} is already checked in`);
            return attendance;
        }

        const updatedAttendance = this.dataManager.addAttendanceRecord(attendance, eventId, scoutId);
        this.notificationManager.showCheckinSuccess(scout.name);
        
        return updatedAttendance;
    }

    checkInParent(eventId, parentId, attendance, parents, events) {
        const parent = Utils.findById(parents, parentId);
        const event = Utils.findById(events, eventId);
        
        if (!parent) {
            this.notificationManager.showErrorMessage('Parent not found');
            return attendance;
        }

        if (!event) {
            this.notificationManager.showErrorMessage('Event not found');
            return attendance;
        }

        if (this.dataManager.isAlreadyCheckedIn(attendance, eventId, null, parentId)) {
            this.notificationManager.showWarningMessage(`${parent.name} is already checked in`);
            return attendance;
        }

        const updatedAttendance = this.dataManager.addAttendanceRecord(attendance, eventId, null, parentId);
        this.notificationManager.showCheckinSuccess(parent.name);
        
        return updatedAttendance;
    }

    checkInMultiple(eventId, attendeeIds, attendeeType, attendance, scouts, parents, events) {
        const isParentEvent = attendeeType === 'parents';
        const attendeeList = isParentEvent ? parents : scouts;
        let updatedAttendance = [...attendance];
        const checkedInNames = [];
        const alreadyCheckedIn = [];

        attendeeIds.forEach(id => {
            const attendee = Utils.findById(attendeeList, id);
            if (!attendee) return;

            const isAlreadyIn = this.dataManager.isAlreadyCheckedIn(
                updatedAttendance, 
                eventId, 
                isParentEvent ? null : id, 
                isParentEvent ? id : null
            );

            if (isAlreadyIn) {
                alreadyCheckedIn.push(attendee.name);
            } else {
                updatedAttendance = this.dataManager.addAttendanceRecord(
                    updatedAttendance, 
                    eventId, 
                    isParentEvent ? null : id, 
                    isParentEvent ? id : null
                );
                checkedInNames.push(attendee.name);
            }
        });

        if (checkedInNames.length > 0) {
            this.notificationManager.showMultipleCheckinSuccess(checkedInNames);
        }

        if (alreadyCheckedIn.length > 0) {
            this.notificationManager.showWarningMessage(
                `Already checked in: ${alreadyCheckedIn.join(', ')}`
            );
        }

        return updatedAttendance;
    }

    undoScoutCheckin(eventId, scoutId, attendance, scouts, events) {
        const scout = Utils.findById(scouts, scoutId);
        const event = Utils.findById(events, eventId);
        
        if (!scout || !event) {
            this.notificationManager.showErrorMessage('Scout or event not found');
            return attendance;
        }

        return new Promise((resolve) => {
            this.notificationManager.showCheckinUndoConfirmation(
                scout.name,
                event.name,
                () => {
                    const updatedAttendance = this.dataManager.removeAttendanceRecord(
                        attendance, eventId, scoutId
                    );
                    this.notificationManager.showCheckinUndoSuccess(scout.name, event.name);
                    resolve(updatedAttendance);
                }
            );
        });
    }

    undoParentCheckin(eventId, parentId, attendance, parents, events) {
        const parent = Utils.findById(parents, parentId);
        const event = Utils.findById(events, eventId);
        
        if (!parent || !event) {
            this.notificationManager.showErrorMessage('Parent or event not found');
            return attendance;
        }

        return new Promise((resolve) => {
            this.notificationManager.showCheckinUndoConfirmation(
                parent.name,
                event.name,
                () => {
                    const updatedAttendance = this.dataManager.removeAttendanceRecord(
                        attendance, eventId, null, parentId
                    );
                    this.notificationManager.showCheckinUndoSuccess(parent.name, event.name);
                    resolve(updatedAttendance);
                }
            );
        });
    }

    getAttendanceForEvent(eventId, attendance, scouts, parents) {
        const eventAttendance = this.dataManager.findAttendanceForEvent(attendance, eventId);
        
        return eventAttendance.map(record => {
            let attendee = null;
            let type = 'scout';

            if (record.scoutId) {
                attendee = Utils.findById(scouts, record.scoutId);
                type = 'scout';
            } else if (record.parentId) {
                attendee = Utils.findById(parents, record.parentId);
                type = 'parent';
            }

            return attendee ? {
                ...attendee,
                type,
                checkedInAt: record.checkedInAt
            } : null;
        }).filter(Boolean);
    }

    getAttendanceHistory(scoutId, parentId, attendance, events) {
        let personAttendance;
        
        if (scoutId) {
            personAttendance = this.dataManager.findAttendanceForScout(attendance, scoutId);
        } else if (parentId) {
            personAttendance = this.dataManager.findAttendanceForParent(attendance, parentId);
        } else {
            return [];
        }

        return personAttendance.map(record => {
            const event = Utils.findById(events, record.eventId);
            return event ? {
                ...record,
                event
            } : null;
        }).filter(Boolean).sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));
    }

    getAttendanceStatistics(attendance, events, scouts, parents) {
        const stats = {
            totalAttendance: attendance.length,
            uniqueEvents: [...new Set(attendance.map(a => a.eventId))].length,
            uniqueScouts: [...new Set(attendance.filter(a => a.scoutId).map(a => a.scoutId))].length,
            uniqueParents: [...new Set(attendance.filter(a => a.parentId).map(a => a.parentId))].length
        };

        const scoutAttendance = attendance.filter(a => a.scoutId);
        const parentAttendance = attendance.filter(a => a.parentId);

        stats.scoutAttendance = scoutAttendance.length;
        stats.parentAttendance = parentAttendance.length;

        const activeScouts = Utils.filterActiveItems(scouts);
        const activeParents = Utils.filterActiveItems(parents);

        if (activeScouts.length > 0) {
            stats.averageScoutAttendance = (stats.uniqueScouts / activeScouts.length * 100).toFixed(1);
        }

        if (activeParents.length > 0) {
            stats.averageParentAttendance = (stats.uniqueParents / activeParents.length * 100).toFixed(1);
        }

        return stats;
    }

    getTopAttendees(attendance, scouts, parents, limit = 10) {
        const scoutCounts = {};
        const parentCounts = {};

        attendance.forEach(record => {
            if (record.scoutId) {
                scoutCounts[record.scoutId] = (scoutCounts[record.scoutId] || 0) + 1;
            }
            if (record.parentId) {
                parentCounts[record.parentId] = (parentCounts[record.parentId] || 0) + 1;
            }
        });

        const topScouts = Object.entries(scoutCounts)
            .map(([id, count]) => {
                const scout = Utils.findById(scouts, id);
                return scout ? { ...scout, attendanceCount: count, type: 'scout' } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.attendanceCount - a.attendanceCount)
            .slice(0, limit);

        const topParents = Object.entries(parentCounts)
            .map(([id, count]) => {
                const parent = Utils.findById(parents, id);
                return parent ? { ...parent, attendanceCount: count, type: 'parent' } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.attendanceCount - a.attendanceCount)
            .slice(0, limit);

        return { topScouts, topParents };
    }

    getAttendanceByDen(attendance, scouts, parents, dens) {
        const denStats = {};

        Utils.sortByOrder(dens).forEach(den => {
            denStats[den.name] = {
                den: den.name,
                scoutAttendance: 0,
                parentAttendance: 0,
                totalAttendance: 0,
                activeScouts: scouts.filter(s => s.active && s.den === den.name).length,
                activeParents: parents.filter(p => p.active && p.den === den.name).length
            };
        });

        attendance.forEach(record => {
            if (record.scoutId) {
                const scout = Utils.findById(scouts, record.scoutId);
                if (scout && denStats[scout.den]) {
                    denStats[scout.den].scoutAttendance++;
                    denStats[scout.den].totalAttendance++;
                }
            }
            if (record.parentId) {
                const parent = Utils.findById(parents, record.parentId);
                if (parent && denStats[parent.den]) {
                    denStats[parent.den].parentAttendance++;
                    denStats[parent.den].totalAttendance++;
                }
            }
        });

        return Object.values(denStats);
    }

    getAttendanceByEventType(attendance, events, eventTypes) {
        const typeStats = {};

        eventTypes.forEach(type => {
            typeStats[type.value] = {
                type: type.name,
                value: type.value,
                eventCount: 0,
                attendanceCount: 0
            };
        });

        const eventsByType = Utils.groupBy(events, 'type');
        
        Object.keys(eventsByType).forEach(typeValue => {
            if (typeStats[typeValue]) {
                typeStats[typeValue].eventCount = eventsByType[typeValue].length;
                
                eventsByType[typeValue].forEach(event => {
                    const eventAttendance = this.dataManager.findAttendanceForEvent(attendance, event.id);
                    typeStats[typeValue].attendanceCount += eventAttendance.length;
                });
            }
        });

        return Object.values(typeStats);
    }

    getMonthlyAttendance(attendance, year = null) {
        const targetYear = year || new Date().getFullYear();
        const monthlyStats = {};

        for (let month = 1; month <= 12; month++) {
            monthlyStats[month] = {
                month,
                monthName: new Date(targetYear, month - 1, 1).toLocaleString('default', { month: 'long' }),
                scoutAttendance: 0,
                parentAttendance: 0,
                totalAttendance: 0
            };
        }

        attendance.forEach(record => {
            const date = new Date(record.checkedInAt);
            if (date.getFullYear() === targetYear) {
                const month = date.getMonth() + 1;
                if (monthlyStats[month]) {
                    monthlyStats[month].totalAttendance++;
                    if (record.scoutId) {
                        monthlyStats[month].scoutAttendance++;
                    }
                    if (record.parentId) {
                        monthlyStats[month].parentAttendance++;
                    }
                }
            }
        });

        return Object.values(monthlyStats);
    }

    isCheckedIn(eventId, scoutId, parentId, attendance) {
        return this.dataManager.isAlreadyCheckedIn(attendance, eventId, scoutId, parentId);
    }

    getCheckedInAttendees(eventId, attendance) {
        return this.dataManager.findAttendanceForEvent(attendance, eventId).map(record => ({
            scoutId: record.scoutId || null,
            parentId: record.parentId || null,
            checkedInAt: record.checkedInAt
        }));
    }

    bulkUndoCheckin(eventId, attendeeIds, attendeeType, attendance) {
        const isParentEvent = attendeeType === 'parents';
        let updatedAttendance = [...attendance];

        attendeeIds.forEach(id => {
            updatedAttendance = this.dataManager.removeAttendanceRecord(
                updatedAttendance,
                eventId,
                isParentEvent ? null : id,
                isParentEvent ? id : null
            );
        });

        const count = attendeeIds.length;
        this.notificationManager.showInfoMessage(
            `Unchecked ${count} ${Utils.pluralize(count, attendeeType === 'parents' ? 'parent' : 'scout')}`
        );

        return updatedAttendance;
    }

    exportAttendanceForEvent(eventId, attendance, scouts, parents, events) {
        const event = Utils.findById(events, eventId);
        if (!event) return null;

        const eventAttendance = this.getAttendanceForEvent(eventId, attendance, scouts, parents);
        
        const csvData = [
            ['Name', 'Den', 'Type', 'Check-in Time'],
            ...eventAttendance.map(attendee => [
                attendee.name,
                attendee.den,
                Utils.capitalizeFirst(attendee.type),
                new Date(attendee.checkedInAt).toLocaleString()
            ])
        ];

        const csvContent = csvData.map(row => Utils.createCsvRow(row)).join('\n');
        const filename = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_attendance_${event.date}.csv`;
        
        Utils.downloadFile(csvContent, filename, 'text/csv');
        return csvContent;
    }

    clearAttendanceForEvent(eventId, attendance, events) {
        const event = Utils.findById(events, eventId);
        if (!event) {
            this.notificationManager.showErrorMessage('Event not found');
            return attendance;
        }

        const eventAttendance = this.dataManager.findAttendanceForEvent(attendance, eventId);
        if (eventAttendance.length === 0) {
            this.notificationManager.showInfoMessage('No attendance records to clear');
            return attendance;
        }

        return new Promise((resolve) => {
            this.notificationManager.showConfirmation(
                'Clear Attendance',
                `Are you sure you want to clear all ${eventAttendance.length} attendance records for "${event.name}"?`,
                () => {
                    const updatedAttendance = attendance.filter(a => a.eventId !== eventId);
                    this.notificationManager.showInfoMessage(`Cleared ${eventAttendance.length} attendance records`);
                    resolve(updatedAttendance);
                },
                'Clear All',
                'warning'
            );
        });
    }
}