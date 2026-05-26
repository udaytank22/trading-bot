import React from 'react';
import AppBadge from './AppBadge';

interface AppStatusBadgeProps {
  status: string;
  className?: string;
}

export const AppStatusBadge: React.FC<AppStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const normStatus = status.toUpperCase();
  let label = status;
  let variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray' = 'primary';

  switch (normStatus) {
    case 'PENDING':
      label = 'Pending';
      variant = 'warning';
      break;
    case 'RFQ_SENT':
      label = 'RFQ Sent';
      variant = 'info';
      break;
    case 'RFQ_RECEIVED':
      label = 'RFQ Received';
      variant = 'primary';
      break;
    case 'RFQ_READY':
      label = 'RFQ Ready';
      variant = 'info';
      break;
    case 'CLIENT_QUOTING':
      label = 'Client Quoting';
      variant = 'primary';
      break;
    case 'QUOTE_SENT':
      label = 'Quote Sent';
      variant = 'success';
      break;
    case 'TL_REVIEW':
      label = 'TL Review';
      variant = 'warning';
      break;
    case 'ADMIN_APPROVAL':
      label = 'Admin Approval';
      variant = 'danger';
      break;
    case 'EMPLOYEE_VERIFY':
      label = 'Verify';
      variant = 'warning';
      break;
    case 'CONFIRMED':
    case 'PAID':
    case 'DELIVERED':
    case 'ACTIVE':
    case 'VALID':
      label = status.charAt(0) + status.slice(1).toLowerCase();
      variant = 'success';
      break;
    case 'CANCELLED':
    case 'EXPIRED':
    case 'INACTIVE':
      label = status.charAt(0) + status.slice(1).toLowerCase();
      variant = 'danger';
      break;
    case 'IN_TRANSIT':
      label = 'In Transit';
      variant = 'info';
      break;
    case 'LOADING':
      label = 'Loading';
      variant = 'warning';
      break;
    case 'DRAFT':
      label = 'Draft';
      variant = 'gray';
      break;
    case 'SENT':
      label = 'Sent';
      variant = 'success';
      break;
    default:
      variant = 'gray';
      break;
  }

  return (
    <AppBadge 
      label={label} 
      variant={variant} 
      className={className} 
    />
  );
};
export default AppStatusBadge;
