export type RiskLevel = 'safe' | 'caution' | 'danger';

export type ProductType = 'ยา' | 'อาหาร' | 'เครื่องดื่ม' | 'ผลิตภัณฑ์เสริมอาหาร' | 'ไม่สามารถระบุได้';

export interface FDAValidation {
  isValidFormat: boolean;
  formatExplanation: string;
  type: string;
  notes?: string;
  breakdown?: {
    province?: string;
    status?: string;
    factory?: string;
    year?: string;
    running?: string;
    checkDigit?: string;
    formatted?: string;
    category?: string;
    number?: string;
  };
}

export interface NutritionFacts {
  calories?: string;
  sugar?: string;
  sodium?: string;
  fat?: string;
  saturatedFat?: string;
}

export interface AllergenAlert {
  allergen: string;
  severity: 'danger' | 'warning';
  note: string;
}

export interface ContraindicationAlert {
  condition: string;
  severity: 'danger' | 'warning';
  reason: string;
}

export interface DrugInteractionAlert {
  drug: string;
  severity: 'danger' | 'warning';
  reason: string;
}

export interface ScanResult {
  id: string;
  timestamp: number;
  isReadable?: boolean;
  unreadableMessage?: string;
  productType: ProductType;
  productName: string;
  brandName?: string;
  genericName?: string;
  fdaNumber?: string;
  fdaValidation?: FDAValidation;
  nutritionFacts?: NutritionFacts;
  activeIngredients?: string[];
  allergensFound?: AllergenAlert[];
  contraindications?: ContraindicationAlert[];
  drugInteractions?: DrugInteractionAlert[];
  directions: string;
  expiryDate?: string;
  warnings?: string[];
  storageAdvice?: string;
  riskLevel: RiskLevel;
  riskSummaryText?: string;
  userFriendlySummary: string;
  actionableGuidance?: string[];
  elderlyTips?: string;
  imageUrl?: string;
  rawOcrText?: string;
  formattedMarkdownReport?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  age?: number | string;
  gender?: 'male' | 'female' | 'other' | '';
  elderlyMode: boolean;
  fontSize: 'normal' | 'large' | 'huge';
  diseases: string[];
  allergies: string[];
  medications: string[];
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
}
