import jsPDF from 'jspdf';

type TranslationFunction = (key: string) => string;

export const generateEnterpriseBrochure = (t: TranslationFunction, language: string) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Brand colors
  const emerald = { r: 16, g: 185, b: 129 };
  const darkText = { r: 30, g: 30, b: 30 };
  const grayText = { r: 80, g: 80, b: 80 };
  const white = { r: 255, g: 255, b: 255 };

  // Helper functions
  const setColor = (color: { r: number; g: number; b: number }) => {
    doc.setTextColor(color.r, color.g, color.b);
  };

  const setFillColor = (color: { r: number; g: number; b: number }) => {
    doc.setFillColor(color.r, color.g, color.b);
  };

  const drawLine = (y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const addHeader = (pageNum: number, totalPages: number) => {
    doc.setFontSize(9);
    setColor(grayText);
    doc.text('Mobile11 Enterprise Solutions', margin, 12);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 12, { align: 'right' });
    drawLine(16);
  };

  const addFooter = () => {
    drawLine(pageHeight - 18);
    doc.setFontSize(8);
    setColor(grayText);
    doc.text('www.mobile11.com | support@mobile11.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  // ============================================
  // PAGE 1: Cover
  // ============================================
  
  // Full emerald background
  setFillColor(emerald);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setColor(white);
  doc.text('MOBILE11', margin, 40);

  // Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('by 1-TO-ALL', margin, 48);

  // Main title
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text('Enterprise', margin, 100);
  doc.text('Connectivity', margin, 118);
  doc.text('Solutions', margin, 136);

  // Tagline
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Worry-Free Internet for Mission-Critical Business', margin, 155);

  // Stats section - white boxes
  const statsY = 200;
  const statBoxWidth = 50;
  const statBoxHeight = 45;
  const statGap = 10;

  const stats = [
    { number: '151', label: 'Countries' },
    { number: '4,500+', label: 'Enterprise Clients' },
    { number: '20+', label: 'Years Experience' },
  ];

  stats.forEach((stat, i) => {
    const x = margin + (i * (statBoxWidth + statGap));
    
    // White box
    setFillColor(white);
    doc.roundedRect(x, statsY, statBoxWidth, statBoxHeight, 3, 3, 'F');
    
    // Number
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    setColor(emerald);
    doc.text(stat.number, x + statBoxWidth / 2, statsY + 20, { align: 'center' });
    
    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(darkText);
    doc.text(stat.label, x + statBoxWidth / 2, statsY + 32, { align: 'center' });
  });

  // Bottom tagline
  doc.setFontSize(11);
  setColor(white);
  doc.text('Thailand\'s 4th Licensed Telecom Operator', margin, pageHeight - 25);

  // ============================================
  // PAGE 2: Why Choose Us
  // ============================================
  doc.addPage();
  addHeader(2, 5);

  let y = 35;

  // Section title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  setColor(darkText);
  doc.text('Why Choose Mobile11?', margin, y);

  y += 15;
  drawLine(y);
  y += 20;

  // Benefits list
  const benefits = [
    {
      title: 'Truly Unlimited Data',
      desc: 'No throttling, no data caps. Your teams stay connected without worrying about usage limits or overage charges.'
    },
    {
      title: '151 Country Coverage',
      desc: 'One solution for global operations. Coverage across all major business destinations worldwide.'
    },
    {
      title: '99.9% Uptime Guarantee',
      desc: 'Mission-critical reliability backed by our service level agreement and redundant network infrastructure.'
    },
    {
      title: '24/7 Priority Support',
      desc: 'Dedicated enterprise support team available around the clock for immediate assistance.'
    },
    {
      title: 'Instant Team Deployment',
      desc: 'Provision connectivity for entire teams in minutes with our centralized management dashboard.'
    },
    {
      title: 'Predictable Costs',
      desc: 'Fixed pricing with no surprise bills. Budget with confidence for your travel connectivity needs.'
    }
  ];

  benefits.forEach((benefit, i) => {
    // Number circle
    setFillColor(emerald);
    doc.circle(margin + 6, y + 2, 6, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(white);
    doc.text(String(i + 1), margin + 6, y + 5, { align: 'center' });

    // Title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    setColor(darkText);
    doc.text(benefit.title, margin + 18, y + 4);

    // Description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setColor(grayText);
    const lines = doc.splitTextToSize(benefit.desc, contentWidth - 20);
    doc.text(lines, margin + 18, y + 12);

    y += 35;
  });

  addFooter();

  // ============================================
  // PAGE 3: Solution Features
  // ============================================
  doc.addPage();
  addHeader(3, 5);

  y = 35;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  setColor(darkText);
  doc.text('Solution Features', margin, y);

  y += 15;
  drawLine(y);
  y += 20;

  // Features in two columns
  const features = [
    'Centralized Dashboard',
    'Real-time Usage Tracking',
    'Bulk eSIM Provisioning',
    'Team Management Tools',
    'Usage Analytics & Reports',
    'Cost Allocation by Team',
    'Instant eSIM Activation',
    'QR Code Distribution',
  ];

  const colWidth = contentWidth / 2;
  features.forEach((feature, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + (col * colWidth);
    const yPos = y + (row * 18);

    // Checkmark
    setFillColor(emerald);
    doc.circle(x + 4, yPos, 4, 'F');
    doc.setFontSize(10);
    setColor(white);
    doc.text('✓', x + 4, yPos + 3, { align: 'center' });

    // Feature text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    setColor(darkText);
    doc.text(feature, x + 14, yPos + 3);
  });

  y += 80;
  drawLine(y);
  y += 15;

  // Plan types section
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setColor(darkText);
  doc.text('Flexible Plan Options', margin, y);

  y += 15;

  const plans = [
    {
      name: 'Day Pass',
      desc: 'Daily high-speed allowance with backup connectivity. Perfect for cost-conscious teams.',
      speed: 'Daily Reset'
    },
    {
      name: 'Max Speed',
      desc: 'High-speed data upfront, then reduced speeds. Great balance of speed and value.',
      speed: 'FUP 384 Kbps'
    },
    {
      name: 'Limitless',
      desc: 'Maximum speeds with zero throttling. Ideal for executives and power users.',
      speed: 'Full 5G Speed'
    }
  ];

  const planBoxWidth = (contentWidth - 10) / 3;
  plans.forEach((plan, i) => {
    const x = margin + (i * (planBoxWidth + 5));
    
    // Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, planBoxWidth, 55, 2, 2, 'S');

    // Plan name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setColor(emerald);
    doc.text(plan.name, x + planBoxWidth / 2, y + 12, { align: 'center' });

    // Speed badge
    doc.setFontSize(8);
    setColor(grayText);
    doc.text(plan.speed, x + planBoxWidth / 2, y + 20, { align: 'center' });

    // Description
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(darkText);
    const descLines = doc.splitTextToSize(plan.desc, planBoxWidth - 8);
    doc.text(descLines, x + 4, y + 32);
  });

  addFooter();

  // ============================================
  // PAGE 4: Use Cases
  // ============================================
  doc.addPage();
  addHeader(4, 5);

  y = 35;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  setColor(darkText);
  doc.text('Use Cases', margin, y);

  y += 15;
  drawLine(y);
  y += 20;

  const useCases = [
    {
      title: 'Executive Travel',
      desc: 'Keep leadership connected with premium unlimited connectivity. Seamless video calls, secure email access, and reliable connectivity across any destination.',
      icon: '✈️'
    },
    {
      title: 'Field Sales Teams',
      desc: 'Empower your sales force with instant access to CRM, presentations, and real-time communication tools wherever deals are being made.',
      icon: '💼'
    },
    {
      title: 'Remote Workforce',
      desc: 'Support distributed teams with consistent, high-quality connectivity. Work from anywhere without compromising on speed or reliability.',
      icon: '🌐'
    },
    {
      title: 'Events & Media',
      desc: 'Live streaming, real-time uploads, and instant content sharing for media production teams and event coverage.',
      icon: '🎬'
    }
  ];

  const caseBoxWidth = (contentWidth - 10) / 2;
  const caseBoxHeight = 70;

  useCases.forEach((useCase, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + (col * (caseBoxWidth + 10));
    const yPos = y + (row * (caseBoxHeight + 10));

    // Box with emerald border
    doc.setDrawColor(emerald.r, emerald.g, emerald.b);
    doc.setLineWidth(1);
    doc.roundedRect(x, yPos, caseBoxWidth, caseBoxHeight, 3, 3, 'S');

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setColor(darkText);
    doc.text(useCase.title, x + 8, yPos + 15);

    // Description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setColor(grayText);
    const caseLines = doc.splitTextToSize(useCase.desc, caseBoxWidth - 16);
    doc.text(caseLines, x + 8, yPos + 28);
  });

  y += (caseBoxHeight * 2) + 30;

  // Testimonial
  drawLine(y);
  y += 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  setColor(darkText);
  const quote = '"Mobile11 transformed how our global team stays connected. No more hunting for local SIMs or worrying about data limits during critical business trips."';
  const quoteLines = doc.splitTextToSize(quote, contentWidth - 20);
  doc.text(quoteLines, margin + 10, y);

  y += 25;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(emerald);
  doc.text('— IT Director, Fortune 500 Company', margin + 10, y);

  addFooter();

  // ============================================
  // PAGE 5: Contact
  // ============================================
  doc.addPage();
  addHeader(5, 5);

  y = 50;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  setColor(darkText);
  doc.text('Get Started Today', pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  setColor(grayText);
  doc.text('Connect with our enterprise team to discuss your needs', pageWidth / 2, y, { align: 'center' });

  y += 40;

  // Contact info box
  const boxX = margin + 20;
  const boxWidth = contentWidth - 40;
  
  setFillColor({ r: 245, g: 245, b: 245 });
  doc.roundedRect(boxX, y, boxWidth, 80, 5, 5, 'F');

  y += 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(darkText);

  const contactInfo = [
    { label: 'Email:', value: 'support@mobile11.com' },
    { label: 'Website:', value: 'www.mobile11.com/business' },
    { label: 'Location:', value: 'Bangkok, Thailand' },
  ];

  contactInfo.forEach((info, i) => {
    doc.setFont('helvetica', 'bold');
    setColor(grayText);
    doc.text(info.label, boxX + 20, y + (i * 18));
    
    doc.setFont('helvetica', 'normal');
    setColor(darkText);
    doc.text(info.value, boxX + 60, y + (i * 18));
  });

  y += 100;

  // CTA Button
  const btnWidth = 100;
  const btnHeight = 14;
  const btnX = (pageWidth - btnWidth) / 2;

  setFillColor(emerald);
  doc.roundedRect(btnX, y, btnWidth, btnHeight, 4, 4, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(white);
  doc.text('Schedule a Consultation', pageWidth / 2, y + 9, { align: 'center' });

  y += 35;

  // Bottom text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor(grayText);
  doc.text('Trusted by 4,500+ enterprises worldwide', pageWidth / 2, y, { align: 'center' });

  addFooter();

  // Save the PDF
  doc.save('Mobile11-Enterprise-Brochure.pdf');
};
