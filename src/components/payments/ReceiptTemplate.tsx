'use client';

import { forwardRef, useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  formatFCFA,
  PAYMENT_METHOD_LABELS,
  getPaymentMethodIcon,
  type PaymentListItem,
  type PaymentDetail,
} from '@/types/payment.types';

type ReceiptProps = {
  payment: (PaymentDetail | PaymentListItem) & {
    studentName: string;
    studentNumber: string;
    trancheName: string;
  };
};

// ─── Component ────────────────────────────────────────────
export function ReceiptTemplate({ payment }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Reçu - ${payment.paymentNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 24px;
                color: #111;
                font-size: 13px;
                line-height: 1.5;
              }
              .receipt { max-width: 420px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { font-size: 20px; color: #8B1C2D; font-weight: 700; margin-bottom: 2px; }
              .header p { font-size: 12px; color: #666; }
              .header .subtitle { font-size: 11px; color: #888; font-style: italic; }
              .separator { border-top: 2px solid #8B1C2D; margin: 12px 0; }
              .title { text-align: center; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 16px 0 8px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
              .info-item label { display: block; font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
              .info-item span { font-size: 13px; font-weight: 500; }
              table { width: 100%; border-collapse: collapse; margin: 12px 0; }
              th { text-align: left; font-size: 10px; text-transform: uppercase; color: #888; padding: 6px 8px; border-bottom: 1px solid #ddd; }
              td { padding: 6px 8px; font-size: 13px; }
              .total-row { font-size: 18px; font-weight: 700; text-align: center; margin: 16px 0 8px; color: #8B1C2D; }
              .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #ccc; }
              .footer p { font-size: 10px; color: #888; }
              .footer .contact { font-size: 11px; color: #555; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h1>IPVE DIGITAL</h1>
                <p>Institut Polytechnique Vase d'Élites</p>
                <p class="subtitle">Enseignement supérieur · Formation professionnelle</p>
              </div>
              <div class="separator"></div>
              <div class="title">Reçu de paiement</div>
              <div class="info-grid">
                <div class="info-item">
                  <label>Numéro reçu</label>
                  <span>${payment.paymentNumber}</span>
                </div>
                <div class="info-item">
                  <label>Date</label>
                  <span>${new Date(payment.paymentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div class="separator"></div>
              <div class="info-grid">
                <div class="info-item">
                  <label>Étudiant</label>
                  <span>${payment.studentName}</span>
                </div>
                <div class="info-item">
                  <label>N° Étudiant</label>
                  <span>${payment.studentNumber}</span>
                </div>
              </div>
              <div class="separator"></div>
              <table>
                <thead>
                  <tr>
                    <th>Tranche</th>
                    <th>Montant</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${payment.trancheName}</td>
                    <td>${formatFCFA(payment.amountPaid)}</td>
                    <td>${getPaymentMethodIcon(payment.paymentMethod)} ${PAYMENT_METHOD_LABELS[payment.paymentMethod]}</td>
                  </tr>
                </tbody>
              </table>
              <div class="total-row">${formatFCFA(payment.amountPaid)}</div>
              ${payment.referenceNumber ? `<div style="text-align:center;font-size:11px;color:#666;margin-bottom:8px;">Réf: ${payment.referenceNumber}</div>` : ''}
              <div class="footer">
                <p>Ce reçu tient lieu de preuve de paiement.</p>
                <p>Toute contestation doit être signalée dans les 48h.</p>
                <p class="contact">contact@ipve.edu.ci · +225 XX XX XX XX</p>
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Screen preview */}
      <div ref={printRef} className="border rounded-lg p-6 max-w-md mx-auto bg-white">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-[#8B1C2D]">IPVE DIGITAL</h1>
          <p className="text-sm text-muted-foreground">
            Institut Polytechnique Vase d'Élites
          </p>
          <p className="text-xs text-muted-foreground italic">
            Enseignement supérieur · Formation professionnelle
          </p>
        </div>
        <Separator className="bg-[#8B1C2D] mb-4" />

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Reçu de paiement
          </h2>
        </div>

        {/* Receipt info */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Numéro reçu</p>
            <p className="font-medium">{payment.paymentNumber}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Date</p>
            <p className="font-medium">
              {new Date(payment.paymentDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <Separator className="mb-3" />

        {/* Student info */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Étudiant</p>
            <p className="font-medium">{payment.studentName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">N° Étudiant</p>
            <p className="font-medium">{payment.studentNumber}</p>
          </div>
        </div>
        <Separator className="mb-3" />

        {/* Payment table */}
        <div className="rounded-lg border text-sm">
          <div className="grid grid-cols-3 gap-0 text-xs">
            <div className="px-3 py-2 bg-muted/50 font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">
              Tranche
            </div>
            <div className="px-3 py-2 bg-muted/50 font-semibold text-muted-foreground uppercase text-[10px] tracking-wide text-right">
              Montant
            </div>
            <div className="px-3 py-2 bg-muted/50 font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">
              Mode
            </div>
            <div className="px-3 py-2 border-t">{payment.trancheName}</div>
            <div className="px-3 py-2 border-t text-right font-bold text-[#8B1C2D]">
              {formatFCFA(payment.amountPaid)}
            </div>
            <div className="px-3 py-2 border-t">
              {getPaymentMethodIcon(payment.paymentMethod)}{' '}
              <span className="text-xs">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="text-center mt-4 mb-2">
          <p className="text-2xl font-bold text-[#8B1C2D]">
            {formatFCFA(payment.amountPaid)}
          </p>
        </div>

        {payment.referenceNumber && (
          <p className="text-center text-xs text-muted-foreground mb-2">
            Réf: {payment.referenceNumber}
          </p>
        )}

        {/* Footer */}
        <div className="text-center mt-4 pt-3 border-t border-dashed">
          <p className="text-[10px] text-muted-foreground">
            Ce reçu tient lieu de preuve de paiement.
          </p>
          <p className="text-[10px] text-muted-foreground">
            Toute contestation doit être signalée dans les 48h.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            contact@ipve.edu.ci · +225 XX XX XX XX
          </p>
        </div>
      </div>

      {/* Print button */}
      <div className="flex justify-center">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimer le reçu
        </Button>
      </div>
    </div>
  );
}
