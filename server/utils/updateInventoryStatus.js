const Inventory = require('../models/Inventory');

const updateInventoryStatus = async () => {
  try {
    const today = new Date();
    const items = await Inventory.find({ status: { $nin: ['Donated', 'Expired'] } });

    for (const item of items) {
      const expDate = new Date(item.expirationDate);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      let newStatus = item.status;
      let newDiscountPrice = item.discountPrice;

      if (diffDays < 0) {
        newStatus = 'Expired';
      } else if (diffDays === 0) {
        // Day of expiration - alert NGOs for pickup
        newStatus = 'Donated'; 
        console.log(`ALERT: Item ${item.name} is expiring today! NGO alerted for pickup.`);
      } else if (diffDays <= 3) {
        // 1-3 days before expiration - apply heavy discount
        newStatus = 'Expiring Soon';
        if (item.price > 0) {
          newDiscountPrice = item.price * 0.5; // 50% discount
        }
      }

      if (newStatus !== item.status || newDiscountPrice !== item.discountPrice) {
        item.status = newStatus;
        item.discountPrice = newDiscountPrice;
        await item.save();
      }
    }
  } catch (error) {
    console.error('Error updating inventory statuses:', error);
  }
};

module.exports = updateInventoryStatus;
