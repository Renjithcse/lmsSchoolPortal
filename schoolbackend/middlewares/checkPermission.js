const checkPermission = (action, subject) => (req, res, next) => {
    if (!req.ability) {
        return res.status(500).json({ 
            message: 'Authentication middleware not properly configured. Please contact administrator.' 
        });
    }
    
    if (req.ability.can(action, subject)) {
        return next();
    }

    return res.status(403).json({ message: 'Access denied' });
};

// Middleware to check multiple permissions with OR logic
// Usage: checkPermissionOr([{action: "Read", subject: "Settings"}, {action: "Read", subject: "TermHistory"}])
const checkPermissionOr = (permissions) => (req, res, next) => {
    if (!req.ability) {
        return res.status(500).json({ 
            message: 'Authentication middleware not properly configured. Please contact administrator.' 
        });
    }
    
    // Check if user has at least one of the required permissions
    const hasPermission = permissions.some(({ action, subject }) => 
        req.ability.can(action, subject)
    );
    
    if (hasPermission) {
        return next();
    }

    return res.status(403).json({ message: 'Access denied' });
};

module.exports = checkPermission;
module.exports.checkPermissionOr = checkPermissionOr;