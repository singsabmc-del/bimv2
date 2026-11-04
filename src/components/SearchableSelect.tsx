import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

export interface SearchOption {
  id: string | number;
  label: string;
  subLabel?: string;
  badge?: string;
  category?: string;
  data?: any;
}

interface SearchableSelectProps {
  options: SearchOption[];
  value?: string | number;
  onChange: (value: string | number, selectedOption?: SearchOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customOptionLabel?: (query: string) => string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'ជ្រើសរើស...',
  searchPlaceholder = 'ស្វែងរក...',
  allowCustom = false,
  customOptionLabel = (q) => `ប្រើឈ្មោះ "${q}" (Non-student / Custom)`,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.id) === String(value));

  // Filter options
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchLabel = opt.label.toLowerCase().includes(q);
    const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
    const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
    return matchLabel || matchSub || matchBadge;
  });

  const showCustomOption =
    allowCustom &&
    searchQuery.trim().length > 0 &&
    !options.some(
      (opt) => opt.label.toLowerCase() === searchQuery.trim().toLowerCase()
    );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (option: SearchOption) => {
    onChange(option.id, option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectCustom = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    onChange(trimmed, { id: trimmed, label: trimmed });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalCount = filteredOptions.length + (showCustomOption ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % (totalCount || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + totalCount) % (totalCount || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showCustomOption && highlightIndex === filteredOptions.length) {
        handleSelectCustom();
      } else if (filteredOptions[highlightIndex]) {
        handleSelect(filteredOptions[highlightIndex]);
      } else if (showCustomOption) {
        handleSelectCustom();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-xl text-xs transition-all text-left ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
              <span className="font-semibold text-slate-900 truncate font-khmer">
                {selectedOption.label}
              </span>
              {selectedOption.subLabel && (
                <span className="text-[11px] text-slate-400 font-mono truncate hidden sm:inline">
                  ({selectedOption.subLabel})
                </span>
              )}
            </>
          ) : value ? (
            <span className="font-semibold text-slate-900 truncate font-khmer">
              {String(value)}
            </span>
          ) : (
            <span className="text-slate-400 font-khmer">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('', undefined);
              }}
              className="p-0.5 hover:text-slate-700 rounded-full hover:bg-slate-100"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Field */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-khmer placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredOptions.length === 0 && !showCustomOption ? (
              <div className="p-4 text-center text-xs text-slate-400 font-khmer">
                រកមិនឃើញទិន្នន័យត្រូវនឹង &ldquo;{searchQuery}&rdquo; ឡើយ
              </div>
            ) : (
              <>
                {filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.id) === String(value);
                  const isHighlighted = idx === highlightIndex;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded-lg text-xs transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-indigo-50/80 text-indigo-900'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {opt.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              isHighlighted
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        <span className="font-semibold truncate font-khmer">
                          {opt.label}
                        </span>
                        {opt.subLabel && (
                          <span className="text-[11px] text-slate-400 font-mono truncate">
                            · {opt.subLabel}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Custom write-in item */}
                {showCustomOption && (
                  <button
                    type="button"
                    onClick={handleSelectCustom}
                    onMouseEnter={() => setHighlightIndex(filteredOptions.length)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-xs font-khmer transition-colors cursor-pointer border-t border-slate-100 ${
                      highlightIndex === filteredOptions.length
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{customOptionLabel(searchQuery.trim())}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
