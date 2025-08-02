class Utils {
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    static formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
    }

    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    static generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static generateSimpleId(prefix = 'item') {
        return `${prefix}_${Date.now()}`;
    }

    static downloadFile(content, filename, mimeType) {
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

    static sortByOrder(items, orderField = 'order') {
        return items.sort((a, b) => (a[orderField] || 999) - (b[orderField] || 999));
    }

    static sortByName(items, nameField = 'name') {
        return items.sort((a, b) => a[nameField].localeCompare(b[nameField]));
    }

    static validateName(name) {
        return name && name.trim().length > 0;
    }

    static validateDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    static getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    static isItemUnique(items, newItem, field = 'name', excludeId = null) {
        return !items.some(item => 
            item.id !== excludeId && 
            item[field].toLowerCase() === newItem[field].toLowerCase()
        );
    }

    static createSlug(text) {
        return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    }

    static filterActiveItems(items) {
        return items.filter(item => item.active);
    }

    static findById(items, id) {
        return items.find(item => item.id === id);
    }

    static removeById(items, id) {
        return items.filter(item => item.id !== id);
    }

    static updateById(items, id, updates) {
        return items.map(item => 
            item.id === id ? { ...item, ...updates } : item
        );
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static formatCsvField(field) {
        return `"${field.toString().replace(/"/g, '""')}"`;
    }

    static createCsvRow(fields) {
        return fields.map(field => Utils.formatCsvField(field)).join(',');
    }

    static pluralize(count, singular, plural = null) {
        if (count === 1) return singular;
        return plural || `${singular}s`;
    }

    static formatCount(count, singular, plural = null) {
        const word = Utils.pluralize(count, singular, plural);
        return `${count} ${word}`;
    }

    static getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    static isValidJsonFile(file) {
        return file && Utils.getFileExtension(file.name) === 'json';
    }
}