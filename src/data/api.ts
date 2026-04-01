import { supabase } from '../lib/supabase';
export { supabase };

// Helper typings para reusar as que já existiam
import type { Professional, Category, SiteSetting } from './mockData';

export const getProfessionalsByCategory = async (categoryId: string): Promise<Professional[]> => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .eq('category', categoryId)
    .in('verification_status', ['ativo', 'verified']);
  if (error) {
    console.error('Error fetching professionals:', error);
    return [];
  }
  return data as unknown as Professional[];
};

export const getFeaturedProfessionals = async (): Promise<Professional[]> => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .eq('featured', true)
    .in('verification_status', ['ativo', 'verified']);
  if (error) {
    console.error('Error fetching featured professionals:', error);
    return [];
  }
  return data as unknown as Professional[];
};

export const searchProfessionals = async (query: string): Promise<Professional[]> => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .in('verification_status', ['ativo', 'verified'])
    .or(`name.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
  if (error) {
    console.error('Error searching professionals:', error);
    return [];
  }
  return data as unknown as Professional[];
};

export const getProfessionalById = async (id: string): Promise<Professional | null> => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching professional:', error);
    return null;
  }
  return data as unknown as Professional;
};

export const getSiteSettings = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');
    
  if (error) {
    console.error('Error fetching site settings:', error);
    return {};
  }
  
  return (data || []).reduce((acc, current) => {
    acc[current.key] = current.value;
    return acc;
  }, {} as Record<string, string>);
};

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*');
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
};

export const getCategoryById = async (id: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }
  return data;
};

export const createProfessionalProfile = async (profileData: any) => {
  // Usamos upsert para evitar erros de "duplicate key" e garantir visibilidade
  const { data, error } = await supabase
    .from('professionals')
    .upsert([{ 
      ...profileData, 
      verification_status: 'ativo' // Forçamos a visibilidade na criação/atualização
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating/updating professional:', error);
    throw error;
  }
  return data;
};

export const addPortfolios = async (portfolios: any[]) => {
  if (!portfolios || portfolios.length === 0) return;
  const { data, error } = await supabase
    .from('portfolios')
    .insert(portfolios);
    
  if (error) {
    console.error('Error adding portfolios:', error);
    throw error;
  }
  return data;
};

export const uploadVerificationDocument = async (file: File, userId: string, type: 'id_front' | 'id_back' | 'certificate'): Promise<string | null> => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('professional-documents')
    .upload(fileName, file);

  if (uploadError) {
    console.error(`Error uploading ${type}:`, uploadError);
    throw uploadError;
  }

  // Get signed URL because the bucket is private
  const { data, error } = await supabase.storage
    .from('professional-documents')
    .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
};

export const submitVerification = async (userId: string, data: any) => {
  const { error } = await supabase
    .from('professionals')
    .update({
      ...data,
      // We don't change 'verification_status' anymore to keep it public while pending review
    })
    .eq('id', userId);

  if (error) {
    console.error('Error submitting verification:', error);
    throw error;
  }
  return true;
};

export const performSimulatedOCR = async (file: File): Promise<{ name: string; idNumber: string }> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock data for demonstration
  return {
    name: "UTILIZADOR VERIFICADO MOCK",
    idNumber: Math.floor(10000000 + Math.random() * 90000000).toString() + "LA012"
  };
};

export const uploadImage = async (file: File): Promise<string | null> => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const updateProfessionalProfile = async (id: string, profileData: any) => {
  const { data, error } = await supabase
    .from('professionals')
    .update(profileData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating professional:', error);
    throw error;
  }
  return data;
};

export const getPendingVerifications = async () => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .in('verification_status', ['suspenso', 'removido']);
    
  if (error) {
    console.error('Error fetching flagged verifications:', error);
    return [];
  }
  return data;
};

export const getAllProfessionals = async () => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching all professionals:', error);
    return [];
  }
  return data;
};


export const adminUpdateVerificationStatus = async (userId: string, status: 'ativo' | 'suspenso' | 'removido') => {
  const { error } = await supabase
    .from('professionals')
    .update({ 
      verification_status: status,
      verified_at: status === 'ativo' ? new Date().toISOString() : null
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating status:', error);
    throw error;
  }
  return true;
};

export const adminUpdateFeaturedStatus = async (userId: string, featured: boolean) => {
  const { error } = await supabase
    .from('professionals')
    .update({ featured })
    .eq('id', userId);

  if (error) {
    console.error('Error updating featured status:', error);
    throw error;
  }
  return true;
};

export const deletePortfolioItem = async (id: string) => {
  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting portfolio:', error);
    throw error;
  }
  return true;
};

export const addReview = async (reviewData: { professional_id: string, author: string, rating: number, comment: string }) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert([reviewData])
    .select()
    .single();
    
  if (error) {
    console.error('Error adding review:', error);
    throw error;
  }
  return data;
};

export const getAdmins = async () => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
  return data || [];
};

export const addAdmin = async (email: string) => {
  // Get current user email for "added_by" field
  const { data: userData } = await supabase.auth.getUser();
  const addedBy = userData.user?.email || 'system';

  const { data, error } = await supabase
    .from('admins')
    .insert([{ email, added_by: addedBy }])
    .select()
    .single();
    
  if (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
  return data;
};

export const removeAdmin = async (email: string) => {
  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('email', email);
    
  if (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
  return true;
};

export const resendVerificationEmail = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/login`
    }
  });

  if (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
  return true;
};

export const recordProfileVisit = async (visitedId: string, visitorId?: string) => {
  const { error } = await supabase.rpc('record_profile_visit', {
    visited_user_id: visitedId,
    visitor_user_id: visitorId || null
  });

  if (error) {
    // We don't throw here to avoid breaking the UI for an analytics failure
    console.error('Error recording profile visit:', error);
    return false;
  }
  return true;
};
