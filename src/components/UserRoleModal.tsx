import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Shield, Check, User, LogOut } from 'lucide-react';

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUser, allUsers, permissions, logout, t } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base font-khmer">
              {t('គ្រប់គ្រងគណនី & សិទ្ធិ (Auth & Roles)', 'Authentication & Role Permissions')}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Active Profile Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs border-2 border-slate-700">
              {currentUser.khmerName.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold font-khmer text-slate-900 text-sm truncate">
                {currentUser.khmerName}
              </div>
              <div className="text-xs text-slate-500 font-sans truncate">
                {currentUser.name}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  Role: {currentUser.role}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  @{currentUser.username}
                </span>
              </div>
            </div>
          </div>

          {/* Auto Login & Session Status */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="text-[11px] text-emerald-900 font-khmer leading-snug">
              <span className="font-bold">ការចូលប្រព័ន្ធស្វ័យប្រវត្តិ (Auto-Login Active)៖</span>
              <span className="text-emerald-700 block text-[10px]">
                គណនីនេះត្រូវបានរក្សាទុកជាប់ជានិច្ច មិនបាត់បង់ពេល Refresh ឬបើកម្តងទៀតឡើយ។
              </span>
            </div>
          </div>

          {/* Current Active Permissions Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-khmer">
            <div className="font-bold text-slate-900 text-xs">
              សិទ្ធិអនុញ្ញាតសម្រាប់គណនីបច្ចុប្បន្ន ({currentUser.role.toUpperCase()}):
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className={permissions.canEdit ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                  {permissions.canEdit ? '✓' : '✗'}
                </span>
                <span>កែប្រែទិន្នន័យ (Edit)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={permissions.canDelete ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                  {permissions.canDelete ? '✓' : '✗'}
                </span>
                <span>លុបទិន្នន័យ (Delete)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={permissions.canCollectFee ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                  {permissions.canCollectFee ? '✓' : '✗'}
                </span>
                <span>ប្រមូលថ្លៃសិក្សា (Fee Collection)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={permissions.canModifySettings ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                  {permissions.canModifySettings ? '✓' : '✗'}
                </span>
                <span>កំណត់ប្រព័ន្ធ (Settings & Backup)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(t('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?', 'Are you sure you want to log out?'))) {
                onClose();
                logout();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-lg font-bold font-khmer transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('ចាកចេញពីប្រព័ន្ធ (Log Out)', 'Log Out')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold font-khmer hover:bg-slate-800 transition-colors"
          >
            បិទផ្ទាំង
          </button>
        </div>
      </div>
    </div>
  );
};
