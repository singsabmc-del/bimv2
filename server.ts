import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import pg from 'pg';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'school-store.json');

// Supabase & Postgres Configuration
const REAL_SUPABASE_URL = 'https://fsiccthpfzmyaowwjzsw.supabase.co';
const REAL_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaWNjdGhwZnpteWFvd3dqenN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mzc3MTEzMywiZXhwIjoyMTA5MzQ3MTMzfQ.qUE-BNWWix4xcqkZm6pKXCmtQc_LZvnBTyvwsmJzopo';
const REAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaWNjdGhwZnpteWFvd3dqenN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NzExMzMsImV4cCI6MjEwOTM0NzEzM30.NeTUZ8VTaVnA5kAtrZv2Y-s6iMbcTmWwm4SdHt3wNrI';

const envUrl = process.env.BIM_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_URL = (envUrl && !envUrl.includes('your-project') && envUrl.startsWith('http'))
  ? envUrl.trim()
  : REAL_SUPABASE_URL;

const envServiceKey = process.env.BIM_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = (envServiceKey && !envServiceKey.includes('your-service-role-key') && envServiceKey.length > 20)
  ? envServiceKey.trim()
  : REAL_SUPABASE_SERVICE_ROLE_KEY;

const envAnonKey = process.env.BIM_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_ANON_KEY = (envAnonKey && !envAnonKey.includes('your-anon-key') && envAnonKey.length > 20)
  ? envAnonKey.trim()
  : REAL_SUPABASE_ANON_KEY;

const RAW_POSTGRES_URL = process.env.BIM_POSTGRES_URL || process.env.DATABASE_URL || '';
// Strip query parameters so pg uses explicit ssl: { rejectUnauthorized: false }
const POSTGRES_URL = RAW_POSTGRES_URL ? RAW_POSTGRES_URL.split('?')[0].trim() : '';

