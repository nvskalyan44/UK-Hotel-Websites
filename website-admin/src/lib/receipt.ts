// Browser-print receipt generator.
// Opens a print-optimised window sized for an 80mm thermal roll and triggers
// the native print dialog — works with any printer the machine has installed
// (thermal, inkjet, or "Save as PDF"), no hardware driver integration needed.

export interface ReceiptItem { name: string; qty: number; price: number; }

export interface ReceiptData {
  orderId: string;
  orderType: string;
  paymentMethod: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  table?: string;
  customerName?: string;
  placedAt: string; // ISO
}

const RESTAURANT = {
  name: "Abhiruchi",
  tagline: "Authentic South Indian · Sheffield",
  address: "142 Ecclesall Road, Sheffield S11 8JB",
  phone: "0114 000 0000",
};

function esc(s: string) {
  return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

export function receiptHtml(data: ReceiptData): string {
  const d = new Date(data.placedAt);
  const when = d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const rows = data.items.map(i => `
    <tr>
      <td class="qty">${i.qty}×</td>
      <td class="nm">${esc(i.name)}</td>
      <td class="amt">£${(i.price * i.qty).toFixed(2)}</td>
    </tr>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(data.orderId)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Courier New", monospace; color: #000; background: #fff; padding: 8px; }
    .r { width: 280px; margin: 0 auto; }
    .center { text-align: center; }
    .name { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
    .sub { font-size: 10px; margin: 2px 0; }
    .meta { font-size: 11px; margin: 8px 0; }
    .meta div { display: flex; justify-content: space-between; }
    hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; font-size: 12px; border-collapse: collapse; }
    td { padding: 2px 0; vertical-align: top; }
    .qty { width: 28px; }
    .amt { text-align: right; white-space: nowrap; }
    .tot { font-size: 13px; }
    .tot div { display: flex; justify-content: space-between; padding: 1px 0; }
    .grand { font-size: 16px; font-weight: 700; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; }
    .foot { font-size: 10px; margin-top: 10px; text-align: center; }
    @media print { @page { margin: 0; } body { padding: 0; } }
  </style></head><body>
  <div class="r">
    <div class="center">
      <div class="name">${esc(RESTAURANT.name)}</div>
      <div class="sub">${esc(RESTAURANT.tagline)}</div>
      <div class="sub">${esc(RESTAURANT.address)}</div>
      <div class="sub">Tel: ${esc(RESTAURANT.phone)}</div>
    </div>
    <hr>
    <div class="meta">
      <div><span>Order:</span><span>${esc(data.orderId)}</span></div>
      <div><span>Type:</span><span>${esc(data.orderType)}</span></div>
      ${data.table ? `<div><span>Table:</span><span>${esc(data.table)}</span></div>` : ""}
      ${data.customerName ? `<div><span>Customer:</span><span>${esc(data.customerName)}</span></div>` : ""}
      <div><span>Date:</span><span>${esc(when)}</span></div>
    </div>
    <hr>
    <table><tbody>${rows}</tbody></table>
    <hr>
    <div class="tot">
      <div><span>Subtotal</span><span>£${data.subtotal.toFixed(2)}</span></div>
      ${data.discount > 0 ? `<div><span>Discount</span><span>-£${data.discount.toFixed(2)}</span></div>` : ""}
      <div class="grand"><span>TOTAL</span><span>£${data.total.toFixed(2)}</span></div>
      <div style="margin-top:4px"><span>Paid via</span><span style="text-transform:capitalize">${esc(data.paymentMethod)}</span></div>
    </div>
    <hr>
    <div class="foot">
      Thank you for your order!<br>
      ${esc(RESTAURANT.name)} · See you again soon
    </div>
  </div>
  <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 300); };</script>
  </body></html>`;
}

export function printReceipt(data: ReceiptData): void {
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) {
    alert("Please allow pop-ups to print receipts.");
    return;
  }
  w.document.open();
  w.document.write(receiptHtml(data));
  w.document.close();
}
