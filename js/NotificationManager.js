class NotificationManager {
    constructor() {
        this.activeNotifications = new Set();
        this.confirmationCallback = null;
        this.setupConfirmationModal();
    }

    showNotification(message, type = 'success', duration = null) {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.warn('Notification container not found');
            return;
        }
        
        const config = ConfigManager.getUIConfig();
        const icons = ConfigManager.getNotificationIcons();
        const finalDuration = duration || config.notificationDuration[type] || config.notificationDuration.success;
        
        const notification = document.createElement('div');
        const notificationId = Utils.generateId('notification');
        notification.id = notificationId;
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${icons[type] || icons.success}</span>
                <span>${Utils.escapeHtml(message)}</span>
            </div>
        `;

        container.appendChild(notification);
        this.activeNotifications.add(notificationId);

        setTimeout(() => {
            notification.classList.add('show');
        }, config.animationDelays.notificationShow);

        setTimeout(() => {
            this.removeNotification(notificationId);
        }, finalDuration);

        return notificationId;
    }

    removeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            const config = ConfigManager.getUIConfig();
            
            notification.classList.add('removing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.activeNotifications.delete(notificationId);
            }, config.animationDelays.notificationRemove);
        }
    }

    clearAllNotifications() {
        this.activeNotifications.forEach(id => {
            this.removeNotification(id);
        });
        this.activeNotifications.clear();
    }

    showSuccess(message, duration = null) {
        return this.showNotification(message, 'success', duration);
    }

    showError(message, duration = null) {
        return this.showNotification(message, 'error', duration);
    }

    showWarning(message, duration = null) {
        return this.showNotification(message, 'warning', duration);
    }

    showInfo(message, duration = null) {
        return this.showNotification(message, 'info', duration);
    }

    setupConfirmationModal() {
        const cancelBtn = document.getElementById('confirmation-cancel');
        const modal = document.getElementById('confirmation-modal');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideConfirmationModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideConfirmationModal();
                }
            });
        }
    }

    showConfirmation(title, message, onConfirm, confirmText = 'Confirm', confirmType = 'danger') {
        const modal = document.getElementById('confirmation-modal');
        const titleElement = document.getElementById('confirmation-title');
        const messageElement = document.getElementById('confirmation-message');
        const confirmBtn = document.getElementById('confirmation-confirm');

        if (!modal || !titleElement || !messageElement || !confirmBtn) {
            console.error('Confirmation modal elements not found');
            return;
        }

        titleElement.textContent = title;
        messageElement.textContent = message;
        confirmBtn.textContent = confirmText;
        
        confirmBtn.className = `btn btn-${confirmType}`;

        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            this.hideConfirmationModal();
            if (onConfirm) onConfirm();
        });

        modal.classList.add('active');
    }

    hideConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showPrompt(title, defaultValue = '', placeholder = '') {
        return new Promise((resolve) => {
            const result = prompt(title, defaultValue);
            resolve(result);
        });
    }

    showAlert(message, title = 'Alert') {
        return new Promise((resolve) => {
            alert(message);
            resolve();
        });
    }

    showDeleteConfirmation(itemName, itemType = 'item', onConfirm) {
        const message = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
        this.showConfirmation(
            `Delete ${Utils.capitalizeFirst(itemType)}`,
            message,
            onConfirm,
            `Delete ${Utils.capitalizeFirst(itemType)}`,
            'danger'
        );
    }

    showRemoveConfirmation(itemName, itemType = 'item', onConfirm) {
        const message = `Are you sure you want to remove "${itemName}"? This action can be undone by re-adding the ${itemType}.`;
        this.showConfirmation(
            `Remove ${Utils.capitalizeFirst(itemType)}`,
            message,
            onConfirm,
            `Remove ${Utils.capitalizeFirst(itemType)}`,
            'danger'
        );
    }

    showRestoreDataConfirmation(onConfirm) {
        const message = 'This will replace all current data with the backup. Are you sure you want to continue?';
        this.showConfirmation(
            'Restore Data',
            message,
            onConfirm,
            'Restore Data',
            'warning'
        );
    }

    showCheckinUndoConfirmation(attendeeName, eventName, onConfirm) {
        const message = `Are you sure you want to undo the check-in for "${attendeeName}" from "${eventName}"?`;
        this.showConfirmation(
            'Undo Check-in',
            message,
            onConfirm,
            'Undo Check-in',
            'warning'
        );
    }

    showMultipleActionConfirmation(count, action, itemType, onConfirm) {
        const message = `This will ${action} ${count} ${Utils.pluralize(count, itemType)}. Are you sure you want to continue?`;
        this.showConfirmation(
            `${Utils.capitalizeFirst(action)} Multiple ${Utils.capitalizeFirst(Utils.pluralize(count, itemType))}`,
            message,
            onConfirm,
            Utils.capitalizeFirst(action),
            'warning'
        );
    }

    showSuccessMessage(message, duration = 3000) {
        return this.showSuccess(message, duration);
    }

    showErrorMessage(message, duration = 5000) {
        return this.showError(message, duration);
    }

    showWarningMessage(message, duration = 4000) {
        return this.showWarning(message, duration);
    }

    showInfoMessage(message, duration = 3000) {
        return this.showInfo(message, duration);
    }

    showItemAddedSuccess(itemName, location) {
        const message = `${itemName} has been added${location ? ` to ${location}` : ''}!`;
        return this.showSuccess(message);
    }

    showItemRemovedSuccess(itemName) {
        const message = `${itemName} has been removed.`;
        return this.showSuccess(message);
    }

    showItemUpdatedSuccess(itemName) {
        const message = `${itemName} has been updated successfully!`;
        return this.showSuccess(message);
    }

    showDuplicateError(itemType) {
        const message = `A ${itemType} with this name already exists!`;
        return this.showWarning(message);
    }

    showValidationError(field, requirement = 'is required') {
        const message = `${Utils.capitalizeFirst(field)} ${requirement}.`;
        return this.showError(message);
    }

    showCheckinSuccess(attendeeName, eventName = null) {
        const message = eventName ? 
            `${attendeeName} checked in successfully to ${eventName}!` :
            `${attendeeName} checked in successfully!`;
        return this.showSuccess(message);
    }

    showMultipleCheckinSuccess(attendeeNames) {
        let message;
        
        if (attendeeNames.length === 1) {
            message = `Successfully checked in: ${attendeeNames[0]}`;
        } else if (attendeeNames.length <= 3) {
            message = `Successfully checked in: ${attendeeNames.join(', ')}`;
        } else {
            message = `Successfully checked in ${attendeeNames.length} people: ${attendeeNames.slice(0, 2).join(', ')}, and ${attendeeNames.length - 2} more`;
        }
        
        const duration = Math.min(6000, 3000 + (attendeeNames.length * 500));
        return this.showSuccess(message, duration);
    }

    showCheckinUndoSuccess(attendeeName, eventName) {
        const message = `${attendeeName} has been unchecked from ${eventName}.`;
        return this.showInfo(message);
    }

    showFileError(errorMessage) {
        const message = `File error: ${errorMessage}`;
        return this.showError(message);
    }

    showNetworkError() {
        const message = 'Network error. Please check your connection and try again.';
        return this.showError(message);
    }

    showGenericError(errorMessage = 'An unexpected error occurred.') {
        return this.showError(errorMessage);
    }

    isNotificationActive(notificationId) {
        return this.activeNotifications.has(notificationId);
    }

    getActiveNotificationCount() {
        return this.activeNotifications.size;
    }
}