import React from 'react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Sidebar';
import { Printer, X } from 'lucide-react';

interface OfficialPrintReportProps {
  activeTab: NavTab;
  onClose: () => void;
}

export const OfficialPrintReport: React.FC<OfficialPrintReportProps> = ({
  activeTab,
  onClose,
}) => {
  const {
    classData,
    selectedClassId,
    dailyMaterials,
    canteenReport,
    uniformReport,
    uniformTypes,
    currentBranch,
    getBranchName,
  } = useApp();

  const currentClass = classData[selectedClassId] || Object.values(classData)[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-8">
      {/* Floating Action Bar (Hidden in Print) */}
      <div className="no-print bg-white rounded-xl shadow-lg border border-slate-200 px-6 py-3 flex items-center justify-between w-full max-w-4xl mb-6 sticky top-4 z-10">
        <div className="text-xs font-semibold text-slate-800">
          Official Report Print Preview (BIM Rangsei School)
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Document (A4)</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet (White Paper container) */}
      <div className="print-container bg-white text-slate-900 w-full max-w-4xl p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Official Header */}
        <div className="text-center space-y-1 mb-8">
          <div className="text-sm font-bold font-khmer text-slate-900">
            ព្រះរាជាណាចក្រកម្ពុជា
          </div>
          <div className="text-xs font-semibold font-khmer text-slate-700">
            ជាតិ សាសនា ព្រះមហាក្សត្រ
          </div>
          <div className="text-xs text-slate-400">❖❖❖</div>

          <div className="pt-2 text-base font-extrabold font-khmer text-slate-900">
            សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
          </div>
          <div className="text-xs font-semibold font-khmer text-indigo-700">
            {currentBranch.nameKhmer} {currentBranch.code ? `(${currentBranch.code})` : ''}
          </div>

          {/* Tab Specific Title */}
          <div className="text-lg font-bold font-khmer text-slate-900 pt-1">
            {(activeTab === 'student_fees' || activeTab === 'revenue_student' || activeTab === 'report_tuition') && (
              <>
                របាយការណ៍បង់ថ្លៃសិក្សាសិស្ស ({currentClass.className})
                <div className="text-xs font-mono font-normal text-slate-600 mt-0.5">
                  ({currentClass.period})
                </div>
              </>
            )}
            {(activeTab === 'daily_materials' || activeTab === 'revenue_materials' || activeTab === 'report_materials' || activeTab === 'pos') && (
              <>
                សម្ភារៈលក់ប្រចាំថ្ងៃ ({dailyMaterials.month} {dailyMaterials.year})
                <div className="text-xs font-mono font-normal text-slate-600 mt-0.5">
                  ({dailyMaterials.dateRange})
                </div>
              </>
            )}
            {(activeTab === 'canteen_vendors' || activeTab === 'revenue_stall_fee' || activeTab === 'report_stall_fee') && (
              <>
                បញ្ជីឈ្មោះអ្នកលក់អាហារក្នុងបរិវេណសាលាប្រចាំខែ {canteenReport.month}
              </>
            )}
            {(activeTab === 'uniform_sales' || activeTab === 'revenue_uniform' || activeTab === 'report_uniform') && (
              <>
                របាយការណ៍ឯកសណ្ឋានសិស្សប្រចាំខែ {uniformReport.month} {uniformReport.year}
              </>
            )}
            {(activeTab === 'school_bus' || activeTab === 'revenue_transport' || activeTab === 'report_transport') && (
              <>
                របាយការណ៍សេវារថយន្តសាលា (School Bus Transportation Report)
              </>
            )}
            {activeTab === 'overview' && <>របាយការណ៍ហិរញ្ញវត្ថុ និងចំណូលប្រតិបត្តិការសាលា</>}
          </div>
        </div>

        {/* Dynamic Content Table */}
        {(activeTab === 'student_fees' || activeTab === 'revenue_student' || activeTab === 'report_tuition') && currentClass && (
          <div className="space-y-6 text-xs">
            <table className="w-full text-left border-collapse border border-slate-400">
              <thead>
                <tr className="bg-amber-300 font-bold border-b border-slate-400 text-slate-900">
                  <th className="py-2 px-2 border-r border-slate-400 text-center w-10">ID</th>
                  <th className="py-2 px-3 border-r border-slate-400 font-khmer">ឈ្មោះសិស្ស (Student Name)</th>
                  <th className="py-2 px-2 border-r border-slate-400 text-center">Gender</th>
                  <th className="py-2 px-2 border-r border-slate-400 text-center">Note</th>
                  <th className="py-2 px-2 border-r border-slate-400 text-center">Fees Group</th>
                  <th className="py-2 px-2 border-r border-slate-400 text-center">Payment Date</th>
                  <th className="py-2 px-2 border-r border-slate-400 text-center">Case</th>
                  <th className="py-2 px-2 border-r border-slate-400 text-center">Paid by</th>
                  <th className="py-2 px-3 text-right">Cash ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {currentClass.students.map((st) => (
                  <tr key={st.id}>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono">{st.id}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-khmer font-medium">{st.name}</td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center">{st.gender}</td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center">{st.note}</td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center">{st.feesGroup}</td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono">{st.paymentDate}</td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center">{st.caseType}</td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold">{st.paidBy}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold">
                      {st.cash > 0 ? `$ ${st.cash.toFixed(2)}` : '$ -'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-200 font-bold border-t-2 border-slate-500">
                  <td colSpan={8} className="py-2 px-3 text-right border-r border-slate-400 uppercase">
                    Total Cash Collected
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-extrabold">
                    $ {currentClass.totalCollectedCash.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Bottom Summary Table */}
            <div className="pt-4">
              <div className="font-bold text-xs font-khmer mb-2 text-slate-800">
                តារាងសង្ខេប (Summary Table):
              </div>
              <table className="w-full text-left border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-amber-300 font-bold border-b border-slate-400 text-slate-900">
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center w-8">ID</th>
                    <th className="py-1.5 px-3 border-r border-slate-400 font-khmer">Case / ប្រភេទ</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center">General</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center">Contribute</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center">50%</th>
                    <th className="py-1.5 px-2 border-r border-slate-400 text-center">Total</th>
                    <th className="py-1.5 px-3 text-right">Cash ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {currentClass.summaryRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-mono">{r.id}</td>
                      <td className="py-1 px-3 border-r border-slate-300 font-khmer">{r.caseKhmer}</td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-mono">{r.general}</td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-mono">{r.contribute}</td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-mono">{r.fiftyPercent}</td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-mono font-bold">{r.totalStudents}</td>
                      <td className="py-1 px-3 text-right font-mono font-bold">
                        {r.totalCash > 0 ? `$ ${r.totalCash.toFixed(2)}` : '$ -'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Uniform Sales Official Ledger */}
        {(activeTab === 'uniform_sales' || activeTab === 'revenue_uniform' || activeTab === 'report_uniform') && (
          <div className="space-y-6 text-xs">
            {uniformTypes.map((ut, idx) => {
              const records =
                ut.id === 'general_shirt'
                  ? uniformReport.shirtDailyRecords || []
                  : ut.id === 'sports_bottom'
                  ? uniformReport.sportDailyRecords || []
                  : uniformReport.recordsByType?.[ut.id] || [];
              const price =
                ut.id === 'general_shirt'
                  ? uniformReport.shirtPriceKHR || ut.defaultPriceKHR
                  : ut.id === 'sports_bottom'
                  ? uniformReport.sportPriceKHR || ut.defaultPriceKHR
                  : ut.defaultPriceKHR;
              const sizeTotals: { [s: string]: number } = {};
              ut.sizes.forEach((s) => {
                sizeTotals[s] = records.reduce((sum, r) => sum + (r.sizes[s] || 0), 0);
              });
              const totalQty = Object.values(sizeTotals).reduce((a, b) => a + b, 0);
              const totalAmount = records.reduce((sum, r) => sum + (r.totalAmountKHR || r.totalQty * price), 0);

              return (
                <div key={ut.id} className="space-y-2">
                  <div className="font-bold font-khmer text-slate-800 text-sm">
                    {idx + 1}. {ut.nameKhmer} ({ut.nameEnglish}) · {price.toLocaleString()} ៛/កំប្លេ
                  </div>
                  <table className="w-full text-left border-collapse border border-slate-400 font-mono text-[11px]">
                    <thead>
                      <tr className="bg-amber-300 font-bold border-b border-slate-400 text-slate-900">
                        <th className="py-1 px-2 border-r border-slate-400 text-center w-8">No</th>
                        <th className="py-1 px-3 border-r border-slate-400">Date</th>
                        {ut.sizes.map((sz) => (
                          <th key={sz} className="py-1 px-1 border-r border-slate-400 text-center">
                            {sz}
                          </th>
                        ))}
                        <th className="py-1 px-2 border-r border-slate-400 text-center bg-amber-200">Total Qty</th>
                        <th className="py-1 px-2 text-right bg-amber-200">Amount (KHR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={ut.sizes.length + 4} className="py-3 text-center text-slate-400 font-khmer">
                            មិនទាន់មានទិន្នន័យ
                          </td>
                        </tr>
                      ) : (
                        records.map((r, rIdx) => (
                          <tr key={rIdx}>
                            <td className="py-1 px-2 border-r border-slate-300 text-center">{rIdx + 1}</td>
                            <td className="py-1 px-3 border-r border-slate-300 font-bold">{r.date}</td>
                            {ut.sizes.map((sz) => (
                              <td key={sz} className="py-1 px-1 border-r border-slate-300 text-center">
                                {r.sizes[sz] || '-'}
                              </td>
                            ))}
                            <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">{r.totalQty}</td>
                            <td className="py-1 px-2 text-right font-bold">{r.totalAmountKHR.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-200 font-bold border-t border-slate-400">
                        <td colSpan={2} className="py-1 px-3 text-right border-r border-slate-400 font-khmer">
                          សរុប:
                        </td>
                        {ut.sizes.map((sz) => (
                          <td key={sz} className="py-1 px-1 border-r border-slate-400 text-center">
                            {sizeTotals[sz] || 0}
                          </td>
                        ))}
                        <td className="py-1 px-2 border-r border-slate-400 text-center">{totalQty}</td>
                        <td className="py-1 px-2 text-right">{totalAmount.toLocaleString()} ៛</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* Other Tabs Fallback Representation */}
        {activeTab !== 'student_fees' && activeTab !== 'uniform_sales' && (
          <div className="py-6 text-xs space-y-4">
            <div className="p-4 rounded border border-slate-300 bg-slate-50 font-khmer text-slate-700">
              ឯកសារនេះត្រូវបានបង្កើតឡើងដោយស្វ័យប្រវត្តិចេញពីទិន្នន័យប្រតិបត្តិការប្រព័ន្ធគ្រប់គ្រងសាលា BIM Rangsei School (សាលា អ៊ីរ៉ែលកម្ពុជា)។
            </div>
          </div>
        )}

        {/* Legal Signatures Block */}
        <div className="mt-16 pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-xs">
          <div className="text-center space-y-12">
            <div className="font-bold font-khmer text-slate-800">
              បានឃើញ និងឯកភាព (Seen & Approved)
            </div>
            <div className="pt-2 border-t border-slate-400 font-khmer text-slate-700 font-semibold">
              យ៉េន ណាវីន (នាយកសាលា)
            </div>
          </div>

          <div className="text-center space-y-12">
            <div className="font-bold font-khmer text-slate-800">
              រៀបចំដោយ (Prepared by)
            </div>
            <div className="pt-2 border-t border-slate-400 font-khmer text-slate-700 font-semibold">
              ប្រាជ្ញ ស៊ីដា (គណនេយ្យករ)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
