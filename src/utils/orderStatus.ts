export type OrderStatus =
  | 'payed'
  | 'confirmed'
  | 'stylist_assigned'
  | 'styling_in_progress'
  | 'ready_to_dispatch'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'user_order_returned'
  | 'return_accepted'
  | 'cancelled';

export const STATUS_CFG: Record<OrderStatus, { label: string; description: string }> = {
  payed:                { label: 'Order Placed',         description: 'Payment received. Order confirmed.' },
  confirmed:            { label: 'Confirmed',            description: 'Your order has been confirmed.' },
  stylist_assigned:     { label: 'Stylist Assigned',     description: 'A stylist has been assigned to your order.' },
  styling_in_progress:  { label: 'Styling in Progress',  description: 'Your stylist is working on your items.' },
  ready_to_dispatch:    { label: 'Ready to Dispatch',    description: 'Your order is packed and ready.' },
  dispatched:           { label: 'Dispatched',           description: 'Your order is on its way.' },
  out_for_delivery:     { label: 'Out for Delivery',     description: 'Your order will be delivered today.' },
  delivered:            { label: 'Delivered',            description: 'Order successfully delivered.' },
  user_order_returned:  { label: 'Return Requested',     description: 'Return request submitted.' },
  return_accepted:      { label: 'Return Accepted',      description: 'Return has been accepted.' },
  cancelled:            { label: 'Cancelled',            description: 'Order has been cancelled.' },
};

export const STATUS_FLOW: OrderStatus[] = [
  'payed',
  'confirmed',
  'stylist_assigned',
  'styling_in_progress',
  'ready_to_dispatch',
  'dispatched',
  'out_for_delivery',
  'delivered',
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
