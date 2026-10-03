import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for Thai FDA 13-digit checksum validation
function validateThaiFoodSerial(serial: string): { isValid: boolean; explanation: string; breakdown: any } {
  const cleaned = serial.replace(/[^0-9]/g, '');
  if (cleaned.length !== 13) {
    return {
      isValid: false,
      explanation: `เลขสารบบอาหารต้องมีความยาว 13 หลัก (ปัจจุบันมี ${cleaned.length} หลัก)`,
      breakdown: null,
    };
  }

  const province = cleaned.slice(0, 2);
  const status = cleaned.slice(2, 3);
  const factory = cleaned.slice(3, 8);
  const year = cleaned.slice(8, 9);
  const running = cleaned.slice(9, 13);

  // Checksum calculation: standard Mod 11 algorithm
  // Weights: 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 for first 12 digits
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i], 10) * (13 - i);
  }
  const checkDigitCalc = (11 - (sum % 11)) % 10;
  const lastDigit = parseInt(cleaned[12], 10);
  const isChecksumValid = checkDigitCalc === lastDigit;

  const provinceNames: Record<string, string> = {
    '10': 'กรุงเทพมหานคร',
    '11': 'สมุทรปราการ',
    '12': 'นนทบุรี',
    '13': 'ปทุมธานี',
    '14': 'พระนครศรีอยุธยา',
    '15': 'อ่างทอง',
    '16': 'ลพบุรี',
    '17': 'สิงห์บุรี',
    '18': 'ชัยนาท',
    '19': 'สระบุรี',
    '20': 'ชลบุรี',
    '21': 'ระยอง',
    '22': 'จันทบุรี',
    '23': 'ตราด',
    '24': 'ฉะเชิงเทรา',
    '25': 'ปราจีนบุรี',
    '26': 'นครนายก',
    '27': 'สระแก้ว',
    '30': 'นครราชสีมา',
    '40': 'ขอนแก่น',
    '41': 'อุดรธานี',
    '50': 'เชียงใหม่',
    '73': 'นครปฐม',
    '74': 'สมุทรสาคร',
    '77': 'ประจวบคีรีขันธ์',
    '80': 'นครศรีธรรมราช',
    '83': 'ภูเก็ต',
    '90': 'สงขลา',
  };

  const provinceName = provinceNames[province] || `รหัสจังหวัด ${province}`;
  const statusText = status === '1' ? 'ผลิตในประเทศ' : status === '2' ? 'นำเข้าจากต่างประเทศ' : 'สถานะอื่น/พิเศษ';

  return {
    isValid: isChecksumValid,
    explanation: isChecksumValid
      ? `โครงสร้างเลข อย. ถูกต้องตามมาตรฐาน 13 หลัก (สถานที่ผลิต ${provinceName}, ${statusText})`
      : `รูปแบบ 13 หลักตรงโครงสร้าง แต่เลขตรวจสอบ (Checksum) ไม่ตรงสูตรคำนวณมาตรฐาน (คำนวณได้ ${checkDigitCalc} แต่ระบุ ${lastDigit})`,
    breakdown: {
      province: `${province} (${provinceName})`,
      status: `${status} (${statusText})`,
      factory: factory,
      year: year,
      running: running,
      checkDigit: `${lastDigit} (สูตรคำนวณ: ${checkDigitCalc})`,
      formatted: `${province}-${status}-${factory}-${year}-${running}`,
    },
  };
}

