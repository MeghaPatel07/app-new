/**
 * Re-exports from the order-status utility so consumers can import from
 * `@/constants/orderStatus` without reaching into utils directly.
 */
export {
  type OrderStatus,
  STATUS_CFG,
  STATUS_FLOW,
  getStatusIndex,
  isCompleted,
  isActive,
} from '../utils/orderStatus';
