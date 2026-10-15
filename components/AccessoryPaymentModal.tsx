'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';
import UpiPaymentModal from '@/components/UpiPaymentModal';
import { launchPayu, PayuLaunchParams } from '@/lib/payments/payuClient';
import { PremiumModal, PremiumButton, ModalDetails, ModalTotal, ModalSuccessHeader } from '@/components/PortalUI';

interface Accessory {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface AccessoryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: Accessory | null;
  stbNumber: string;
  customerName?: string;
  customerMobile?: string;
}

export default function AccessoryPaymentModal({
  isOpen,
  onClose,
  accessory,
  stbNumber,
}: AccessoryPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [upiOrder, setUpiOrder] = useState<{ orderId: string; upiLink: string; amount: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { t } = useTranslation();

  if (!isOpen || !accessory) return null;

  const resetAndClose = () => {
    setUpiOrder(null);
    onClose();
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      const orderResponse = await fetch('/api/accessory/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessoryId: accessory.id }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      if (orderData.payu) {
        await launchPayu(orderData.payu as PayuLaunchParams, () => setLoading(false));
        return;
      }

      setUpiOrder({ orderId: orderData.orderId, upiLink: orderData.upiLink, amount: orderData.amount });
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (upiOrder) {
    if (showSuccess) {
      const goToDashboard = () => {
        resetAndClose();
        window.location.reload();
      };
      return (
        <PremiumModal title="Thank you!" onClose={goToDashboard}>
          <ModalSuccessHeader
            title="Payment Submitted!"
            message="We have received your payment details. Your operator will deliver the accessory once verified."
          />
          <ModalDetails rows={[
            { label: 'Order ID', value: <span className="font-mono text-xs sm:text-sm">{upiOrder.orderId}</span> },
            { label: t('accessory'), value: accessory.name },
            { label: 'Amount', value: formatCurrency(upiOrder.amount), valueClass: 'text-green-400' },
          ]} />
          <PremiumButton onClick={goToDashboard}>Go to Dashboard</PremiumButton>
        </PremiumModal>
      );
    }

    return (
      <UpiPaymentModal
        upiLink={upiOrder.upiLink}
        amount={upiOrder.amount}
        submitUtrUrl={`/api/accessory/${upiOrder.orderId}/submit-utr`}
        onSubmitted={() => setShowSuccess(true)}
        onCancel={resetAndClose}
      />
    );
  }

  return (
    <PremiumModal title={t('confirmOrder')} subtitle="Delivered to your address after payment" onClose={onClose} closeDisabled={loading}>
      {accessory.description && (
        <p className="text-sm text-gray-300 mb-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.25)' }}>
          {accessory.description}
        </p>
      )}
      <ModalDetails rows={[
        { label: t('accessory'), value: accessory.name },
        { label: 'STB Number', value: <span className="font-mono">{stbNumber}</span> },
      ]} />
      <ModalTotal label={t('totalAmount')} amount={formatCurrency(accessory.price)} />
      <PremiumButton onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing…' : t('payWithCashfree')}
      </PremiumButton>
      <p className="text-center text-[11px] text-gray-500 mt-3">🔒 Secure payment</p>
    </PremiumModal>
  );
}
