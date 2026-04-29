export const createAppleEsimUrl = (downloadLink: string): string => {
  return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(downloadLink)}`;
};

export const downloadQRCode = async (
  qrCodeUrl: string,
  orderId: string,
  onSuccess: (message: string) => void,
  onError: (error: Error) => void
) => {
  try {
    const response = await fetch(qrCodeUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esim-qr-code-${orderId}.png`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    onSuccess('QR code saved successfully');
  } catch (error) {
    console.error('QR code download failed, opening in new tab instead:', error);
    window.open(qrCodeUrl, '_blank', 'noopener,noreferrer');
    onError(error as Error);
  }
};
