import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { POSCartItem, StudentFeeRecord } from '../types';
import { SearchableSelect, SearchOption } from './SearchableSelect';
import {
  ShoppingBag,
  Shirt,
  BookOpen,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Printer,
  X,
  CheckCircle2,
  User,
  RotateCcw,
  Clock,
  Sparkles,
  Receipt,
  QrCode,
  Tag,
  Building2,
} from 'lucide-react';

export const POSSalesView: React.FC = () => {
  const {
    uniformTypes,
    dailyMaterials,
    recordPOSSale,
    classData,
    settings,
    currentUser,
    permissions,
    currentBranch,
    currentBranchId,
    t,
  } = useApp();

  // Catalog category filter
  const [activeCategory, setActiveCategory] = useState<'all' | 'uniform' | 'stationery' | 'books'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cartItems, setCartItems] = useState<POSCartItem[]>([]);

  // Selected size per uniform type: { [typeId: string]: string }
  const [selectedSizes, setSelectedSizes] = useState<{ [typeId: string]: string }>(() => {
    const initial: { [typeId: string]: string } = {};
    uniformTypes.forEach((ut) => {
      if (ut.sizes.length > 0) initial[ut.id] = ut.sizes[0];
    });
    return initial;
  });

  // Buyer / Customer selection
  const [buyerMode, setBuyerMode] = useState<'student' | 'custom'>('student');
  const [selectedStudentCode, setSelectedStudentCode] = useState<string>('');
  const [customBuyerName, setCustomBuyerName] = useState<string>('');

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'ABA' | 'AC'>('ABA');
  const [cashTenderedUSD, setCashTenderedUSD] = useState<number>(0);
  const [cashTenderedKHR, setCashTenderedKHR] = useState<number>(0);
  const [tenderCurrency, setTenderCurrency] = useState<'USD' | 'KHR'>('USD');

  // Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<{
    receiptNo: string;
    timestamp: string;
    items: POSCartItem[];
    buyerName: string;
    classId?: string;
    paymentMethod: string;
    totalUSD: number;
    totalKHR: number;
    cashTenderedUSD?: number;
    cashTenderedKHR?: number;
    changeUSD?: number;
    changeKHR?: number;
  } | null>(null);

  // Flatten all students across classes for searchable buyer dropdown (filtered by active campus)
  const studentOptions: SearchOption[] = useMemo(() => {
    const list: SearchOption[] = [];
    Object.values(classData).forEach((cls) => {
      if (currentBranchId !== 'all' && (cls.branchId || 'branch-central') !== currentBranchId) {
        return;
      }
      cls.students.forEach((st) => {
        list.push({
          id: st.studentCode,
          label: `${st.name} ${st.latinName ? `(${st.latinName})` : ''}`,
          subLabel: cls.className,
          badge: st.studentCode,
          data: { ...st, classId: cls.classId, className: cls.className },
        });
      });
    });
    return list;
  }, [classData, currentBranchId]);

  // Selected student object
  const currentStudent = useMemo(() => {
    if (!selectedStudentCode) return null;
    for (const cls of Object.values(classData)) {
      const found = cls.students.find((s) => s.studentCode === selectedStudentCode);
      if (found) return { ...found, classId: cls.classId, className: cls.className };
    }
    return null;
  }, [classData, selectedStudentCode]);

  // Add uniform item to cart
  const handleAddUniform = (ut: typeof uniformTypes[0]) => {
    const size = selectedSizes[ut.id] || ut.sizes[0] || 'Free Size';
    const cartItemId = `uni-${ut.id}-${size}`;
    const unitPriceKHR = ut.defaultPriceKHR;
    const unitPriceUSD = unitPriceKHR / settings.exchangeRate;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === cartItemId
            ? {
                ...i,
                quantity: i.quantity + 1,
                totalPriceKHR: (i.quantity + 1) * unitPriceKHR,
                totalPriceUSD: (i.quantity + 1) * unitPriceUSD,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          typeId: ut.id,
          name: `${ut.nameKhmer} (Size ${size})`,
          nameEnglish: ut.nameEnglish,
          category: 'uniform',
          size,
          quantity: 1,
          unitPriceKHR,
          unitPriceUSD,
          totalPriceKHR: unitPriceKHR,
          totalPriceUSD: unitPriceUSD,
        },
      ];
    });
  };

  // Add material item to cart
  const handleAddMaterial = (item: typeof dailyMaterials.items[0]) => {
    const cartItemId = `mat-${item.id}`;
    const unitPriceKHR = item.unitPriceKHR;
    const unitPriceUSD = unitPriceKHR / settings.exchangeRate;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === cartItemId
            ? {
                ...i,
                quantity: i.quantity + 1,
                totalPriceKHR: (i.quantity + 1) * unitPriceKHR,
                totalPriceUSD: (i.quantity + 1) * unitPriceUSD,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          itemId: item.id,
          name: item.name,
          category: (item.category === 'uniform_card' ? 'uniform' : item.category) as 'books' | 'stationery' | 'textbooks' | 'uniform',
          quantity: 1,
          unitPriceKHR,
          unitPriceUSD,
          totalPriceKHR: unitPriceKHR,
          totalPriceUSD: unitPriceUSD,
        },
      ];
    });
  };

  // Update item quantity in cart
  const handleUpdateQty = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (i.cartItemId === cartItemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...i,
              quantity: newQty,
              totalPriceKHR: newQty * i.unitPriceKHR,
              totalPriceUSD: newQty * i.unitPriceUSD,
            };
          }
          return i;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  // Remove item from cart
  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Cart totals
  const totalCartKHR = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.totalPriceKHR, 0),
    [cartItems]
  );
  const totalCartUSD = useMemo(
    () => totalCartKHR / settings.exchangeRate,
    [totalCartKHR, settings.exchangeRate]
  );

  // Compute change
  const changeUSD = useMemo(() => {
    if (paymentMethod !== 'Cash' || tenderCurrency !== 'USD') return 0;
    return Math.max(0, cashTenderedUSD - totalCartUSD);
  }, [paymentMethod, tenderCurrency, cashTenderedUSD, totalCartUSD]);

  const changeKHR = useMemo(() => {
    if (paymentMethod !== 'Cash' || tenderCurrency !== 'KHR') return 0;
    return Math.max(0, cashTenderedKHR - totalCartKHR);
  }, [paymentMethod, tenderCurrency, cashTenderedKHR, totalCartKHR]);

  // Handle Checkout & Sale Confirmation
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    let buyerName = 'អតិថិជនទូទៅ';
    let classId: string | undefined = undefined;
    let studentId: number | undefined = undefined;

    if (buyerMode === 'student' && currentStudent) {
      buyerName = `${currentStudent.name} (${currentStudent.studentCode})`;
      classId = currentStudent.classId;
      studentId = currentStudent.id;
    } else if (customBuyerName.trim()) {
      buyerName = customBuyerName.trim();
    }

    const res = recordPOSSale({
      items: cartItems,
      buyerName,
      studentId,
      classId,
      paymentMethod,
      totalAmountUSD: totalCartUSD,
      totalAmountKHR: totalCartKHR,
      cashTenderedUSD: tenderCurrency === 'USD' ? cashTenderedUSD : undefined,
      cashTenderedKHR: tenderCurrency === 'KHR' ? cashTenderedKHR : undefined,
      changeUSD,
      changeKHR,
    });

    setCompletedOrder({
      receiptNo: res.receiptNo,
      timestamp: res.timestamp,
      items: [...cartItems],
      buyerName,
      classId,
      paymentMethod,
      totalUSD: totalCartUSD,
      totalKHR: totalCartKHR,
      cashTenderedUSD: tenderCurrency === 'USD' ? cashTenderedUSD : undefined,
      cashTenderedKHR: tenderCurrency === 'KHR' ? cashTenderedKHR : undefined,
      changeUSD,
      changeKHR,
    });

    // Reset Cart
    setCartItems([]);
    setCashTenderedUSD(0);
    setCashTenderedKHR(0);
  };

  // Print thermal receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter Catalog Items
  const filteredUniforms = useMemo(() => {
    if (activeCategory === 'stationery' || activeCategory === 'books') return [];
    return uniformTypes.filter(
      (u) =>
        u.nameKhmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniformTypes, activeCategory, searchQuery]);

  const filteredMaterials = useMemo(() => {
    if (activeCategory === 'uniform') return [];
    return dailyMaterials.items.filter((item) => {
      const matchCat =
        activeCategory === 'all' ||
        (activeCategory === 'stationery' && item.category === 'stationery') ||
        (activeCategory === 'books' && (item.category === 'books' || item.category === 'textbooks'));
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [dailyMaterials.items, activeCategory, searchQuery]);

  return (
    <div className="space-y-5 w-full">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold border border-amber-300/40 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 font-khmer">
                  {t('ប្រព័ន្ធលក់រហ័ស (Point of Sale - POS)', 'Point of Sale (POS)')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase font-mono">
                  Live POS
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-khmer flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-indigo-500" />
                  <span>{currentBranch.nameKhmer}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-khmer mt-0.5">
                {t(
                  'លក់ឯកសណ្ឋានសិស្ស សម្ភារៈសិក្សា & ចេញវិក្កយបត្រភ្លាមៗ និង Auto-Sync ទៅកាន់របាយការណ៍',
                  'Quick sales for uniforms and materials with instant receipt & ledger sync'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono flex items-center gap-2 text-slate-700">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-khmer">អត្រាប្តូរប្រាក់៖</span>
              <span className="font-bold text-indigo-700">$1 = {settings.exchangeRate.toLocaleString()} ៛</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-khmer flex items-center gap-1.5 shadow-2xs">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 font-normal">អ្នកលក់៖</span>
              <span className="font-bold text-amber-300">{currentUser.khmerName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* POS Main Grid: Left Catalog (7 cols) + Right Checkout / Cart (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product Catalog */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Tabs & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t('ទាំងអស់ (All)', 'All Items')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('uniform')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeCategory === 'uniform'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>{t('ឯកសណ្ឋានសិស្ស', 'Uniforms')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('stationery')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeCategory === 'stationery'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{t('សម្ភារៈសិក្សា', 'Stationery')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('books')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeCategory === 'books'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t('សៀវភៅពុម្ព & កត់', 'Books')}</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('ស្វែងរកទំនិញ...', 'Search catalog...')}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Uniform Cards */}
            {filteredUniforms.map((ut) => {
              const currentSize = selectedSizes[ut.id] || ut.sizes[0] || 'Free Size';
              const priceKHR = ut.defaultPriceKHR;
              const priceUSD = priceKHR / settings.exchangeRate;

              return (
                <div
                  key={`catalog-ut-${ut.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Shirt className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 font-khmer line-clamp-1">
                            {ut.nameKhmer}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {ut.nameEnglish}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono shrink-0">
                        Uniform
                      </span>
                    </div>

                    {/* Sizing selector pills */}
                    <div className="mt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase font-khmer mb-1.5">
                        ជ្រើសរើសទំហំ (Size)៖
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ut.sizes.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() =>
                              setSelectedSizes((prev) => ({ ...prev, [ut.id]: sz }))
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                              currentSize === sz
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-base font-black text-slate-900 font-mono">
                        {priceKHR.toLocaleString()} ៛
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ${priceUSD.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddUniform(ut)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('+ ដាក់ក្នុងកន្ត្រក', 'Add')}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Material & Book Cards */}
            {filteredMaterials.map((item) => {
              const priceKHR = item.unitPriceKHR;
              const priceUSD = priceKHR / settings.exchangeRate;

              return (
                <div
                  key={`catalog-mat-${item.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                        {item.category === 'books' || item.category === 'textbooks' ? (
                          <BookOpen className="w-4 h-4" />
                        ) : (
                          <Tag className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 font-khmer line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-khmer capitalize">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase font-mono shrink-0">
                      {item.category === 'stationery' ? 'Stationery' : 'Book'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-base font-black text-slate-900 font-mono">
                        {priceKHR.toLocaleString()} ៛
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ${priceUSD.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddMaterial(item)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold font-khmer transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('+ ដាក់ក្នុងកន្ត្រក', 'Add')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUniforms.length === 0 && filteredMaterials.length === 0 && (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 font-khmer text-sm">
              រកមិនឃើញមុខទំនិញដែលត្រូវនឹង &ldquo;{searchQuery}&rdquo; ឡើយ
            </div>
          )}
        </div>

        {/* Right Column: Shopping Cart & Checkout Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('កន្ត្រកទំនិញ (Shopping Cart)', 'Shopping Cart')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)} pcs
                </span>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-xs text-rose-500 hover:text-rose-700 font-khmer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>សម្អាត</span>
                  </button>
                )}
              </div>
            </div>

            {/* Buyer Selection: Searchable Registered Student vs Non-Student Buyer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 font-khmer">
                  {t('អ្នកទិញ / សិស្ស (Select Buyer / Student) *', 'Select Buyer *')}
                </label>
                <div className="flex items-center gap-2 text-xs font-khmer">
                  <button
                    type="button"
                    onClick={() => setBuyerMode('student')}
                    className={`font-bold transition-colors ${
                      buyerMode === 'student' ? 'text-indigo-600 underline' : 'text-slate-400'
                    }`}
                  >
                    សិស្សក្នុងសាលា
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBuyerMode('custom')}
                    className={`font-bold transition-colors ${
                      buyerMode === 'custom' ? 'text-indigo-600 underline' : 'text-slate-400'
                    }`}
                  >
                    ទូទៅ / អាណាព្យាបាល
                  </button>
                </div>
              </div>

              {buyerMode === 'student' ? (
                <div className="space-y-1.5">
                  <SearchableSelect
                    options={studentOptions}
                    value={selectedStudentCode}
                    onChange={(val) => setSelectedStudentCode(String(val))}
                    placeholder="ស្វែងរកសិស្ស (ឈ្មោះ ឬកូដ BIM-2026-001)..."
                    searchPlaceholder="វាយឈ្មោះសិស្ស កូដ ឬថ្នាក់..."
                  />
                  {currentStudent && (
                    <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between font-khmer">
                      <span>
                        សិស្ស៖ <strong>{currentStudent.name}</strong> ({currentStudent.className})
                      </span>
                      <span className="font-mono font-bold text-emerald-700">{currentStudent.studentCode}</span>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="ឈ្មោះអ្នកទិញ / អាណាព្យាបាល (ឧ. លោក ឈុន វណ្ណា)..."
                  value={customBuyerName}
                  onChange={(e) => setCustomBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-khmer"
                />
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cartItems.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-khmer text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p>មិនទាន់មានទំនិញក្នុងកន្ត្រកនៅឡើយទេ</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    សូមចុច &ldquo;+ ដាក់ក្នុងកន្ត្រក&rdquo; លើមុខទំនិញខាងឆ្វេង
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cartItemId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 font-khmer truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {item.unitPriceKHR.toLocaleString()} ៛ · ${(item.unitPriceUSD).toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.cartItemId, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.cartItemId, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <div className="w-20 text-right font-mono font-bold text-xs text-slate-900">
                        {item.totalPriceKHR.toLocaleString()} ៛
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-md transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 font-khmer block">
                {t('វិធីទូទាត់ (Payment Method) *', 'Payment Method')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ABA')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'ABA'
                      ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-600" />
                  <span>ABA KHQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('AC')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'AC'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                  <span>ACLEDA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold font-khmer flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'Cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>សាច់ប្រាក់</span>
                </button>
              </div>
            </div>

            {/* Cash Tender & Change Calculator (if Cash selected) */}
            {paymentMethod === 'Cash' && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-khmer font-bold text-emerald-900">
                  <span>ប្រាក់ទទួលពីអតិថិជន (Cash Received)</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTenderCurrency('USD')}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        tenderCurrency === 'USD' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-700'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTenderCurrency('KHR')}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        tenderCurrency === 'KHR' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-700'
                      }`}
                    >
                      KHR (៛)
                    </button>
                  </div>
                </div>

                {tenderCurrency === 'USD' ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-emerald-700">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={cashTenderedUSD || ''}
                        onChange={(e) => setCashTenderedUSD(Number(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    {cashTenderedUSD > 0 && (
                      <div className="flex items-center justify-between text-xs font-mono pt-1 text-emerald-900">
                        <span>ប្រាក់អាប់ (Change Due):</span>
                        <span className="font-bold text-sm text-emerald-800">
                          ${changeUSD.toFixed(2)} ({(changeUSD * settings.exchangeRate).toLocaleString()} ៛)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <span className="absolute right-3 top-2 text-xs font-mono font-bold text-emerald-700">៛</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={cashTenderedKHR || ''}
                        onChange={(e) => setCashTenderedKHR(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-3 pr-7 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    {cashTenderedKHR > 0 && (
                      <div className="flex items-center justify-between text-xs font-mono pt-1 text-emerald-900">
                        <span>ប្រាក់អាប់ (Change Due):</span>
                        <span className="font-bold text-sm text-emerald-800">
                          {changeKHR.toLocaleString()} ៛ (${(changeKHR / settings.exchangeRate).toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Total Summary & Checkout Button */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="space-y-1 font-mono">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-khmer">សរុបជាប្រាក់រៀល (KHR)</span>
                  <span className="text-slate-900 font-bold">{totalCartKHR.toLocaleString()} ៛</span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-indigo-700">
                  <span className="font-khmer">សរុបត្រូវទូទាត់ (Grand Total)</span>
                  <span>${totalCartUSD.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={cartItems.length === 0 || !permissions.canCollectFee}
                onClick={handleCheckout}
                className={`w-full py-3 px-4 rounded-xl font-bold font-khmer text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  cartItems.length > 0 && permissions.canCollectFee
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>{t('គិតលុយ & ចេញវិក្កយបត្រ (Pay & Print)', 'Complete Sale & Print')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETED SALE THERMAL RECEIPT MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold font-khmer">
                <CheckCircle2 className="w-5 h-5" />
                <span>ការលក់ជោគជ័យ (Sale Completed)</span>
              </div>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Thermal Receipt Box */}
            <div className="mt-4 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl font-mono text-[11px] space-y-3">
              {/* Header */}
              <div className="text-center space-y-0.5">
                <div className="font-bold text-xs text-slate-900 font-khmer">
                  {settings.schoolNameKhmer}
                </div>
                <div className="text-[10px] text-slate-600 font-mono">
                  {settings.schoolNameEnglish}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {settings.phone}
                </div>
                <div className="pt-1 font-bold text-slate-900 text-xs uppercase tracking-wider">
                  *** វិក្កយបត្រលក់ / RECEIPT ***
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-khmer">លេខវិក្កយបត្រ:</span>
                  <span className="font-bold text-slate-900">#{completedOrder.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-khmer">កាលបរិច្ឆេទ:</span>
                  <span>{completedOrder.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-khmer">អ្នកទិញ:</span>
                  <span className="font-bold font-khmer text-slate-900 truncate max-w-[150px]">
                    {completedOrder.buyerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-khmer">អ្នកគិតលុយ:</span>
                  <span className="font-khmer">{currentUser.khmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-khmer">វិធីទូទាត់:</span>
                  <span className="font-bold">{completedOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="pt-2 border-t border-dashed border-slate-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[9px] uppercase">
                      <th className="py-1">ទំនិញ (Item)</th>
                      <th className="py-1 text-center">ចំនួន</th>
                      <th className="py-1 text-right">សរុប (៛)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-khmer text-[10px] leading-tight">
                          <div>{it.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {it.unitPriceKHR.toLocaleString()} ៛
                          </div>
                        </td>
                        <td className="py-1.5 text-center font-bold text-slate-700">
                          {it.quantity}
                        </td>
                        <td className="py-1.5 text-right font-bold text-slate-900">
                          {it.totalPriceKHR.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-[11px] font-black text-slate-900">
                  <span className="font-khmer">សរុបរួម (KHR):</span>
                  <span>{completedOrder.totalKHR.toLocaleString()} ៛</span>
                </div>
                <div className="flex justify-between text-xs font-black text-indigo-700">
                  <span className="font-khmer">សរុបរួម (USD):</span>
                  <span>${completedOrder.totalUSD.toFixed(2)}</span>
                </div>
                {completedOrder.cashTenderedUSD !== undefined && completedOrder.cashTenderedUSD > 0 && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>ប្រាក់ទទួល ($):</span>
                      <span>${completedOrder.cashTenderedUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-emerald-700">
                      <span>ប្រាក់អាប់ ($):</span>
                      <span>${(completedOrder.changeUSD || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Thank you */}
              <div className="pt-3 border-t border-dashed border-slate-300 text-center font-khmer text-[10px] text-slate-500">
                សូមអរគុណ! សូមពិនិត្យទំនិញមុនពេលចាកចេញ
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-khmer hover:bg-slate-100 text-xs"
              >
                បិទ
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold font-khmer text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>បោះពុម្ពវិក្កយបត្រ (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