// Helper for Drug Registration Format
function validateDrugReg(text: string): { isValid: boolean; explanation: string; breakdown: any } {
  // e.g. 1A 234/50 or 2A 12/65 or G 123/45 or K 45/60
  const drugRegex = /^([1-2]?[A-Z])\s*([0-9]+)\/([0-9]{2})$/i;
  const match = text.trim().match(drugRegex);

  if (!match) {
    return {
      isValid: false,
      explanation: 'รูปแบบไม่ตรงกับทะเบียนยา อย. (เช่น 1A 234/50, 2A 12/60, G 123/45)',
      breakdown: null,
    };
  }

  const category = match[1].toUpperCase();
  const running = match[2];
  const year = match[3];

  const catMap: Record<string, string> = {
    '1A': 'ยาแผนปัจจุบันสำหรับมนุษย์ ผลิตภายในประเทศ (ยาเดี่ยว)',
    '2A': 'ยาแผนปัจจุบันสำหรับมนุษย์ ผลิตภายในประเทศ (ยาสูตรผสม)',
    '1B': 'ยาแผนปัจจุบันสำหรับมนุษย์ นำเข้าหรือสั่งเข้ามาในราชอาณาจักร (ยาเดี่ยว)',
    '2B': 'ยาแผนปัจจุบันสำหรับมนุษย์ นำเข้าหรือสั่งเข้ามาในราชอาณาจักร (ยาสูตรผสม)',
    '1C': 'ยาแผนปัจจุบันแบ่งบรรจุ (ยาเดี่ยว)',
    '2C': 'ยาแผนปัจจุบันแบ่งบรรจุ (ยาสูตรผสม)',
    '1K': 'ยาแผนปัจจุบันสำหรับมนุษย์ นำเข้าหรือสั่งเข้ามาในราชอาณาจักร (ยาเดี่ยว)',
    '2N': 'ยาแผนปัจจุบันสำหรับมนุษย์ นำเข้าหรือสั่งเข้ามาในราชอาณาจักร (ยาสูตรผสม)',
    'G': 'ยาแผนโบราณสำหรับมนุษย์ ผลิตภายในประเทศ',
    'K': 'ยาแผนโบราณสำหรับมนุษย์ นำเข้าหรือสั่งเข้ามาในราชอาณาจักร',
    'N': 'ยาสำหรับสัตว์ ผลิตภายในประเทศ',
  };

  const meaning = catMap[category] || `หมวดยา ${category}`;

  return {
    isValid: true,
    explanation: `โครงสร้างทะเบียนยาถูกต้อง: ${meaning} ลำดับที่ ${running} ปี พ.ศ. 25${year}`,
    breakdown: {
      category: `${category} (${meaning})`,
      number: running,
      year: `25${year}`,
      formatted: `${category} ${running}/${year}`,
    },
  };
}

// 1. API: Check FDA Format
app.post('/api/check-fda-format', (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'กรุณาระบุรหัสที่ต้องการตรวจสอบ' });
    }

    const trimmed = code.trim();
    // Check if it looks like food serial (contains mostly digits)
    const digitsOnly = trimmed.replace(/[^0-9]/g, '');
    if (digitsOnly.length === 13) {
      const result = validateThaiFoodSerial(trimmed);
      return res.json({
        type: 'food',
        raw: trimmed,
        isValid: result.isValid,
        explanation: result.explanation,
        breakdown: result.breakdown,
      });
    }

    // Try drug format
    const drugResult = validateDrugReg(trimmed);
    if (drugResult.isValid || /^[0-9]?[a-zA-Z]/i.test(trimmed)) {
      return res.json({
        type: 'drug',
        raw: trimmed,
        isValid: drugResult.isValid,
        explanation: drugResult.explanation,
        breakdown: drugResult.breakdown,
      });
    }

    return res.json({
      type: 'unknown',
      raw: trimmed,
      isValid: false,
      explanation: 'ไม่ตรงกับรูปแบบเลขสารบบอาหาร 13 หลัก หรือเลขทะเบียนยา อย. ไทย',
      breakdown: null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ' });
  }
});

// Helper for robust JSON extraction from model response
function extractCleanJson(rawText: string): any {
  if (!rawText) return null;
  let text = rawText.trim();
  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Locate the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const sub = text.substring(start, end + 1);
      return JSON.parse(sub);
    }
    throw e;
  }
}

