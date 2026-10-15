'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import UpiPaymentModal from '@/components/UpiPaymentModal';
import { launchPayu, PayuLaunchParams } from '@/lib/payments/payuClient';
import { PremiumModal, PremiumButton, ModalDetails, ModalTotal, ModalSuccessHeader } from '@/components/PortalUI';

interface AlacartePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChannelIds: number[];
  channelCount: number;
  totalPrice: number; // in paise
  stbNumber: string;
  customerName?: string;
  customerMobile?: string;
  onSuccess: () => void;
}

export default function AlacartePaymentModal({
  isOpen,
  onClose,
  selectedChannelIds,
  channelCount,
  totalPrice,
  stbNumber,
  onSuccess,
}: AlacartePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [upiOrder, setUpiOrder] = useState<{ orderId: string; upiLink: string; amount: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen || selectedChannelIds.length === 0) return null;

  const resetAndClose = () => {
    setUpiOrder(null);
    onClose();
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      const orderResponse = await fetch('/api/recharge/create-alacarte-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds: selectedChannelIds }),
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
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (upiOrder) {
    if (showSuccess) {
      const goToDashboard = () => {
        const orderId = upiOrder.orderId;
        resetAndClose();
        onSuccess();
        window.location.href = `/dashboard?order_id=${orderId}`;
      };
      return (
        <PremiumModal title="Thank you!" onClose={goToDashboard}>
          <ModalSuccessHeader
            title="Payment Submitted!"
            message="We have received your payment details. Your a-la-carte subscription will be activated once verified."
          />
          <ModalDetails rows={[
            { label: 'Order ID', value: <span className="font-mono text-xs sm:text-sm">{upiOrder.orderId}</span> },
            { label: 'Channels', value: `${channelCount} Channels` },
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
        submitUtrUrl={`/api/recharge/${upiOrder.orderId}/submit-utr`}
        onSubmitted={() => setShowSuccess(true)}
        onCancel={resetAndClose}
      />
    );
  }

  return (
    <PremiumModal title="Confirm Payment" subtitle="Review your channel pack before paying" onClose={onClose} closeDisabled={loading}>
      <ModalDetails rows={[
        { label: 'Type', value: 'A La Carte Subscription' },
        { label: 'Selected Channels', value: `${channelCount} channels` },
        { label: 'Duration', value: '30 days' },
        { label: 'STB Number', value: <span className="font-mono">{stbNumber}</span> },
      ]} />
      <ModalTotal amount={formatCurrency(totalPrice)} />
      <PremiumButton onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing…' : 'Pay Now'}
      </PremiumButton>
      <p className="text-center text-[11px] text-gray-500 mt-3">🔒 Secure payment</p>
    </PremiumModal>
  );
}
