import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, ShieldCheck, QrCode, ExternalLink } from 'lucide-react';

interface InvoiceQRCodeProps {
  invoiceNo: string;
  studentCode: string;
  studentName: string;
  amountUSD: number;
  amountKHR?: number;
  paymentDate: string;
  paidBy: string;
  status: 'paid' | 'pending' | 'unpaid' | 'prepaid' | 'waived' | string;
  className?: string;
  academicYear?: string;
  size?: number;
  showDetails?: boolean;
  onVerifyClick?: () => void;
  classNameCustom?: string;
}

export const InvoiceQRCode: React.FC<InvoiceQRCodeProps> = ({
  invoiceNo,
  studentCode,
  studentName,
  amountUSD,
  amountKHR,
  paymentDate,
  paidBy,
  status,
  className = '1A',
  academicYear = '2026-2027',
  size = 110,
  showDetails = true,
  onVerifyClick,
  classNameCustom = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  // Verification URL that links to payment verification
  const verificationUrl = useMemoUrl(invoiceNo, studentCode);

  // Generate QR code data URL
  useEffect(() => {
    let isMounted = true;

    // Structured JSON payload + URL for universal scanning
    const qrPayload = verificationUrl;

    QRCode.toDataURL(qrPayload, {
      width: size * 2, // high DPI for crisp print
      margin: 1,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [verificationUrl, size]);

  const isPaid = status === 'paid' || status === 'prepaid';

  return (
    <div
      className={`flex flex-col items-center text-center p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs ${classNameCustom}`}
    >
      {/* QR Code Container */}
      <div className="relative group cursor-pointer" onClick={onVerifyClick} title="ចុចដើម្បីផ្ទៀងផ្ទាត់វិក្កយបត្រ">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code for Invoice ${invoiceNo}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="rounded-lg object-contain block mx-auto transition-transform group-hover:scale-105"
          />
        ) : error ? (
          <div
            style={{ width: `${size}px`, height: `${size}px` }}
            className="flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-[10px]"
          >
            QR Error
          </div>
        ) : (
          <div
            style={{ width: `${size}px`, height: `${size}px` }}
            className="flex items-center justify-center bg-slate-50 rounded-lg animate-pulse"
          >
            <QrCode className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        )}

        {/* Center Emblem/Seal Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Verification Subtitle & Status Badge */}
      {showDetails && (
        <div className="mt-1.5 space-y-1 w-full">
          <div className="flex items-center justify-center gap-1">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-tight ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{isPaid ? 'VERIFIED · PAID' : 'PENDING'}</span>
            </span>
          </div>

          <div className="text-[9px] font-khmer text-slate-500 leading-tight">
            ស្កេនផ្ទៀងផ្ទាត់សុពលភាព
          </div>

          {onVerifyClick && (
            <button
              type="button"
              onClick={onVerifyClick}
              className="no-print mt-0.5 text-[9px] font-khmer text-indigo-600 hover:text-indigo-800 hover:underline flex items-center justify-center gap-0.5 mx-auto font-bold"
            >
              <span>ផ្ទៀងផ្ទាត់ឥឡូវនេះ</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Helper to construct verification URL
function useMemoUrl(invoiceNo: string, studentCode: string) {
  return React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('verify_invoice', invoiceNo || '');
    if (studentCode) params.set('student_code', studentCode);
    params.set('ts', Date.now().toString());
    return `${base}?${params.toString()}`;
  }, [invoiceNo, studentCode]);
}
