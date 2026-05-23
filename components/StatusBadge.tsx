interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusClass = () => {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending';
      case 'paid':
        return 'status-badge status-paid';
      case 'activated':
        return 'status-badge status-activated';
      case 'failed':
        return 'status-badge status-failed';
      default:
        return 'status-badge';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Paid / Activating';
      case 'activated':
        return 'Activated';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  return <span className={getStatusClass()}>{getStatusText()}</span>;
}
