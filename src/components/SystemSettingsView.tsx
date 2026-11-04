import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SchoolBranch } from '../types';
import {
  Settings,
  Shield,
  Send,
  Download,
  Upload,
  UploadCloud,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building,
  DollarSign,
  UserCheck,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Plus,
  Users,
  MapPin,
  Phone,
  Mail,
  Star,
  Loader2,
  Database,
  HelpCircle,
  Radio,
  FileText,
  Search,
  Server,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { checkSupabaseHealth, SupabaseHealthResult } from '../lib/supabase';

export const SystemSettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    sendTelegramAlert,
    downloadFullBackup,
    restoreFromBackup,
    resetToInitialData,
    clearAllDataKeepSettings,
    backupToTelegramGroup,
    permissions,
    currentUser,
    switchUser,
    allUsers,
    addUser,
    updateUser,
    deleteUser,
    classData,
    telegramAlertLogs,
    clearTelegramLogs,
    deleteTelegramLog,
    branches,
    currentBranchId,
    currentBranch,
    setCurrentBranchId,
    addBranch,
    updateBranch,
    deleteBranch,
    setMainBranch,
    t,
    openAutoBackupModal,
    autoBackupConfig,
    lastBackupTime,
    exportDailySalesAndStudents,
    syncToSupabaseNow,
    restoreFromSupabaseNow,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'branches' | 'telegram' | 'supabase' | 'backup' | 'roles'>('general');
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  // Supabase state
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthResult | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingToSupabase, setIsSyncingToSupabase] = useState(false);
  const [isRestoringFromSupabase, setIsRestoringFromSupabase] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check Supabase health on mount
  React.useEffect(() => {
    checkSupabaseHealth().then((res) => setSupabaseHealth(res));
  }, []);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseMessage(null);
    try {
      const res = await checkSupabaseHealth();
      setSupabaseHealth(res);
      if (res.connected) {
        setSupabaseMessage({
          type: 'success',
          text: t(
            `ការតភ្ជាប់ទៅកាន់ Supabase ជោគជ័យ ១០០% (Latency: ${res.latencyMs || 0}ms)!`,
            `Supabase connected successfully (${res.latencyMs || 0}ms latency)!`
          ),
        });
      } else {
        setSupabaseMessage({
          type: 'error',
          text: res.error || t('មិនអាចតភ្ជាប់ទៅ Supabase បានទេ', 'Failed to connect to Supabase'),
        });
      }
    } catch (err: any) {
      setSupabaseMessage({
        type: 'error',
        text: err.message || 'Error checking Supabase',
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncingToSupabase(true);
    setSupabaseMessage(null);
    try {
      const res = await syncToSupabaseNow();
      if (res.success) {
        setSupabaseMessage({ type: 'success', text: res.message });
        const refreshed = await checkSupabaseHealth();
        setSupabaseHealth(refreshed);
      } else {
        setSupabaseMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSupabaseMessage({ type: 'error', text: err.message });
    } finally {
      setIsSyncingToSupabase(false);
    }
  };

  const handleRestoreFromSupabase = async () => {
    if (!window.confirm(t('តើអ្នកពិតជាចង់ទាញយកទិន្នន័យពី Supabase Cloud មកជំនួសទិន្នន័យបច្ចុប្បន្នមែនទេ?', 'Are you sure you want to restore data from Supabase Cloud? Current data will be replaced.'))) {
      return;
    }
    setIsRestoringFromSupabase(true);
    setSupabaseMessage(null);
    try {
      const res = await restoreFromSupabaseNow();
      if (res.success) {
        setSupabaseMessage({ type: 'success', text: res.message });
      } else {
        setSupabaseMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSupabaseMessage({ type: 'error', text: err.message });
    } finally {
      setIsRestoringFromSupabase(false);
    }
  };

  // Form states
  const [schoolKhmer, setSchoolKhmer] = useState(settings.schoolNameKhmer);
  const [schoolEnglish, setSchoolEnglish] = useState(settings.schoolNameEnglish);
  const [schoolLogo, setSchoolLogo] = useState(settings.schoolLogo || '/assets/aistudio/image_aa91f44e.png');
  const [director, setDirector] = useState(settings.directorName);
  const [accountant, setAccountant] = useState(settings.accountantName);
  const [rate, setRate] = useState(settings.exchangeRate);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);

  // Branch Management States & Modals
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<SchoolBranch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<SchoolBranch | null>(null);

  // Branch Form fields
  const [bNameKhmer, setBNameKhmer] = useState('');
  const [bNameEnglish, setBNameEnglish] = useState('');
  const [bCode, setBCode] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bDirector, setBDirector] = useState('');
  const [bAccountant, setBAccountant] = useState('');
  const [bStatus, setBStatus] = useState<'active' | 'inactive'>('active');
  const [bIsMain, setBIsMain] = useState(false);

  const handleOpenAddBranch = () => {
    setBNameKhmer('');
    setBNameEnglish('');
    setBCode(`BIM-0${branches.length + 1}`);
    setBPhone(settings.phone);
    setBEmail('');
    setBAddress(settings.address);
    setBDirector(settings.directorName);
    setBAccountant(settings.accountantName);
    setBStatus('active');
    setBIsMain(false);
    setIsAddBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: SchoolBranch) => {
    setEditingBranch(branch);
    setBNameKhmer(branch.nameKhmer);
    setBNameEnglish(branch.nameEnglish);
    setBCode(branch.code);
    setBPhone(branch.phone);
    setBEmail(branch.email || '');
    setBAddress(branch.address);
    setBDirector(branch.directorName);
    setBAccountant(branch.accountantName || '');
    setBStatus(branch.status);
    setBIsMain(!!branch.isMainBranch);
    setIsEditBranchModalOpen(true);
  };

  const handleSaveAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bNameKhmer.trim() || !bCode.trim()) {
      showNotification(t('សូមបញ្ចូលឈ្មោះសាខា និងលេខកូដ!', 'Please enter branch name and code!'), 'error');
      return;
    }

    addBranch({
      nameKhmer: bNameKhmer.trim(),
      nameEnglish: bNameEnglish.trim() || bNameKhmer.trim(),
      code: bCode.trim().toUpperCase(),
      phone: bPhone.trim() || settings.phone,
      email: bEmail.trim() || undefined,
      address: bAddress.trim() || settings.address,
      directorName: bDirector.trim() || settings.directorName,
      accountantName: bAccountant.trim() || undefined,
      status: bStatus,
      isMainBranch: bIsMain,
    });

    setIsAddBranchModalOpen(false);
    showNotification(t(`បានបន្ថែមសាខា ${bNameKhmer} ដោយជោគជ័យ!`, `Branch ${bNameKhmer} added successfully!`));
  };

  const handleSaveEditBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    if (!bNameKhmer.trim() || !bCode.trim()) {
      showNotification(t('សូមបញ្ចូលឈ្មោះសាខា និងលេខកូដ!', 'Please enter branch name and code!'), 'error');
      return;
    }

    updateBranch(editingBranch.id, {
      nameKhmer: bNameKhmer.trim(),
      nameEnglish: bNameEnglish.trim() || bNameKhmer.trim(),
      code: bCode.trim().toUpperCase(),
      phone: bPhone.trim(),
      email: bEmail.trim() || undefined,
      address: bAddress.trim(),
      directorName: bDirector.trim(),
      accountantName: bAccountant.trim() || undefined,
      status: bStatus,
      isMainBranch: bIsMain,
    });

    setIsEditBranchModalOpen(false);
    setEditingBranch(null);
    showNotification(t(`បានកែប្រែព័ត៌មានសាខា ${bNameKhmer} ដោយជោគជ័យ!`, `Branch updated successfully!`));
  };

  const handleConfirmDeleteBranch = () => {
    if (!branchToDelete) return;
    const res = deleteBranch(branchToDelete.id);
    if (!res.success) {
      showNotification(res.message || t('មិនអាចលុបសាខានេះបានទេ!', 'Cannot delete branch!'), 'error');
    } else {
      showNotification(t(`បានលុបសាខា ${branchToDelete.nameKhmer} ជោគជ័យ!`, `Branch deleted successfully!`));
    }
    setBranchToDelete(null);
  };

  // User Management Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // User Form fields
  const [formUserName, setFormUserName] = useState('');
  const [formUserKhmerName, setFormUserKhmerName] = useState('');
  const [formUserUsername, setFormUserUsername] = useState('');
  const [formUserRole, setFormUserRole] = useState<'admin' | 'accountant' | 'teacher' | 'student'>('teacher');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserClassId, setFormUserClassId] = useState('');

  // Telegram states
  const [tgEnabled, setTgEnabled] = useState(settings.telegramConfig.enabled);
  const [tgToken, setTgToken] = useState(settings.telegramConfig.botToken);
  const [tgChatId, setTgChatId] = useState(settings.telegramConfig.chatId);
  const [tgFeeAlert, setTgFeeAlert] = useState(settings.telegramConfig.alertOnFeePayment);
  const [tgCanteenAlert, setTgCanteenAlert] = useState(settings.telegramConfig.alertOnDailyCanteen);
  const [tgUniformAlert, setTgUniformAlert] = useState(settings.telegramConfig.alertOnUniformSale);
  const [tgMatAlert, setTgMatAlert] = useState(settings.telegramConfig.alertOnMaterialSale);
  const [tgAutoBackup, setTgAutoBackup] = useState(!!settings.telegramConfig.autoBackupEnabled);
  const [isBackingUpToTg, setIsBackingUpToTg] = useState(false);
  const [tgTestStatus, setTgTestStatus] = useState<string | null>(null);
  const [tgTestFeedback, setTgTestFeedback] = useState<{ type: 'success' | 'error'; message: string; botUsername?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isConfirmClearDataOpen, setIsConfirmClearDataOpen] = useState(false);

  // Auto-Detect & Test Backup Document States
  const [isDetectingChat, setIsDetectingChat] = useState(false);
  const [detectedChats, setDetectedChats] = useState<Array<{ id: string; title: string; type: string; username?: string; lastActive?: string }>>([]);
  const [detectChatNotice, setDetectChatNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isTestingBackupFile, setIsTestingBackupFile] = useState(false);
  const [backupFileTestFeedback, setBackupFileTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTgSetupGuide, setShowTgSetupGuide] = useState(false);

  // Logo Upload States & Refs
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const processAndUploadLogo = async (file: File) => {
    if (!permissions.canModifySettings) {
      showNotification(t('អ្នកគ្មានសិទ្ធិកែប្រែការកំណត់ទេ!', 'Permission Denied: Cannot modify settings!'), 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showNotification(t('សូមជ្រើសរើសឯកសាររូបភាពប៉ុណ្ណោះ (PNG, JPG, SVG, WebP)!', 'Please select an image file only (PNG, JPG, SVG, WebP)!'), 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification(t('ទំហំរូបភាពធំពេក សូមជ្រើសរូបភាពក្រោម 10MB!', 'Image file too large, please select an image under 10MB!'), 'error');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        let finalUrl = base64Data;

        try {
          const res = await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              filename: file.name,
            }),
          });
          const json = await res.json();
          if (json.success && json.url) {
            finalUrl = json.url;
          }
        } catch (apiErr) {
          console.warn('Server upload fallback to base64 Data URL:', apiErr);
        }

        setSchoolLogo(finalUrl);
        updateSettings({ schoolLogo: finalUrl });
        setIsUploadingLogo(false);
        showNotification(t('បានផ្ទុកឡើង និងផ្លាស់ប្តូរ Logo សាលាដោយជោគជ័យ!', 'School logo uploaded and updated successfully!'));
      };

      reader.onerror = () => {
        setIsUploadingLogo(false);
        showNotification(t('មានបញ្ហាក្នុងការអានរូបភាព!', 'Failed to read image!'), 'error');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploadingLogo(false);
      showNotification(err.message || t('ការផ្ទុកឡើងបានបរាជ័យ!', 'Upload failed!'), 'error');
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadLogo(file);
    }
    e.target.value = '';
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadLogo(file);
    }
  };

  // Save general settings
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      schoolNameKhmer: schoolKhmer,
      schoolNameEnglish: schoolEnglish,
      schoolLogo,
      directorName: director,
      accountantName: accountant,
      exchangeRate: Number(rate) || 4100,
      academicYear,
      phone,
      address,
    });
    showNotification(t('បានរក្សាទុកការកំណត់ជោគជ័យ!', 'Settings saved successfully!'));
  };

  // Save telegram settings
  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      telegramConfig: {
        enabled: tgEnabled,
        botToken: tgToken,
        chatId: tgChatId,
        alertOnFeePayment: tgFeeAlert,
        alertOnDailyCanteen: tgCanteenAlert,
        alertOnUniformSale: tgUniformAlert,
        alertOnMaterialSale: tgMatAlert,
        autoBackupEnabled: tgAutoBackup,
      },
    });
    showNotification(t('បានរក្សាទុកការកំណត់ Telegram ជោគជ័យ!', 'Telegram alert configuration saved!'));
  };

  // Helper to clean client Telegram parameters
  const cleanClientTelegram = (token: string, chatId: string) => {
    let cleanToken = (token || '').trim().replace(/^bot(?=\d+:)/i, '').replace(/[\r\n\t]/g, '');
    let cleanChatId = (chatId || '').trim().replace(/[\r\n\t"']/g, '');

    if (cleanChatId.includes('web.telegram.org') && cleanChatId.includes('#-')) {
      const match = cleanChatId.match(/#(-?\d+)/);
      if (match) cleanChatId = match[1];
    } else if (cleanChatId.match(/t\.me\/c\/(\d+)/)) {
      const match = cleanChatId.match(/t\.me\/c\/(\d+)/);
      if (match) cleanChatId = `-100${match[1]}`;
    } else if (cleanChatId.startsWith('https://t.me/')) {
      cleanChatId = '@' + cleanChatId.replace('https://t.me/', '').split('/')[0].split('?')[0];
    } else if (cleanChatId.startsWith('t.me/')) {
      cleanChatId = '@' + cleanChatId.replace('t.me/', '').split('/')[0].split('?')[0];
    }

    if (/^100\d{8,11}$/.test(cleanChatId)) {
      cleanChatId = `-${cleanChatId}`;
    }

    return { cleanToken, cleanChatId };
  };

  const handleTestTelegram = async () => {
    if (!tgToken.trim() || !tgChatId.trim()) {
      setTgTestFeedback({
        type: 'error',
        message: t('សូមបញ្ចូល Bot Token និង Chat ID ជាមុនសិន!', 'Please enter Telegram Bot Token and Chat ID first!'),
      });
      return;
    }

    setTgTestStatus('testing');
    setTgTestFeedback(null);

    const { cleanToken, cleanChatId } = cleanClientTelegram(tgToken, tgChatId);

    try {
      let isSuccess = false;
      let botUsername = '';
      let errorMsg = '';

      // 1. Try server proxy endpoint first
      try {
        const res = await fetch('/api/telegram/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: cleanToken,
            chatId: cleanChatId,
          }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.success) {
            isSuccess = true;
            botUsername = data.botUsername || '';
          } else if (data && data.error) {
            errorMsg = data.error;
          }
        }
      } catch (proxyErr) {
        console.warn('Server test endpoint unreachable, using direct Telegram API fallback:', proxyErr);
      }

      // 2. Direct client-side fallback if server proxy was not reachable
      if (!isSuccess && !errorMsg) {
        // Step A: Verify Bot via getMe
        const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
        const meData = await meRes.json();
        if (!meRes.ok || !meData.ok) {
          throw new Error(meData.description || 'Bot Token មិនត្រឹមត្រូវ សូមពិនិត្យ Bot Token ឡើងវិញ!');
        }
        botUsername = meData.result?.username ? `@${meData.result.username}` : meData.result?.first_name;

        // Step B: Send test message
        const testText = `🔔 តេស្តប្រព័ន្ធ Telegram Alerts (BIM Rangsei School)\n\n✅ ការតភ្ជាប់ជោគជ័យ ១០០%!\n🤖 Bot: ${botUsername}\n📢 Chat ID: ${cleanChatId}\n⏱ កាលបរិច្ឆេទ: ${new Date().toLocaleString('km-KH')}`;
        const sendRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: testText,
          }),
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.ok) {
          let hint = sendData.description || 'បរាជ័យក្នុងការផ្ញើសារ';
          if (hint.includes('chat not found')) {
            hint = `រកមិនឃើញ Chat ID "${cleanChatId}" ទេ។ សូម Add Bot (${botUsername}) ចូលក្នុង Group ហើយតម្លើងជា Admin។`;
          }
          throw new Error(hint);
        }
        isSuccess = true;
      }

      if (isSuccess) {
        setTgTestStatus('success');
        setTgTestFeedback({
          type: 'success',
          message: t('បានផ្ញើសារតេស្តទៅកាន់ Telegram ជោគជ័យ!', 'Test message sent successfully!'),
          botUsername,
        });
        setTimeout(() => setTgTestStatus(null), 5000);
      } else {
        setTgTestStatus('error');
        setTgTestFeedback({
          type: 'error',
          message: errorMsg || t('ការផ្ញើសារបរាជ័យ។ សូមពិនិត្យ Bot Token និង Chat ID!', 'Failed to send test alert.'),
          botUsername,
        });
      }
    } catch (err: any) {
      setTgTestStatus('error');
      setTgTestFeedback({
        type: 'error',
        message: err.message || t('មានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ Telegram Server', 'Error connecting to Telegram server'),
      });
    }
  };

  const handleDetectTelegramChat = async () => {
    if (!tgToken.trim()) {
      setDetectChatNotice({
        type: 'error',
        message: t('សូមបញ្ចូល Telegram Bot Token ជាមុនសិន!', 'Please enter Telegram Bot Token first!'),
      });
      return;
    }

    if (tgToken.trim() === 'bot_demo_token_bim_school' || tgToken.trim().startsWith('bot_demo_')) {
      setDetectChatNotice({
        type: 'error',
        message: t(
          'Bot Token នៅជា Demo នៅឡើយ។ សូមបង្កើត Bot ថ្មីជាមួយ @BotFather ក្នុង Telegram រួចចម្លង Token មកដាក់ទីនេះ។',
          'Bot Token is still a demo token. Please get a real token from @BotFather in Telegram.'
        ),
      });
      return;
    }

    setIsDetectingChat(true);
    setDetectChatNotice(null);

    const { cleanToken } = cleanClientTelegram(tgToken, '');

    try {
      let data: any = null;

      // 1. Try server proxy endpoint first
      try {
        const res = await fetch('/api/telegram/detect-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken: cleanToken }),
        });

        if (res.ok) {
          const parsed = await res.json().catch(() => null);
          if (parsed && parsed.success) {
            data = parsed;
          }
        }
      } catch (proxyErr) {
        console.warn('Server detect-chat endpoint unreachable, falling back to direct Telegram API:', proxyErr);
      }

      // 2. Direct client-side Telegram API fallback (100% resilient if server proxy returned 404 or failed)
      if (!data || !data.success) {
        // Step A: Verify Bot Token via getMe
        const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
        const meData = await meRes.json();

        if (!meRes.ok || !meData.ok) {
          throw new Error(
            `Bot Token មិនត្រឹមត្រូវ (${meData.description || 'Unauthorized'})។ សូមពិនិត្យ Bot Token ពី @BotFather ឡើងវិញ។`
          );
        }

        const botUsername = meData.result?.username ? `@${meData.result.username}` : meData.result?.first_name;

        // Step B: Fetch updates to extract active groups
        const updatesRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates?limit=50`);
        const updatesData = await updatesRes.json();

        if (!updatesRes.ok || !updatesData.ok) {
          throw new Error(updatesData.description || 'មិនអាចទាញយក updates ពី Telegram បានទេ');
        }

        const chatsMap = new Map<string, { id: string; title: string; type: string; username?: string; lastActive?: string }>();

        (updatesData.result || []).forEach((u: any) => {
          const msg = u.message || u.channel_post || u.my_chat_member || u.edited_message;
          if (msg && msg.chat) {
            const chat = msg.chat;
            const chatIdStr = String(chat.id);
            const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || 'Chat';
            const type = chat.type || 'group';
            chatsMap.set(chatIdStr, {
              id: chatIdStr,
              title,
              type,
              username: chat.username ? `@${chat.username}` : undefined,
              lastActive: msg.date ? new Date(msg.date * 1000).toISOString() : undefined,
            });
          }
        });

        data = {
          success: true,
          botUsername,
          chats: Array.from(chatsMap.values()),
          count: chatsMap.size,
        };
      }

      if (data && data.success) {
        if (data.chats && data.chats.length > 0) {
          setDetectedChats(data.chats);
          // If only 1 group found, auto-select it
          if (data.chats.length === 1) {
            setTgChatId(data.chats[0].id);
            setDetectChatNotice({
              type: 'success',
              message: t(
                `បានរកឃើញ Group/Channel៖ "${data.chats[0].title}" (ID: ${data.chats[0].id}) និងបានបំពេញដោយស្វ័យប្រវត្ត!`,
                `Discovered: "${data.chats[0].title}" (ID: ${data.chats[0].id}) and auto-filled!`
              ),
            });
          } else {
            setDetectChatNotice({
              type: 'info',
              message: t(
                `បានរកឃើញ Group/Channel ចំនួន ${data.chats.length}។ សូមចុចជ្រើសរើស Group ដែលចង់ប្រើប្រាស់ខាងក្រោម៖`,
                `Discovered ${data.chats.length} chats. Click to select one below:`
              ),
            });
          }
        } else {
          setDetectedChats([]);
          setDetectChatNotice({
            type: 'info',
            message: t(
              `Bot (${data.botUsername || ''}) ដំណើរការល្អ! ប៉ុន្តែមិនទាន់ទទួលបានសារក្នុង Group ណាមួយនៅឡើយទេ។ ដំណោះស្រាយ៖ សូម Add Bot ចូលក្នុង Telegram Group ហើយសរសេរសារតេស្តណាមួយ (ឧ. hello) ក្នុង Group នោះ រួចចុច "ស្វែងរក Group ID" ម្តងទៀត។`,
              `Bot verified! No group messages received yet. Please add bot to your Telegram group and send a message there, then click Auto-Detect again.`
            ),
          });
        }
      } else {
        setDetectChatNotice({
          type: 'error',
          message: data?.error || t('មិនអាចស្វែងរក Telegram Group បានទេ', 'Failed to detect chats'),
        });
      }
    } catch (err: any) {
      setDetectChatNotice({
        type: 'error',
        message: err.message || t('មានបញ្ហាក្នុងការតភ្ជាប់', 'Connection error'),
      });
    } finally {
      setIsDetectingChat(false);
    }
  };

  const handleTestBackupFileToTelegram = async () => {
    if (!tgToken.trim() || !tgChatId.trim()) {
      setBackupFileTestFeedback({
        type: 'error',
        message: t('សូមបញ្ចូល Bot Token និង Chat ID ជាមុនសិន!', 'Please enter Bot Token and Chat ID first!'),
      });
      return;
    }

    setIsTestingBackupFile(true);
    setBackupFileTestFeedback(null);

    try {
      const res = await backupToTelegramGroup();
      if (res.success) {
        setBackupFileTestFeedback({
          type: 'success',
          message: res.message || t('បានផ្ញើឯកសារ Backup (.json) ទៅកាន់ Telegram Group ជោគជ័យ!', 'Backup file sent successfully!'),
        });
      } else {
        setBackupFileTestFeedback({
          type: 'error',
          message: res.message || t('បរាជ័យក្នុងការផ្ញើឯកសារ Backup ទៅកាន់ Telegram', 'Failed to send backup file'),
        });
      }
    } catch (err: any) {
      setBackupFileTestFeedback({
        type: 'error',
        message: err.message || t('មានបញ្ហាក្នុងការផ្ញើឯកសារ Backup', 'Error sending backup file'),
      });
    } finally {
      setIsTestingBackupFile(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const ok = restoreFromBackup(content);
      if (ok) {
        showNotification(t('ទិន្នន័យត្រូវបានស្តារឡើងវិញពី Backup ជោគជ័យ!', 'Backup successfully restored!'));
      } else {
        showNotification(t('ឯកសារ Backup មិនត្រឹមត្រូវ!', 'Invalid backup file!'), 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 font-khmer">
                សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
                {t('ការកំណត់ប្រព័ន្ធ, Backup & Telegram Alerts', 'System Settings, Data Backup & Telegram Alerts')}
              </h2>
              <div className="text-xs text-slate-500">
                School administration profile, financial rates, RBAC security, and automation
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>Role: {currentUser.role.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* In-App Status Notification Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-khmer flex items-center gap-2 animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-100 text-xs font-khmer">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'general' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('ព័ត៌មានទូទៅសាលា (School Profile)', 'General Profile')}
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'branches' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{t('សាខាសាលា (Campuses & Branches)', 'Campuses & Branches')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'branches' ? 'bg-white text-amber-900' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {branches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'telegram' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('Telegram Alerts ស្វ័យប្រវត្តិ', 'Telegram Alerts')}</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'supabase' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span>{t('មូលដ្ឋានទិន្នន័យ Supabase Cloud', 'Supabase Cloud DB')}</span>
            <span className={`w-2 h-2 rounded-full ${supabaseHealth?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`}></span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('ទិន្នន័យ Backup & Restore', 'Data Backup & Restore')}</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'roles' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t('សិទ្ធិ Role & អ្នកប្រើប្រាស់ (RBAC)', 'Role Permissions & Users')}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: General Profile */}
      {activeTab === 'general' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs w-full">
          <h3 className="font-bold text-slate-900 text-base font-khmer mb-4">
            ព័ត៌មានទូទៅសាលា និងហត្ថលេខាផ្លូវការ (Official School Information)
          </h3>

          <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">ឈ្មោះសាលា (ភាសាខ្មែរ)</label>
                <input
                  type="text"
                  value={schoolKhmer}
                  onChange={(e) => setSchoolKhmer(e.target.value)}
                  disabled={!permissions.canModifySettings}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer text-sm disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">School Name (English)</label>
                <input
                  type="text"
                  value={schoolEnglish}
                  onChange={(e) => setSchoolEnglish(e.target.value)}
                  disabled={!permissions.canModifySettings}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 font-semibold"
                  required
                />
              </div>
            </div>

            {/* School Logo Upload & Settings Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block text-slate-800 font-bold font-khmer text-xs">
                    ឡូហ្គោសាលា & ត្រាក្បាលលិខិត (School Logo & Emblem for Roster & Reports)
                  </label>
                  <p className="text-[11px] text-slate-500 font-khmer mt-0.5">
                    ឡូហ្គោនេះនឹងត្រូវបានទាញយកទៅបង្ហាញដោយស្វ័យប្រវត្តិនៅលើបញ្ជីនាមសិស្សតាមថ្នាក់ និងរបាយការណ៍បោះពុម្ព
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-khmer font-semibold underline underline-offset-2"
                  >
                    {showUrlInput ? 'លាក់ប្រអប់ URL' : 'បញ្ចូលតាម URL / Link'}
                  </button>
                </div>
              </div>

              {/* Hidden Native File Input */}
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                onChange={handleLogoFileChange}
                className="hidden"
              />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Logo Preview Box */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="relative w-28 h-28 rounded-xl border border-slate-200 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center overflow-hidden p-2 group">
                    {schoolLogo ? (
                      <img
                        src={schoolLogo}
                        alt="School Logo Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 stroke-1" />
                        <span className="text-[10px]">គ្មាន Logo</span>
                      </div>
                    )}

                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white text-[11px] font-khmer">
                        <Loader2 className="w-6 h-6 animate-spin mb-1 text-amber-400" />
                        <span>កំពុងផ្ទុកឡើង...</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {schoolLogo.startsWith('data:') ? 'Custom Upload (Base64)' : schoolLogo.slice(0, 30) + '...'}
                  </span>
                </div>

                {/* Upload & Actions Box / Drag & Drop Target */}
                <div className="md:col-span-8 space-y-2.5">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverLogo(true);
                    }}
                    onDragLeave={() => setIsDragOverLogo(false)}
                    onDrop={handleLogoDrop}
                    onClick={() => permissions.canModifySettings && logoFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragOverLogo
                        ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                        : 'border-slate-300 hover:border-slate-400 hover:bg-white bg-slate-100/50'
                    } ${!permissions.canModifySettings ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-2xs">
                      {isUploadingLogo ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                    </div>
                    <div className="font-bold text-slate-800 text-xs font-khmer">
                      {t('ចុចទីនេះដើម្បីជ្រើសរើសរូបភាព ឬទាញទម្លាក់ចូល (Click or Drag & Drop)', 'Click to upload or drag & drop logo image')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      គាំទ្រប្រភេទ PNG, JPG, SVG, WebP (អតិបរមា 10MB)
                    </div>
                  </div>

                  {/* Buttons Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={!permissions.canModifySettings || isUploadingLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-khmer font-bold text-xs shadow-2xs transition-all disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('ផ្ទុកឡើង Logo ថ្មី (Upload Logo)', 'Upload Logo')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!permissions.canModifySettings || isUploadingLogo}
                      onClick={() => {
                        const defaultLogo = '/assets/aistudio/image_aa91f44e.png';
                        setSchoolLogo(defaultLogo);
                        updateSettings({ schoolLogo: defaultLogo });
                        showNotification(t('បានប្តូរទៅ Logo ដើមក្រសួង MoEYS រួចរាល់!', 'Reset to default MoEYS logo!'));
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-khmer font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('ប្រើ Logo ដើម (MoEYS)', 'Default MoEYS')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!permissions.canModifySettings || isUploadingLogo}
                      onClick={() => {
                        const bimBadge = 'https://api.dicebear.com/7.x/identicon/svg?seed=BIMRangseiSchool';
                        setSchoolLogo(bimBadge);
                        updateSettings({ schoolLogo: bimBadge });
                        showNotification(t('បានប្តូរទៅ BIM Crest Badge រួចរាល់!', 'Switched to BIM Crest Badge!'));
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-khmer font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <span>BIM Crest Badge</span>
                    </button>
                  </div>

                  {/* Optional Direct URL Input */}
                  {showUrlInput && (
                    <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px] font-khmer">
                        URL ឬ Link រូបភាព Logo ផ្ទាល់៖
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={schoolLogo}
                          onChange={(e) => setSchoolLogo(e.target.value)}
                          disabled={!permissions.canModifySettings}
                          placeholder="https://... ឬ /assets/..."
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateSettings({ schoolLogo });
                            showNotification(t('បានរក្សាទុក URL Logo រួចរាល់!', 'Logo URL saved!'));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-khmer text-xs font-bold"
                        >
                          អនុវត្ត
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  នាយកសាលា (បានឃើញ និងឯកភាព)
                </label>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  disabled={!permissions.canModifySettings}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer disabled:bg-slate-100 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  គណនេយ្យករ (រៀបចំដោយ)
                </label>
                <input
                  type="text"
                  value={accountant}
                  onChange={(e) => setAccountant(e.target.value)}
                  disabled={!permissions.canModifySettings}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer disabled:bg-slate-100 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Exchange Rate ($1.00 USD → KHR ៛)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1000"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  disabled={!permissions.canModifySettings}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-sm disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  disabled={!permissions.canModifySettings}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono disabled:bg-slate-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">លេខទូរស័ព្ទទាក់ទង</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!permissions.canModifySettings}
                  placeholder="012 345 678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">អាសយដ្ឋានសាលា</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!permissions.canModifySettings}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer disabled:bg-slate-100"
                />
              </div>
            </div>

            {permissions.canModifySettings && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer transition-colors shadow-xs"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab: Multi-Campus & Branches Management */}
      {activeTab === 'branches' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-khmer flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-600" />
                <span>ការគ្រប់គ្រងសាខាសាលា (Multi-Campus & Branch Management)</span>
              </h3>
              <p className="text-xs text-slate-500 font-khmer mt-1">
                បន្ថែម កែប្រែ ឬលុបសាខាសាលា និងកំណត់សាខាសកម្មសម្រាប់ប្រតិបត្តិការ និងការចេញវិក្កយបត្រ
              </p>
            </div>

            {permissions.canModifySettings && (
              <button
                type="button"
                onClick={handleOpenAddBranch}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold font-khmer text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>បន្ថែមសាខាថ្មី (Add Branch)</span>
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-500 block font-khmer">សាខាសរុប (Total Campuses):</span>
              <span className="text-2xl font-mono font-bold text-slate-900">{branches.length}</span>
              <div className="text-[11px] text-slate-400 font-khmer mt-0.5">
                {branches.filter((b) => b.status === 'active').length} សាខាកំពុងដំណើរការ
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs">
              <span className="text-amber-800 block font-khmer font-medium">សាខាសកម្មឥឡូវនេះ (Active Campus):</span>
              <span className="text-base font-bold text-amber-950 font-khmer truncate block mt-0.5">
                {currentBranch.nameKhmer}
              </span>
              <div className="text-[11px] text-amber-700 font-mono mt-0.5">
                Code: {currentBranch.code} · Tel: {currentBranch.phone}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-500 block font-khmer">ទីស្នាក់ការកណ្តាល (Headquarters / HQ):</span>
              <span className="text-base font-bold text-slate-800 font-khmer truncate block mt-0.5">
                {branches.find((b) => b.isMainBranch)?.nameKhmer || currentBranch.nameKhmer}
              </span>
              <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                នាយក៖ {branches.find((b) => b.isMainBranch)?.directorName || settings.directorName}
              </div>
            </div>
          </div>

          {/* Branches Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {branches.map((b) => {
              const isActive = b.id === currentBranchId;
              const isMain = !!b.isMainBranch;

              return (
                <div
                  key={b.id}
                  className={`rounded-2xl p-5 border transition-all text-xs space-y-4 ${
                    isActive
                      ? 'border-amber-400 bg-amber-50/20 shadow-xs ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono font-bold text-[11px]">
                          {b.code}
                        </span>
                        {isMain && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-khmer font-bold text-[10px] flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>សាខាមេ (HQ)</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-khmer font-bold text-[10px] flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>កំពុងជ្រើសរើស (Active)</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            b.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {b.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base font-khmer pt-1">
                        {b.nameKhmer}
                      </h4>
                      <div className="text-slate-500 text-[11px] font-medium">
                        {b.nameEnglish}
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Building className="w-5 h-5 text-amber-700" />
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="space-y-1">
                      <div className="text-slate-500 font-khmer">នាយកសាខា (Director):</div>
                      <div className="font-bold text-slate-800 font-khmer">{b.directorName}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-500 font-khmer">គណនេយ្យករ (Accountant):</div>
                      <div className="font-bold text-slate-800 font-khmer">{b.accountantName || '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-500 font-khmer flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>លេខទូរស័ព្ទ៖</span>
                      </div>
                      <div className="font-mono font-bold text-slate-800">{b.phone}</div>
                    </div>
                    {b.email && (
                      <div className="space-y-1">
                        <div className="text-slate-500 font-khmer flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>អ៊ីមែល៖</span>
                        </div>
                        <div className="font-mono text-slate-700 truncate">{b.email}</div>
                      </div>
                    )}
                    <div className="sm:col-span-2 space-y-1">
                      <div className="text-slate-500 font-khmer flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>អាសយដ្ឋានសាខា៖</span>
                      </div>
                      <div className="text-slate-700 font-khmer leading-relaxed">{b.address}</div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentBranchId(b.id);
                            showNotification(t(`បានប្តូរទៅកាន់សាខា ${b.nameKhmer}!`, `Switched to ${b.nameEnglish}!`));
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-khmer font-bold text-[11px] transition-colors"
                        >
                          {t('ជ្រើសរើសជាសាខាសកម្ម', 'Switch to Branch')}
                        </button>
                      )}
                      {!isMain && permissions.canModifySettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setMainBranch(b.id);
                            showNotification(t(`បានកំណត់ ${b.nameKhmer} ជាសាខាមេ!`, `Set as main campus!`));
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-khmer font-bold text-[11px] transition-colors"
                        >
                          {t('កំណត់ជាសាខាមេ', 'Set as HQ')}
                        </button>
                      )}
                    </div>

                    {permissions.canModifySettings && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditBranch(b)}
                          className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                          title={t('កែប្រែព័ត៌មានសាខា', 'Edit Branch')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBranchToDelete(b)}
                          disabled={branches.length <= 1 || isMain}
                          className={`p-1.5 rounded-lg transition-colors ${
                            branches.length <= 1 || isMain
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={
                            isMain
                              ? t('មិនអាចលុបសាខាមេបានទេ', 'Cannot delete main campus')
                              : branches.length <= 1
                              ? t('មិនអាចលុបសាខាចុងក្រោយបានទេ', 'Cannot delete the only branch')
                              : t('លុបសាខានេះ', 'Delete Branch')
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Telegram Alerts */}
      {activeTab === 'telegram' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-khmer flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-600" />
                <span>ការកំណត់ការជូនដំណឹងតាម Telegram (Automated Telegram Alerts &amp; File Backup)</span>
              </h3>
              <p className="text-xs text-slate-500 font-khmer mt-1">
                ផ្ញើសារជូនដំណឹងភ្លាមៗ និងឯកសារ Backup (.json) ទៅកាន់ Telegram Group របស់គណៈគ្រប់គ្រងសាលា
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTgSetupGuide(!showTgSetupGuide)}
              className="px-3 py-1.5 rounded-lg border border-sky-200 hover:border-sky-300 bg-sky-50 text-sky-800 text-xs font-khmer font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>{showTgSetupGuide ? 'លាក់ការណែនាំដំឡើង' : 'របៀបដំឡើង Bot & Group (Guide)'}</span>
            </button>
          </div>

          {/* Interactive Step-by-Step Setup Guide */}
          {showTgSetupGuide && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="font-bold text-sky-950 font-khmer flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px] font-bold">i</span>
                <span>ការណែនាំបង្កើត Telegram Bot &amp; ភ្ជាប់ជាមួយ Group (៣ ជំហានងាយៗ)៖</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700 font-khmer">
                <div className="p-3 bg-white/90 rounded-xl border border-sky-100 space-y-1.5">
                  <div className="font-bold text-sky-900 text-[11px] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold">1</span>
                    <span>បង្កើត Bot ជាមួយ @BotFather</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    បើក Telegram ស្វែងរក <b>@BotFather</b> រួចផ្ញើ <code>/newbot</code>។ កំណត់ឈ្មោះ និង Username រួចចម្លង <b>HTTP API Token</b> មកបិទភ្ជាប់ក្នុងប្រអប់ "Telegram Bot Token"។
                  </p>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-sky-100 space-y-1.5">
                  <div className="font-bold text-sky-900 text-[11px] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold">2</span>
                    <span>Add Bot ចូល Group &amp; តម្លើងជា Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ចូលក្នុង Telegram Group ឬបង្កើត Group ថ្មី រួច Add Bot របស់អ្នកចូលជាសមាជិក។ <strong>សំខាន់៖</strong> ត្រូវតម្លើងសិទ្ធិ Bot ជា <b>Administrator</b> ដើម្បីឱ្យ Bot អាចផ្ញើសារ និងឯកសារ Backup បាន។
                  </p>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-sky-100 space-y-1.5">
                  <div className="font-bold text-sky-900 text-[11px] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold">3</span>
                    <span>ស្វែងរក Group ID ដោយស្វ័យប្រវត្ត</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    សរសេរសារតេស្តណាមួយ (ឧ. "Hello") ក្នុង Group នោះ រួចចុចប៊ូតុង <b>"ស្វែងរក Group ID ដោយស្វ័យប្រវត្ត"</b> នៅខាងក្រោម។ ប្រព័ន្ធនឹងរកឃើញ Group ID (ឧ. <code>-100...</code>) ភ្លាមៗ!
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveTelegram} className="space-y-4 text-xs">
            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sky-900 font-khmer text-sm">
                  ដំណើរការ Telegram Notification &amp; Auto-Backup
                </div>
                <div className="text-[11px] text-sky-700 font-khmer">
                  បើក/បិទការជូនដំណឹងស្វ័យប្រវត្តិ និងការផ្ញើឯកសារ Backup ទៅ Telegram
                </div>
              </div>
              <input
                type="checkbox"
                checked={tgEnabled}
                onChange={(e) => setTgEnabled(e.target.checked)}
                className="w-5 h-5 text-sky-600 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bot Token Input */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Telegram Bot Token</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tgToken}
                    onChange={(e) => setTgToken(e.target.value)}
                    placeholder="e.g. 712345678:AAH..."
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-khmer mt-1">
                  ទាញយកពី @BotFather ក្នុង Telegram (ចម្លងលេខកូដ API Token)
                </p>
              </div>

              {/* Chat ID Input with Auto-Detect Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Channel / Group Chat ID</label>
                  <button
                    type="button"
                    onClick={handleDetectTelegramChat}
                    disabled={isDetectingChat}
                    className="text-[11px] text-sky-700 hover:text-sky-900 font-khmer font-bold flex items-center gap-1 underline underline-offset-2 cursor-pointer disabled:opacity-50"
                  >
                    {isDetectingChat ? (
                      <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                    ) : (
                      <Search className="w-3 h-3 text-sky-600" />
                    )}
                    <span>{isDetectingChat ? 'កំពុងស្វែងរក...' : 'ស្វែងរក Group ID ដោយស្វ័យប្រវត្ត'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  placeholder="e.g. -1001234567890 or @bim_finance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
                <p className="text-[10px] text-slate-400 font-khmer mt-1">
                  Telegram Group ID ច្រើនចាប់ផ្តើមដោយសញ្ញាដក <code>-100...</code> (ឧ. <code>-1002345678901</code>)
                </p>
              </div>
            </div>

            {/* Auto-Detect Feedback / Discovered Chats Card */}
            {detectChatNotice && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-khmer flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  detectChatNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : detectChatNotice.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {detectChatNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : detectChatNotice.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="leading-relaxed">{detectChatNotice.message}</div>

                  {/* List of detected chats if multiple */}
                  {detectedChats.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-current/10">
                      <div className="font-bold text-[11px]">បញ្ជី Group/Channel ដែល Bot បានចូលរួម៖</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {detectedChats.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setTgChatId(c.id);
                              showNotification(t(`បានជ្រើសរើស Group "${c.title}"!`, `Selected "${c.title}"!`));
                            }}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              tgChatId === c.id
                                ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold truncate text-xs">{c.title}</div>
                              <div className={`font-mono text-[10px] ${tgChatId === c.id ? 'text-sky-100' : 'text-slate-500'}`}>
                                ID: {c.id} · ({c.type})
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              tgChatId === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {tgChatId === c.id ? 'កំពុងជ្រើស' : 'ជ្រើសរើស'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Triggers */}
            <div className="pt-2">
              <div className="font-bold text-slate-800 font-khmer mb-2">ព្រឹត្តិការណ៍ដែលត្រូវផ្ញើសារ Alert (Triggers):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgFeeAlert}
                    onChange={(e) => setTgFeeAlert(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-khmer font-medium text-slate-800">ពេលប្រមូលថ្លៃសិក្សាសិស្ស (Tuition Payment)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgCanteenAlert}
                    onChange={(e) => setTgCanteenAlert(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-khmer font-medium text-slate-800">ពេលកត់ត្រាវត្តមានអ្នកលក់អាហារ (Canteen Stalls)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgUniformAlert}
                    onChange={(e) => setTgUniformAlert(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-khmer font-medium text-slate-800">ពេលលក់ឯកសណ្ឋានសិស្ស (Uniform Sale)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tgMatAlert}
                    onChange={(e) => setTgMatAlert(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-khmer font-medium text-slate-800">ពេលលក់សម្ភារៈសិក្សា &amp; សៀវភៅ (Supplies Sale)</span>
                </label>
              </div>
            </div>

            {/* Actions Row */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Test Message */}
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={tgTestStatus === 'testing' || !tgToken.trim() || !tgChatId.trim()}
                  className="px-3.5 py-2 border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg font-bold font-khmer flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {tgTestStatus === 'testing'
                      ? 'កំពុងផ្ញើសារ...'
                      : tgTestStatus === 'success'
                      ? 'សារតេស្តបានជោគជ័យ ✅'
                      : '១. ផ្ញើសារតេស្ត (Test Alert)'}
                  </span>
                </button>

                {/* Test Backup Document Dispatch (.json) */}
                <button
                  type="button"
                  onClick={handleTestBackupFileToTelegram}
                  disabled={isTestingBackupFile || !tgToken.trim() || !tgChatId.trim()}
                  className="px-3.5 py-2 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg font-bold font-khmer flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="ផ្ញើឯកសារ .json Backup ទៅ Telegram Group ដើម្បីផ្ទៀងផ្ទាត់ការទាញយកឯកសារ"
                >
                  {isTestingBackupFile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>
                    {isTestingBackupFile ? 'កំពុងផ្ញើ Backup File...' : '២. ផ្ញើឯកសារ Backup តេស្ត (.json)'}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer transition-colors shadow-xs cursor-pointer"
              >
                រក្សាទុក Telegram
              </button>
            </div>

            {/* Test Alert Feedback */}
            {tgTestFeedback && (
              <div
                className={`mt-3 p-3.5 rounded-xl border text-xs font-khmer flex items-start gap-3 animate-in fade-in duration-200 ${
                  tgTestFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {tgTestFeedback.type === 'success' ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">!</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>{tgTestFeedback.type === 'success' ? 'ការតភ្ជាប់ Telegram ដំណើរការល្អ (Operational)' : 'បរាជ័យក្នុងការតភ្ជាប់ Telegram'}</span>
                    {tgTestFeedback.botUsername && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white/80 rounded border border-current">
                        {tgTestFeedback.botUsername}
                      </span>
                    )}
                  </div>
                  <div className="leading-relaxed opacity-95">{tgTestFeedback.message}</div>
                </div>
              </div>
            )}

            {/* Backup File Test Feedback */}
            {backupFileTestFeedback && (
              <div
                className={`mt-2 p-3.5 rounded-xl border text-xs font-khmer flex items-start gap-3 animate-in fade-in duration-200 ${
                  backupFileTestFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {backupFileTestFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-bold">
                    {backupFileTestFeedback.type === 'success' ? 'ការផ្ញើឯកសារ Backup (.json) ជោគជ័យ' : 'បរាជ័យក្នុងការផ្ញើ Backup File'}
                  </div>
                  <div className="leading-relaxed opacity-95">{backupFileTestFeedback.message}</div>
                </div>
              </div>
            )}
          </form>

          {/* Telegram Alert Logs History & Clear Control */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
                  <span>ប្រវត្តិសារ Telegram Alerts (Alert History Logs)</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-mono font-bold">
                    {telegramAlertLogs.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  បញ្ជីកំណត់ត្រាប្រតិបត្តិការដែលបានផ្ញើទៅកាន់ Telegram ដោយស្វ័យប្រវត្តិ
                </p>
              </div>

              {telegramAlertLogs.length > 0 && (
                <div>
                  {confirmClearLogs ? (
                    <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="text-xs text-rose-800 font-khmer font-bold">
                        {t('តើអ្នកពិតជាចង់សម្អាតប្រវត្តិទាំងអស់មែនទេ?', 'Clear all alert logs?')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearTelegramLogs();
                          setConfirmClearLogs(false);
                          showNotification(t('បានសម្អាតប្រវត្តិ Telegram Alert ទាំងអស់ជោគជ័យ!', 'All Telegram alert logs cleared!'));
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-khmer font-bold transition-colors shadow-2xs"
                      >
                        {t('បាទ/ចាស (Yes)', 'Yes, Clear')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearLogs(false)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-khmer"
                      >
                        {t('បោះបង់ (Cancel)', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearLogs(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-khmer font-bold transition-colors"
                      title={t('សម្អាតប្រវត្តិទាំងអស់', 'Clear All Logs')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('សម្អាតប្រវត្តិទាំងអស់ (Clear All Logs)', 'Clear All Alert Logs')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Logs List */}
            {telegramAlertLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs text-slate-500 font-khmer font-medium">
                  {t('មិនទាន់មានប្រវត្តិការផ្ញើ Telegram Alert នៅឡើយទេ', 'No Telegram alert logs found')}
                </div>
                <div className="text-[11px] text-slate-400 font-khmer mt-0.5">
                  {t('សារ Alert នឹងបង្ហាញនៅទីនេះពេលមានការបង់ថ្លៃសិក្សា ឬលក់សម្ភារៈ', 'Alerts will appear here when fees are collected or items are sold')}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {telegramAlertLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-2xs group flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 font-khmer text-sm">
                          {log.title}
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-mono">
                          {log.timestamp}
                        </span>
                        {log.amount && (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 font-mono font-bold">
                            {log.amount}
                          </span>
                        )}
                        {log.payerName && (
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-800 font-khmer">
                            {log.payerName}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600 font-khmer whitespace-pre-line leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100 text-[11px]">
                        {log.message}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        deleteTelegramLog(log.id);
                        showNotification(t('បានលុបសារកំណត់ត្រាជោគជ័យ!', 'Log item removed!'));
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title={t('លុបកំណត់ត្រានេះ', 'Delete this log entry')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Supabase Cloud Database */}
      {activeTab === 'supabase' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-base font-khmer">
                    {t('មូលដ្ឋានទិន្នន័យ Supabase Cloud (PostgreSQL Storage)', 'Supabase Cloud Database (PostgreSQL)')}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                      supabaseHealth?.connected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        supabaseHealth?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    ></span>
                    <span>
                      {supabaseHealth?.connected
                        ? t(`បានភ្ជាប់ជោគជ័យ (${supabaseHealth.latencyMs || 0}ms)`, `Connected (${supabaseHealth.latencyMs || 0}ms)`)
                        : t('មិនទាន់បានភ្ជាប់', 'Disconnected')}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
                    fsiccthpfzmyaowwjzsw
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-khmer mt-1">
                  {t(
                    'ប្រព័ន្ធរក្សាទុកទិន្នន័យសាលាជាអចិន្ត្រៃយ៍នៅលើ Supabase Cloud (AWS US-East-1 PostgreSQL Pooler) ការពារការបាត់បង់ទិន្នន័យពេល Redeploy ឬប្តូរ Browser',
                    'Permanent persistent cloud storage on Supabase Cloud PostgreSQL, securing school data across redeployments and browser resets.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-khmer font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingSupabase ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>{isTestingSupabase ? t('កំពុងតេស្ត...', 'Testing...') : t('តេស្តការតភ្ជាប់', 'Test Connection')}</span>
              </button>
            </div>
          </div>

          {/* Feedback Message Banner */}
          {supabaseMessage && (
            <div
              className={`p-4 rounded-xl border text-xs font-khmer flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                supabaseMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {supabaseMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-semibold">{supabaseMessage.text}</span>
              </div>
              <button
                onClick={() => setSupabaseMessage(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Configuration & Architecture Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Supabase Endpoint & Credentials Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>ព័ត៌មានគម្រោង Supabase Cloud (Project Specs)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Supabase Project URL</span>
                  <span className="text-slate-800 select-all font-semibold">https://fsiccthpfzmyaowwjzsw.supabase.co</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">PostgreSQL Host &amp; Pooler</span>
                  <span className="text-slate-800 select-all">aws-0-us-east-1.pooler.supabase.com:6543</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Database</span>
                    <span className="text-slate-800 font-semibold">postgres (SSL Mode: require)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Storage Type</span>
                    <span className="text-emerald-700 font-semibold font-sans">
                      {supabaseHealth?.storageType === 'supabase_postgres' ? 'Supabase PostgreSQL' : 'Supabase REST + Local'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Database Tables Managed</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[10px] font-mono">
                      bim_school_state (master JSONB)
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[10px] font-mono">
                      bim_school_backups (snapshots)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloud Sync Operations Card */}
            <div className="p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 font-khmer text-sm flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>ប្រតិបត្តិការសមកាលកម្មទិន្នន័យ (Cloud Sync Actions)</span>
                  </span>
                  <span className="text-[10px] font-khmer font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Auto-Sync បើកជានិច្ច
                  </span>
                </div>
                <p className="text-slate-600 font-khmer text-xs leading-relaxed">
                  {t(
                    'រាល់ការកែប្រែក្នុងប្រព័ន្ធ (ការបង់ប្រាក់, បញ្ជីសិស្ស, ការលក់សម្ភារៈ, ឯកសណ្ឋាន, អាហារដ្ឋាន) ត្រូវបាន Debounced Sync ទៅ Supabase ដោយស្វ័យប្រវត្តិ។ លោកអ្នកក៏អាចបញ្ជា Sync ឬ Restore ភ្លាមៗខាងក្រោមនេះផងដែរ៖',
                    'All transactions, student records, payments, sales, and settings are debounced and automatically saved to Supabase. You can also trigger immediate manual operations below:'
                  )}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSyncToSupabase}
                  disabled={isSyncingToSupabase}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold font-khmer flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer text-xs"
                >
                  {isSyncingToSupabase ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>
                    {isSyncingToSupabase
                      ? t('កំពុងបញ្ជូនទិន្នន័យទៅ Supabase...', 'Syncing to Supabase...')
                      : t('ធ្វើសមកាលកម្មទិន្នន័យទៅ Supabase ឥឡូវនេះ (Sync to Supabase Now)', 'Sync State to Supabase Now')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreFromSupabase}
                  disabled={isRestoringFromSupabase}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 rounded-xl font-bold font-khmer flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer text-xs"
                >
                  {isRestoringFromSupabase ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    {isRestoringFromSupabase
                      ? t('កំពុងទាញទិន្នន័យ...', 'Restoring...')
                      : t('ស្តារទិន្នន័យពី Supabase Cloud (Restore from Supabase Cloud)', 'Restore from Supabase Cloud')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Architecture Details Banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-khmer flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">
                {t('ការធានាសុវត្ថិភាពកម្រិត Triple-Tier Storage Resilience', 'Triple-Tier Storage Resilience Guarantee')}
              </span>
              <p className="text-[11px] leading-relaxed">
                ១. <strong>Browser Tier:</strong> រក្សាទុកក្នុង LocalStorage និង IndexedDB ដំណើរការភ្លាមៗពេល Offline។<br />
                ២. <strong>Server Tier:</strong> រក្សាទុកក្នុង Express Server Cache (`data/school-store.json`)។<br />
                ៣. <strong>Supabase Cloud Database:</strong> រក្សាទុកក្នុង PostgreSQL table `bim_school_state` នៅលើ AWS US-East-1 Cloud Infrastructure។ ពេល Redeploy ឬផ្លាស់ប្តូរ Server កុងតឺន័រ ទិន្នន័យនឹងត្រូវ Rehydrated ដោយស្វ័យប្រវត្ត ១០០%!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Data Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs w-full space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-khmer">
              សុវត្ថិភាពទិន្នន័យ Backup & Restore
            </h3>
            <p className="text-xs text-slate-500 font-khmer mt-1">
              ទាញយកទិន្នន័យសាលាទាំងអស់រក្សាទុកជាឯកសារ JSON (សិស្ស, ថ្លៃសិក្សា, ការលក់, អាហារដ្ឋាន) ឬស្តារឡើងវិញពេលប្តូរឧបករណ៍
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* NEW: Periodic Auto-Backup & Cloud Sync Card */}
            <div className="p-6 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/60 space-y-4 flex flex-col justify-between sm:col-span-2 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 font-khmer text-base">
                        {t('ប្រព័ន្ធបម្រុងទុកស្វ័យប្រវត្ត & Cloud Sync (Auto-Backup Engine)', 'Periodic Auto-Backup & Cloud Sync')}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        autoBackupConfig?.enabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {autoBackupConfig?.enabled ? t('ដំណើរការស្វ័យប្រវត្ត', 'Active') : t('បិទ', 'Disabled')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-100 text-indigo-800">
                        {autoBackupConfig?.frequency === '15m' ? 'រៀងរាល់ 15 នាទី' :
                         autoBackupConfig?.frequency === '30m' ? 'រៀងរាល់ 30 នាទី' :
                         autoBackupConfig?.frequency === '1h' ? 'រៀងរាល់ 1 ម៉ោង' :
                         autoBackupConfig?.frequency === '4h' ? 'រៀងរាល់ 4 ម៉ោង' :
                         autoBackupConfig?.frequency === 'daily_evening' ? 'រាល់ល្ងាច 5:00 PM' : 'ដោយដៃ (Manual)'}
                      </span>
                    </div>
                    <p className="text-slate-600 font-khmer mt-1 text-xs leading-relaxed max-w-2xl">
                      {t(
                        'ប្រព័ន្ធធ្វើការបម្រុងទុកស្វ័យប្រវត្តិនូវរបាយការណ៍លក់ប្រចាំថ្ងៃ (Daily Sales: ថ្លៃសិក្សា, សម្ភារៈ, ឯកសណ្ឋាន, អាហារដ្ឋាន, ឡានសាលា) និងទិន្នន័យសិស្សទាំងស្រុង (Student Records) ទៅកាន់ Local Storage និង Server ព្រមទាំងផ្តល់ជម្រើស Cloud Sync ភ្លាមៗ។',
                        'Automatically exports and snapshots daily sales (Tuition, Materials, Uniforms, Canteen, Bus) and complete student records to local storage and server with instant cloud sync prompts.'
                      )}
                    </p>
                    {lastBackupTime && (
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        {t('បម្រុងទុកចុងក្រោយ:', 'Last Auto-Backup:')} {new Date(lastBackupTime).toLocaleString('km-KH')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAutoBackupModal()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-khmer flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer text-xs"
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t('គ្រប់គ្រង & កំណត់ម៉ោងបម្រុងទុក', 'Manage & Configure')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportDailySalesAndStudents()}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-900 rounded-xl font-bold font-khmer flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer text-xs"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>{t('ទាញយក Daily Sales & Students (.json)', 'Export Daily Sales & Students')}</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Download Backup */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-2">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 font-khmer text-sm">
                  ទាញយក Full JSON Backup
                </h4>
                <p className="text-slate-500 font-khmer mt-1">
                  ទាញយកទិន្នន័យទាំងស្រុងនៃបញ្ជីសិស្ស ថ្លៃសិក្សា ប្រវត្តិលក់ និងការកំណត់ប្រព័ន្ធ។
                </p>
              </div>

              <button
                onClick={downloadFullBackup}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>ទាញយក Backup File</span>
              </button>
            </div>

            {/* Restore from File */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 font-khmer text-sm">
                  ស្តារទិន្នន័យ (Restore from Backup)
                </h4>
                <p className="text-slate-500 font-khmer mt-1">
                  ជ្រើសរើសឯកសារ JSON Backup ដែលបានទាញយកពីមុនដើម្បីបញ្ចូលទិន្នន័យឡើងវិញ។
                </p>
              </div>

              <label className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold font-khmer flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer text-center">
                <Upload className="w-4 h-4" />
                <span>ជ្រើសរើសឯកសារ JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Auto-Backup to Telegram Group */}
            <div className="p-6 rounded-xl border border-sky-200 bg-sky-50/60 space-y-3 flex flex-col justify-between sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                      <span>{t('បម្រុងទុកទិន្នន័យទៅ Telegram Group (Auto-Backup to Telegram)', 'Auto-Backup to Telegram Group')}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 font-mono">
                        Direct Cloud Dispatch
                      </span>
                    </h4>
                    <p className="text-slate-600 font-khmer mt-0.5 text-xs">
                      ផ្ញើឯកសារ Backup ទិន្នន័យសាលាទាំងស្រុង (.json) ទៅកាន់ Telegram Group របស់ថ្នាក់ដឹកនាំ និងគណនេយ្យករដោយផ្ទាល់
                    </p>
                  </div>
                </div>

                {settings.telegramConfig.lastBackupDate && (
                  <div className="text-[11px] text-slate-500 font-mono bg-white/80 px-2.5 py-1 rounded-lg border border-sky-100 self-start sm:self-auto">
                    Last Backup: {new Date(settings.telegramConfig.lastBackupDate).toLocaleString('km-KH')}
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-sky-900 font-khmer">
                  {settings.telegramConfig.chatId ? (
                    <span className="font-mono text-emerald-700 font-semibold">
                      ✓ គោលដៅ Telegram Chat ID: {settings.telegramConfig.chatId}
                    </span>
                  ) : (
                    <span className="text-amber-700">
                      ⚠️ សូមបំពេញ Telegram Bot Token & Chat ID ក្នុង Tab Telegram ជាមុនសិន
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isBackingUpToTg || !settings.telegramConfig.botToken || !settings.telegramConfig.chatId}
                  onClick={async () => {
                    setIsBackingUpToTg(true);
                    const res = await backupToTelegramGroup();
                    setIsBackingUpToTg(false);
                    showNotification(res.message, res.success ? 'success' : 'error');
                  }}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-xl font-bold font-khmer flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isBackingUpToTg ? 'កំពុងផ្ញើ Backup...' : 'ផ្ញើ Backup ទៅ Telegram Group ឥឡូវនេះ (Backup Now)'}</span>
                </button>
              </div>
            </div>

            {/* Supabase Cloud Database Direct Sync Card */}
            <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-3 flex flex-col justify-between sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                      <span>{t('បម្រុងទុកទៅ Supabase Cloud Database (PostgreSQL Cloud Persistence)', 'Supabase Cloud Database Sync')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${supabaseHealth?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'} font-mono`}>
                        {supabaseHealth?.connected ? 'PostgreSQL Active' : 'Offline Buffer'}
                      </span>
                    </h4>
                    <p className="text-slate-600 font-khmer mt-0.5 text-xs">
                      រក្សាទុកទិន្នន័យបញ្ជីសិស្ស ថ្លៃសិក្សា ការលក់សម្ភារៈ ឯកសណ្ឋាន និងអាហារដ្ឋានទាំងអស់ទៅក្នុង PostgreSQL Table bim_school_state នៅលើ Supabase Cloud
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100 self-start sm:self-auto">
                  Project: fsiccthpfzmyaowwjzsw
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-emerald-900 font-khmer font-mono">
                  host: db.fsiccthpfzmyaowwjzsw.supabase.co (pooler port 6543)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSyncingToSupabase}
                    onClick={handleSyncToSupabase}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold font-khmer flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer text-xs"
                  >
                    {isSyncingToSupabase ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{isSyncingToSupabase ? 'កំពុង Sync...' : 'Sync ទៅ Supabase ឥឡូវនេះ (Sync to Supabase)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('supabase')}
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 rounded-xl font-bold font-khmer text-xs"
                  >
                    {t('មើលព័ត៌មានលម្អិត', 'View Details')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CLEAR ALL DATA (KEEP SETTINGS) */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-950 font-khmer text-sm flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-amber-600" />
                  <span>សម្អាតទិន្នន័យទាំងអស់ ដោយរក្សាទុកការកំណត់ (Clear All Data - Keep Settings)</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold font-khmer">
                  រក្សាទុក Settings & គណនី ១០០%
                </span>
              </div>
              <p className="text-amber-900 font-khmer text-xs leading-relaxed">
                លុបតែទិន្នន័យប្រតិបត្តិការ (សិស្សក្នុងថ្នាក់, ប្រវត្តិនៃការបង់ថ្លៃសិក្សា, វិក្កយបត្រ, ការលក់សម្ភារៈ, ការលក់ឯកសណ្ឋាន, កំណត់ត្រាអាហារដ្ឋាន និងឡានក្រុង) ដើម្បីចាប់ផ្តើមទំព័រថ្មី។
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-800 font-khmer pt-1">
                <span className="flex items-center gap-1">✓ រក្សាទុកឈ្មោះសាលា ឡូហ្គោ និងព័ត៌មានទូទៅ</span>
                <span className="flex items-center gap-1">✓ រក្សាទុកបញ្ជីសាខា & គណនីអ្នកប្រើប្រាស់</span>
                <span className="flex items-center gap-1">✓ រក្សាទុកបញ្ជីថ្នាក់រៀន គ្រូ និងទំនិញ</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsConfirmClearDataOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold font-khmer text-xs shrink-0 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>សម្អាតទិន្នន័យ (Clear Data)</span>
            </button>
          </div>

          {/* In-App Confirmation Modal for Clear Data (Keep Settings) */}
          {isConfirmClearDataOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 font-khmer text-base">
                      {t('បញ្ជាក់ការសម្អាតទិន្នន័យ (រក្សាទុក Settings)', 'Confirm Clear All Data (Keep Settings)')}
                    </h3>
                    <p className="text-xs text-slate-500 font-khmer">
                      Wipe all student and sales records while keeping system configurations
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-khmer">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>ទិន្នន័យដែលនឹងត្រូវសម្អាត (Data to be wiped)៖</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 ml-1 text-[11px]">
                    <li>បញ្ជីសិស្សទាំងអស់ក្នុងថ្នាក់នីមួយៗ (ចំនួនសិស្សក្លាយជា 0 នាក់)</li>
                    <li>ប្រវត្តិបង់ប្រាក់ថ្លៃសិក្សា វិក្កយបត្រ និងបង្កាន់ដៃទាំងអស់</li>
                    <li>តារាង និងប្រវត្តិនៃការលក់សម្ភារៈសិក្សាប្រចាំថ្ងៃ</li>
                    <li>តារាង និងប្រវត្តិនៃការលក់ឯកសណ្ឋានសិស្ស</li>
                    <li>កំណត់ត្រាវត្តមាន និងការបង់ប្រាក់អ្នកលក់អាហារដ្ឋាន</li>
                    <li>កំណត់ត្រាឡានក្រុង (ការចុះឈ្មោះ, ការទូទាត់, វត្តមាន)</li>
                    <li>ប្រវត្តិឡើងថ្នាក់សិស្ស (Promotion History) និង Telegram logs</li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs font-khmer text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>ការកំណត់ដែលត្រូវបានរក្សាទុកដដែល ១០០% (Settings Kept)៖</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 leading-relaxed">
                    ឈ្មោះសាលា, ឡូហ្គោ, ឆ្នាំសិក្សា, អត្រាប្តូរប្រាក់, គណនីអ្នកប្រើប្រាស់ & ពាក្យសម្ងាត់, បញ្ជីសាខា, បញ្ជីថ្នាក់រៀន, មុខទំនិញឯកសណ្ឋាន & ទំហំ, បញ្ជីអ្នកលក់អាហារដ្ឋាន, និងខ្សែរត់ឡានក្រុង <strong>នៅរក្សាទុកទាំងអស់</strong>។
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsConfirmClearDataOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer text-xs"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllDataKeepSettings();
                      setIsConfirmClearDataOpen(false);
                      showNotification(t('បានសម្អាតទិន្នន័យទាំងអស់ដោយជោគជ័យ! ការកំណត់ត្រូវបានរក្សាទុក។', 'All operational data cleared successfully! Settings kept intact.'));
                    }}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold font-khmer text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>បញ្ជាក់សម្អាតទិន្នន័យ (Confirm Clear)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Action */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-red-900 font-khmer flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>កំណត់ទិន្នន័យឡើងវិញតាម Screenshots ដើម (Reset to Original Data)</span>
              </div>
              <p className="text-red-700 font-khmer mt-0.5 text-[11px]">
                ទិន្នន័យនឹងត្រូវស្តារត្រឡប់ទៅតម្លៃដើមដូចក្នុងរូបភាព Screenshots ទាំង ៥។
              </p>
            </div>

            <button
              onClick={() => setIsConfirmResetOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold font-khmer shrink-0 transition-colors"
            >
              Reset Data
            </button>
          </div>

          {/* In-App Confirmation Modal for Reset Data */}
          {isConfirmResetOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 font-khmer text-base">បញ្ជាក់ការកំណត់ទិន្នន័យឡើងវិញ</h3>
                    <p className="text-xs text-slate-500 font-khmer">Reset to Original Screenshot Ledgers</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-khmer leading-relaxed">
                  តើអ្នកប្រាកដជាចង់កំណត់ទិន្នន័យទាំងអស់ត្រឡប់ទៅស្ថានភាពដើមដូច Screenshots ទាំង ៥ ឬទេ? ទិន្នន័យបច្ចុប្បន្នទាំងអស់នឹងត្រូវជំនួសឡើងវិញ។
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmResetOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer text-xs"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetToInitialData();
                      setIsConfirmResetOpen(false);
                      showNotification('ទិន្នន័យត្រូវបានកំណត់ឡើងវិញដោយជោគជ័យ!');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold font-khmer text-xs shadow-xs"
                  >
                    បញ្ជាក់ Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Role Permissions & User Switcher */}
      {activeTab === 'roles' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs w-full space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-khmer">
              ការបែងចែកសិទ្ធិ & ការកម្រិត (Role Permissions & RBAC Restriction)
            </h3>
            <p className="text-xs text-slate-500 font-khmer mt-1">
              ប្រព័ន្ធបានកំណត់សិទ្ធិកែប្រែ (Edit) និងលុបទិន្នន័យ (Delete) តាមតួនាទីនីមួយៗយ៉ាងតឹងរ៉ឹង
            </p>
          </div>

          {/* Current Active Account Card (Demo switcher removed) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800 text-xs font-khmer mb-2">
              គណនីកំពុងដំណើរការ (Current Active Session):
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-slate-700">
                  {currentUser.khmerName.slice(0, 1)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 font-khmer text-sm">{currentUser.khmerName}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    @{currentUser.username} · {currentUser.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-900 border border-amber-200">
                  Role: {currentUser.role}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-khmer bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {permissions.canModifySettings ? 'សិទ្ធិពេញលេញ (Full Access)' : permissions.canEdit ? 'សិទ្ធិកែប្រែ (Edit Only)' : 'សិទ្ធិមើល (Read Only)'}
                </span>
              </div>
            </div>
          </div>

          {/* User Management Section: Add, Edit, Delete Users */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-khmer">
                  {t('បញ្ជីគណនីអ្នកប្រើប្រាស់ទាំងអស់ (User Management)', 'All User Accounts')}
                </h4>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  អ្នកអាចបន្ថែម កែប្រែ ឬលុបគណនីអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធបាននៅទីនេះ
                </p>
              </div>

              {permissions.canModifySettings && (
                <button
                  type="button"
                  onClick={() => {
                    setFormUserName('');
                    setFormUserKhmerName('');
                    setFormUserUsername('');
                    setFormUserRole('teacher');
                    setFormUserEmail('');
                    setFormUserClassId('');
                    setIsAddUserModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>+ បន្ថែមអ្នកប្រើប្រាស់ថ្មី</span>
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-200 font-khmer">
                    <th className="py-2.5 px-3 w-12 text-center">ល.រ</th>
                    <th className="py-2.5 px-3">ឈ្មោះអ្នកប្រើប្រាស់</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">តួនាទី (Role)</th>
                    <th className="py-2.5 px-3">អ៊ីមែល (Email)</th>
                    <th className="py-2.5 px-3 text-center">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-khmer text-xs">
                  {allUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                            alt={u.name}
                            className="w-7 h-7 rounded-full bg-slate-200 object-cover shrink-0"
                          />
                          <div>
                            <div>{u.khmerName}</div>
                            <div className="text-[10px] text-slate-400 font-normal font-mono">
                              {u.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                        @{u.username}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            u.role === 'admin'
                              ? 'bg-rose-100 text-rose-800'
                              : u.role === 'accountant'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'teacher'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {u.email}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {permissions.canModifySettings && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(u.id);
                                  setFormUserName(u.name);
                                  setFormUserKhmerName(u.khmerName);
                                  setFormUserUsername(u.username);
                                  setFormUserRole(u.role);
                                  setFormUserEmail(u.email);
                                  setFormUserClassId(u.classId || '');
                                  setIsEditUserModalOpen(true);
                                }}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (currentUser.id === u.id) {
                                    alert(t('មិនអាចលុបគណនីដែលកំពុងដំណើរការបានទេ!', 'Cannot delete active account!'));
                                    return;
                                  }
                                  if (window.confirm(`តើអ្នកពិតជាចង់លុបគណនី "${u.khmerName}" មែនទេ?`)) {
                                    deleteUser(u.id);
                                    showNotification('បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ!');
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 font-khmer mb-3">
              តារាងសិទ្ធិប្រតិបត្តិការ (Permission Matrix):
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-200 font-khmer">
                    <th className="py-2.5 px-3">Role / តួនាទី</th>
                    <th className="py-2.5 px-3 text-center">Edit Records</th>
                    <th className="py-2.5 px-3 text-center">Delete Records</th>
                    <th className="py-2.5 px-3 text-center">Collect Fees</th>
                    <th className="py-2.5 px-3 text-center">System Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 font-khmer">Admin (នាយកសាលា)</td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">✅ Yes</td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">✅ Yes</td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">✅ Yes</td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">✅ Yes</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 font-khmer">Accountant (គណនេយ្យករ)</td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">✅ Yes</td>
                    <td className="py-2 px-3 text-center text-rose-600 font-bold">❌ Restrict</td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">✅ Yes</td>
                    <td className="py-2 px-3 text-center text-rose-600 font-bold">❌ Restrict</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 font-khmer">Teacher (គ្រូបន្ទុកថ្នាក់)</td>
                    <td className="py-2 px-3 text-center text-slate-400">View Only</td>
                    <td className="py-2 px-3 text-center text-rose-600 font-bold">❌ Restrict</td>
                    <td className="py-2 px-3 text-center text-slate-400">View Only</td>
                    <td className="py-2 px-3 text-center text-rose-600 font-bold">❌ Restrict</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 font-khmer">Student (សិស្ស / អាណាព្យាបាល)</td>
                    <td className="py-2 px-3 text-center text-slate-400">Portal View</td>
                    <td className="py-2 px-3 text-center text-rose-600 font-bold">❌ Restrict</td>
                    <td className="py-2 px-3 text-center text-slate-400">Portal View</td>
                    <td className="py-2 px-3 text-center text-rose-600 font-bold">❌ Restrict</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('បន្ថែមអ្នកប្រើប្រាស់ថ្មី', 'Add New User Account')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formUserName.trim() || !formUserUsername.trim()) return;
                addUser({
                  name: formUserName.trim(),
                  khmerName: formUserKhmerName.trim() || formUserName.trim(),
                  username: formUserUsername.trim().toLowerCase(),
                  role: formUserRole,
                  email: formUserEmail.trim() || `${formUserUsername.trim().toLowerCase()}@bimrangsei.edu.kh`,
                  classId: formUserClassId || undefined,
                });
                setIsAddUserModalOpen(false);
                showNotification('បានបន្ថែមអ្នកប្រើប្រាស់ជោគជ័យ!');
              }}
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះជាភាសាខ្មែរ (Khmer Name) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. សុខ ម៉ាលី"
                  value={formUserKhmerName}
                  onChange={(e) => setFormUserKhmerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះជាឡាតាំង (Full Latin Name) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sok Maly"
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. maly.sok"
                    value={formUserUsername}
                    onChange={(e) => setFormUserUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    តួនាទី (Role) *
                  </label>
                  <select
                    value={formUserRole}
                    onChange={(e) => setFormUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                  >
                    <option value="admin">Admin (នាយកសាលា)</option>
                    <option value="accountant">Accountant (គណនេយ្យករ)</option>
                    <option value="teacher">Teacher (គ្រូបន្ទុកថ្នាក់)</option>
                    <option value="student">Student (សិស្ស)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  អ៊ីមែល (Email)
                </label>
                <input
                  type="email"
                  placeholder="e.g. maly@bimrangsei.edu.kh"
                  value={formUserEmail}
                  onChange={(e) => setFormUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              {formUserRole === 'teacher' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ថ្នាក់ទទួលបន្ទុក (Assigned Class)
                  </label>
                  <select
                    value={formUserClassId}
                    onChange={(e) => setFormUserClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  >
                    <option value="">-- ជ្រើសរើសថ្នាក់ --</option>
                    {Object.values(classData).map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className} ({c.classId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-khmer shadow-xs"
                >
                  បន្ថែមអ្នកប្រើប្រាស់
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditUserModalOpen && editingUserId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('កែប្រែព័ត៌មានអ្នកប្រើប្រាស់', 'Edit User Account')}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editingUserId, {
                  name: formUserName.trim(),
                  khmerName: formUserKhmerName.trim(),
                  username: formUserUsername.trim().toLowerCase(),
                  role: formUserRole,
                  email: formUserEmail.trim(),
                  classId: formUserClassId || undefined,
                });
                setIsEditUserModalOpen(false);
                showNotification('បានកែប្រែព័ត៌មានអ្នកប្រើប្រាស់ជោគជ័យ!');
              }}
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះជាភាសាខ្មែរ (Khmer Name) *
                </label>
                <input
                  type="text"
                  value={formUserKhmerName}
                  onChange={(e) => setFormUserKhmerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះជាឡាតាំង (Full Latin Name) *
                </label>
                <input
                  type="text"
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formUserUsername}
                    onChange={(e) => setFormUserUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    តួនាទី (Role) *
                  </label>
                  <select
                    value={formUserRole}
                    onChange={(e) => setFormUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                  >
                    <option value="admin">Admin (នាយកសាលា)</option>
                    <option value="accountant">Accountant (គណនេយ្យករ)</option>
                    <option value="teacher">Teacher (គ្រូបន្ទុកថ្នាក់)</option>
                    <option value="student">Student (សិស្ស)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  អ៊ីមែល (Email)
                </label>
                <input
                  type="email"
                  value={formUserEmail}
                  onChange={(e) => setFormUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              {formUserRole === 'teacher' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ថ្នាក់ទទួលបន្ទុក (Assigned Class)
                  </label>
                  <select
                    value={formUserClassId}
                    onChange={(e) => setFormUserClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  >
                    <option value="">-- ជ្រើសរើសថ្នាក់ --</option>
                    {Object.values(classData).map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className} ({c.classId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-khmer shadow-xs"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BRANCH MODAL */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-khmer">
                    {t('បន្ថែមសាខាសាលាថ្មី', 'Add New Campus / Branch')}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-khmer">
                    បញ្ចូលព័ត៌មានលម្អិតអំពីទីតាំងសាខា និងអ្នកគ្រប់គ្រង
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddBranch} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ឈ្មោះសាខា (ភាសាខ្មែរ) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. សាខាសែនសុខ"
                    value={bNameKhmer}
                    onChange={(e) => setBNameKhmer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ឈ្មោះសាខា (English)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sen Sok Campus"
                    value={bNameEnglish}
                    onChange={(e) => setBNameEnglish(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    លេខកូដសាខា (Branch Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BIM-04"
                    value={bCode}
                    onChange={(e) => setBCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ស្ថានភាពដំណើរការ
                  </label>
                  <select
                    value={bStatus}
                    onChange={(e) => setBStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                  >
                    <option value="active">ដំណើរការ (Active)</option>
                    <option value="inactive">ផ្អាកដំណើរការ (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    លេខទូរស័ព្ទសាខា
                  </label>
                  <input
                    type="text"
                    placeholder="012 889 977"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    អ៊ីមែលសាខា
                  </label>
                  <input
                    type="email"
                    placeholder="branch@bimrangsei.edu.kh"
                    value={bEmail}
                    onChange={(e) => setBEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    នាយកសាខា (Branch Director)
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. ឡុង សុធា"
                    value={bDirector}
                    onChange={(e) => setBDirector(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    គណនេយ្យករសាខា (Accountant)
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. មាស ធីតា"
                    value={bAccountant}
                    onChange={(e) => setBAccountant(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  អាសយដ្ឋានសាខា (Campus Address)
                </label>
                <textarea
                  rows={2}
                  placeholder="ផ្ទះលេខ... ផ្លូវ... សង្កាត់... ខណ្ឌ..."
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                />
              </div>

              <label className="flex items-center gap-2 p-3 bg-amber-50/60 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={bIsMain}
                  onChange={(e) => setBIsMain(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="font-khmer font-bold text-slate-800 text-xs">
                  កំណត់ជាទីស្នាក់ការកណ្តាល (Set as School Headquarters / Main Campus)
                </span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold font-khmer shadow-xs transition-colors"
                >
                  រក្សាទុកសាខាថ្មី
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRANCH MODAL */}
      {isEditBranchModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-khmer">
                    {t('កែសម្រួលព័ត៌មានសាខា', 'Edit Campus / Branch')}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Code: {editingBranch.code}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBranch} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ឈ្មោះសាខា (ភាសាខ្មែរ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bNameKhmer}
                    onChange={(e) => setBNameKhmer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ឈ្មោះសាខា (English)
                  </label>
                  <input
                    type="text"
                    value={bNameEnglish}
                    onChange={(e) => setBNameEnglish(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    លេខកូដសាខា (Branch Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bCode}
                    onChange={(e) => setBCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ស្ថានភាពដំណើរការ
                  </label>
                  <select
                    value={bStatus}
                    onChange={(e) => setBStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                  >
                    <option value="active">ដំណើរការ (Active)</option>
                    <option value="inactive">ផ្អាកដំណើរការ (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    លេខទូរស័ព្ទសាខា
                  </label>
                  <input
                    type="text"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    អ៊ីមែលសាខា
                  </label>
                  <input
                    type="email"
                    value={bEmail}
                    onChange={(e) => setBEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    នាយកសាខា (Branch Director)
                  </label>
                  <input
                    type="text"
                    value={bDirector}
                    onChange={(e) => setBDirector(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    គណនេយ្យករសាខា (Accountant)
                  </label>
                  <input
                    type="text"
                    value={bAccountant}
                    onChange={(e) => setBAccountant(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  អាសយដ្ឋានសាខា (Campus Address)
                </label>
                <textarea
                  rows={2}
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                />
              </div>

              <label className="flex items-center gap-2 p-3 bg-amber-50/60 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={bIsMain}
                  onChange={(e) => setBIsMain(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="font-khmer font-bold text-slate-800 text-xs">
                  កំណត់ជាទីស្នាក់ការកណ្តាល (Set as School Headquarters / Main Campus)
                </span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditBranchModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold font-khmer shadow-xs transition-colors"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BRANCH CONFIRMATION MODAL */}
      {branchToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('តើអ្នកពិតជាចង់លុបសាខានេះមែនទេ?', 'Confirm Branch Deletion?')}
              </h3>
              <p className="text-slate-600 font-khmer leading-relaxed">
                អ្នកកំពុងលុបសាខា <strong>{branchToDelete.nameKhmer}</strong> ({branchToDelete.code})។
              </p>
              <p className="text-[11px] text-slate-400 font-khmer">
                ទិន្នន័យសិស្ស និងថ្នាក់រៀនទាំងអស់នឹងនៅតែមានសុវត្ថិភាព។
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-khmer"
              >
                {t('បោះបង់ (Cancel)', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBranch}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold font-khmer shadow-xs transition-colors"
              >
                {t('យល់ព្រមលុប', 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
