// Professional PDF invoice generator with HAVANAT branding
import { formatNaira } from './formatters';
import { BRAND } from '@/config/brand';

export interface InvoiceOrder {
  id: number | string;
  orderNumber?: string;
  date: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export async function generateInvoicePDF(order: InvoiceOrder): Promise<void> {
  // Dynamically import jsPDF to avoid bundle bloat
  const { default: jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  
  let y = 20;
  
  // Header - Brand name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND.name.toUpperCase(), leftMargin, y);
  y += 6;
  
  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(BRAND.tagline, leftMargin, y);
  doc.setTextColor(0, 0, 0);
  y += 15;
  
  // Horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 10;
  
  // Invoice title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', leftMargin, y);
  y += 10;
  
  // Order details - Left column
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order #${order.orderNumber || order.id}`, leftMargin, y);
  y += 5;
  doc.text(`Date: ${new Date(order.date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}`, leftMargin, y);
  y += 5;
  doc.text(`Status: ${order.status.replace('_', ' ').toUpperCase()}`, leftMargin, y);
  y += 10;
  
  // Customer info
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', leftMargin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, leftMargin, y);
  y += 5;
  doc.text(order.customerEmail, leftMargin, y);
  y += 5;
  if (order.customerPhone) {
    doc.text(order.customerPhone, leftMargin, y);
    y += 5;
  }
  
  // Shipping address
  if (order.shippingAddress) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO:', leftMargin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const addr = order.shippingAddress;
    doc.text(`${addr.street}`, leftMargin, y);
    y += 5;
    doc.text(`${addr.city}, ${addr.state} ${addr.postalCode}`, leftMargin, y);
    y += 5;
  }
  
  y += 10;
  
  // Items table header
  doc.setFillColor(0, 0, 0);
  doc.rect(leftMargin, y - 5, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ITEM', leftMargin + 2, y);
  doc.text('SIZE', leftMargin + 90, y);
  doc.text('QTY', leftMargin + 115, y);
  doc.text('PRICE', leftMargin + 135, y);
  doc.text('TOTAL', leftMargin + 160, y);
  y += 8;
  
  // Items
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  for (const item of order.items) {
    // Check if we need a new page
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
    
    // Item name (wrap if too long)
    const itemName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
    doc.text(itemName, leftMargin + 2, y);
    doc.text(item.size, leftMargin + 90, y);
    doc.text(String(item.quantity), leftMargin + 115, y);
    doc.text(formatNaira(item.price), leftMargin + 135, y);
    doc.text(formatNaira(item.price * item.quantity), leftMargin + 160, y);
    y += 6;
  }
  
  y += 5;
  
  // Horizontal line before totals
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 8;
  
  // Totals section
  const totalsX = leftMargin + 120;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, y);
  doc.text(formatNaira(order.subtotal), totalsX + 40, y, { align: 'right' });
  y += 6;
  
  doc.text('Delivery Fee:', totalsX, y);
  doc.text(formatNaira(order.deliveryFee), totalsX + 40, y, { align: 'right' });
  y += 8;
  
  // Total in bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsX, y);
  doc.text(formatNaira(order.total), totalsX + 40, y, { align: 'right' });
  y += 10;
  
  // Footer
  y = pageHeight - 30;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 6;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', leftMargin, y);
  y += 4;
  doc.text(`${BRAND.name} • Premium Bespoke Tailoring • Nigeria`, leftMargin, y);
  y += 4;
  doc.text('For inquiries, contact us at hello@havanat.store', leftMargin, y);
  
  // Save the PDF
  doc.save(`HAVANAT-Invoice-${order.orderNumber || order.id}.pdf`);
}
