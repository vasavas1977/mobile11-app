import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

function isHttpUrl(value?: string) {
  return !!value && /^https?:\/\//i.test(value);
}

function upgradeUsimsaQrSize(url: string, size: number) {
  // USIMSA endpoint usually ends with "/{size}". We upgrade it for better scan quality.
  return url.replace(/\/\d+$/, `/${size}`);
}

function extractLpaFromQrUrl(url: string) {
  const marker = "/qrcode/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  let lpa = url.slice(idx + marker.length);
  lpa = lpa.replace(/\/\d+$/, "");

  try {
    return decodeURIComponent(lpa);
  } catch {
    return lpa;
  }
}

interface EsimQrCodeProps {
  qrCode?: string;
  downloadLink?: string;
  size?: number;
}

export function EsimQrCode({ qrCode, downloadLink, size = 200 }: EsimQrCodeProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const shouldTryImage = isHttpUrl(qrCode);

  const imgSrc = useMemo(() => {
    if (!shouldTryImage || !qrCode) return null;
    // Request a larger image than our displayed size to avoid blur.
    const requestSize = Math.max(400, size * 2);
    return upgradeUsimsaQrSize(qrCode, requestSize);
  }, [qrCode, shouldTryImage, size]);

  const qrValue = useMemo(() => {
    if (downloadLink) return downloadLink;
    if (qrCode && !isHttpUrl(qrCode)) return qrCode;
    if (qrCode && isHttpUrl(qrCode)) return extractLpaFromQrUrl(qrCode) ?? qrCode;
    return "";
  }, [downloadLink, qrCode]);

  if (imgSrc && !imgFailed) {
    return (
      <img
        src={imgSrc}
        alt="eSIM installation QR code"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain"
        crossOrigin="anonymous"
        loading="eager"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <QRCodeSVG
      value={qrValue}
      size={size}
      level="M"
      includeMargin={true}
    />
  );
}
