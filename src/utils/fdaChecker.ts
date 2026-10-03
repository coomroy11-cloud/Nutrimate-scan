export interface FdaCheckResult {
  code: string;
  type: 'food' | 'drug' | 'unknown';
  isValid: boolean;
  explanation: string;
  breakdown: {
    title: string;
    items: { label: string; value: string; desc?: string }[];
  } | null;
}

const PROVINCE_MAP: Record<string, string> = {
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
  '31': 'บุรีรัมย์',
  '32': 'สุรินทร์',
  '33': 'ศรีสะเกษ',
  '34': 'อุบลราชธานี',
  '40': 'ขอนแก่น',
  '41': 'อุดรธานี',
  '50': 'เชียงใหม่',
  '57': 'เชียงราย',
  '70': 'ราชบุรี',
  '73': 'นครปฐม',
  '74': 'สมุทรสาคร',
  '75': 'สมุทรสงคราม',
  '76': 'เพชรบุรี',
  '77': 'ประจวบคีรีขันธ์',
  '80': 'นครศรีธรรมราช',
  '83': 'ภูเก็ต',
  '84': 'สุราษฎร์ธานี',
  '90': 'สงขลา',
};

const DRUG_CAT_MAP: Record<string, string> = {
  '1A': 'ยาแผนปัจจุบันสำหรับมนุษย์ ผลิตภายในประเทศ (ยาเดี่ยว)',
  '2A': 'ยาแผนปัจจุบันสำหรับมนุษย์ ผลิตภายในประเทศ (ยาสูตรผสม)',
  '1B': 'ยาแผนปัจจุบันสำหรับมนุษย์ นำเข้าจากต่างประเทศ (ยาเดี่ยว)',
  '2B': 'ยาแผนปัจจุบันสำหรับมนุษย์ นำเข้าจากต่างประเทศ (ยาสูตรผสม)',
  '1C': 'ยาแผนปัจจุบันสำหรับมนุษย์ แบ่งบรรจุ (ยาเดี่ยว)',
  '2C': 'ยาแผนปัจจุบันสำหรับมนุษย์ แบ่งบรรจุ (ยาสูตรผสม)',
  '1D': 'ยาชีววัตถุ ผลิตภายในประเทศ',
  '2D': 'ยาชีววัตถุ นำเข้าจากต่างประเทศ',
  'G': 'ยาแผนโบราณสำหรับมนุษย์ ผลิตภายในประเทศ',
  'H': 'ยาแผนโบราณสำหรับมนุษย์ แบ่งบรรจุ',
  'K': 'ยาแผนโบราณสำหรับมนุษย์ นำเข้าจากต่างประเทศ',
  'N': 'ยาสำหรับสัตว์ ผลิตภายในประเทศ',
  'P': 'ยาสำหรับสัตว์ นำเข้าจากต่างประเทศ',
};

export function checkFDAFormat(input: string): FdaCheckResult {
  const cleanStr = input.trim();

  // Try Food 13-digit format
  const digitsOnly = cleanStr.replace(/[^0-9]/g, '');
  if (digitsOnly.length === 13) {
    const province = digitsOnly.slice(0, 2);
    const status = digitsOnly.slice(2, 3);
    const factory = digitsOnly.slice(3, 8);
    const year = digitsOnly.slice(8, 9);
    const running = digitsOnly.slice(9, 13);

    // Mod 11 Checksum calculation
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digitsOnly[i], 10) * (13 - i);
    }
    const calculatedCheck = (11 - (sum % 11)) % 10;
    const actualCheck = parseInt(digitsOnly[12], 10);
    const isChecksumValid = calculatedCheck === actualCheck;

    const provinceName = PROVINCE_MAP[province] || `รหัสจังหวัด ${province}`;
    const statusText = status === '1' ? 'ผลิตในประเทศ' : status === '2' ? 'นำเข้าจากต่างประเทศ' : `ประเภทสถานที่ (${status})`;

    const formatted = `${province}-${status}-${factory}-${year}-${running}`;

    return {
      code: formatted,
      type: 'food',
      isValid: isChecksumValid,
      explanation: isChecksumValid
        ? `โครงสร้างเลขสารบบอาหาร 13 หลักถูกต้องสมบูรณ์ (สถานที่ผลิต: ${provinceName}, ${statusText})`
        : `โครงสร้าง 13 หลักถูกต้อง แต่เลขตรวจสอบ (Checksum) ไม่ถูกต้อง (คำนวณได้ ${calculatedCheck} แต่ฉลากระบุ ${actualCheck}) มีโอกาสเป็นเลขสวมหรือพิมพ์ผิด`,
      breakdown: {
        title: 'โครงสร้างเลขสารบบอาหาร 13 หลัก (อย.)',
        items: [
          { label: 'รหัสจังหวัด (2 หลักแรก)', value: province, desc: provinceName },
          { label: 'สถานะสถานที่ผลิต (1 หลัก)', value: status, desc: statusText },
          { label: 'เลขสถานที่ผลิต/นำเข้า (5 หลัก)', value: factory, desc: 'รหัสโรงงานที่ได้รับอนุญาต' },
          { label: 'รหัสปี พ.ศ. (1 หลัก)', value: year, desc: `เลขท้ายปีที่อนุญาต พ.ศ. 25x${year}` },
          { label: 'ลำดับที่อาหาร (4 หลัก)', value: running, desc: `ลำดับผลิตภัณฑ์ที่ ${running}` },
          {
            label: 'เลขตรวจสอบ Checksum (หลักสุดท้าย)',
            value: `${actualCheck} (สูตรคำนวณ: ${calculatedCheck})`,
            desc: isChecksumValid ? '✓ ผ่านการตรวจสอบสูตร Mod-11' : '⚠️ ตรวจสอบไม่ผ่าน (เลขไม่ตรงสูตร)',
          },
        ],
      },
    };
  }

  // Try Drug format: [1-2]?[A-Z] [0-9]+/[0-9]{2} or G 123/45
  const drugRegex = /^([1-2]?[A-Z])\s*([0-9]+)\/([0-9]{2})$/i;
  const drugMatch = cleanStr.match(drugRegex);

  if (drugMatch) {
    const category = drugMatch[1].toUpperCase();
    const regNum = drugMatch[2];
    const year = drugMatch[3];
    const meaning = DRUG_CAT_MAP[category] || `หมวดยา ${category}`;
    const formatted = `${category} ${regNum}/${year}`;

    return {
      code: formatted,
      type: 'drug',
      isValid: true,
      explanation: `โครงสร้างทะเบียนยาถูกต้อง: ${meaning} ลำดับที่ ${regNum} ขึ้นทะเบียนปี พ.ศ. 25${year}`,
      breakdown: {
        title: 'โครงสร้างเลขทะเบียนยา อย.',
        items: [
          { label: 'หมวดยา', value: category, desc: meaning },
          { label: 'ลำดับที่ขึ้นทะเบียน', value: regNum, desc: `ลำดับทะเบียนยาที่ ${regNum}` },
          { label: 'ปี พ.ศ. ที่ขึ้นทะเบียน', value: `25${year}`, desc: `ปี พ.ศ. 25${year}` },
        ],
      },
    };
  }

  return {
    code: cleanStr,
    type: 'unknown',
    isValid: false,
    explanation: 'รูปแบบไม่ตรงกับเลขสารบบอาหาร 13 หลัก (XX-X-XXXXX-X-XXXX) หรือเลขทะเบียนยา (เช่น 1A 234/50, G 123/45)',
    breakdown: null,
  };
}