// 2. API: Scan Food/Drug Label with Gemini Multimodal
app.post('/api/scan-label', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', rawText, userProfile } = req.body;

    if (!imageBase64 && !rawText) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาอัปโหลดรูปภาพฉลากหรือระบุข้อความฉลากที่ต้องการวิเคราะห์',
      });
    }

    const userProfileText = userProfile
      ? `
ข้อมูลสุขภาพผู้ใช้ปัจจุบัน:
- โหมดผู้สูงอายุ: ${userProfile.elderlyMode ? 'เปิดใช้งาน (ต้องการภาษาเข้าใจง่าย ตัวหนังสือชัดเจน แนะนำสิ่งที่ควรทำและไม่ควรทำเป็นข้อๆ ชัดเจน)' : 'ปิดใช้งาน'}
- โรคประจำตัว / ภาวะสุขภาพ: ${(userProfile.diseases || []).join(', ') || 'ไม่มี'}
- ประวัติการแพ้อาหารหรือแพ้ยา: ${(userProfile.allergies || []).join(', ') || 'ไม่มี'}
- ยาที่รับประทานประจำ: ${(userProfile.medications || []).join(', ') || 'ไม่มี'}
`
      : 'ไม่มีข้อมูลสุขภาพเฉพาะบุคคล';

    const systemInstruction = `
# SYSTEM INSTRUCTION: NutriMed Scan AI Agent (Structure Validation Mode)

## 1. ROLE AND IDENTITY
You are "NutriMed Expert", an AI specialized in pharmaceutical labels, food nutrition, and Thailand FDA (สำนักงานคณะกรรมการอาหารและยา) structure validation.
Your goal is to extract label data (OCR) accurately, validate Thai FDA & Drug Registration numbers against official structural patterns, and provide simple, actionable safety advice for everyday consumers and elderly users.

---

## 2. FDA & DRUG REGISTRATION VALIDATION RULES (METHOD 1: STRUCTURE CHECK)
When detecting any Thai FDA or Drug Registration number on the label, strictly check against these structural rules:

### A. Food Serial Number (เลขสารบบอาหาร 13 หลัก)
- Format Structure: XX-X-XXXXX-X-XXXX (13 digits total, separated by dashes/spaces or continuous).
- Structure Breakdown:
  1. Digits 1-2 (Province Code): Thai province code (e.g., 10 = Bangkok, 11 = Samut Prakan, 50 = Chiang Mai, 73 = Nakhon Pathom).
  2. Digit 3 (Site Status): 1 = Manufactured in Thailand, 2 = Imported.
  3. Digits 4-8 (Factory ID): 5-digit registered factory ID number.
  4. Digit 9 (Approved Year Code): Last digit of B.E. year (e.g., 1 = B.E. 2561).
  5. Digits 10-13 (Product Sequence & Checksum): 4 digits where the 13th digit is a Checksum.
- Validation Action: If the number has fewer/more than 13 digits or invalid pattern, mark as "⚠️ โครงสร้างเลข อย. ไม่ถูกต้อง".

### B. Drug Registration Number (เลขทะเบียนยา)
- Modern Drug (ผลิตในประเทศ): Format 1A 123/50, 2A 12/60 (Pattern: [1-2][A-N] XXX/YY)
- Modern Drug (นำเข้า): Format 1B 123/45, 2N 56/61, 1K (Pattern: [1-2][B|K|N] XXX/YY)
- Traditional Drug (ยาแผนโบราณ): Format G 123/45, K 456/50 (Pattern: [G|K] XXX/YY)
- Validation Action: Verify the existence of category letters (A, B, G, K, etc.) and valid slash format (/ปี พ.ศ. สองหลัก).

---

## 3. UNREADABLE OR BLURRY IMAGE CRITICAL RULE
- If the image is blurry, out of focus, too dark/bright, or the text is illegible:
  DO NOT guess, fabricate, or hallucinate product names or FDA numbers!
  Set "isReadable": false
  Set "unreadableMessage": "ไม่สามารถอ่านข้อมูลบนฉลากได้อย่างชัดเจนเนื่องจากภาพเบลอ มืด หรือไม่โฟกัส กรุณาถ่ายภาพใหม่โดยให้แสงสว่างเพียงพอและเห็นข้อความบนฉลากอย่างครบถ้วน"
  Set "productName": "ไม่สามารถอ่านชื่อผลิตภัณฑ์ได้ชัดเจน"
  Set "riskLevel": "caution"
  Set "riskSummaryText": "⚠️ ภาพไม่ชัดเจน กรุณาถ่ายภาพใหม่"
  Set "directions": "ไม่สามารถอ่านวิธีใช้ได้ กรุณาถ่ายภาพใหม่"
  Set "userFriendlySummary": "ภาพไม่ชัดเจน กรุณาถ่ายภาพใหม่เพื่อให้ระบบสามารถอ่านส่วนประกอบและคำเตือนได้อย่างแม่นยำ"

---

## 4. OUTPUT FORMAT (STRICT JSON ONLY)
You MUST return a valid JSON object matching this schema:
{
  "isReadable": boolean,
  "unreadableMessage": string (or empty if readable),
  "productType": string (e.g. "ยา", "อาหาร", "เครื่องดื่ม", "ผลิตภัณฑ์เสริมอาหาร"),
  "productName": string,
  "brandName": string,
  "genericName": string,
  "fdaNumber": string,
  "nutritionFacts": {
    "calories": string,
    "sugar": string,
    "sodium": string,
    "fat": string
  },
  "activeIngredients": [string],
  "allergensFound": [
    { "allergen": string, "severity": "danger" | "warning", "note": string }
  ],
  "contraindications": [
    { "condition": string, "severity": "danger" | "warning", "reason": string }
  ],
  "drugInteractions": [
    { "drug": string, "severity": "danger" | "warning", "reason": string }
  ],
  "directions": string,
  "expiryDate": string,
  "storageAdvice": string,
  "warnings": [string],
  "riskLevel": "safe" | "caution" | "danger",
  "riskSummaryText": string,
  "userFriendlySummary": string,
  "actionableGuidance": [string],
  "elderlyTips": string,
  "rawOcrText": string,
  "formattedMarkdownReport": string
}
`;

    const parts: any[] = [];

    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const textPrompt = `
กรุณาวิเคราะห์ฉลากนี้อย่างละเอียด:
${rawText ? `ข้อความจากฉลาก:\n${rawText}\n` : ''}

${userProfileText}

คำแนะนำสำคัญ:
1. หากภาพเบลอ ไม่ชัดเจน หรือไม่ใช่ฉลากยา/อาหาร ให้ตั้งค่า isReadable เป็น false ห้ามเดาข้อมูล
2. หากอ่านได้ชัดเจน ให้สกัดชื่อผลิตภัณฑ์ เลข อย./ทะเบียนยา สารอาหาร สารก่อภูมิแพ้ วิธีใช้ และประเมินความเสี่ยงเทียบกับข้อมูลสุขภาพของผู้ใช้
3. ส่งคำตอบเป็น JSON ตามโครงสร้างที่กำหนดเท่านั้น
`;
    parts.push({ text: textPrompt });

    // Multi-model resilience: try gemini-3.1-flash-lite first (fastest and highest availability), then gemini-3.8-flash, then gemini-flash-latest
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let parsed: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: { parts },
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });

        const rawTextOutput = response.text || '';
        parsed = extractCleanJson(rawTextOutput);
        if (parsed && typeof parsed === 'object') {
          // Success! Break loop
          break;
        }
      } catch (err: any) {
        console.warn(`Scan model ${model} attempt failed:`, err.message);
        lastError = err;
        // If 503 or 429, wait 800ms and try next model
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    if (!parsed) {
      throw lastError || new Error('ไม่สามารถประมวลผลข้อมูลจากภาพฉลากได้');
    }

    // Default safety fallbacks if missing required fields
    if (parsed.isReadable === undefined) {
      parsed.isReadable = true;
    }

    if (!parsed.isReadable) {
      parsed.productName = parsed.productName || 'ไม่สามารถอ่านชื่อผลิตภัณฑ์ได้ชัดเจน';
      parsed.unreadableMessage =
        parsed.unreadableMessage ||
        'ไม่สามารถอ่านข้อมูลบนฉลากได้อย่างชัดเจนเนื่องจากภาพเบลอ มืด หรือไม่โฟกัส กรุณาถ่ายภาพใหม่โดยให้แสงสว่างเพียงพอและเห็นข้อความบนฉลากอย่างครบถ้วน';
      parsed.riskLevel = 'caution';
      parsed.riskSummaryText = '⚠️ ภาพไม่ชัดเจน กรุณาถ่ายภาพใหม่';
      parsed.directions = parsed.directions || 'ไม่สามารถอ่านวิธีใช้ได้ กรุณาถ่ายภาพใหม่';
      parsed.userFriendlySummary =
        parsed.userFriendlySummary ||
        'ภาพไม่ชัดเจน กรุณาถ่ายภาพใหม่เพื่อให้ระบบสามารถอ่านส่วนประกอบและคำเตือนได้อย่างแม่นยำ';
    }

    // Always enforce authoritative Method 1 structure check on fdaNumber if present
    if (parsed.fdaNumber && parsed.fdaNumber !== 'ไม่พบข้อมูล' && parsed.isReadable) {
      const cleanDigits = parsed.fdaNumber.replace(/[^0-9]/g, '');
      if (cleanDigits.length === 13) {
        const foodRes = validateThaiFoodSerial(parsed.fdaNumber);
        parsed.fdaValidation = {
          isValidFormat: foodRes.isValid,
          formatExplanation: foodRes.explanation,
          type: 'เลขสารบบอาหาร 13 หลัก',
          notes: foodRes.breakdown ? `จังหวัด: ${foodRes.breakdown.province}` : '',
          breakdown: foodRes.breakdown,
        };
      } else {
        const drugRes = validateDrugReg(parsed.fdaNumber);
        parsed.fdaValidation = {
          isValidFormat: drugRes.isValid,
          formatExplanation: drugRes.explanation,
          type: 'เลขทะเบียนยา อย.',
          notes: '',
          breakdown: drugRes.breakdown,
        };
      }
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Scan error:', err);
    // User-friendly error message in Thai (Requirement 10)
    let friendlyMessage = 'ระบบวิเคราะห์ฉลากขัดข้องชั่วคราว กรุณากดลองใหม่อีกครั้ง';
    const errMsg = String(err.message || '');
    if (errMsg.includes('503') || errMsg.includes('demand') || errMsg.includes('UNAVAILABLE')) {
      friendlyMessage = 'ขณะนี้เซิร์ฟเวอร์ AI มีผู้ใช้งานจำนวนมากชั่วคราว กรุณารอสักครู่แล้วกดลองใหม่อีกครั้ง';
    } else if (errMsg.includes('API key') || errMsg.includes('403') || errMsg.includes('401')) {
      friendlyMessage = 'เกิดปัญหาการยืนยันสิทธิ์ API กับเซิร์ฟเวอร์ กรุณาตรวจสอบการตั้งค่า';
    }

    res.status(500).json({
      success: false,
      error: friendlyMessage,
      technicalDetails: process.env.NODE_ENV !== 'production' ? errMsg : undefined,
    });
  }
});

