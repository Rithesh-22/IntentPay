import React from 'react';
import { TransactionState } from '../types';

interface StatusBadgeProps {
  state: TransactionState;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ state }) => {
  switch (state) {
    case 'CAPTURE_CONFIRMED':
      return (
        <span className="font-mono text-xs font-semibold text-[#4EAA79]">
          Confirmed (Captured)
        </span>
      );
    case 'PAYMENT_ORDER_CREATED':
      return (
        <span className="font-mono text-xs font-semibold text-[#D8A85B]">
          PayPal Order Created
        </span>
      );
    case 'AWAITING_USER_APPROVAL':
      return (
        <span className="font-mono text-xs font-semibold text-[#C7F36B]">
          Awaiting Approval
        </span>
      );
    case 'CAPTURE_REQUESTED':
      return (
        <span className="font-mono text-xs font-semibold text-[#D8A85B]">
          Capturing Payment...
        </span>
      );
    case 'BLOCKED':
      return (
        <span className="font-mono text-xs font-semibold text-[#D95D5D]">
          Policy Blocked
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="font-mono text-xs text-[#A4AA9A]">
          User Cancelled
        </span>
      );
    case 'FAILED':
      return (
        <span className="font-mono text-xs text-[#D95D5D]">
          Payment Failed
        </span>
      );
    default:
      return (
        <span className="font-mono text-xs text-[#A4AA9A]">
          {state.replace(/_/g, ' ')}
        </span>
      );
  }
};
