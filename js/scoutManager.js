class ScoutManager {
    constructor(dataManager, notificationManager) {
        this.dataManager = dataManager;
        this.notificationManager = notificationManager;
    }

    addScout(name, den, scouts) {
        if (!Utils.validateName(name)) {
            this.notificationManager.showValidationError('Scout name');
            return scouts;
        }

        if (!den) {
            this.notificationManager.showValidationError('Den');
            return scouts;
        }

        const scout = ConfigManager.createScout(name, den);
        const updatedScouts = [...scouts, scout];
        
        this.notificationManager.showItemAddedSuccess(scout.name, den);
        return updatedScouts;
    }

    addParent(name, den, parents) {
        if (!Utils.validateName(name)) {
            this.notificationManager.showValidationError('Parent name');
            return parents;
        }

        if (!den) {
            this.notificationManager.showValidationError('Den');
            return parents;
        }

        const parent = ConfigManager.createParent(name, den);
        const updatedParents = [...parents, parent];
        
        this.notificationManager.showItemAddedSuccess(parent.name, den);
        return updatedParents;
    }

    removeScout(scoutId, scouts) {
        const scout = Utils.findById(scouts, scoutId);
        if (!scout) {
            this.notificationManager.showErrorMessage('Scout not found');
            return scouts;
        }

        return new Promise((resolve) => {
            this.notificationManager.showRemoveConfirmation(
                scout.name,
                'scout',
                () => {
                    const updatedScouts = Utils.updateById(scouts, scoutId, { active: false });
                    this.notificationManager.showItemRemovedSuccess(scout.name);
                    resolve(updatedScouts);
                }
            );
        });
    }

    removeParent(parentId, parents) {
        const parent = Utils.findById(parents, parentId);
        if (!parent) {
            this.notificationManager.showErrorMessage('Parent not found');
            return parents;
        }

        return new Promise((resolve) => {
            this.notificationManager.showRemoveConfirmation(
                parent.name,
                'parent',
                () => {
                    const updatedParents = Utils.updateById(parents, parentId, { active: false });
                    this.notificationManager.showItemRemovedSuccess(parent.name);
                    resolve(updatedParents);
                }
            );
        });
    }

    updateScout(scoutId, updates, scouts) {
        const scout = Utils.findById(scouts, scoutId);
        if (!scout) {
            this.notificationManager.showErrorMessage('Scout not found');
            return scouts;
        }

        if (updates.name && !Utils.validateName(updates.name)) {
            this.notificationManager.showValidationError('Scout name');
            return scouts;
        }

        const updatedScouts = Utils.updateById(scouts, scoutId, updates);
        this.notificationManager.showItemUpdatedSuccess(updates.name || scout.name);
        
        return updatedScouts;
    }

    updateParent(parentId, updates, parents) {
        const parent = Utils.findById(parents, parentId);
        if (!parent) {
            this.notificationManager.showErrorMessage('Parent not found');
            return parents;
        }

        if (updates.name && !Utils.validateName(updates.name)) {
            this.notificationManager.showValidationError('Parent name');
            return parents;
        }

        const updatedParents = Utils.updateById(parents, parentId, updates);
        this.notificationManager.showItemUpdatedSuccess(updates.name || parent.name);
        
        return updatedParents;
    }

    getActiveScouts(scouts) {
        return Utils.filterActiveItems(scouts);
    }

    getActiveParents(parents) {
        return Utils.filterActiveItems(parents);
    }

    getScoutsByDen(scouts, denName) {
        return scouts.filter(scout => scout.active && scout.den === denName);
    }

    getParentsByDen(parents, denName) {
        return parents.filter(parent => parent.active && parent.den === denName);
    }

    searchScouts(scouts, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return scouts;
        }

        const term = searchTerm.toLowerCase().trim();
        return scouts.filter(scout => 
            scout.active &&
            (scout.name.toLowerCase().includes(term) ||
             scout.den.toLowerCase().includes(term))
        );
    }

    searchParents(parents, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return parents;
        }

        const term = searchTerm.toLowerCase().trim();
        return parents.filter(parent => 
            parent.active &&
            (parent.name.toLowerCase().includes(term) ||
             parent.den.toLowerCase().includes(term))
        );
    }

    getScoutStatistics(scouts, dens) {
        const activeScouts = this.getActiveScouts(scouts);
        const stats = {
            totalActive: activeScouts.length,
            totalInactive: scouts.filter(s => !s.active).length,
            byDen: {}
        };

        dens.forEach(den => {
            const denScouts = this.getScoutsByDen(scouts, den.name);
            stats.byDen[den.name] = {
                active: denScouts.length,
                percentage: activeScouts.length > 0 ? 
                    Math.round((denScouts.length / activeScouts.length) * 100) : 0
            };
        });

        return stats;
    }

    getParentStatistics(parents, dens) {
        const activeParents = this.getActiveParents(parents);
        const stats = {
            totalActive: activeParents.length,
            totalInactive: parents.filter(p => !p.active).length,
            byDen: {}
        };

        dens.forEach(den => {
            const denParents = this.getParentsByDen(parents, den.name);
            stats.byDen[den.name] = {
                active: denParents.length,
                percentage: activeParents.length > 0 ? 
                    Math.round((denParents.length / activeParents.length) * 100) : 0
            };
        });

        return stats;
    }

    validateScoutData(name, den) {
        const errors = [];
        
        if (!Utils.validateName(name)) {
            errors.push('Scout name is required');
        }
        
        if (!den) {
            errors.push('Den selection is required');
        }

        return errors;
    }

    validateParentData(name, den) {
        const errors = [];
        
        if (!Utils.validateName(name)) {
            errors.push('Parent name is required');
        }
        
        if (!den) {
            errors.push('Den selection is required');
        }

        return errors;
    }

    bulkUpdateDen(oldDenName, newDenName, scouts, parents) {
        let updatedScouts = [...scouts];
        let updatedParents = [...parents];
        let scoutCount = 0;
        let parentCount = 0;

        scouts.forEach(scout => {
            if (scout.den === oldDenName) {
                updatedScouts = Utils.updateById(updatedScouts, scout.id, { den: newDenName });
                scoutCount++;
            }
        });

        parents.forEach(parent => {
            if (parent.den === oldDenName) {
                updatedParents = Utils.updateById(updatedParents, parent.id, { den: newDenName });
                parentCount++;
            }
        });

        if (scoutCount > 0 || parentCount > 0) {
            this.notificationManager.showInfoMessage(
                `Updated ${scoutCount} scouts and ${parentCount} parents to "${newDenName}" den`
            );
        }

        return { scouts: updatedScouts, parents: updatedParents };
    }

    reactivateScout(scoutId, scouts) {
        const scout = Utils.findById(scouts, scoutId);
        if (!scout) {
            this.notificationManager.showErrorMessage('Scout not found');
            return scouts;
        }

        const updatedScouts = Utils.updateById(scouts, scoutId, { active: true });
        this.notificationManager.showSuccessMessage(`${scout.name} has been reactivated`);
        
        return updatedScouts;
    }

    reactivateParent(parentId, parents) {
        const parent = Utils.findById(parents, parentId);
        if (!parent) {
            this.notificationManager.showErrorMessage('Parent not found');
            return parents;
        }

        const updatedParents = Utils.updateById(parents, parentId, { active: true });
        this.notificationManager.showSuccessMessage(`${parent.name} has been reactivated`);
        
        return updatedParents;
    }

    getInactiveScouts(scouts) {
        return scouts.filter(scout => !scout.active);
    }

    getInactiveParents(parents) {
        return parents.filter(parent => !parent.active);
    }

    permanentlyDeleteScout(scoutId, scouts, attendance) {
        const scout = Utils.findById(scouts, scoutId);
        if (!scout) {
            this.notificationManager.showErrorMessage('Scout not found');
            return { scouts, attendance };
        }

        const scoutAttendance = this.dataManager.findAttendanceForScout(attendance, scoutId);
        let confirmMessage = `Are you sure you want to permanently delete "${scout.name}"?`;
        
        if (scoutAttendance.length > 0) {
            confirmMessage += `\n\nThis will also delete ${scoutAttendance.length} attendance records.`;
        }

        return new Promise((resolve) => {
            this.notificationManager.showDeleteConfirmation(
                scout.name,
                'scout',
                () => {
                    const updatedScouts = Utils.removeById(scouts, scoutId);
                    const updatedAttendance = attendance.filter(a => a.scoutId !== scoutId);
                    
                    this.notificationManager.showItemRemovedSuccess(`Scout "${scout.name}"`);
                    resolve({ scouts: updatedScouts, attendance: updatedAttendance });
                }
            );
        });
    }

    permanentlyDeleteParent(parentId, parents, attendance) {
        const parent = Utils.findById(parents, parentId);
        if (!parent) {
            this.notificationManager.showErrorMessage('Parent not found');
            return { parents, attendance };
        }

        const parentAttendance = this.dataManager.findAttendanceForParent(attendance, parentId);
        let confirmMessage = `Are you sure you want to permanently delete "${parent.name}"?`;
        
        if (parentAttendance.length > 0) {
            confirmMessage += `\n\nThis will also delete ${parentAttendance.length} attendance records.`;
        }

        return new Promise((resolve) => {
            this.notificationManager.showDeleteConfirmation(
                parent.name,
                'parent',
                () => {
                    const updatedParents = Utils.removeById(parents, parentId);
                    const updatedAttendance = attendance.filter(a => a.parentId !== parentId);
                    
                    this.notificationManager.showItemRemovedSuccess(`Parent "${parent.name}"`);
                    resolve({ parents: updatedParents, attendance: updatedAttendance });
                }
            );
        });
    }

    importScoutsFromCSV(csvData, den, scouts) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            this.notificationManager.showErrorMessage('No data found in CSV');
            return scouts;
        }

        let updatedScouts = [...scouts];
        let importedCount = 0;
        let skippedCount = 0;

        lines.forEach(line => {
            const name = line.trim();
            if (name && Utils.validateName(name)) {
                const existingScout = scouts.find(s => 
                    s.name.toLowerCase() === name.toLowerCase() && s.den === den
                );
                
                if (!existingScout) {
                    const scout = ConfigManager.createScout(name, den);
                    updatedScouts.push(scout);
                    importedCount++;
                } else {
                    skippedCount++;
                }
            }
        });

        if (importedCount > 0) {
            this.notificationManager.showSuccessMessage(
                `Imported ${importedCount} scouts${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`
            );
        } else {
            this.notificationManager.showWarningMessage('No new scouts were imported');
        }

        return updatedScouts;
    }

    exportScoutsToCSV(scouts, denFilter = null) {
        let scoutsToExport = this.getActiveScouts(scouts);
        
        if (denFilter) {
            scoutsToExport = scoutsToExport.filter(s => s.den === denFilter);
        }

        const csvData = [
            ['Name', 'Den'],
            ...scoutsToExport.map(scout => [scout.name, scout.den])
        ];

        const csvContent = csvData.map(row => Utils.createCsvRow(row)).join('\n');
        const filename = `scouts_${denFilter || 'all'}_${Utils.getTodayString()}.csv`;
        
        Utils.downloadFile(csvContent, filename, 'text/csv');
        return csvContent;
    }

    exportParentsToCSV(parents, denFilter = null) {
        let parentsToExport = this.getActiveParents(parents);
        
        if (denFilter) {
            parentsToExport = parentsToExport.filter(p => p.den === denFilter);
        }

        const csvData = [
            ['Name', 'Den'],
            ...parentsToExport.map(parent => [parent.name, parent.den])
        ];

        const csvContent = csvData.map(row => Utils.createCsvRow(row)).join('\n');
        const filename = `parents_${denFilter || 'all'}_${Utils.getTodayString()}.csv`;
        
        Utils.downloadFile(csvContent, filename, 'text/csv');
        return csvContent;
    }
}