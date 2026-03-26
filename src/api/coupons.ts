import { api } from '../lib/api';
import type { CouponValidation } from '../types';

export interface ValidateCouponPayload {
  code: string;
  cartTotal?: number;
}

export const couponsApi = {
  /**
   * POST /coupons/validate
   * Validates a coupon code and returns discount details.
   */
  validateCoupon: (payload: ValidateCouponPayload) =>
    api.post<CouponValidation>('/coupons/validate', payload),
};