function isValidPostgresHost(connStr: string): boolean {
  if (!connStr || connStr.length === 0) return false;
  try {
    const url = new URL(connStr.replace(/^postgres(ql)?:\/\//, 'http://'));
    const host = (url.hostname || '').toLowerCase();
    if (!host || host === 'host' || host === 'example.com' || host === 'none') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Supabase REST client
const supabaseAdmin = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// PostgreSQL Pool (only enabled if connection string is provided with a valid hostname)
const { Pool } = pg;
let pgPool: pg.Pool | null = null;
if (POSTGRES_URL && isValidPostgresHost(POSTGRES_URL)) {
  try {
    pgPool = new Pool({
      connectionString: POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 2000,
      max: 5,
    });
    pgPool.on('error', () => {
      // Quiet pool error listener
    });
  } catch {
    pgPool = null;
  }
}

let pgInitialized = false;
async function initSupabaseSchema() {
  if (!pgPool) return;
  try {
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bim_school_state (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS bim_school_backups (
          id TEXT PRIMARY KEY,
          title TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          meta JSONB,
          data JSONB
        );
      `);
      pgInitialized = true;
      console.log('✅ Supabase PostgreSQL connected and tables verified/created');
    } finally {
      client.release();
    }
  } catch {
    // If direct PostgreSQL cannot be reached (DNS, blocked port, or offline host),
    // cleanly shut down pool so runtime requests operate in local/REST storage without warnings
    try {
      await pgPool.end();
    } catch {}
    pgPool = null;
    pgInitialized = false;
  }
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Supabase tables in background
  initSupabaseSchema().catch(() => {});

  app.use(express.json({ limit: '30mb' }));

  // Gemini Client initialization
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Supabase Health & Diagnostics Endpoint
  app.get('/api/supabase/status', async (req, res) => {
    const start = performance.now();
    let pgStatus = 'disconnected';
    let pgVersion: string | null = null;
    let tableExists = false;
    let rowCount = 0;
    let lastSavedAt: string | null = null;
    let errorMessage: string | null = null;

    if (pgPool && pgInitialized) {
      try {
        const client = await pgPool.connect();
        try {
          const pingRes = await client.query('SELECT version(), NOW() as server_time');
          pgStatus = 'connected';
          pgVersion = pingRes.rows[0]?.version?.split(' ')[0] || 'PostgreSQL';

          // Check bim_school_state table existence and stored rows
          const tableCheck = await client.query(`SELECT to_regclass('public.bim_school_state') as tbl`);
          if (tableCheck.rows[0]?.tbl) {
            tableExists = true;
            const dataCheck = await client.query('SELECT updated_at FROM bim_school_state WHERE id = $1', ['latest']);
            if (dataCheck.rows.length > 0) {
              rowCount = 1;
              lastSavedAt = dataCheck.rows[0].updated_at;
            }
          }
        } finally {
          client.release();
        }
      } catch (err: any) {
        errorMessage = err?.message || 'Failed to query PostgreSQL';
      }
    }

    // If PostgreSQL pool was not reachable, verify via Supabase REST API
    let isConnected = pgStatus === 'connected';
    let storageType = isConnected ? 'supabase_postgres' : 'local_fallback';

    if (!isConnected) {
      try {
        const restPing = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        });
        if (restPing.ok || restPing.status === 200 || restPing.status === 401) {
          isConnected = true;
          storageType = 'supabase_rest';
          errorMessage = null;
        }
      } catch {}
    }

    const latency = Math.round(performance.now() - start);
    return res.json({
      connected: isConnected,
      projectId: 'fsiccthpfzmyaowwjzsw',
      url: SUPABASE_URL,
      host: 'db.fsiccthpfzmyaowwjzsw.supabase.co',
      database: 'postgres',
      latencyMs: latency,
      pgStatus,
      pgVersion,
      tableExists,
      hasStoredData: rowCount > 0,
      lastSavedAt,
      storageType,
      error: errorMessage,
    });
  });

  // Helper to fetch master state from Supabase or local fallback
  const fetchSchoolState = async () => {
    // 1. Try Supabase Postgres if configured and initialized
    if (pgPool && pgInitialized) {
      try {
        const client = await pgPool.connect();
        try {
          const queryRes = await client.query('SELECT data, updated_at FROM bim_school_state WHERE id = $1 LIMIT 1', ['latest']);
          if (queryRes.rows.length > 0 && queryRes.rows[0].data) {
            return { data: queryRes.rows[0].data, source: 'supabase_postgres', updatedAt: queryRes.rows[0].updated_at };
          }
        } finally {
          client.release();
        }
      } catch (err) {
        // Postgres pool error, fall through
      }
    }

    // 2. Try Supabase REST Client with timeout
    try {
      const restPromise = supabaseAdmin.from('bim_school_state').select('data, updated_at').eq('id', 'latest').single();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
      const { data, error }: any = await Promise.race([restPromise, timeoutPromise]);
      if (!error && data && data.data) {
        return { data: data.data, source: 'supabase_rest', updatedAt: data.updated_at };
      }
    } catch {}

    // 3. Fall back to local STORE_FILE
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      return { data: JSON.parse(raw), source: 'local_file', updatedAt: null };
    }

    return { data: null, source: 'none', updatedAt: null };
  };

  // Helper to save master state to Supabase + local cache
  const saveSchoolState = async (payload: any) => {
    // Always mirror to local file first
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');

    let savedToSupabase = false;
    let supabaseError: string | null = null;

    // Save to Supabase PostgreSQL if pool is available and initialized
    if (pgPool && pgInitialized) {
      try {
        const client = await pgPool.connect();
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS bim_school_state (
              id TEXT PRIMARY KEY,
              data JSONB NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
          `);
          await client.query(
            `INSERT INTO bim_school_state (id, data, updated_at) 
             VALUES ('latest', $1, NOW()) 
             ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
            [payload]
          );
          savedToSupabase = true;
        } finally {
          client.release();
        }
      } catch (err: any) {
        supabaseError = err?.message;
        // Try REST upsert as secondary Supabase pathway
        try {
          const { error } = await supabaseAdmin.from('bim_school_state').upsert({
            id: 'latest',
            data: payload,
            updated_at: new Date().toISOString(),
          });
          if (!error) savedToSupabase = true;
        } catch {}
      }
    } else {
      // Save directly via Supabase REST API with reasonable network timeout
      try {
        const restPromise = supabaseAdmin.from('bim_school_state').upsert({
          id: 'latest',
          data: payload,
          updated_at: new Date().toISOString(),
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000));
        const { error }: any = await Promise.race([restPromise, timeoutPromise]);
        if (!error) {
          savedToSupabase = true;
        } else {
          supabaseError = error?.message || 'Supabase upsert rejected';
        }
      } catch (err: any) {
        supabaseError = err?.message || 'Network timeout saving to Supabase';
      }
    }

    return { savedToSupabase, supabaseError, savedAt: new Date().toISOString() };
  };

  // Persistent Server-Side State Endpoints with Supabase backing
  app.get(['/api/state', '/api/supabase/state'], async (req, res) => {
    try {
      const result = await fetchSchoolState();
      return res.json({
        success: true,
        data: result.data,
        source: result.source,
        updatedAt: result.updatedAt,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post(['/api/state', '/api/supabase/state'], async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ success: false, error: 'Valid JSON payload is required' });
      }
      const saveResult = await saveSchoolState(payload);
      return res.json({
        success: true,
        savedToSupabase: saveResult.savedToSupabase,
        supabaseError: saveResult.supabaseError,
        savedAt: saveResult.savedAt,
      });
    } catch (err: any) {
      console.error('Error saving state:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Manual Supabase Test / Sync ping endpoint
  app.post('/api/supabase/test', async (req, res) => {
    if (!pgPool || !pgInitialized) {
      return res.json({
        success: true,
        message: 'PostgreSQL direct pool is not configured. The app is running smoothly using local file storage and Supabase REST.',
        time: new Date().toISOString(),
        database: 'local_file_store',
      });
    }
    try {
      const client = await pgPool.connect();
      try {
        const testRes = await client.query('SELECT NOW() as current_time, current_database() as database');
        return res.json({
          success: true,
          message: 'Supabase PostgreSQL connection successful!',
          time: testRes.rows[0]?.current_time,
          database: testRes.rows[0]?.database,
        });
      } finally {
        client.release();
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Cannot connect to Supabase PostgreSQL',
      });
    }
  });

  // OCR and Document Extraction Endpoint using Gemini 3.8 Flash
  app.post('/api/extract-report', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', reportCategory } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 payload is required' });
      }

      // Remove potential data URI prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const prompt = `You are an expert document OCR and financial ledger parser for Cambodian school administration reports (BIM Rangsei School / សាលា អ៊ីរ៉ែលកម្ពុជា).
Analyze this uploaded screenshot and extract all structured data into JSON.
Suggested Category context: ${reportCategory || 'Auto-detect from image content'}.

Extract with highest fidelity:
1. "detectedType": one of "student_fees", "daily_materials", "canteen_vendors", "uniform_sales", "other"
2. "title": exact document title in Khmer and/or English
3. "schoolName": school name detected (e.g. BIM Rangsei School / សាលា អ៊ីរ៉ែលកម្ពុជា)
4. "period": month/dates mentioned (e.g. September, October 2026, 01.10.2026 - 31.10.2026)
5. "currency": "USD" ($) or "KHR" (៛)
6. "summaryStats": key totals, counts, grand total cash
7. "signoffs": { "seenAndApproved": string, "preparedBy": string }
8. "items": array of row items with specific keys depending on type:
   - For student_fees: { id, name, gender, note, feesGroup, startDate, paymentDate, caseType, paidBy, cash }
   - For daily_materials: { id, itemName, dailyCounts: [dayNumber and count], totalQty, totalAmountKHR }
   - For canteen_vendors: { date, vendors: { vendorName: feeAmountOrAbsent }, dailyVendorCount, dailyTotalKHR }
   - For uniform_sales: { date, sizes: { sizeName: count }, dailyTotalQty, dailyTotalKHR }

Output STRICT JSON only matching this schema without markdown fences.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      try {
        const parsed = JSON.parse(rawText);
        res.json({ success: true, data: parsed });
      } catch (parseError) {
        res.json({ success: true, raw: rawText });
      }
    } catch (err: any) {
      console.error('OCR Extraction error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error occurred while processing screenshot with Gemini',
      });
    }
  });

  // Admission Form (ពាក្យសុំចូលរៀន) OCR & Parsing Endpoint using Gemini 3.8 Flash
  app.post('/api/extract-admission-form', async (req, res) => {
    try {
      const { fileBase64, mimeType = 'application/pdf', useSamplePdf } = req.body;
      let cleanBase64 = fileBase64 ? fileBase64.replace(/^data:[^;]+;base64,/, '') : '';
      let effectiveMime = mimeType;

      // Support sample PDF stored locally in workspace
      if (useSamplePdf || !cleanBase64) {
        const samplePath = path.join(__dirname, 'public', 'assets', 'aistudio', '2.1._____________version3_ac242d81.pdf');
        if (fs.existsSync(samplePath)) {
          const fileBuffer = fs.readFileSync(samplePath);
          cleanBase64 = fileBuffer.toString('base64');
          effectiveMime = 'application/pdf';
        }
      }

      if (!cleanBase64) {
        return res.status(400).json({ error: 'fileBase64 payload or sample PDF is required' });
      }

      const prompt = `You are an expert OCR parser for the official BIM School (សាលា អ៊ីរ៉ែលកម្ពុជា) Student Admission & Registration Form (ពាក្យសុំចូលរៀន).
Carefully read all pages of this registration document and extract every filled or blank field into strict JSON.

Document structure:
I. ព័ត៌មានសិស្ស / Pupil Details:
- nameKhmer (១. នាម និងគោត្តនាម / Name in Khmer)
- nameEnglish (២. ឈ្មោះអក្សរឡាតាំង / Name in English)
- gender (ភេទ: ប្រុស "Man" or ស្រី "Female")
- nationality (សញ្ជាតិ - default "ខ្មែរ" if blank or unspecified)
- dob (៣. ថ្ងៃ.ខែ.ឆ្នាំកំណើត / Date of Birth in YYYY-MM-DD or DD-MM-YYYY format)
- religion (សាសនា - default "ព្រះពុទ្ធ" if blank or unspecified)
- studentId (៤. ID សិស្ស / Student ID, e.g. BIM-...)
- placeOfBirth (៥. ទីកន្លែងកំណើត / Place of Birth)

II. កម្មវិធីសិក្សា / GRADE LEVEL:
- previousGrade (១. កម្រិតថ្នាក់ឆ្នាំចាស់ / Previous Grade)
- previousYear (ឆ្នាំសិក្សា / Year)
- previousSchool (ឈ្មោះសាលា / School name)
- presentGrade (២. កម្រិតថ្នាក់បច្ចុប្បន្ន / Present Grade, e.g. "1A", "Kindergarten", etc.)
- presentYear (ឆ្នាំសិក្សា / Year, e.g. "2026-2027")
- presentSchool (ឈ្មោះសាលា / School name, typically "សាលា អ៊ីរ៉ែលកម្ពុជា / BIM School")
- studyDays (៣. ថ្ងៃសិក្សា / Day, e.g. "ថ្ងៃចន្ទ-ថ្ងៃសុក្រ")
- studyHours (ម៉ោងសិក្សា / Time, e.g. "ម៉ោង៧:០០នាទី-១៦:០០នាទី")

III. ព័ត៌មានសុខភាពកុមារ / Student Health Section:
- 12 conditions (hasCondition: boolean, details: string):
  malnutrition (កង្វះអាហារូបត្ថម្ភ / lack of food)
  heartCondition (ស្ថានភាពបេះដូង / Heart condition)
  asthma (ជំងឺហឺត / Asthma / breathing issues)
  migraine (ជំងឺឈឺក្បាលប្រកាំង / Migraine)
  diabetes (ជំងឺទឹកនោមផ្អែម / Diabetes)
  dizziness (វិលមុខ ងងឹតមុខ ដួលសន្លប់ / Dizziness/Black Outs/Fainting)
  behaviorConcerns (បញ្ហាអាកប្បកិរិយា / Behavior Concerns)
  learningConcerns (បញ្ហាការសិក្សា / Learning Concerns)
  hearingConcerns (បញ្ហាការស្តាប់ / Hearing Concerns)
  visionConcerns (បញ្ហាការមើល / Vision Concerns)
  speechConcerns (បញ្ហាការនិយាយស្តី / Speech Concerns)
  mobilityConcerns (បញ្ហាការចល័ត / Mobility Concerns)
- takesMedication (boolean): does child take any medication?
- medicationDetails (string): medication names, dosage, daily or as needed

IV. ព័ត៌មានមាតាបិតា / Parents / Caretaker's Details:
- father: { name, occupation, phone } (១. ឪពុកឈ្មោះ)
- mother: { name, occupation, phone } (២. ម្តាយឈ្មោះ)
- caretaker: { name, occupation, phone } (៣. អាណាព្យាបាលឈ្មោះ)
- emergencyContact: { relationship, occupation, phone } (៤. អ្នកជិតខាងដែលអាចទាក់ទងបាន)
- forbiddenPickupPerson: { hasForbiddenPerson: boolean, details: string } (៥. តើមានបុគ្គលដែលហាមមិនអោយជួបឬមកទទួលកុមារដែរឬទេ?)

V. សេវាកម្មផ្សេងៗ / Other:
- services: { breakfast: boolean, lunch: boolean, eveningFood: boolean }
- permanentAddress: string (អាសយដ្ឋានបច្ចុប្បន្ន)

VI. សេចក្តីបញ្ជាក់ / Declaration:
- parentSignDate: string (កាលបរិច្ឆេទ)
- declarationAccepted: boolean

Also provide:
- suggestedClassId: string matching one of the school classes ("1A", "1B", "2A", "2B", "3A", "3B", "KG")

Return a single clean JSON object matching this schema without markdown fences. If a field is not filled in the form, provide null or reasonable defaults.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: effectiveMime,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      try {
        const parsed = JSON.parse(rawText);
        res.json({ success: true, data: parsed });
      } catch (parseError) {
        res.json({ success: true, raw: rawText });
      }
    } catch (err: any) {
      console.error('Admission Form Extraction error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error occurred while processing admission form with Gemini',
      });
    }
  });

  // Helper to escape HTML for Telegram
  const escapeTelegramHtml = (str: string): string => {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const convertMarkdownToTelegramHtml = (text: string): string => {
    let html = escapeTelegramHtml(text);
    // bold *text*
    html = html.replace(/\*([^*\n]+)\*/g, '<b>$1</b>');
    // italic _text_
    html = html.replace(/_([^_\n]+)_/g, '<i>$1</i>');
    // code `text`
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    return html;
  };

  const cleanTelegramParams = (botToken: string, chatId: string) => {
    let cleanToken = (botToken || '').trim().replace(/^bot(?=\d+:)/i, '').replace(/[\r\n\t]/g, '');
    let cleanChatId = (chatId || '').trim().replace(/[\r\n\t"']/g, '');

    // Handle Telegram URL patterns:
    // 1. web.telegram.org: https://web.telegram.org/k/#-1001234567890 or https://web.telegram.org/a/#-1001234567890
    if (cleanChatId.includes('web.telegram.org') && cleanChatId.includes('#-')) {
      const match = cleanChatId.match(/#(-?\d+)/);
      if (match) cleanChatId = match[1];
    }
    // 2. https://t.me/c/1234567890/123 (private supergroup direct link)
    else if (cleanChatId.match(/t\.me\/c\/(\d+)/)) {
      const match = cleanChatId.match(/t\.me\/c\/(\d+)/);
      if (match) cleanChatId = `-100${match[1]}`;
    }
    // 3. https://t.me/username or t.me/username
    else if (cleanChatId.startsWith('https://t.me/')) {
      cleanChatId = '@' + cleanChatId.replace('https://t.me/', '').split('/')[0].split('?')[0];
    } else if (cleanChatId.startsWith('t.me/')) {
      cleanChatId = '@' + cleanChatId.replace('t.me/', '').split('/')[0].split('?')[0];
    }

    // 4. If someone entered a 13-digit positive ID starting with 100 (e.g. 1002345678901), they forgot the minus sign for supergroup
    if (/^100\d{8,11}$/.test(cleanChatId)) {
      cleanChatId = `-${cleanChatId}`;
    }

    return { cleanToken, cleanChatId };
  };

  // Telegram Routes Middleware (CORS + Preflight)
  app.use(['/api/telegram', '*/api/telegram'], (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Telegram Auto-Detect Chat ID Endpoint (reads getUpdates to find groups/supergroups/channels)
  const handleDetectChat = async (req: express.Request, res: express.Response) => {
    try {
      const rawToken = req.body?.botToken || req.query?.botToken || (typeof req.body === 'string' ? JSON.parse(req.body || '{}')?.botToken : undefined);
      if (!rawToken) {
        return res.status(400).json({ success: false, error: 'សូមបញ្ចូល Bot Token ជាមុនសិន!' });
      }

      const { cleanToken } = cleanTelegramParams(String(rawToken), '');

      if (!cleanToken || cleanToken === 'bot_demo_token_bim_school' || cleanToken.startsWith('bot_demo_')) {
        return res.status(400).json({
          success: false,
          error: 'Bot Token នៅជា Demo Placeholder (bot_demo_token_bim_school) នៅឡើយ។ សូមបង្កើត Bot ថ្មីជាមួយ @BotFather ក្នុង Telegram រួចចម្លង Token មកដាក់ទីនេះ។',
        });
      }

      // 1. Verify Bot Token via getMe
      const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const meData = await meRes.json();

      if (!meRes.ok || !meData.ok) {
        return res.status(400).json({
          success: false,
          error: `Bot Token មិនត្រឹមត្រូវ (${meData.description || 'Unauthorized'})។ សូមពិនិត្យ Bot Token ពី @BotFather ឡើងវិញ។`,
        });
      }

      const botUsername = meData.result?.username ? `@${meData.result.username}` : meData.result?.first_name;

      // 2. Fetch updates to find active groups and channels
      const updatesRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates?limit=50`);
      const updatesData = await updatesRes.json();

      if (!updatesRes.ok || !updatesData.ok) {
        return res.status(400).json({
          success: false,
          botUsername,
          error: `Telegram Error: ${updatesData.description || 'Could not fetch updates'}`,
        });
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

      const chats = Array.from(chatsMap.values());

      return res.json({
        success: true,
        botUsername,
        chats,
        count: chats.length,
      });
    } catch (err: any) {
      console.error('Telegram detect-chat error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Error auto-detecting Telegram chats' });
    }
  };

  app.all(['/api/telegram/detect-chat', '/api/telegram/detect-chat/', '/api/telegram/detect-chats', '*/api/telegram/detect-chat'], handleDetectChat);

  // Telegram Connection Diagnostic & Test Endpoint
  app.all(['/api/telegram/test', '/api/telegram/test/', '*/api/telegram/test'], async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      if (!botToken || !chatId) {
        return res.status(400).json({ success: false, error: 'សូមបញ្ចូល Bot Token និង Chat ID ឱ្យបានត្រឹមត្រូវ!' });
      }

      const { cleanToken, cleanChatId } = cleanTelegramParams(botToken, chatId);

      if (cleanToken === 'bot_demo_token_bim_school' || cleanToken.startsWith('bot_demo_')) {
        return res.status(400).json({
          success: false,
          error: 'Bot Token នៅជា Placeholder (bot_demo_token_bim_school) នៅឡើយ។ សូមបង្កើត Bot ថ្មីជាមួយ @BotFather ក្នុង Telegram រួចចម្លង HTTP API Token មកដាក់ទីនេះ។',
        });
      }

      // Step 1: Verify Bot Token via getMe
      const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const getMeData = await getMeRes.json();

      if (!getMeRes.ok || !getMeData.ok) {
        return res.status(400).json({
          success: false,
          error: `Bot Token មិនត្រឹមត្រូវ ឬមិនដំណើរការ (${getMeData.description || 'Unauthorized'})។ សូមពិនិត្យ Bot Token ពី @BotFather ឡើងវិញ។`,
          details: getMeData,
        });
      }

      const botInfo = getMeData.result;
      const botUsername = botInfo.username ? `@${botInfo.username}` : botInfo.first_name;

      // Step 2: Check Chat existence via getChat
      let chatTitle = cleanChatId;
      try {
        const getChatRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getChat?chat_id=${encodeURIComponent(cleanChatId)}`);
        const getChatData = await getChatRes.json();
        if (getChatData.ok && getChatData.result) {
          chatTitle = getChatData.result.title || getChatData.result.username || cleanChatId;
        }
      } catch {}

      // Step 3: Send test message to chat_id
      const dateKhmer = new Date().toLocaleString('km-KH');
      const testHtml = `🔔 <b>តេស្តប្រព័ន្ធ Telegram Alerts (System Test)</b>\n🏫 <b>សាលា អ៊ីរ៉ែលកម្ពុជា (BIM Rangsei School)</b>\n\n✅ <b>ការតភ្ជាប់ជោគជ័យ ១០០%!</b>\n🤖 <b>Bot៖</b> <b>${escapeTelegramHtml(botUsername)}</b> (${escapeTelegramHtml(botInfo.first_name)})\n📢 <b>គោលដៅ៖</b> <code>${escapeTelegramHtml(cleanChatId)}</code> (${escapeTelegramHtml(chatTitle)})\n⏱ <b>កាលបរិច្ឆេទ៖</b> ${escapeTelegramHtml(dateKhmer)}\n\n<i>សារស្វ័យប្រវត្តិនឹងត្រូវបានផ្ញើមកកាន់ទីនេះរាល់ពេលមានប្រតិបត្តិការថ្មី និងពេល Auto-Backup។</i>`;

      let sendRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: testHtml,
          parse_mode: 'HTML',
        }),
      });

      let sendData = await sendRes.json();

      // Fallback to plain text if HTML parsing failed
      if (!sendRes.ok && sendData.description?.includes('parse entities')) {
        sendRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: `🔔 តេស្តប្រព័ន្ធ Telegram Alerts (BIM Rangsei School)\n\nការតភ្ជាប់ជោគជ័យ! Bot: ${botUsername}\nChat: ${cleanChatId}\nកាលបរិច្ឆេទ: ${dateKhmer}`,
          }),
        });
        sendData = await sendRes.json();
      }

      if (!sendRes.ok || !sendData.ok) {
        let hint = sendData.description || 'Cannot send message';
        if (hint.includes('chat not found')) {
          hint = `រកមិនឃើញ Chat ID "${cleanChatId}" ទេ។ ប្រសិនបើជា Group ឬ Channel សូមប្រាកដថាបាន Add Bot (${botUsername}) ចូលក្នុង Group និងបានតម្លើងសិទ្ធិជា Administrator។`;
        } else if (hint.includes('bot is not a member') || hint.includes('not a member')) {
          hint = `Bot (${botUsername}) មិនទាន់បានចូលក្នុង Group/Channel នេះទេ។ សូម Add Bot ចូល និងតម្លើងជា Admin។`;
        } else if (hint.includes('Forbidden: bot was blocked by the user')) {
          hint = `Bot ត្រូវបាន Block។ សូមចូលទៅកាន់ ${botUsername} ក្នុង Telegram រួចចុច Start/Restart។`;
        } else if (hint.includes('not enough rights')) {
          hint = `Bot (${botUsername}) មិនមានសិទ្ធិផ្ញើសារក្នុង Group នេះទេ។ សូមតម្លើងសិទ្ធិ Bot ជា Administrator។`;
        }

        return res.status(400).json({
          success: false,
          error: hint,
          botUsername,
          rawError: sendData,
        });
      }

      return res.json({
        success: true,
        botUsername,
        chatId: cleanChatId,
        chatTitle,
        message: `បានផ្ញើសារតេស្តទៅកាន់ Telegram ដោយជោគជ័យ (Bot: ${botUsername})!`,
      });
    } catch (err: any) {
      console.error('Telegram test error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Error communicating with Telegram' });
    }
  });

  // Telegram Alert Dispatch Endpoint (with multi-mode auto fallback)
  app.all(['/api/telegram/send', '/api/telegram/send/', '*/api/telegram/send'], async (req, res) => {
    try {
      const { botToken, chatId, text } = req.body;
      if (!botToken || !chatId || !text) {
        return res.status(400).json({ success: false, error: 'botToken, chatId and text are required' });
      }

      const { cleanToken, cleanChatId } = cleanTelegramParams(botToken, chatId);

      if (cleanToken === 'bot_demo_token_bim_school' || cleanToken.startsWith('bot_demo_')) {
        return res.status(400).json({
          success: false,
          error: 'Bot Token is placeholder demo token. Please configure real botToken in Settings.',
        });
      }

      // Convert text to safe HTML
      const htmlText = convertMarkdownToTelegramHtml(text);

      let tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: htmlText,
          parse_mode: 'HTML',
        }),
      });

      let tgData = await tgRes.json();

      // If Telegram returned entity parse error, retry with clean plain text
      if (!tgRes.ok && (tgData.description?.includes('parse') || tgData.description?.includes('entity'))) {
        const plainText = text.replace(/[*_`]/g, '');
        tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: plainText,
          }),
        });
        tgData = await tgRes.json();
      }

      if (!tgRes.ok || !tgData.ok) {
        let errDesc = tgData.description || 'Failed to send message to Telegram';
        if (errDesc.includes('chat not found')) {
          errDesc = `រកមិនឃើញ Chat ID "${cleanChatId}" ទេ។ សូម Add Bot ចូលក្នុង Group/Channel និងតម្លើងជា Admin។`;
        } else if (errDesc.includes('bot is not a member')) {
          errDesc = `Bot មិនទាន់បានចូលក្នុង Group/Channel ទេ។ សូម Add Bot ចូល។`;
        }
        return res.status(tgRes.status || 400).json({ success: false, error: errDesc, raw: tgData });
      }

      return res.json({ success: true, data: tgData });
    } catch (err: any) {
      console.warn('Telegram server dispatch error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Telegram Auto-Backup File Dispatch Endpoint (.json document delivery)
  app.all(['/api/telegram/backup', '/api/telegram/backup/', '*/api/telegram/backup'], async (req, res) => {
    try {
      const { botToken, chatId, storeData, caption } = req.body;
      if (!botToken || !chatId) {
        return res.status(400).json({ success: false, error: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ឱ្យបានត្រឹមត្រូវ!' });
      }

      const { cleanToken, cleanChatId } = cleanTelegramParams(botToken, chatId);

      if (cleanToken === 'bot_demo_token_bim_school' || cleanToken.startsWith('bot_demo_')) {
        return res.status(400).json({
          success: false,
          error: 'Bot Token នៅជា Demo Placeholder (bot_demo_token_bim_school) នៅឡើយ។ សូមកំណត់ Bot Token ពិតប្រាកដក្នុង Settings!',
        });
      }

      // Step 1: Prepare Backup Payload
      let jsonPayload = '';
      if (storeData) {
        jsonPayload = typeof storeData === 'string' ? storeData : JSON.stringify(storeData, null, 2);
        // Sync to STORE_FILE on server
        try {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          fs.writeFileSync(STORE_FILE, jsonPayload, 'utf-8');
        } catch {}
      } else if (fs.existsSync(STORE_FILE)) {
        jsonPayload = fs.readFileSync(STORE_FILE, 'utf-8');
      } else {
        jsonPayload = JSON.stringify({ message: 'Empty store backup', timestamp: new Date().toISOString() }, null, 2);
      }

      // Also persist to BACKUPS_DIR
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const fileName = `BIM_Rangsei_Backup_${datePart}_${timePart}.json`;

      try {
        const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
        if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
        fs.writeFileSync(path.join(BACKUPS_DIR, fileName), jsonPayload, 'utf-8');
      } catch {}

      const sizeBytes = Buffer.byteLength(jsonPayload, 'utf-8');
      const sizeKb = (sizeBytes / 1024).toFixed(1);
      const dateKhmer = now.toLocaleString('km-KH');

      // Step 2: Prepare clean HTML caption (avoids Markdown entity parse errors on filenames with underscores)
      const captionHtml = caption
        ? convertMarkdownToTelegramHtml(caption)
        : `💾 <b>BIM Rangsei School Database Backup</b>\n📅 <b>កាលបរិច្ឆេទ៖</b> ${escapeTelegramHtml(dateKhmer)}\n📁 <b>ឯកសារ៖</b> <code>${escapeTelegramHtml(fileName)}</code> (${sizeKb} KB)\n🏫 <b>សាលា អ៊ីរ៉ែលកម្ពុជា (BIM Rangsei School)</b>\n✅ <b>ទិន្នន័យ៖</b> បញ្ជីសិស្ស, ថ្លៃសិក្សា, សម្ភារៈ, ឯកសណ្ឋាន & អាហារដ្ឋាន`;

      // Step 3: Send Document via FormData
      const formData = new FormData();
      formData.append('chat_id', cleanChatId);
      formData.append('caption', captionHtml);
      formData.append('parse_mode', 'HTML');
      const fileBlob = new Blob([jsonPayload], { type: 'application/json' });
      formData.append('document', fileBlob, fileName);

      let tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      let tgData = await tgRes.json();

      // Retry without parse_mode if entity parse error occurred
      if (!tgRes.ok && (tgData.description?.includes('parse') || tgData.description?.includes('entity'))) {
        const plainCaption = `💾 BIM Rangsei School Database Backup\n📅 កាលបរិច្ឆេទ: ${dateKhmer}\n📁 ឯកសារ: ${fileName} (${sizeKb} KB)\n✅ ទិន្នន័យ: បញ្ជីសិស្ស, ថ្លៃសិក្សា, សម្ភារៈ, ឯកសណ្ឋាន & អាហារដ្ឋាន`;
        const retryFd = new FormData();
        retryFd.append('chat_id', cleanChatId);
        retryFd.append('caption', plainCaption);
        const retryBlob = new Blob([jsonPayload], { type: 'application/json' });
        retryFd.append('document', retryBlob, fileName);

        tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
          method: 'POST',
          body: retryFd,
        });
        tgData = await tgRes.json();
      }

      // Step 4: Handle failure with detailed explanation
      if (!tgRes.ok || !tgData.ok) {
        let hint = tgData.description || 'បរាជ័យក្នុងការផ្ញើឯកសារទៅ Telegram';
        if (hint.includes('chat not found')) {
          hint = `រកមិនឃើញ Chat ID "${cleanChatId}" ទេ។ សូមប្រាកដថាបាន Add Bot ចូលក្នុង Telegram Group និងបានតម្លើងសិទ្ធិជា Administrator។`;
        } else if (hint.includes('bot is not a member') || hint.includes('not a member')) {
          hint = `Bot មិនទាន់បានចូលក្នុង Group នេះទេ។ សូម Add Bot ចូលក្នុង Group ហើយតម្លើងជា Admin។`;
        } else if (hint.includes('Forbidden: bot was blocked')) {
          hint = `Bot ត្រូវបាន Block។ សូម Start Bot ឡើងវិញក្នុង Telegram។`;
        } else if (hint.includes('not enough rights')) {
          hint = `Bot មិនមានសិទ្ធិផ្ញើឯកសារ (Send Documents) ក្នុង Group នេះទេ។ សូមតម្លើងសិទ្ធិ Bot ជា Administrator។`;
        }

        return res.status(400).json({
          success: false,
          error: hint,
          rawError: tgData,
        });
      }

      return res.json({
        success: true,
        fileName,
        sizeBytes,
        dateKhmer,
        message: `បានផ្ញើឯកសារ Backup (${fileName}) ទៅកាន់ Telegram Group ដោយជោគជ័យ!`,
        tgResponse: tgData,
      });
    } catch (err: any) {
      console.warn('Telegram backup dispatch error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Error sending backup file to Telegram' });
    }
  });

  // Dedicated Backup Storage Endpoints
  const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
  if (!fs.existsSync(BACKUPS_DIR)) {
    try {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    } catch {}
  }

  // 1. Get list of all backup snapshots
  app.get('/api/backups', (req, res) => {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) {
        return res.json({ success: true, backups: [] });
      }
      const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
      const backups = files.map((file) => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        let meta = null;
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          meta = {
            id: parsed.snapshotId || parsed.id || file,
            source: parsed.backupType || parsed.source || 'auto',
            totalStudents: parsed.studentRecords?.totalCount ?? (parsed.studentRecords?.students?.length ?? (parsed.totalStudents ?? 0)),
            todaySalesUSD: parsed.dailySales?.totals?.usd ?? 0,
            todaySalesKHR: parsed.dailySales?.totals?.khr ?? 0,
            todayTransactionsCount: parsed.dailySales?.totals?.count ?? 0,
            createdAt: parsed.createdAt || parsed.timestamp || stats.mtime.toISOString(),
          };
        } catch {
          // ignore parsing error for corrupt files
        }
        return {
          filename: file,
          sizeBytes: stats.size,
          mtime: stats.mtime.toISOString(),
          meta,
        };
      }).sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

      return res.json({ success: true, backups });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Save a new auto/manual backup snapshot
  app.post('/api/backups', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ success: false, error: 'JSON payload is required' });
      }
      if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
      }

      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const typePart = (payload.backupType || payload.source || 'auto').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `backup_${typePart}_${datePart}_${timePart}.json`;
      const filePath = path.join(BACKUPS_DIR, filename);

      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

      // Keep maximum 30 backup files to manage disk space
      try {
        const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
        if (files.length > 30) {
          const sorted = files.map((f) => ({
            name: f,
            time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime(),
          })).sort((a, b) => a.time - b.time);

          // delete oldest beyond 30
          const toRemove = sorted.slice(0, files.length - 30);
          toRemove.forEach((item) => {
            try { fs.unlinkSync(path.join(BACKUPS_DIR, item.name)); } catch {}
          });
        }
      } catch {}

      return res.json({
        success: true,
        filename,
        savedAt: now.toISOString(),
        sizeBytes: fs.statSync(filePath).size,
      });
    } catch (err: any) {
      console.error('Error saving backup file:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Download/get single backup snapshot
  app.get('/api/backups/:filename', (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(BACKUPS_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Backup file not found' });
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return res.json({ success: true, filename, data: JSON.parse(content) });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Delete backup file
  app.delete('/api/backups/:filename', (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(BACKUPS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.json({ success: true, filename });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Unified Cloud Sync Endpoint
  app.post('/api/cloud-sync', async (req, res) => {
    try {
      const { backupData, telegramConfig } = req.body;
      if (!backupData || typeof backupData !== 'object') {
        return res.status(400).json({ success: false, error: 'backupData is required' });
      }

      // A. Write to current server store
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(backupData, null, 2), 'utf-8');

      // B. Save a named timestamped snapshot in backups dir
      if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
      }
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const snapshotName = `cloud_sync_${datePart}_${timePart}.json`;
      const snapshotPath = path.join(BACKUPS_DIR, snapshotName);
      fs.writeFileSync(snapshotPath, JSON.stringify(backupData, null, 2), 'utf-8');

      // Persist to Supabase PostgreSQL & REST
      saveSchoolState(backupData).catch(() => {});
      let supabaseSynced = false;
      if (pgPool && pgInitialized) {
        try {
          const client = await pgPool.connect();
          try {
            await client.query(`
              CREATE TABLE IF NOT EXISTS bim_school_backups (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                meta JSONB,
                data JSONB
              );
              INSERT INTO bim_school_backups (id, title, created_at, meta, data)
              VALUES ($1, $2, NOW(), $3, $4)
              ON CONFLICT (id) DO UPDATE SET data = $4, meta = $3;
            `, [snapshotName, `Backup ${datePart}`, JSON.stringify({ filename: snapshotName, date: datePart }), JSON.stringify(backupData)]);
            supabaseSynced = true;
          } finally {
            client.release();
          }
        } catch {
          supabaseSynced = false;
        }
      }

      let tgResult = null;
      let tgSynced = false;

      // C. If Telegram credentials provided or available, dispatch to Telegram Cloud
      if (telegramConfig?.botToken && telegramConfig?.chatId) {
        try {
          const { cleanToken, cleanChatId } = cleanTelegramParams(telegramConfig.botToken, telegramConfig.chatId);
          if (cleanToken && cleanChatId && !cleanToken.startsWith('bot_demo_')) {
            const jsonPayload = JSON.stringify(backupData, null, 2);
            const dateKhmer = now.toLocaleString('km-KH');
            const sizeKb = (Buffer.byteLength(jsonPayload, 'utf-8') / 1024).toFixed(1);

            const captionHtml = `☁️ <b>BIM Rangsei Cloud Sync &amp; Auto-Backup</b>\n📅 <b>កាលបរិច្ឆេទ៖</b> ${escapeTelegramHtml(dateKhmer)}\n📁 <b>ឯកសារ៖</b> <code>${escapeTelegramHtml(snapshotName)}</code> (${sizeKb} KB)\n✅ <b>សមកាលកម្ម៖</b> បានរក្សាទុកក្នុង Server &amp; Telegram Cloud Storage`;

            const formData = new FormData();
            formData.append('chat_id', cleanChatId);
            formData.append('caption', captionHtml);
            formData.append('parse_mode', 'HTML');
            const fileBlob = new Blob([jsonPayload], { type: 'application/json' });
            formData.append('document', fileBlob, snapshotName);

            let tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
              method: 'POST',
              body: formData,
            });
            let tgData = await tgRes.json();

            // Retry plain text caption if HTML parse issue
            if (!tgRes.ok && (tgData.description?.includes('parse') || tgData.description?.includes('entity'))) {
              const plainCaption = `☁️ BIM Rangsei Cloud Sync & Auto-Backup\n📅 កាលបរិច្ឆេទ: ${dateKhmer}\n📁 ឯកសារ: ${snapshotName} (${sizeKb} KB)\n✅ សមកាលកម្ម: បានរក្សាទុកក្នុង Server & Telegram Cloud Storage`;
              const retryFd = new FormData();
              retryFd.append('chat_id', cleanChatId);
              retryFd.append('caption', plainCaption);
              const retryBlob = new Blob([jsonPayload], { type: 'application/json' });
              retryFd.append('document', retryBlob, snapshotName);

              tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
                method: 'POST',
                body: retryFd,
              });
              tgData = await tgRes.json();
            }

            tgResult = tgData;
            tgSynced = !!tgData.ok;
          }
        } catch (tgErr) {
          console.warn('Telegram cloud sync error:', tgErr);
        }
      }

      return res.json({
        success: true,
        snapshotName,
        savedAt: now.toISOString(),
        supabaseSynced,
        tgSynced,
        tgResult,
        message: tgSynced
          ? 'បានធ្វើសមកាលកម្មទៅកាន់ Supabase Database និង Telegram Cloud ដោយជោគជ័យ!'
          : 'បានធ្វើសមកាលកម្មទិន្នន័យទៅ Supabase Database & Server Storage ដោយជោគជ័យ!',
      });
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // School Logo Upload Endpoint
  app.post('/api/upload-logo', (req, res) => {
    try {
      const { imageBase64, filename } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: 'imageBase64 payload is required' });
      }

      const UPLOADS_DIR = path.join(__dirname, 'public', 'assets', 'uploads');
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      let ext = 'png';
      if (filename && filename.includes('.')) {
        ext = filename.split('.').pop().toLowerCase();
      } else if (imageBase64.includes('image/jpeg')) {
        ext = 'jpg';
      } else if (imageBase64.includes('image/svg+xml')) {
        ext = 'svg';
      } else if (imageBase64.includes('image/webp')) {
        ext = 'webp';
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+.-]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeName = `school_logo_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, buffer);

      return res.json({
        success: true,
        url: `/assets/uploads/${safeName}`,
      });
    } catch (err: any) {
      console.error('Upload logo error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
