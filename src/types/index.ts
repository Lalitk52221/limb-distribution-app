export interface Beneficiary {
  id: string;
  reg_number: string;
  camp_date: string;
  name: string;
  father_name?: string;
  date_of_birth?: string;
  age?: number;
  address?: string;
  state?: string;
  status?:string;
  phone_number?: string;
  aadhar_number?: string;
  type_of_aid?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  current_step: 'registration' | 'before_photo' | 'measurement' | 'fitment' | 'extra_items' | 'after_photo' | 'completed';
  completed_steps: string[];
  extra_items: ExtraItem[];
  step_volunteers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ExtraItem {
  item: string;
  quantity: number;
}

export interface CampSummary {
  total_beneficiaries: number;
  completed_beneficiaries: number;
  aid_types: Record<string, number>;
  extra_items: Record<string, number>;
  step_counts: Record<string, number>;
}