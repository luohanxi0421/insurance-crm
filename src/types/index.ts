export interface Client {
  id: string;
  user_id: string;
  name: string;
  gender: 'male' | 'female' | null;
  phone: string | null;
  birth_date: string | null;
  lunar_birthday_month: number | null;
  lunar_birthday_day: number | null;
  lunar_is_leap_month: boolean | null;
  lunar_leap_month_order: number | null;
  birthday_type: 'solar' | 'lunar';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BloodRelationship {
  id: string;
  person_id: string;
  related_person_id: string;
  relation_type: 'father' | 'mother';
  created_at: string;
  related_name?: string;
  related_gender?: string;
  related_birth_date?: string;
}

export interface SpouseRelationship {
  id: string;
  male_id: string;
  female_id: string;
  relation_type: 'spouse' | 'cohabiting';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  male_name?: string;
  female_name?: string;
}

export interface Visit {
  id: string;
  client_id: string;
  visit_date: string;
  content: string;
  notes: string | null;
  created_at: string;
  gifts?: VisitGift[];
}

export interface VisitGift {
  id: string;
  visit_id: string;
  gift_name: string;
  quantity: number;
  price: number | null;
  delivery_type: 'in_person' | 'mailed';
  created_at: string;
}

export interface BirthdayReminder {
  client_id: string;
  name: string;
  birth_date: string;
  days_until: number;
  birthday_type: 'solar' | 'lunar';
}