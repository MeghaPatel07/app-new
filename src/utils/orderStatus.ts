// Must match backend orderStatusController.js TRANSITIONS exactly
export type OrderStatus =
  | 'payed'
  | 'vendor_processing'
  | 'vendor_dispatched'
  | 'vendor_cancelled'
  | 'warehouse_order_received'
  | 'warehouse_order_processing'
  | 'warehouse_order_cancelled'
  | 'vendor_order_returned'
  | 'order_dispatched'
  | 'order_delivered'
  | 'user_order_returned';

export const STATUS_CFG: Record<OrderStatus, { label: string; description: string }> = {
  payed:                      { label: 'Order Placed',              description: 'Payment received. Order confirmed.' },
  vendor_processing:          { label: 'Vendor Processing',         description: 'The vendor is processing your order.' },
  vendor_dispatched:          { label: 'Vendor Dispatched',         description: 'Vendor has shipped to our warehouse.' },
  vendor_cancelled:           { label: 'Cancelled',                 description: 'Order has been cancelled. Refund initiated.' },
  warehouse_order_received:   { label: 'Warehouse Received',        description: 'Your order has arrived at our warehouse.' },
  warehouse_order_processing: { label: 'Quality Check & Packing',   description: 'Your order is being quality-checked and packed.' },
  warehouse_order_cancelled:  { label: 'Cancelled at Warehouse',    description: 'Order cancelled at warehouse. Refund initiated.' },
  vendor_order_returned:      { label: 'Returned to Vendor',        description: 'Order has been returned to the vendor.' },
  order_dispatched:           { label: 'Out for Delivery',          description: 'Your order is out for delivery!' },
  order_delivered:            { label: 'Delivered',                  description: 'Order successfully delivered.' },
  user_order_returned:        { label: 'Return Initiated',          description: 'Return request submitted.' },
};

// The normal forward flow (excludes cancellation/return branches)
export const STATUS_FLOW: OrderStatus[] = [
  'payed',
  'vendor_processing',
  'vendor_dispatched',
  'warehouse_order_received',
  'warehouse_order_processing',
  'order_dispatched',
  'order_delivered',
];

export function getStatusIndex(status: OrderStatus): number {
  return STATUS_FLOW.indexOf(status);
}

export function isCompleted(currentStatus: OrderStatus, stepStatus: OrderStatus): boolean {
  return getStatusIndex(currentStatus) > getStatusIndex(stepStatus);
}

export function isActive(currentStatus: OrderStatus, stepStatus: OrderStatus): boolean {
  return currentStatus === stepStatus;
}
