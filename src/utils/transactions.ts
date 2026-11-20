// Unified list of every payment received (tuition, uniforms, materials/POS, bus, canteen),
// shared by the daily payment report and the dashboard.
import {
  BusStudentEnrollment,
  BusPaymentRecord,
  ClassFeeData,
  MaterialSaleTransaction,
  UniformSaleTransaction,
} from '../types';

export interface UnifiedDailyTransaction {
  id: string;
  timestamp: string;
  date: string;
  receiptNo: string;
  category: 'tuition' | 'uniform' | 'material' | 'bus' | 'canteen';
  categoryLabelKhmer: string;
  payerName: string;
  payerSub?: string;
  description: string;
  paidBy: 'Cash' | 'ABA' | 'AC' | 'Wing' | '$ -' | string;
  amountUSD: number;
  amountKHR: number;
  recordedBy: string;
  rawDetails?: any;
}

// Date normalization helper: returns YYYY-MM-DD
export const normalizeDateToISO = (dateStr?: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Handles DD-MM-YYYY or DD/MM/YYYY
  const slashParts = trimmed.split(/[-./_]/);
  if (slashParts.length === 3) {
    if (slashParts[0].length === 2 && slashParts[2].length === 4) {
      return `${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`;
    }
  }

  // Handles DD-Mon-YY (e.g. 22-Oct-26 or 7-Sep-26)
  const monthMap: { [m: string]: string } = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const monMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (monMatch) {
    const day = monMatch[1].padStart(2, '0');
    const mon = monthMap[monMatch[2]] || '01';
    let yr = monMatch[3];
    if (yr.length === 2) yr = `20${yr}`;
    return `${yr}-${mon}-${day}`;
  }

  return trimmed;
};

export interface TransactionSources {
  classData: { [classId: string]: ClassFeeData };
  uniformSalesHistory: UniformSaleTransaction[];
  materialSalesHistory: MaterialSaleTransaction[];
  busEnrollments: BusStudentEnrollment[];
  busPayments: BusPaymentRecord[];
  canteenHistory: { [month: string]: any };
  selectedCanteenMonth: string;
  settings: { exchangeRate: number };
  currentBranchId: string;
  /** Include stall fees from every saved month (default: only the selected month) */
  allCanteenMonths?: boolean;
}

