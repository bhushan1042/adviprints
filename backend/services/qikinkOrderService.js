const mongoose = require('mongoose');
const Order = require('../models/Order');
const { getQikinkClient, QikinkError } = require('./qikinkClient');

const createOrderNumber = () => `ap${new mongoose.Types.ObjectId().toString().slice(-13)}`;

const createQikinkPayload = (order) => {
  const address = order.address || {};
  const [firstName, ...lastName] = order.customerName.trim().split(/\s+/);
  const lineItems = order.lineItems.map((item) => {
    return {
      search_from_my_products: 1,
      sku: item.qikinkSku,
      quantity: String(item.quantity),
      price: Number(item.qikinkPrice).toFixed(2)
    };
  });

  return {
    order_number: order.qikinkFulfillment.reference,
    qikink_shipping: 1,
    gateway: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    total_order_value: order.totalPrice,
    line_items: lineItems,
    shipping_address: {
      first_name: firstName,
      ...(lastName.length ? { last_name: lastName.join(' ') } : {}),
      address1: address.street,
      phone: order.customerPhone,
      email: order.customerEmail,
      city: address.city,
      zip: address.zipCode,
      province: address.state,
      country_code: 'IN'
    }
  };
};

const submitOrder = async (order) => {
  const reference = createOrderNumber();
  order.qikinkFulfillment.reference = reference;
  order.qikinkFulfillment.state = 'submitting';
  order.qikinkFulfillment.lastError = undefined;
  order.updatedAt = new Date();
  await order.save();

  try {
    const response = await getQikinkClient().createOrder(createQikinkPayload(order));
    if (!response || !response.order_id) {
      order.qikinkFulfillment.state = 'outcome_unknown';
      order.qikinkFulfillment.lastError = 'Qikink response did not include an order ID. Check the Qikink dashboard before taking action.';
    } else {
      order.qikinkFulfillment.state = 'submitted';
      order.qikinkFulfillment.orderId = String(response.order_id);
      order.qikinkFulfillment.response = {
        message: typeof response.message === 'string' ? response.message.slice(0, 200) : undefined,
        orderId: String(response.order_id),
        statusCode: typeof response.status_code === 'string' ? response.status_code.slice(0, 20) : undefined
      };
      order.qikinkFulfillment.submittedAt = new Date();
    }
  } catch (error) {
    if (!(error instanceof QikinkError)) throw error;
    order.qikinkFulfillment.state = error.outcomeUnknown ? 'outcome_unknown' :
      error.code === 'NOT_CONFIGURED' || error.code === 'LIVE_DISABLED' ? 'not_configured' : 'rejected';
    order.qikinkFulfillment.lastError = error.outcomeUnknown
      ? 'Qikink submission outcome is uncertain. Check the Qikink dashboard before taking action.'
      : [error.message, error.detail].filter(Boolean).join(': ').slice(0, 300);
  }

  order.updatedAt = new Date();
  await order.save();
  return order;
};

const syncOrderStatus = async (order) => {
  if (!order.qikinkFulfillment?.orderId && !order.qikinkFulfillment?.reference) return order;
  const response = await getQikinkClient().listOrders({
    order_reference_no: order.qikinkFulfillment.reference
  });
  const orders = Array.isArray(response?.data) ? response.data : [];
  const match = orders.find((item) =>
    String(item.order_id) === String(order.qikinkFulfillment.orderId) ||
    String(item.number || '').endsWith(`_${order.qikinkFulfillment.reference}`)
  );
  if (!match) {
    order.qikinkFulfillment.lastSyncedAt = new Date();
    order.qikinkFulfillment.lastError = 'No matching order was present in the Qikink order-list response. Check the API look-back window and Qikink dashboard.';
    order.updatedAt = new Date();
    await order.save();
    return order;
  }

  order.qikinkFulfillment.rawStatus = typeof match.status === 'string' ? match.status.slice(0, 80) : undefined;
  order.qikinkFulfillment.shippingType = typeof match.shipping_type === 'string' ? match.shipping_type.slice(0, 100) : undefined;
  order.qikinkFulfillment.deliveredOn = typeof match.delivered_on === 'string' ? match.delivered_on.slice(0, 80) : undefined;
  order.qikinkFulfillment.lastError = undefined;
  order.qikinkFulfillment.lastSyncedAt = new Date();
  order.updatedAt = new Date();
  await order.save();
  return order;
};

module.exports = { createOrderNumber, createQikinkPayload, submitOrder, syncOrderStatus };
