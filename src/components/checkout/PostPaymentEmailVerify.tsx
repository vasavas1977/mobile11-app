import { useState, useEffect, useRef } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, ShieldCheck, Pencil, ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isGuestAutoCreated } from '@/utils/guestCheckout';
import { useNavigate } from 'react-router-dom';

interface PostPaymentEmailVerifyProps {
  email: string;
  userId: string;
  parentOrderId: string;
  onVerified: () => void;
  onEmailChanged?: (newEmail: string) => void;
}

export function PostPaymentEmailVerify({ email, userId, parentOrderId, onVerified, onEmailChanged }: PostPaymentEmailVerifyProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [orderTransferMode, setOrderTransferMode] = useState(false);
  const [transferTargetEmail, setTransferTargetEmail] = useState('');
  const hasSentInitial = useRef(false);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const langCode = language as string;

  useEffect(() => {
    if (!hasSentInitial.current) {
      hasSentInitial.current = true;
      sendOtp();
    }
  }, []);

  const sendOtp = async (targetEmail?: string) => {
    setIsSending(true);
    setError(null);
    try {
      const emailToSend = targetEmail || email;
      const { data, error: fnError } = await supabase.functions.invoke('post-payment-otp', {
        body: { action: 'send', userId, email: emailToSend, language: langCode },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        if (data.cooldown) {
          setResendCooldown(data.cooldown);
          startCooldown(data.cooldown);
        }
        throw new Error(data.error);
      }

      setResendCooldown(60);
      startCooldown(60);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsSending(false);
    }
  };

  const startCooldown = (seconds: number) => {
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      setResendCooldown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
  };

  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const emailToVerify = orderTransferMode ? transferTargetEmail : email;
      const { data, error: fnError } = await supabase.functions.invoke('post-payment-otp', {
        body: { action: 'verify', userId, email: emailToVerify, code },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      if (data?.verified) {
        await supabase
          .from('orders')
          .update({ email_verified: true })
          .eq('parent_order_id', parentOrderId);

        // If in transfer mode, transfer orders to existing account
        if (orderTransferMode) {
          await handleOrderTransfer();
          return;
        }

        // Normal flow: send confirmations only for orders not already sent by webhook
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, language, status, qr_code, webhook_data')
          .eq('parent_order_id', parentOrderId);

        if (ordersData) {
          for (const order of ordersData) {
            // Skip if webhook already sent confirmation (order completed with QR + confirmation_sent flag)
            const webhookData = order.webhook_data as Record<string, unknown> | null;
            if (order.status === 'completed' && order.qr_code && webhookData?.confirmation_sent) {
              console.log('Skipping confirmation for order (already sent by webhook):', order.id);
              continue;
            }
            try {
              await supabase.functions.invoke('send-order-confirmation', {
                body: { orderId: order.id, language: order.language || 'en' },
              });
            } catch (emailErr) {
              console.error('Failed to send confirmation for order:', order.id, emailErr);
            }
          }
        }

        if (isGuestAutoCreated()) {
          try {
            await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/reset-password?lang=${langCode}`,
            });
          } catch (pwErr) {
            console.error('Failed to send password reset email:', pwErr);
          }
        }

        toast({
          title: t('paymentSuccess.emailVerified') || 'Email verified!',
          description: t('paymentSuccess.emailVerifiedDesc') || 'Your eSIM details and confirmation email are on the way.',
        });

        onVerified();
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Verification failed');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderTransfer = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('transfer-guest-orders', {
        body: { guestUserId: userId, targetEmail: transferTargetEmail, parentOrderId },
      });

      if (fnError) {
        const msg = data?.error || fnError.message;
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      toast({
        title: t('checkout.orderTransferSuccess') || 'Orders transferred!',
        description: t('checkout.orderTransferSuccess') || 'Orders transferred to your existing account! Please sign in.',
      });

      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    } catch (err: any) {
      console.error('Order transfer error:', err);
      setError(t('checkout.orderTransferFailed') || err.message || 'Transfer failed');
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setError(null);
    if (value.length === 6) {
      verifyOtp(value);
    }
  };

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('checkout.invalidEmail'));
      return;
    }
    if (trimmed === email.toLowerCase()) {
      setIsEditingEmail(false);
      return;
    }

    setIsUpdatingEmail(true);
    setError(null);
    try {
      const { data: emailData, error: emailFnError } = await supabase.functions.invoke('update-guest-email', {
        body: { userId, newEmail: trimmed },
      });
      if (emailFnError) {
        const realMessage = emailData?.error || emailFnError.message;
        throw new Error(realMessage);
      }
      if (emailData?.error) throw new Error(emailData.error);

      // Check if this is an order transfer scenario
      if (emailData?.orderTransfer) {
        setOrderTransferMode(true);
        setTransferTargetEmail(trimmed);
        setOtp('');
        setResendCooldown(0);
        setIsEditingEmail(false);

        // Send OTP to the target email for verification
        await supabase.functions.invoke('post-payment-otp', {
          body: { action: 'send', userId, email: trimmed, language: langCode },
        });
        setResendCooldown(60);
        startCooldown(60);

        toast({
          title: t('checkout.orderTransferDetected') || 'Account found',
          description: t('checkout.orderTransferDetected') || 'Verify your email to transfer your order.',
        });
        return;
      }

      // Normal email update flow
      await supabase
        .from('orders')
        .update({ guest_email: trimmed, notification_email: trimmed })
        .eq('parent_order_id', parentOrderId);

      setOtp('');
      setResendCooldown(0);
      setIsEditingEmail(false);

      onEmailChanged?.(trimmed);

      await supabase.functions.invoke('post-payment-otp', {
        body: { action: 'send', userId, email: trimmed, language: langCode },
      });
      setResendCooldown(60);
      startCooldown(60);

      toast({
        title: t('checkout.emailUpdated'),
        description: t('checkout.verificationCodeSent').replace('{email}', trimmed),
      });
    } catch (err: any) {
      console.error('Change email error:', err);
      const msg = err.message || '';
      if (msg === 'session_expired' || msg.includes('sub claim') || msg.includes('not exist')) {
        setError(t('checkout.sessionExpired'));
        await supabase.auth.signOut();
      } else {
        setError(msg || 'Failed to update email');
      }
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const displayEmail = orderTransferMode ? transferTargetEmail : email;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-full">
          {orderTransferMode ? (
            <ArrowRightLeft className="w-6 h-6 text-primary" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-primary" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-xl">
            {orderTransferMode
              ? (t('checkout.verifyToTransfer') || 'Verify email to transfer order')
              : (t('paymentSuccess.verifyEmail') || 'Verify your email')}
          </h3>
          <p className="text-sm text-gray-600">
            {orderTransferMode
              ? (t('checkout.orderTransferDetected') || 'This email is linked to an existing account. Verify your email to transfer your order.')
              : (t('paymentSuccess.verifyEmailDesc') || 'Enter the 6-digit code sent to your email to view your eSIM details.')}
          </p>
        </div>
      </div>

      {isEditingEmail ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            {t('checkout.enterNewEmail')}
          </p>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setError(null); }}
            placeholder="email@example.com"
            disabled={isUpdatingEmail}
            className="rounded-xl border-gray-300 text-gray-900 bg-white"
          />
          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          <Button
            className="w-full rounded-xl bg-orange-500 text-white hover:bg-orange-600"
            onClick={handleChangeEmail}
            disabled={isUpdatingEmail}
          >
            {isUpdatingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Mail className="mr-2 h-4 w-4" />
            {t('checkout.updateAndSendCode')}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => { setIsEditingEmail(false); setNewEmail(email); setError(null); }}
            disabled={isUpdatingEmail}
          >
            {t('checkout.cancel')}
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">
              {t('paymentSuccess.codeSentTo') || 'Code sent to'}
            </p>
            <p className="font-bold text-gray-900">{displayEmail}</p>
            {orderTransferMode && (
              <p className="text-xs text-orange-600 mt-1">
                <ArrowRightLeft className="inline w-3 h-3 mr-1" />
                {t('checkout.verifyToTransfer') || 'Verify email to transfer order'}
              </p>
            )}
          </div>

          <div className="flex justify-center [&_div]:border-gray-300 [&_div]:text-gray-900">
            <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} disabled={isLoading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.verifyingCode') || 'Verifying...'}
            </div>
          )}

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <Button
            className="w-full rounded-xl bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => sendOtp(orderTransferMode ? transferTargetEmail : undefined)}
            disabled={resendCooldown > 0 || isSending || isLoading}
          >
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            {resendCooldown > 0
              ? `${t('auth.resendCodeIn') || 'Resend code in'} ${resendCooldown}s`
              : t('auth.resendCode') || 'Resend code'}
          </Button>

          {!orderTransferMode && (
            <Button
              variant="ghost"
              className="w-full text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => { setIsEditingEmail(true); setNewEmail(email); }}
              disabled={isLoading || isSending}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t('checkout.changeEmail')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
