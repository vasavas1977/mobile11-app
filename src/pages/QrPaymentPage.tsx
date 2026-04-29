import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrPaymentState {
  qrImageUrl: string;
  paymentToken: string;
  parentOrderId: string;
  totalAmount: number;
  expiryTimer: number;
}

const QrPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const state = location.state as QrPaymentState | null;

  const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'expired'>('pending');
  const [timeLeft, setTimeLeft] = useState(state?.expiryTimer || 900);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guard: redirect if no state
  useEffect(() => {
    if (!state) {
      navigate('/cart', { replace: true });
    }
  }, [state, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!state || status !== 'pending') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state, status]);

  // Poll payment status
  const checkStatus = useCallback(async () => {
    if (!state) return;
    try {
      const { data, error } = await supabase.functions.invoke('check-2c2p-payment-status', {
        body: { paymentToken: state.paymentToken }
      });
      if (error) return;
      if (data?.status === 'completed') {
        setStatus('completed');
      } else if (data?.status === 'failed') {
        setStatus('failed');
      } else if (data?.status === 'expired') {
        setStatus('expired');
      }
    } catch {
      // Silently continue polling
    }
  }, [state]);

  useEffect(() => {
    if (!state || status !== 'pending') return;
    pollingRef.current = setInterval(checkStatus, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [state, status, checkStatus]);

  // On success, redirect after brief delay
  useEffect(() => {
    if (status === 'completed' && state) {
      const timer = setTimeout(() => {
        navigate(`/payment-success?parent_order_id=${state.parentOrderId}&method=2c2p`, { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, state, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!state) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const labels: Record<string, Record<string, string>> = {
    en: {
      title: 'Scan to Pay',
      instruction: 'Open your banking app and scan this QR code',
      amount: 'Amount',
      waiting: 'Waiting for payment...',
      timeRemaining: 'Time remaining',
      success: 'Payment successful!',
      redirecting: 'Redirecting...',
      failed: 'Payment failed',
      expired: 'QR code expired',
      tryAgain: 'Try Again',
      securedBy: 'Secured by 2C2P',
      promptpay: 'PromptPay QR Payment',
    },
    th: {
      title: 'สแกนเพื่อชำระเงิน',
      instruction: 'เปิดแอปธนาคารแล้วสแกน QR โค้ดนี้',
      amount: 'จำนวนเงิน',
      waiting: 'รอการชำระเงิน...',
      timeRemaining: 'เวลาที่เหลือ',
      success: 'ชำระเงินสำเร็จ!',
      redirecting: 'กำลังเปลี่ยนหน้า...',
      failed: 'การชำระเงินล้มเหลว',
      expired: 'QR โค้ดหมดอายุ',
      tryAgain: 'ลองอีกครั้ง',
      securedBy: 'ปลอดภัยโดย 2C2P',
      promptpay: 'ชำระเงินผ่าน PromptPay QR',
    },
    ja: {
      title: 'スキャンして支払い',
      instruction: 'バンキングアプリを開いてこのQRコードをスキャンしてください',
      amount: '金額',
      waiting: '支払いを待っています...',
      timeRemaining: '残り時間',
      success: '支払い成功！',
      redirecting: 'リダイレクト中...',
      failed: '支払いに失敗しました',
      expired: 'QRコードの有効期限切れ',
      tryAgain: '再試行',
      securedBy: '2C2Pによるセキュリティ',
      promptpay: 'PromptPay QR決済',
    },
    ko: {
      title: '스캔하여 결제',
      instruction: '뱅킹 앱을 열고 이 QR 코드를 스캔하세요',
      amount: '금액',
      waiting: '결제를 기다리는 중...',
      timeRemaining: '남은 시간',
      success: '결제 성공!',
      redirecting: '리디렉션 중...',
      failed: '결제 실패',
      expired: 'QR 코드 만료',
      tryAgain: '다시 시도',
      securedBy: '2C2P 보안',
      promptpay: 'PromptPay QR 결제',
    },
    fr: {
      title: 'Scanner pour payer',
      instruction: 'Ouvrez votre application bancaire et scannez ce QR code',
      amount: 'Montant',
      waiting: 'En attente du paiement...',
      timeRemaining: 'Temps restant',
      success: 'Paiement réussi !',
      redirecting: 'Redirection...',
      failed: 'Échec du paiement',
      expired: 'QR code expiré',
      tryAgain: 'Réessayer',
      securedBy: 'Sécurisé par 2C2P',
      promptpay: 'Paiement QR PromptPay',
    },
    de: {
      title: 'Zum Bezahlen scannen',
      instruction: 'Öffnen Sie Ihre Banking-App und scannen Sie diesen QR-Code',
      amount: 'Betrag',
      waiting: 'Warte auf Zahlung...',
      timeRemaining: 'Verbleibende Zeit',
      success: 'Zahlung erfolgreich!',
      redirecting: 'Weiterleitung...',
      failed: 'Zahlung fehlgeschlagen',
      expired: 'QR-Code abgelaufen',
      tryAgain: 'Erneut versuchen',
      securedBy: 'Gesichert durch 2C2P',
      promptpay: 'PromptPay QR-Zahlung',
    },
  };

  const l = labels[language] || labels.en;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-[2rem] border border-border/60 bg-background/95 p-5 shadow-sm backdrop-blur">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{l.title}</h1>
          <p className="text-sm text-muted-foreground">{l.promptpay}</p>
        </div>

        {/* Amount */}
        <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{l.amount}</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            ฿{state.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-background rounded-xl p-6 flex flex-col items-center space-y-4 border border-border shadow-sm">
          {status === 'pending' && (
            <>
              <img
                src={state.qrImageUrl}
                alt="PromptPay QR Code"
                className="w-64 h-64 object-contain rounded-lg"
              />
              <p className="text-sm text-muted-foreground text-center">{l.instruction}</p>
            </>
          )}
          {status === 'completed' && (
            <div className="w-64 h-64 flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
              <p className="text-lg font-semibold text-foreground">{l.success}</p>
              <p className="text-sm text-muted-foreground">{l.redirecting}</p>
            </div>
          )}
          {(status === 'failed' || status === 'expired') && (
            <div className="w-64 h-64 flex flex-col items-center justify-center space-y-4">
              <XCircle className="h-20 w-20 text-destructive" />
              <p className="text-lg font-semibold text-destructive">
                {status === 'expired' ? l.expired : l.failed}
              </p>
            </div>
          )}
        </div>

        {/* Status bar */}
        {status === 'pending' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{l.waiting}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">
                {l.timeRemaining}: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Try Again button */}
        {(status === 'failed' || status === 'expired') && (
          <Button
            onClick={() => navigate('/cart', { replace: true })}
            className="w-full"
            size="lg"
          >
            {l.tryAgain}
          </Button>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs">{l.securedBy}</span>
        </div>
      </div>
    </div>
  );
};

export default QrPaymentPage;
