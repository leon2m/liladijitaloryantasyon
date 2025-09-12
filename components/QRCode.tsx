import React from 'react';

interface QRCodeProps {
  data: string;
  size?: number;
}

/**
 * A simple component to display a QR code using an external API.
 * This avoids adding a heavy library for a simple feature.
 */
function QRCode({ data, size = 150 }: QRCodeProps): React.ReactNode {
  const encodedData = encodeURIComponent(data);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&qzone=1`;

  return (
    <img
      src={qrUrl}
      alt="Kurtarma Kodu QR"
      width={size}
      height={size}
      aria-label="Hesap kurtarma kodunuzu içeren QR kodu"
    />
  );
}

export default QRCode;