// 3. API: Chat with FDA 1556 AI Consultant
app.post('/api/chat-fda', async (req, res) => {
  try {
    const { messages, currentScan, userProfile } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'กรุณาระบุข้อความสนทนา' });
    }

    const contextParts = [];
    if (userProfile) {
      contextParts.push(
        `ข้อมูลสุขภาพของผู้รับบริการ: โรคประจำตัว [${(userProfile.diseases || []).join(', ') || 'ไม่มี'}], แพ้ [${(userProfile.allergies || []).join(', ') || 'ไม่มี'}], ยาประจำ [${(userProfile.medications || []).join(', ') || 'ไม่มี'}]`
      );
    }
    if (currentScan) {
      contextParts.push(
        `ผลิตภัณฑ์ที่เพิ่งสแกนล่าสุด: ${currentScan.productName} (${currentScan.productType}) - ${currentScan.genericName || ''}, ระดับความเสี่ยง: ${currentScan.riskLevel}`
      );
    }

    const systemInstruction = `
คุณคือ "เจ้าหน้าที่ให้คำปรึกษา" ร่วมกับ NutriMed Scan AI
บุคลิก: สุภาพ อบอุ่น มีความรู้ความเชี่ยวชาญด้านยาและอาหารตามมาตรฐานสาธารณสุข ตอบด้วยภาษาไทยที่ชัดเจน เป็นมิตร และให้ความปลอดภัยแก่ผู้รับบริการสูงสุด

คำแนะนำ:
- ให้คำแนะนำการใช้ยาที่ถูกต้อง (เช่น ก่อน/หลังอาหาร, การลืมทานยา, การเก็บรักษา)
- เตือนเรื่องสารก่อภูมิแพ้ และอันตรายของยาปลอม/สินค้าสวมเลขทะเบียน
- หากเป็นกรณีฉุกเฉิน ยาเกินขนาด สารพิษ หรืออาการแพ้รุนแรง (เช่น หายใจไม่ออก ผื่นคัน แน่นหน้าอก) ให้แนะนำติดต่อ "การแพทย์ฉุกเฉิน 1669" หรือ "ศูนย์พิษวิทยา 1367" ทันที
- แนบคำเตือนทุกครั้ง: "ข้อมูลนี้เป็นคำแนะนำเบื้องต้นเพื่อความปลอดภัย หากมีอาการผิดปกติควรปรึกษาแพทย์หรือเภสัชกรใกล้บ้าน"
${contextParts.join('\n')}
`;

    // Map history to Gemini contents
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const reply = response.text || 'ขอบคุณสำหรับคำถามค่ะ หากต้องการคำแนะนำเพิ่มเติม สามารถสอบถามเจ้าหน้าที่ให้คำปรึกษาได้ตลอดเวลาค่ะ';

    res.json({
      reply,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาดในการสนทนา' });
  }
});

// 4. API: TTS Voice output using Gemini TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'กรุณาระบุข้อความ' });
    }

    // Limit text length for TTS
    const cleanText = text.slice(0, 300);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Clear, gentle, compassionate healthcare advisor speaking in natural Thai',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, format: 'audio/wav' });
    }

    return res.status(404).json({ error: 'No audio returned' });
  } catch (err: any) {
    console.warn('TTS error (fallback to Web Speech API on client):', err.message);
    res.status(500).json({ error: err.message || 'TTS unavailable' });
  }
});

// Vite middleware integration in dev mode, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`NutriMed Scan AI server is running on port ${PORT}`);
  });
}

startServer();
