import jsPDF from 'jspdf';
import { Transaction, Currency, ExchangeRates } from '@/types/finance';
import { formatCurrency, convertCurrency } from './currency';
import {
  calculateTotalRevenue,
  calculateDailyRevenue,
  calculateAverageRevenue,
  calculateAverageTicket,
  calculateBestDay,
  calculateWorstDay,
  calculateBestDayOfWeek,
  calculateCategoryDistribution,
  DailyPoint,
} from './metrics';

export interface GeneratePDFOptions {
  transactions: Transaction[];
  previousTransactions: Transaction[];
  targetCurrency: Currency;
  rates: ExchangeRates;
  periodLabel: string;
  startDate: string;
  endDate: string;
}

/**
 * Generates high-resolution data URL of the official NIVRA brand logo for PDF embedding
 */
function getNivraPdfLogoDataUrl(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 640, 160);

    // 1. Draw Symbol (Ascending N Monogram)
    ctx.save();
    ctx.translate(10, 12);
    ctx.scale(1.1, 1.1);

    const grad = ctx.createLinearGradient(10, 90, 150, 10);
    grad.addColorStop(0, '#8534F5');
    grad.addColorStop(0.6, '#9B4DFF');
    grad.addColorStop(1, '#B377FF');
    ctx.fillStyle = grad;

    // Dynamic ascending N ribbon
    ctx.fill(new Path2D('M 12 92 L 48 24 L 72 24 L 98 72 L 98 52 L 126 12 L 148 4 L 122 52 L 102 92 L 78 92 L 52 48 L 34 84 Z'));
    // Acceleration stripe 1
    ctx.fill(new Path2D('M 72 44 L 84 24 L 94 24 L 82 44 Z'));
    // Acceleration stripe 2
    ctx.fill(new Path2D('M 88 56 L 104 28 L 114 28 L 98 56 Z'));
    ctx.restore();

    // 2. Draw Wordmark (N I V R Ʌ)
    ctx.save();
    ctx.translate(195, 30);
    ctx.scale(1.22, 1.22);
    ctx.fillStyle = '#F0E9FF';

    // N
    ctx.fill(new Path2D('M 10 50 L 10 10 L 22 10 L 46 38 L 46 10 L 58 10 L 58 50 L 46 50 L 22 22 L 22 50 Z'));
    // I
    ctx.fill(new Path2D('M 82 10 L 94 10 L 94 50 L 82 50 Z'));
    // V
    ctx.fill(new Path2D('M 118 10 L 132 10 L 146 42 L 160 10 L 174 10 L 153 50 L 139 50 Z'));
    // R
    ctx.fill(new Path2D('M 196 10 L 226 10 C 238 10 246 16 246 25 C 246 33 239 38 228 39 L 246 50 L 232 50 L 216 40 L 208 40 L 208 50 L 196 50 Z M 208 20 L 208 31 L 224 31 C 230 31 234 29 234 25.5 C 234 22 230 20 224 20 Z'));
    // Ʌ (open geometric apex)
    ctx.fill(new Path2D('M 288 10 L 302 10 L 324 50 L 310 50 L 295 22 L 280 50 L 266 50 Z'));
    ctx.restore();

    // 3. Subtitle
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillStyle = '#858593';
    ctx.letterSpacing = '4px';
    ctx.fillText('REVENUE INTELLIGENCE', 208, 125);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao gerar logo para PDF:', err);
    return null;
  }
}

/**
 * Generates compact symbol icon data URL for running PDF headers
 */
function getNivraPdfSymbolDataUrl(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 160, 120);

    const grad = ctx.createLinearGradient(10, 90, 150, 10);
    grad.addColorStop(0, '#8534F5');
    grad.addColorStop(0.6, '#9B4DFF');
    grad.addColorStop(1, '#B377FF');
    ctx.fillStyle = grad;

    ctx.fill(new Path2D('M 12 92 L 48 24 L 72 24 L 98 72 L 98 52 L 126 12 L 148 4 L 122 52 L 102 92 L 78 92 L 52 48 L 34 84 Z'));
    ctx.fill(new Path2D('M 72 44 L 84 24 L 94 24 L 82 44 Z'));
    ctx.fill(new Path2D('M 88 56 L 104 28 L 114 28 L 98 56 Z'));

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao gerar símbolo para PDF:', err);
    return null;
  }
}

