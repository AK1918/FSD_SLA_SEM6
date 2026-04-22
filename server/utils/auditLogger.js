const AuditLog = require('../models/AuditLog');

/**
 * Creates a structured audit log entry
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action type (INSERT, UPDATE, etc.)
 * @param {string} entity - Entity being modified (Inventory, Request, etc.)
 * @param {string} entityId - ID of the specific entity
 * @param {object} changes - JSON object containing what changed
 */
const createAuditLog = async (userId, action, entity, entityId, changes) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      changes,
      timestamp: new Date()
    });
    console.log(`AUDIT LOG: ${action} on ${entity} (${entityId}) by user ${userId}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = createAuditLog;
