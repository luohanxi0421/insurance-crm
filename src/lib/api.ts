import { Client, BloodRelationship, SpouseRelationship, Visit, VisitGift, BirthdayReminder } from '../types';
import { supabase } from './supabase';

// Auth
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function sendRegisterEmailCode(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });
  return { data, error };
}

export async function verifyRegisterEmailCode(
  email: string,
  code: string,
  password: string
) {
  // Prefer email OTP verification first.
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });
  let verifiedData = data;
  let verifyError = error;

  // Some Supabase projects may issue signup-type tokens for new users.
  if (verifyError) {
    const retry = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    verifiedData = retry.data;
    verifyError = retry.error;
  }
  if (verifyError) return { data: verifiedData, error: verifyError };

  // After OTP verification, set account password so the user can sign in with email+password.
  const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
    password,
  });
  if (updateError) return { data: updatedUser, error: updateError };

  return { data: verifiedData, error: null };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function requireCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) {
    throw new Error('登录状态已失效，请重新登录。');
  }
  return data.user.id;
}

// Clients
export async function fetchClients(userId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function searchClients(userId: string, query: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%` + query + `%`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function findClientByName(userId: string, name: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function findClientByPhone(userId: string, phone: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .eq('phone', phone)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function fetchClientById(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createClient(
  client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Client> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...client, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

// Blood Relationships
export async function fetchBloodRelationships(personId: string): Promise<BloodRelationship[]> {
  const { data, error } = await supabase
    .from('blood_relationships')
    .select('*, related:clients!blood_relationships_related_person_id_fkey(id, name, gender, birth_date)')
    .eq('person_id', personId);
  if (error) throw error;
  return (data || []).map((r: any) => ({
    ...r,
    related_name: r.related?.name,
    related_gender: r.related?.gender,
    related_birth_date: r.related?.birth_date,
  }));
}

export async function addBloodRelationship(personId: string, relatedPersonId: string, relationType: 'father' | 'mother'): Promise<BloodRelationship> {
  const { data, error } = await supabase
    .from('blood_relationships')
    .insert({ person_id: personId, related_person_id: relatedPersonId, relation_type: relationType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBloodRelationship(id: string): Promise<void> {
  const { error } = await supabase.from('blood_relationships').delete().eq('id', id);
  if (error) throw error;
}

// Spouse Relationships
export async function fetchSpouseRelationships(clientId: string): Promise<SpouseRelationship[]> {
  const { data, error } = await supabase
    .from('spouse_relationships')
    .select('*, male:clients!spouse_relationships_male_id_fkey(id, name), female:clients!spouse_relationships_female_id_fkey(id, name)')
    .or(`male_id.eq.` + clientId + `,female_id.eq.` + clientId);
  if (error) throw error;
  return (data || []).map((r: any) => ({
    ...r,
    male_name: r.male?.name,
    female_name: r.female?.name,
  }));
}

export async function addSpouseRelationship(maleId: string, femaleId: string, relationType: 'spouse' | 'cohabiting', startDate?: string, endDate?: string): Promise<SpouseRelationship> {
  const { data, error } = await supabase
    .from('spouse_relationships')
    .insert({ male_id: maleId, female_id: femaleId, relation_type: relationType, start_date: startDate || null, end_date: endDate || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpouseRelationship(id: string, updates: Partial<SpouseRelationship>): Promise<SpouseRelationship> {
  const { data, error } = await supabase.from('spouse_relationships').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSpouseRelationship(id: string): Promise<void> {
  const { error } = await supabase.from('spouse_relationships').delete().eq('id', id);
  if (error) throw error;
}

// Visits
export async function fetchVisitById(id: string): Promise<Visit> {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchVisits(clientId: string): Promise<Visit[]> {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('client_id', clientId)
    .order('visit_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createVisit(visit: Omit<Visit, 'id' | 'created_at'>): Promise<Visit> {
  const { data, error } = await supabase.from('visits').insert(visit).select().single();
  if (error) throw error;
  return data;
}

export async function updateVisit(id: string, updates: Partial<Visit>): Promise<Visit> {
  const { data, error } = await supabase.from('visits').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVisit(id: string): Promise<void> {
  const { error } = await supabase.from('visits').delete().eq('id', id);
  if (error) throw error;
}

// Visit Gifts
export async function fetchVisitGifts(visitId: string): Promise<VisitGift[]> {
  const { data, error } = await supabase.from('visit_gifts').select('*').eq('visit_id', visitId);
  if (error) throw error;
  return data || [];
}

export async function addVisitGift(gift: Omit<VisitGift, 'id' | 'created_at'>): Promise<VisitGift> {
  const { data, error } = await supabase.from('visit_gifts').insert(gift).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVisitGift(id: string): Promise<void> {
  const { error } = await supabase.from('visit_gifts').delete().eq('id', id);
  if (error) throw error;
}

// Birthday Reminders
export async function fetchBirthdayReminders(userId: string): Promise<BirthdayReminder[]> {
  const { data, error } = await supabase.rpc('get_upcoming_birthdays', { p_user_id: userId, p_days: 7 });
  if (error) throw error;
  return data || [];
}