export function generatePDF(options: GeneratePDFOptions): void {

  const {
    transactions,
    previousTransactions,
    targetCurrency,
    rates,
    periodLabel,
    startDate,
    endDate,
  } = options;

  // 1. Calculations & Metrics
  const currentTotal = calculateTotalRevenue(transactions, targetCurrency, rates);
  const previousTotal = calculateTotalRevenue(previousTransactions, targetCurrency, rates);
  const dailyPoints: DailyPoint[] = calculateDailyRevenue(
    transactions,
    startDate,
    endDate,
    targetCurrency,
    rates
  );

  const daysCount = dailyPoints.length || 1;
  const avgDaily = calculateAverageRevenue(currentTotal, daysCount);
  const avgTicket = calculateAverageTicket(currentTotal, transactions.length);
  const bestDay = calculateBestDay(dailyPoints);
  const worstDay = calculateWorstDay(dailyPoints);
  const bestDayOfWeek = calculateBestDayOfWeek(transactions, targetCurrency, rates);
  const categories = calculateCategoryDistribution(transactions, targetCurrency, rates);

  // Active vs Inactive days
  const activeDays = dailyPoints.filter((p) => p.amount > 0);
  const activeDaysCount = activeDays.length;
  const inactiveDaysCount = Math.max(0, daysCount - activeDaysCount);
  const activeDaysPct = Math.round((activeDaysCount / Math.max(1, daysCount)) * 100);
  const inactiveDaysPct = 100 - activeDaysPct;
  const avgActiveDay = activeDaysCount > 0 ? currentTotal / activeDaysCount : 0;

  // Growth comparison (Strictly no fake +100% when previous is 0 or absent)
  const hasValidComparison = previousTransactions.length > 0 && previousTotal > 0;
  let growthPercentage = 0;
  let isPositiveGrowth = true;
  if (hasValidComparison) {
    const diff = currentTotal - previousTotal;
    growthPercentage = Math.round((diff / previousTotal) * 1000) / 10;
    isPositiveGrowth = diff >= 0;
  }

  // Single transaction bounds
  const convertedTxList = transactions.map((t) => ({
    ...t,
    convVal: convertCurrency(t.amount, t.currency, targetCurrency, rates),
  }));
  convertedTxList.sort((a, b) => b.convVal - a.convVal);
  const highestTx = convertedTxList[0] || null;
  const lowestTx = convertedTxList[convertedTxList.length - 1] || null;

  // Top category
  const topCategory = categories[0] || null;

  // Initialize jsPDF document (A4, portrait, mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174

  // Color constants
  const C_BG = [7, 8, 12] as const; // #07080C
  const C_SURFACE = [14, 16, 24] as const; // #0E1018
  const C_SURFACE_ALT = [18, 20, 30] as const; // #12141E
  const C_BORDER = [36, 40, 56] as const; // #242838
  const C_BORDER_SUBTLE = [26, 30, 44] as const;
  const C_PURPLE = [155, 77, 255] as const; // #9B4DFF
  const C_PURPLE_LIGHT = [198, 155, 255] as const; // #C69BFF
  const C_TEXT_PRIMARY = [240, 233, 255] as const; // #F0E9FF
  const C_TEXT_SECONDARY = [133, 133, 147] as const; // #858593
  const C_TEXT_MUTED = [90, 92, 110] as const; // #5A5C6E
  const C_GREEN = [37, 211, 154] as const; // #25D39A
  const C_RED = [255, 92, 115] as const; // #FF5C73

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  const generationDateShort = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date()).toUpperCase();

  // Helper: Fill page background
  const drawPageBackground = () => {
    doc.setFillColor(C_BG[0], C_BG[1], C_BG[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // Helper: Draw standard running header (Pages 2+)
  const drawPageHeader = (sectionCode: string, sectionTitle: string) => {
    // Brand symbol icon or top hairline accent line
    const symbolData = getNivraPdfSymbolDataUrl();
    if (symbolData) {
      doc.addImage(symbolData, 'PNG', margin, 9, 8, 6);
    } else {
      doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
      doc.rect(margin, 12, 12, 1.2, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
    doc.text('NIVRA REVENUE INTELLIGENCE', margin + (symbolData ? 10.5 : 15), 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    doc.text(`${sectionCode} · ${sectionTitle.toUpperCase()}`, pageWidth - margin, 13.5, { align: 'right' });

    // Hairline divider below header
    doc.setDrawColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, 17, pageWidth - margin, 17);
  };

  // Helper: Draw section title on content pages
  const drawSectionTitle = (code: string, title: string, subtitle: string, yStart: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
    doc.text(code, margin, yStart);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
    doc.text(title, margin, yStart + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    doc.text(subtitle, margin, yStart + 12);
  };

  // =========================================================================
  // PÁGINA 1 — CAPA / EXECUTIVE OVERVIEW
  // =========================================================================
  drawPageBackground();

  // Official NIVRA Logo (Vector Monogram + Wordmark + Tagline)
  const logoData = getNivraPdfLogoDataUrl();
  if (logoData) {
    // Render official high-res brand lockup
    doc.addImage(logoData, 'PNG', margin, 18, 64, 16);
  } else {
    // Fallback vector bar & text
    doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
    doc.rect(margin, 20, 24, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
    doc.text('NIVRA', margin, 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    doc.text('REVENUE INTELLIGENCE', margin, 37);
  }


  // Document Title Kicker
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
  doc.text('RELATÓRIO FINANCEIRO EXECUTIVO', margin, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text(periodLabel, margin, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  doc.text(`${startDate} — ${endDate}`, margin, 66);
  doc.text(`Moeda Base: ${targetCurrency}`, margin, 71.5);

  // Technical Metadata Badge
  const metaBoxY = 80;
  doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
  doc.roundedRect(margin, metaBoxY, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, metaBoxY, contentWidth, 12, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
  doc.text('LOCAL LEDGER', margin + 6, metaBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  doc.text('·  DADOS PRIVADOS LOCAIS  ·  GERADO EM ' + generationDateShort, margin + 34, metaBoxY + 7);

  // Huge Floating Glass Hero Revenue Plate
  const heroY = 104;
  const heroHeight = 56;
  doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
  doc.roundedRect(margin, heroY, contentWidth, heroHeight, 2.5, 2.5, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, heroY, contentWidth, heroHeight, 2.5, 2.5, 'D');

  // Specular top hairline reflection on hero
  doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
  doc.rect(margin + 20, heroY, contentWidth - 40, 0.8, 'F');

  // Hero Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  doc.text('FATURAMENTO CONSOLIDADO DO PERÍODO', margin + 10, heroY + 12);

  // Big Formatted Revenue Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  const formattedCurrentTotal = formatCurrency(currentTotal, targetCurrency);
  doc.text(formattedCurrentTotal, margin + 10, heroY + 28);

  // Comparison Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  if (hasValidComparison) {
    if (isPositiveGrowth) {
      doc.setTextColor(C_GREEN[0], C_GREEN[1], C_GREEN[2]);
      doc.text(`+${growthPercentage}% vs período anterior (${formatCurrency(previousTotal, targetCurrency)})`, margin + 10, heroY + 38);
    } else {
      doc.setTextColor(C_RED[0], C_RED[1], C_RED[2]);
      doc.text(`${growthPercentage}% vs período anterior (${formatCurrency(previousTotal, targetCurrency)})`, margin + 10, heroY + 38);
    }
  } else {
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
    doc.text('Base inicial (sem ciclo anterior equivalente registrado)', margin + 10, heroY + 38);
  }

  // Hero Sub-row (Lançamentos · Média Diária · Ticket Médio)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  const heroSubText = `${transactions.length} ${transactions.length === 1 ? 'lançamento' : 'lançamentos'}  ·  ${formatCurrency(avgDaily, targetCurrency)} média diária  ·  ${formatCurrency(avgTicket, targetCurrency)} ticket médio`;
  doc.text(heroSubText, margin + 10, heroY + 47);

  // 3 Primary Metric Pillar Blocks
  const colY = 172;
  const colWidth = (contentWidth - 8) / 3;
  const colHeight = 36;

  const pillarCards = [
    {
      kicker: 'ATIVIDADE OPERACIONAL',
      val: `${transactions.length}`,
      unit: transactions.length === 1 ? 'lançamento registrado' : 'lançamentos registrados',
      note: `${activeDaysCount} de ${daysCount} dias com entrada`,
    },
    {
      kicker: 'MÉDIA DIÁRIA REGISTRADA',
      val: formatCurrency(avgDaily, targetCurrency),
      unit: 'por dia no intervalo',
      note: `Base cronológica de ${daysCount} dias`,
    },
    {
      kicker: 'TICKET MÉDIO UNITÁRIO',
      val: formatCurrency(avgTicket, targetCurrency),
      unit: 'por transação faturada',
      note: highestTx ? `Maior: ${formatCurrency(highestTx.convVal, targetCurrency)}` : 'Sem lançamentos',
    },
  ];

  pillarCards.forEach((card, idx) => {
    const colX = margin + idx * (colWidth + 4);
    doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
    doc.roundedRect(colX, colY, colWidth, colHeight, 2, 2, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(colX, colY, colWidth, colHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
    doc.text(card.kicker, colX + 5, colY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
    doc.text(card.val, colX + 5, colY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    doc.text(card.unit, colX + 5, colY + 24);
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
    doc.text(card.note, colX + 5, colY + 30);
  });

  // Executive Scope Statement Box on Cover
  const statementY = 220;
  doc.setFillColor(C_SURFACE_ALT[0], C_SURFACE_ALT[1], C_SURFACE_ALT[2]);
  doc.roundedRect(margin, statementY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, statementY, contentWidth, 34, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text('OBJETIVO & ESCOPO DA AUDITORIA', margin + 6, statementY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  const statementText =
    `Este relatório executivo consolida o desempenho financeiro de faturamento apurado entre ${startDate} e ${endDate}, totalizando ${daysCount} dias corridos. Todos os dados foram processados com rigor contábil local a partir dos registros soberanos da ferramenta NIVRA. As páginas a seguir detalham a curva de evolução diária, o mix de faturamento por categoria, o mapa de frequência de atividade e o extrato integral de lançamentos.`;
  const splitStatement = doc.splitTextToSize(statementText, contentWidth - 12);
  doc.text(splitStatement, margin + 6, statementY + 14);

  // Cover Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
  doc.text('NIVRA REVENUE INTELLIGENCE  ·  DOCUMENTO CONFIDENCIAL', margin, 280);
  doc.text(`PÁGINA 1`, pageWidth - margin, 280, { align: 'right' });

  // =========================================================================
  // PÁGINA 2 — PERFORMANCE (GRÁFICO GRANDE & EVOLUÇÃO)
  // =========================================================================
  doc.addPage();
  drawPageBackground();
  drawPageHeader('01', 'PERFORMANCE');

  drawSectionTitle(
    '01 / PERFORMANCE',
    'Como o faturamento se comportou no período',
    'Curva de evolução diária contínua, sazonalidade e identificação de picos de receita.',
    28
  );

  // Large Chart Container Frame
  const chartBoxY = 48;
  const chartBoxHeight = 104;
  doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
  doc.roundedRect(margin, chartBoxY, contentWidth, chartBoxHeight, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, chartBoxY, contentWidth, chartBoxHeight, 2, 2, 'D');

  // Chart Header inside box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
  doc.text('EVOLUÇÃO DIÁRIA DE FATURAMENTO', margin + 6, chartBoxY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  doc.text(`${daysCount} dias analisados (${startDate} a ${endDate})`, pageWidth - margin - 6, chartBoxY + 8, { align: 'right' });

  // Draw Vector Chart if we have dailyPoints
  const chartInnerX = margin + 18;
  const chartInnerY = chartBoxY + 18;
  const chartInnerWidth = contentWidth - 24;
  const chartInnerHeight = 64;

  const maxVal = Math.max(...dailyPoints.map((d) => d.amount), 10);
  const power = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const yAxisMax = Math.max(Math.ceil(maxVal / power) * power, 10);

  // Y Axis Gridlines (4 levels: 0%, 33%, 66%, 100%)
  const yTiers = [1, 0.66, 0.33, 0];
  yTiers.forEach((tier) => {
    const yPos = chartInnerY + chartInnerHeight * (1 - tier);
    doc.setDrawColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
    doc.setLineWidth(0.2);
    doc.line(chartInnerX, yPos, chartInnerX + chartInnerWidth, yPos);

    // Y Axis label
    const valAtTier = yAxisMax * tier;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
    const labelStr = formatCurrency(valAtTier, targetCurrency).split(',')[0];
    doc.text(labelStr, chartInnerX - 2, yPos + 2, { align: 'right' });
  });

  // Calculate coordinates for points
  const coords = dailyPoints.map((pt, i) => {
    const x = chartInnerX + (i / Math.max(1, dailyPoints.length - 1)) * chartInnerWidth;
    const y = chartInnerY + chartInnerHeight - (pt.amount / yAxisMax) * chartInnerHeight;
    return { x, y, pt, index: i };
  });

  if (dailyPoints.length > 1) {
    // Fill Area under curve using subtle fill
    // In jsPDF, area can be drawn by lines
    doc.setDrawColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
    doc.setLineWidth(0.6);

    // Draw connecting polyline
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      doc.line(p1.x, p1.y, p2.x, p2.y);
    }

    // Draw point markers on days with revenue
    coords.forEach((c) => {
      if (c.pt.amount > 0) {
        // Outer glow circle
        doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
        doc.circle(c.x, c.y, 1.4, 'F');

        // Inner white dot
        doc.setFillColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
        doc.circle(c.x, c.y, 0.7, 'F');
      }
    });

    // Best Day callout pin if exists
    if (bestDay && bestDay.amount > 0) {
      const bestCoord = coords.find((c) => c.pt.date === bestDay.date);
      if (bestCoord) {
        const pinY = Math.max(chartInnerY - 2, bestCoord.y - 7);
        doc.setFillColor(C_SURFACE_ALT[0], C_SURFACE_ALT[1], C_SURFACE_ALT[2]);
        doc.roundedRect(bestCoord.x - 14, pinY, 28, 5.5, 1, 1, 'F');
        doc.setDrawColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(bestCoord.x - 14, pinY, 28, 5.5, 1, 1, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
        doc.text(`PICO: ${formatCurrency(bestDay.amount, targetCurrency)}`, bestCoord.x, pinY + 3.8, { align: 'center' });
      }
    }
  }

  // X Axis Date Labels (sampled up to 7 labels)
  const sampleStep = Math.max(1, Math.floor(dailyPoints.length / 6));
  const xIndices = [];
  for (let i = 0; i < dailyPoints.length; i += sampleStep) {
    xIndices.push(i);
  }
  if (xIndices[xIndices.length - 1] !== dailyPoints.length - 1) {
    xIndices.push(dailyPoints.length - 1);
  }

  xIndices.forEach((idx) => {
    const c = coords[idx];
    if (c) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
      doc.text(c.pt.label.toUpperCase(), c.x, chartInnerY + chartInnerHeight + 7, { align: 'center' });
    }
  });

  // 4 Metrics Below Chart
  const perfCardsY = 160;
  const perfCardW = (contentWidth - 9) / 4;
  const perfCardH = 26;

  const perfCards = [
    {
      label: 'TOTAL DO PERÍODO',
      val: formatCurrency(currentTotal, targetCurrency),
      sub: `${transactions.length} entradas registradas`,
    },
    {
      label: 'MÉDIA DIÁRIA',
      val: formatCurrency(avgDaily, targetCurrency),
      sub: `Em ${daysCount} dias corridos`,
    },
    {
      label: 'MELHOR DIA',
      val: bestDay ? formatCurrency(bestDay.amount, targetCurrency) : '—',
      sub: bestDay ? bestDay.date : 'Nenhum registro',
    },
    {
      label: 'MENOR DIA ATIVO',
      val: worstDay && worstDay.amount > 0 ? formatCurrency(worstDay.amount, targetCurrency) : '—',
      sub: worstDay ? worstDay.date : 'Nenhum registro',
    },
  ];

  perfCards.forEach((c, idx) => {
    const cX = margin + idx * (perfCardW + 3);
    doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
    doc.roundedRect(cX, perfCardsY, perfCardW, perfCardH, 1.5, 1.5, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cX, perfCardsY, perfCardW, perfCardH, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
    doc.text(c.label, cX + 4, perfCardsY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
    doc.text(c.val, cX + 4, perfCardsY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    doc.text(c.sub, cX + 4, perfCardsY + 21);
  });

  // Textual Performance Analysis Box (Data-grounded)
  const analysisY = 196;
  doc.setFillColor(C_SURFACE_ALT[0], C_SURFACE_ALT[1], C_SURFACE_ALT[2]);
  doc.roundedRect(margin, analysisY, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, analysisY, contentWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text('DIAGNÓSTICO ANALÍTICO DA PERFORMANCE TEMPORAL', margin + 6, analysisY + 8);

  // Generate factual narrative
  let performanceNarrative = '';
  if (currentTotal <= 0) {
    performanceNarrative = `Não foram computados lançamentos financeiros no intervalo selecionado (${startDate} a ${endDate}). O gráfico e os indicadores refletem base neutra sem entradas registradas.`;
  } else if (bestDay && bestDay.amount / currentTotal >= 0.7) {
    const concentrationPct = Math.round((bestDay.amount / currentTotal) * 100);
    performanceNarrative = `O período apresentou alta concentração em datas pontuais: o pico em ${bestDay.date} representou ${concentrationPct}% de todo o faturamento apurado (${formatCurrency(bestDay.amount, targetCurrency)}). Os demais recebimentos foram esparsos, caracterizando um padrão de grandes entregas ou fechamentos concentrados, com média de ${formatCurrency(avgDaily, targetCurrency)} por dia corrido.`;
  } else if (bestDay) {
    performanceNarrative = `A receita distribuiu-se ao longo do intervalo de ${daysCount} dias, registrando o ponto culminante em ${bestDay.date} (${formatCurrency(bestDay.amount, targetCurrency)}). Ao todo, ${activeDaysCount} dias tiveram faturamento efetivo, resultando em uma média de ${formatCurrency(avgActiveDay, targetCurrency)} nos dias de entrada e ${formatCurrency(avgDaily, targetCurrency)} na média diária global.`;
  } else {
    performanceNarrative = `Faturamento consolidado em ${formatCurrency(currentTotal, targetCurrency)} no intervalo analisado, distribuído em ${transactions.length} transações contábeis.`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  const splitPerfNarrative = doc.splitTextToSize(performanceNarrative, contentWidth - 12);
  doc.text(splitPerfNarrative, margin + 6, analysisY + 15);

  // Day of Week breakdown note
  if (bestDayOfWeek) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
    doc.text(`CONCENTRAÇÃO SEMANAL: ${bestDayOfWeek.dayName.toUpperCase()} registrou o maior volume agregado acumulado (${formatCurrency(bestDayOfWeek.total, targetCurrency)}).`, margin + 6, analysisY + 32);
  }

  // =========================================================================
  // PÁGINA 3 — COMPOSIÇÃO DO FATURAMENTO (REVENUE MIX)
  // =========================================================================
  doc.addPage();
  drawPageBackground();
  drawPageHeader('02', 'REVENUE MIX');

  drawSectionTitle(
    '02 / REVENUE MIX',
    'De onde veio o faturamento?',
    'Composição estrutural por linhas de projeto, serviços e categorias registradas no período.',
    28
  );

  // Big Proportional Stacked Bar
  const barY = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  doc.text('DISTRIBUIÇÃO PROPORCIONAL POR CATEGORIA', margin, barY);

  const barBoxY = barY + 4;
  const barHeight = 8;
  doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
  doc.roundedRect(margin, barBoxY, contentWidth, barHeight, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, barBoxY, contentWidth, barHeight, 2, 2, 'D');

  // Palette for category slices
  const catPalette = [
    [155, 77, 255], // Purple
    [37, 211, 154], // Green
    [198, 155, 255], // Lavender
    [59, 130, 246], // Blue
    [245, 158, 11], // Amber
    [236, 72, 153], // Pink
    [107, 114, 128], // Gray
  ] as const;

  let currentBarX = margin;
  categories.forEach((cat, idx) => {
    const sliceWidth = (cat.percentage / 100) * contentWidth;
    if (sliceWidth > 0.5) {
      const col = catPalette[idx % catPalette.length];
      doc.setFillColor(col[0], col[1], col[2]);
      doc.rect(currentBarX, barBoxY + 0.3, sliceWidth, barHeight - 0.6, 'F');
      currentBarX += sliceWidth;
    }
  });

  // Category Detailed Breakdown Table / Cards
  const catListY = 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text('DETALHAMENTO POR CATEGORIA', margin, catListY);

  let curCatY = catListY + 6;
  categories.slice(0, 7).forEach((cat, idx) => {
    const col = catPalette[idx % catPalette.length];

    doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
    doc.roundedRect(margin, curCatY, contentWidth, 18, 1.5, 1.5, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, curCatY, contentWidth, 18, 1.5, 1.5, 'D');

    // Color indicator pill
    doc.setFillColor(col[0], col[1], col[2]);
    doc.circle(margin + 5, curCatY + 6.5, 1.5, 'F');

    // Category Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
    doc.text(cat.category, margin + 10, curCatY + 8);

    // Percentage + Total on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(formatCurrency(cat.total, targetCurrency), pageWidth - margin - 6, curCatY + 8, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
    doc.text(`${cat.percentage}%`, pageWidth - margin - 48, curCatY + 8, { align: 'right' });

    // Mini proportional progress bar inside card
    const miniBarWidth = 90;
    const miniBarFill = (cat.percentage / 100) * miniBarWidth;
    doc.setFillColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
    doc.rect(margin + 10, curCatY + 11.5, miniBarWidth, 2, 'F');
    doc.setFillColor(col[0], col[1], col[2]);
    doc.rect(margin + 10, curCatY + 11.5, Math.max(1, miniBarFill), 2, 'F');

    // Details: transaction count & avg ticket in category
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    const catAvgTicket = cat.count > 0 ? cat.total / cat.count : 0;
    doc.text(
      `${cat.count} ${cat.count === 1 ? 'lançamento' : 'lançamentos'} · Ticket médio de ${formatCurrency(catAvgTicket, targetCurrency)}`,
      pageWidth - margin - 6,
      curCatY + 13.5,
      { align: 'right' }
    );

    curCatY += 21;
  });

  // Factual Revenue Mix Commentary Box
  const mixAnalysisY = Math.max(curCatY + 4, 215);
  doc.setFillColor(C_SURFACE_ALT[0], C_SURFACE_ALT[1], C_SURFACE_ALT[2]);
  doc.roundedRect(margin, mixAnalysisY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, mixAnalysisY, contentWidth, 34, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text('ANÁLISE DE CONCENTRAÇÃO E MIX DE RECEITA', margin + 6, mixAnalysisY + 8);

  let mixNarrative = '';
  if (categories.length === 0) {
    mixNarrative = 'Nenhuma movimentação por categoria registrada no período analisado.';
  } else if (topCategory && topCategory.percentage >= 70) {
    mixNarrative = `A categoria "${topCategory.category}" representou expressivos ${topCategory.percentage}% do faturamento apurado (${formatCurrency(topCategory.total, targetCurrency)} em ${topCategory.count} lançamentos), configurando forte dependência de receita em um único segmento. As demais ${categories.length - 1} categorias somadas responderam por ${(100 - topCategory.percentage).toFixed(1)}% do faturamento.`;
  } else if (topCategory) {
    mixNarrative = `A receita esteve equilibrada entre ${categories.length} categorias distintas. A maior participação individual coube a "${topCategory.category}", com ${topCategory.percentage}% do montante (${formatCurrency(topCategory.total, targetCurrency)}), demonstrando diversificação de fontes de faturamento no período.`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  const splitMix = doc.splitTextToSize(mixNarrative, contentWidth - 12);
  doc.text(splitMix, margin + 6, mixAnalysisY + 15);

  // =========================================================================
  // PÁGINA 4 — ATIVIDADE E CONSISTÊNCIA (ACTIVITY)
  // =========================================================================
  doc.addPage();
  drawPageBackground();
  drawPageHeader('03', 'ACTIVITY');

  drawSectionTitle(
    '03 / ACTIVITY',
    'Frequência e densidade dos lançamentos',
    'Consistência do fluxo de caixa, proporção de dias com entrada e mapa cronológico de atividade.',
    28
  );

  // 4 Top Activity KPI Cards
  const actKpiY = 48;
  const actKpiW = (contentWidth - 9) / 4;
  const actKpiH = 28;

  const actCards = [
    {
      kicker: 'DIAS COM FATURAMENTO',
      val: `${activeDaysCount} / ${daysCount}`,
      sub: `${activeDaysPct}% dos dias do ciclo`,
      highlight: true,
    },
    {
      kicker: 'DIAS SEM FATURAMENTO',
      val: `${inactiveDaysCount} / ${daysCount}`,
      sub: `${inactiveDaysPct}% sem entradas`,
      highlight: false,
    },
    {
      kicker: 'TOTAL DE LANÇAMENTOS',
      val: `${transactions.length}`,
      sub: `${(transactions.length / Math.max(1, daysCount)).toFixed(2)} por dia`,
      highlight: false,
    },
    {
      kicker: 'TICKET MÉDIO GLOBAL',
      val: formatCurrency(avgTicket, targetCurrency),
      sub: 'Média por operação',
      highlight: false,
    },
  ];

  actCards.forEach((c, idx) => {
    const cX = margin + idx * (actKpiW + 3);
    doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
    doc.roundedRect(cX, actKpiY, actKpiW, actKpiH, 1.5, 1.5, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cX, actKpiY, actKpiW, actKpiH, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(c.highlight ? C_PURPLE_LIGHT[0] : C_TEXT_SECONDARY[0], c.highlight ? C_PURPLE_LIGHT[1] : C_TEXT_SECONDARY[1], c.highlight ? C_PURPLE_LIGHT[2] : C_TEXT_SECONDARY[2]);
    doc.text(c.kicker, cX + 4, actKpiY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
    doc.text(c.val, cX + 4, actKpiY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    doc.text(c.sub, cX + 4, actKpiY + 22.5);
  });

  // Visual Calendar Activity Matrix (Dots ● vs ○)
  const calY = 84;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text('MAPA CRONOLÓGICO DE ATIVIDADE FINANCEIRA', margin, calY);

  const calBoxY = calY + 4;
  const calBoxH = 88;
  doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
  doc.roundedRect(margin, calBoxY, contentWidth, calBoxH, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, calBoxY, contentWidth, calBoxH, 2, 2, 'D');

  // Legend at top of calendar box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  // Legend Item 1: Active revenue day (purple circle dot)
  const leg1CircleX = margin + 6;
  const leg1TextX = margin + 10;
  doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
  doc.circle(leg1CircleX, calBoxY + 8, 1.4, 'F');
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  const activeLabel = 'Dia com Receita Registrada';
  doc.text(activeLabel, leg1TextX, calBoxY + 9.2);

  // Compute clean dynamic spacing to prevent any overlapping
  const leg1Width = doc.getTextWidth(activeLabel);
  const leg2CircleX = leg1TextX + leg1Width + 14;
  const leg2TextX = leg2CircleX + 4;

  // Legend Item 2: Inactive day (muted circle dot)
  doc.setFillColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
  doc.circle(leg2CircleX, calBoxY + 8, 1.4, 'F');
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  doc.text('Dia sem Registro Financeiro', leg2TextX, calBoxY + 9.2);

  // Grid layout for days (up to 31 or custom days, arranged in columns of weeks or grid items)
  const gridStartX = margin + 6;
  const gridStartY = calBoxY + 16;
  const itemsPerRow = 7;
  const chipWidth = (contentWidth - 12 - (itemsPerRow - 1) * 3) / itemsPerRow;
  const chipHeight = 11;

  dailyPoints.forEach((dp, i) => {
    const row = Math.floor(i / itemsPerRow);
    const col = i % itemsPerRow;
    const x = gridStartX + col * (chipWidth + 3);
    const y = gridStartY + row * (chipHeight + 3);

    // Limit rendering to fit inside box
    if (y + chipHeight <= calBoxY + calBoxH - 4) {
      const hasRevenue = dp.amount > 0;
      doc.setFillColor(hasRevenue ? C_SURFACE_ALT[0] : C_BG[0], hasRevenue ? C_SURFACE_ALT[1] : C_BG[1], hasRevenue ? C_SURFACE_ALT[2] : C_BG[2]);
      doc.roundedRect(x, y, chipWidth, chipHeight, 1, 1, 'F');

      if (hasRevenue) {
        doc.setDrawColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
        doc.setLineWidth(0.4);
      } else {
        doc.setDrawColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
        doc.setLineWidth(0.2);
      }
      doc.roundedRect(x, y, chipWidth, chipHeight, 1, 1, 'D');

      // Date number
      const dayNum = dp.date.split('-')[2] || `${i + 1}`;
      doc.setFont('helvetica', hasRevenue ? 'bold' : 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(hasRevenue ? C_TEXT_PRIMARY[0] : C_TEXT_MUTED[0], hasRevenue ? C_TEXT_PRIMARY[1] : C_TEXT_MUTED[1], hasRevenue ? C_TEXT_PRIMARY[2] : C_TEXT_MUTED[2]);
      doc.text(dayNum, x + 3, y + 4.5);

      // Status indicator dot or formatted snippet
      if (hasRevenue) {
        doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
        doc.circle(x + chipWidth - 3.5, y + 4, 1.2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
        const shortVal = dp.amount >= 1000 ? `${(dp.amount / 1000).toFixed(1)}k` : `${Math.round(dp.amount)}`;
        doc.text(shortVal, x + 3, y + 9);
      } else {
        doc.setFillColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
        doc.circle(x + chipWidth - 3.5, y + 4, 0.8, 'F');
      }
    }
  });

  // Activity Narrative Commentary
  const actNarrativeY = 186;
  doc.setFillColor(C_SURFACE_ALT[0], C_SURFACE_ALT[1], C_SURFACE_ALT[2]);
  doc.roundedRect(margin, actNarrativeY, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, actNarrativeY, contentWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text('OBSERVAÇÕES FACTUAIS DE CONSISTÊNCIA', margin + 6, actNarrativeY + 8);

  let actObservation = '';
  if (transactions.length === 0) {
    actObservation = 'Não constam eventos de faturamento registrados no intervalo cronológico selecionado.';
  } else if (activeDaysCount <= 2 && daysCount >= 14) {
    actObservation = `O faturamento esteve concentrado em apenas ${activeDaysCount} dos ${daysCount} dias analisados (${activeDaysPct}% de atividade). Esse padrão indica recebimentos por marcos contratuais ou entregas de lote (batch settlements), com intervalos vazios prolongados entre cada transação. Nos dias em que houve entrada, o faturamento médio alcançou ${formatCurrency(avgActiveDay, targetCurrency)}.`;
  } else {
    actObservation = `Foram contabilizados ${activeDaysCount} dias de entrada financeira ao longo do período de ${daysCount} dias, representando uma cadência ativa de ${activeDaysPct}%. A média diária apurada quando há entrada foi de ${formatCurrency(avgActiveDay, targetCurrency)}, ante ${formatCurrency(avgDaily, targetCurrency)} na média contínua de todo o ciclo.`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  const splitAct = doc.splitTextToSize(actObservation, contentWidth - 12);
  doc.text(splitAct, margin + 6, actNarrativeY + 15);

  // =========================================================================
  // PÁGINA 5 — INSIGHTS (04 / INSIGHTS)
  // =========================================================================
  doc.addPage();
  drawPageBackground();
  drawPageHeader('04', 'INSIGHTS');

  drawSectionTitle(
    '04 / INSIGHTS',
    'Principais observações do período',
    'Conclusões matemáticas e padrões identificados nos registros contábeis locais.',
    28
  );

  // Build curated 4-5 high quality deterministic insights
  interface PDFInsightItem {
    num: string;
    title: string;
    highlight: string;
    explanation: string;
  }
  const curatedInsights: PDFInsightItem[] = [];

  // Insight 1: Concentração de Categoria
  if (topCategory) {
    curatedInsights.push({
      num: '01',
      title: 'CONCENTRAÇÃO DE RECEITA',
      highlight: `${topCategory.percentage}%`,
      explanation: `A categoria "${topCategory.category}" representou ${topCategory.percentage}% do faturamento registrado no período, totalizando ${formatCurrency(topCategory.total, targetCurrency)} em ${topCategory.count} lançamentos.`,
    });
  }

  // Insight 2: Pico / Maior Dia
  if (bestDay && bestDay.amount > 0) {
    const peakPct = currentTotal > 0 ? Math.round((bestDay.amount / currentTotal) * 100) : 0;
    curatedInsights.push({
      num: '02',
      title: 'MAIOR PICO DIÁRIO',
      highlight: formatCurrency(bestDay.amount, targetCurrency),
      explanation: `O maior faturamento diário ocorreu em ${bestDay.date}, respondendo individualmente por ${peakPct}% de toda a receita apurada no período analisado.`,
    });
  }

  // Insight 3: Frequência Operacional
  curatedInsights.push({
    num: '03',
    title: 'FREQUÊNCIA DE FATURAMENTO',
    highlight: `${activeDaysPct}%`,
    explanation: `Houve movimentação financeira registrada em ${activeDaysCount} dos ${daysCount} dias analisados (${inactiveDaysCount} dias sem movimentação financeira direta).`,
  });

  // Insight 4: Ticket Médio
  curatedInsights.push({
    num: '04',
    title: 'TICKET MÉDIO UNITÁRIO',
    highlight: formatCurrency(avgTicket, targetCurrency),
    explanation: `Cada lançamento efetuado gerou, em média, ${formatCurrency(avgTicket, targetCurrency)}. O maior lançamento individual foi de ${highestTx ? formatCurrency(highestTx.convVal, targetCurrency) : '—'}.`,
  });

  // Insight 5: Comparação vs Período Anterior ou Dia da Semana
  if (hasValidComparison) {
    curatedInsights.push({
      num: '05',
      title: 'VARIAÇÃO COMPARATIVA',
      highlight: `${isPositiveGrowth ? '+' : ''}${growthPercentage}%`,
      explanation: `O faturamento registrado no período foi ${Math.abs(growthPercentage)}% ${isPositiveGrowth ? 'superior' : 'inferior'} em relação ao ciclo anterior (${formatCurrency(previousTotal, targetCurrency)}).`,
    });
  } else if (bestDayOfWeek) {
    curatedInsights.push({
      num: '05',
      title: 'PADRÃO DE DIA DA SEMANA',
      highlight: bestDayOfWeek.dayName.split('-')[0],
      explanation: `${bestDayOfWeek.dayName} registrou a maior soma de faturamento entre os dias da semana, acumulando ${formatCurrency(bestDayOfWeek.total, targetCurrency)}.`,
    });
  }

  // Render Insight Cards
  let insightCardY = 48;
  const insightCardH = 34;

  curatedInsights.forEach((ins) => {
    doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
    doc.roundedRect(margin, insightCardY, contentWidth, insightCardH, 2, 2, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, insightCardY, contentWidth, insightCardH, 2, 2, 'D');

    // Left accent bar
    doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
    doc.rect(margin, insightCardY + 4, 1.5, insightCardH - 8, 'F');

    // Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
    doc.text(ins.num, margin + 6, insightCardY + 9);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
    doc.text(ins.title, margin + 16, insightCardY + 9);

    // Highlight Big Value on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
    doc.text(ins.highlight, pageWidth - margin - 6, insightCardY + 11, { align: 'right' });

    // Explanation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
    const splitExplanation = doc.splitTextToSize(ins.explanation, contentWidth - 20);
    doc.text(splitExplanation, margin + 6, insightCardY + 17);

    insightCardY += insightCardH + 5;
  });

  // =========================================================================
  // PÁGINA 6+ — REGISTRO DOS LANÇAMENTOS (05 / LEDGER) & SOBRE O RELATÓRIO
  // =========================================================================
  doc.addPage();
  drawPageBackground();
  drawPageHeader('05', 'LEDGER');

  drawSectionTitle(
    '05 / LEDGER',
    'Registro dos lançamentos contábeis',
    'Auditoria individual de todos os recebimentos que compõem o faturamento apurado.',
    28
  );

  let ledgerY = 48;

  // Helper to draw Table Header
  const drawTableHeader = (y: number) => {
    doc.setFillColor(C_SURFACE_ALT[0], C_SURFACE_ALT[1], C_SURFACE_ALT[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 7, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);

    doc.text('DATA', margin + 3, y + 4.8);
    doc.text('DESCRIÇÃO', margin + 24, y + 4.8);
    doc.text('CATEGORIA', margin + 82, y + 4.8);
    doc.text('MOEDA ORIG.', margin + 118, y + 4.8);
    doc.text('VALOR ORIG.', margin + 144, y + 4.8, { align: 'right' });
    doc.text(`VALOR (${targetCurrency})`, pageWidth - margin - 3, y + 4.8, { align: 'right' });
  };

  drawTableHeader(ledgerY);
  ledgerY += 7;

  // Sorted transactions (date desc)
  const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (sortedTx.length === 0) {
    doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
    doc.rect(margin, ledgerY, contentWidth, 14, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
    doc.text('Nenhum lançamento registrado no período selecionado.', pageWidth / 2, ledgerY + 8.5, { align: 'center' });
    ledgerY += 18;
  } else {
    sortedTx.forEach((tx) => {
      // Check if row would overflow page
      if (ledgerY > 240) {
        doc.addPage();
        drawPageBackground();
        drawPageHeader('05', 'LEDGER (CONTINUAÇÃO)');
        ledgerY = 25;
        drawTableHeader(ledgerY);
        ledgerY += 7;
      }

      const convVal = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);

      doc.setFillColor(C_SURFACE[0], C_SURFACE[1], C_SURFACE[2]);
      doc.rect(margin, ledgerY, contentWidth, 8, 'F');

      // Hairline row bottom border
      doc.setDrawColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, ledgerY + 8, pageWidth - margin, ledgerY + 8);

      // Data values
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
      doc.text(tx.date, margin + 3, ledgerY + 5.2);

      // Description (truncated if needed)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
      const descTrunc = doc.splitTextToSize(tx.description || 'Lançamento sem descrição', 54)[0];
      doc.text(descTrunc, margin + 24, ledgerY + 5.2);

      // Category
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
      const catTrunc = doc.splitTextToSize(tx.category || 'Sem categoria', 32)[0];
      doc.text(catTrunc, margin + 82, ledgerY + 5.2);

      // Currency & Original Value
      doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
      doc.text(tx.currency, margin + 118, ledgerY + 5.2);
      doc.text(formatCurrency(tx.amount, tx.currency), margin + 144, ledgerY + 5.2, { align: 'right' });

      // Converted Target Value
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
      doc.text(formatCurrency(convVal, targetCurrency), pageWidth - margin - 3, ledgerY + 5.2, { align: 'right' });

      ledgerY += 8;
    });
  }

  // =========================================================================
  // SEÇÃO FINAL — SOBRE ESTE RELATÓRIO / METODOLOGIA
  // =========================================================================
  // Ensure enough room on current page or add new page
  if (ledgerY > 215) {
    doc.addPage();
    drawPageBackground();
    drawPageHeader('METODOLOGIA', 'SOBRE ESTE RELATÓRIO');
    ledgerY = 28;
  } else {
    ledgerY += 8;
  }

  const aboutBoxH = 46;
  doc.setFillColor(C_SURFACE_ALT[0], C_SURFACE_ALT[1], C_SURFACE_ALT[2]);
  doc.roundedRect(margin, ledgerY, contentWidth, aboutBoxH, 2, 2, 'F');
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, ledgerY, contentWidth, aboutBoxH, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
  doc.text('SOBRE ESTE RELATÓRIO & DECLARAÇÃO DE PRIVACIDADE', margin + 6, ledgerY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(C_TEXT_SECONDARY[0], C_TEXT_SECONDARY[1], C_TEXT_SECONDARY[2]);
  const privacyText =
    'Este documento foi emitido e processado integralmente pelo aplicativo NIVRA REVENUE. Todos os cálculos matemáticos e visualizações são derivados diretamente dos registros armazenados na base local do dispositivo do usuário. Nenhum dado financeiro ou informação de faturamento foi transmitido para servidores de terceiros ou nuvem remota.';
  const splitPrivacy = doc.splitTextToSize(privacyText, contentWidth - 12);
  doc.text(splitPrivacy, margin + 6, ledgerY + 14);

  // Technical Metadata Columns
  const metaLineY = ledgerY + 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
  doc.text('FONTE:', margin + 6, metaLineY);
  doc.text('MOEDA BASE:', margin + 46, metaLineY);
  doc.text('INTERVALO:', margin + 86, metaLineY);
  doc.text('DATA DE GERAÇÃO:', margin + 130, metaLineY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(C_TEXT_PRIMARY[0], C_TEXT_PRIMARY[1], C_TEXT_PRIMARY[2]);
  doc.text('Local Ledger (NIVRA)', margin + 6, metaLineY + 5);
  doc.text(targetCurrency, margin + 46, metaLineY + 5);
  doc.text(`${startDate} a ${endDate}`, margin + 86, metaLineY + 5);
  doc.text(generationDateShort, margin + 130, metaLineY + 5);

  // =========================================================================
  // FOOTER & PAGE NUMBERING PASS (PÁGINA X DE Y)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Skip running footer line on cover page (it has custom footer)
    if (p > 1) {
      doc.setDrawColor(C_BORDER_SUBTLE[0], C_BORDER_SUBTLE[1], C_BORDER_SUBTLE[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, 282, pageWidth - margin, 282);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
      doc.text('NIVRA REVENUE INTELLIGENCE  ·  LOCAL LEDGER  ·  PRIVATE DATA', margin, 287);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(C_PURPLE_LIGHT[0], C_PURPLE_LIGHT[1], C_PURPLE_LIGHT[2]);
      doc.text(`PÁGINA ${p} DE ${totalPages}`, pageWidth - margin, 287, { align: 'right' });
    }
  }

  // Save the professional PDF
  const filename = `relatorio-financeiro-nivra-${startDate}-a-${endDate}.pdf`;
  doc.save(filename);
}
