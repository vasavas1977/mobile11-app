// Static guide images for QR Code Activation flow
// These are the direct URLs to the guide images

export const androidGuideImages: Record<number, string> = {
  1: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fandroid%2Fqr%2Fandroid_qr_1.png&w=640&q=90',
  2: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fandroid%2Fqr%2Fandroid_qr_2.png&w=640&q=90',
  3: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fandroid%2Fqr%2Fandroid_qr_3.png&w=640&q=90',
  4: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fandroid%2Fqr%2Fandroid_qr_4.png&w=640&q=90',
  5: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fandroid%2Fqr%2Fandroid_qr_5.png&w=640&q=90',
  6: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fandroid%2Fqr%2Fandroid_qr_6.png&w=640&q=90',
};

export const iosGuideImages: Record<number, string> = {
  1: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fios%2Fqr%2Fios_qr_1.png&w=640&q=90',
  2: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fios%2Fqr%2Fios_qr_2.png&w=640&q=90',
  3: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fios%2Fqr%2Fios_qr_3.png&w=640&q=90',
  4: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fios%2Fqr%2Fios_qr_4.png&w=640&q=90',
  5: 'https://www.superalink.com/_next/image?url=%2Fassets%2Fesim-guide%2Fios%2Fqr%2Fios_qr_5.png&w=640&q=90',
};

export function getGuideImages(device: 'android' | 'ios'): Record<number, string> {
  return device === 'android' ? androidGuideImages : iosGuideImages;
}