/** Every transaction across all dates (each with an ISO `date`). Filter by date as needed. */
export const collectAllTransactions = ({
  classData,
  uniformSalesHistory,
  materialSalesHistory,
  busEnrollments,
  busPayments,
  canteenHistory,
  selectedCanteenMonth,
  settings,
  currentBranchId,
  allCanteenMonths = false,
}: TransactionSources): UnifiedDailyTransaction[] => {
    const list: UnifiedDailyTransaction[] = [];

    // 1. Tuition Fees from Class Data (filtered by active campus)
    Object.values(classData).forEach((cls) => {
      if (currentBranchId !== 'all' && (cls.branchId || 'branch-central') !== currentBranchId) {
        return;
      }
      cls.students.forEach((st) => {
        if (st.feeHistory && st.feeHistory.length > 0) {
          st.feeHistory.forEach((rec) => {
            const recISO = normalizeDateToISO(rec.date);
            if (recISO !== '') {
              list.push({
                id: `fee-${st.id}-${rec.receiptNo}`,
                timestamp: `${rec.date}`,
                date: recISO,
                receiptNo: rec.invoiceNo || rec.receiptNo,
                category: 'tuition',
                categoryLabelKhmer: 'ថ្លៃសិក្សា',
                payerName: st.name,
                payerSub: `${st.studentCode} · ${cls.className}`,
                description:
                  rec.months && rec.months.length > 1
                    ? `បង់ថ្លៃសិក្សា ${rec.months.length} ខែ (${rec.month})`
                    : `បង់ថ្លៃសិក្សាខែ ${rec.month}`,
                paidBy: rec.paidBy,
                amountUSD: rec.amountUSD,
                amountKHR: rec.amountKHR || Math.round(rec.amountUSD * settings.exchangeRate),
                recordedBy: rec.recordedBy || 'គណនេយ្យករ',
                rawDetails: { student: st, receipt: rec, className: cls.className },
              });
            }
          });
        }
      });
    });

    // 2. Uniform Sales History
    uniformSalesHistory.forEach((tx) => {
      const txISO = normalizeDateToISO(tx.date);
      if (txISO !== '') {
        const amtUSD = tx.totalAmountKHR / settings.exchangeRate;
        list.push({
          id: tx.id,
          timestamp: tx.timestamp || tx.date,
          date: txISO,
          receiptNo: tx.receiptNo,
          category: 'uniform',
          categoryLabelKhmer: 'ឯកសណ្ឋាន',
          payerName: tx.buyerName,
          payerSub: tx.classId ? `ថ្នាក់: ${tx.classId}` : 'អតិថិជនទូទៅ',
          description: `${tx.typeNameKhmer || tx.type} (${tx.size}) × ${tx.quantity} pcs`,
          paidBy: tx.paymentMethod,
          amountUSD: amtUSD,
          amountKHR: tx.totalAmountKHR,
          recordedBy: tx.recordedBy || 'អ្នកលក់ឯកសណ្ឋាន',
          rawDetails: tx,
        });
      }
    });

    // 3. Materials & POS Stationery Sales History
    materialSalesHistory.forEach((tx) => {
      const txISO = normalizeDateToISO(tx.date);
      if (txISO !== '') {
        const amtUSD = tx.totalAmountKHR / settings.exchangeRate;
        list.push({
          id: tx.id,
          timestamp: tx.timestamp || tx.date,
          date: txISO,
          receiptNo: tx.receiptNo,
          category: 'material',
          categoryLabelKhmer: 'សម្ភារៈ/POS',
          payerName: tx.customerName || 'អតិថិជនទូទៅ',
          payerSub: tx.category,
          description: `${tx.itemName} × ${tx.quantity}`,
          paidBy: tx.paymentMethod,
          amountUSD: amtUSD,
          amountKHR: tx.totalAmountKHR,
          recordedBy: tx.recordedBy || 'អ្នកលក់សម្ភារៈ',
          rawDetails: tx,
        });
      }
    });

    // 4. School Bus Service Fees (from busPayments ledger filtered by active campus)
    if (busPayments && busPayments.length > 0) {
      busPayments.forEach((bp) => {
        if (currentBranchId !== 'all') {
          const bpBranch = bp.branchId || (bp.classId && classData[bp.classId]?.branchId) || 'branch-central';
          if (bpBranch !== currentBranchId) return;
        }
        const bpISO = normalizeDateToISO(bp.paymentDate);
        if (bpISO !== '') {
          list.push({
            id: `bus-pay-${bp.id}`,
            timestamp: bp.paymentDate,
            date: bpISO,
            receiptNo: bp.receiptNo || bp.invoiceNo || `BUS-${bp.id.slice(-4)}`,
            category: 'bus',
            categoryLabelKhmer: 'រថយន្តសាលា',
            payerName: bp.studentName,
            payerSub: `${bp.studentCode} · ${bp.className || bp.classId}`,
            description: `សេវារថយន្ត (${bp.routeName}) - ${bp.months?.join(', ') || bp.month}`,
            paidBy: bp.paidBy || 'Cash',
            amountUSD: bp.amountUSD,
            amountKHR: bp.amountKHR,
            recordedBy: bp.recordedBy || 'គណនេយ្យកររថយន្ត',
            rawDetails: bp,
          });
        }
      });
    } else {
      busEnrollments.forEach((e) => {
        if (currentBranchId !== 'all') {
          const eBranch = e.branchId || (e.classId && classData[e.classId]?.branchId) || 'branch-central';
          if (eBranch !== currentBranchId) return;
        }
        if (e.status === 'paid' && e.paymentDate) {
          const eISO = normalizeDateToISO(e.paymentDate);
          if (eISO !== '') {
            const amtUSD = Math.max(0, e.monthlyFeeUSD - (e.discountUSD || 0));
            list.push({
              id: `bus-${e.id}`,
              timestamp: e.paymentDate,
              date: eISO,
              receiptNo: e.receiptNo || `BUS-${e.id.slice(-4)}`,
              category: 'bus',
              categoryLabelKhmer: 'រថយន្តសាលា',
              payerName: e.studentName,
              payerSub: `${e.studentCode} · ${e.classId || 'សិស្សជិះឡាន'}`,
              description: `សេវារថយន្តសាលា (${e.pickupLocation || e.routeId})`,
              paidBy: e.paidBy || 'Cash',
              amountUSD: amtUSD,
              amountKHR: Math.round(amtUSD * settings.exchangeRate),
              recordedBy: 'គណនេយ្យកររថយន្ត',
              rawDetails: e,
            });
          }
        }
      });
    }

    // 5. Canteen Daily Stall Fees
    const canteenMonths = allCanteenMonths
      ? Object.values(canteenHistory || {})
      : [canteenHistory[selectedCanteenMonth] || Object.values(canteenHistory)[0]];
    canteenMonths.forEach((currentCanteen) => {
    if (currentCanteen && currentCanteen.dailyRecords) {
      currentCanteen.dailyRecords.forEach((dr) => {
        const drISO = normalizeDateToISO(dr.date);
        if (drISO !== '' && dr.vendorStatus) {
          Object.entries(dr.vendorStatus).forEach(([vId, vStat]) => {
            if (vStat.status === 'paid' || vStat.status === 'double_paid') {
              const vendor = currentCanteen.vendors.find((v) => v.id === vId);
              const feeKHR = vStat.amountKHR || (vStat.status === 'double_paid' ? 20000 : 10000);
              list.push({
                id: `canteen-${dr.date}-${vId}`,
                timestamp: dr.date,
                date: drISO,
                receiptNo: `CAN-${vId.toUpperCase()}`,
                category: 'canteen',
                categoryLabelKhmer: 'អាហារដ្ឋាន',
                payerName: vendor?.name || 'អាជីវករ',
                payerSub: vendor?.stallName || 'តូបអាហារ',
                description: `ថ្លៃទីតាំងអាហារដ្ឋាន (${vStat.status === 'double_paid' ? 'បង់ទ្វេដង' : 'បង់ធម្មតា'})`,
                paidBy: 'Cash',
                amountUSD: feeKHR / settings.exchangeRate,
                amountKHR: feeKHR,
                recordedBy: currentCanteen.preparedBy || 'គណនេយ្យករ',
                rawDetails: { vendor, status: vStat },
              });
            }
          });
        }
      });
    }
    });

    return list;
};
