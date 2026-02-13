/**
 * Helper functions - Backend bilan 100% mos
 */

export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0 UZS';

    const number = Number(amount);
    if (isNaN(number)) return '0 UZS';

    // Round to avoid floating point errors
    const rounded = Math.round(number);

    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(rounded);
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

/**
 * Get current user's role
 */
export const getUserRole = () => {
    const user = getCurrentUser();
    return user?.role || null;
};

/**
 * Get current user's ID
 */
export const getUserId = () => {
    const user = getCurrentUser();
    return user?.userId || null;
};
