import { supabase, supabasePublic } from '../lib/supabase';
export { supabase, supabasePublic };

// Helper typings para reusar as que já existiam
import type { Professional, Category, SiteSetting } from './mockData';

export const getProfessionalsByCategory = async (categoryId: string): Promise<Professional[]> => {
  const { data, error } = await supabasePublic
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .eq('category', categoryId)
    .headers({ 'Cache-Control': 'no-cache' });
  if (error) {
    console.error('Error fetching professionals:', error);
    return [];
  }
  return (data || []).map(mapProfessional);
};

// Helper to map DB record to Professional interface
const mapProfessional = (pro: any): Professional => {
  return {
    ...pro,
    reviewCount: pro.review_count || 0,
    avatar: pro.avatar || "",
    category: pro.category || "other",
    // Mantemos os dois nomes para compatibilidade com o que já existe nos componentes
    portfolio: pro.portfolios || [],
    portfolios: pro.portfolios || [],
    reviews: pro.reviews || []
  };
};

export const getFeaturedProfessionals = async (): Promise<Professional[]> => {
  try {
    console.log('Buscando profissionais em destaque...');

    // Tentativa 1: profissionais marcados manualmente como destaque
    const { data: featuredData, error: featuredError } = await supabasePublic
      .from('professionals')
      .select('*, portfolios(*), reviews(*)')
      .eq('featured', true)
      .limit(6)
      .headers({ 'Cache-Control': 'no-cache' });

    if (featuredData && featuredData.length > 0) {
      console.log('Destaques manuais encontrados:', featuredData.length);
      return featuredData.map(mapProfessional);
    }

    // Fallback 1: Melhores avaliados
    const { data: ratedData } = await supabasePublic
      .from('professionals')
      .select('*, portfolios(*), reviews(*)')
      .order('rating', { ascending: false })
      .limit(6)
      .headers({ 'Cache-Control': 'no-cache' });

    if (ratedData && ratedData.length > 0) {
      console.log('Fallback 1 (Avaliados) encontrado:', ratedData.length);
      return ratedData.map(mapProfessional);
    }

    // Fallback Final: Super simples, sem joins, apenas profissionais para garantir que aparece ALGO
    console.log('Usando fallback final (sem joins)...');
    const { data: simpleData, error: simpleError } = await supabasePublic
      .from('professionals')
      .select('*')
      .limit(6)
      .headers({ 'Cache-Control': 'no-cache' });

    if (simpleError) {
      console.error('Erro crítico no fallback total:', simpleError);
      return [];
    }

    console.log('Fallback final obteve:', simpleData?.length || 0, 'perfis');
    return (simpleData || []).map(mapProfessional);
  } catch (err) {
    console.error('Erro fatal ao buscar destaques:', err);
    return [];
  }
};

export const searchProfessionals = async (query: string): Promise<Professional[]> => {
  const { data, error } = await supabasePublic
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .or(`name.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
    .headers({ 'Cache-Control': 'no-cache' });
  if (error) {
    console.error('Error searching professionals:', error);
    return [];
  }
  return (data || []).map(mapProfessional);
};

export const getProfessionalById = async (id: string): Promise<Professional | null> => {
  const { data, error } = await supabasePublic
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching professional:', error);
    return null;
  }
  return data ? mapProfessional(data) : null;
};

export const getSiteSettings = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabasePublic
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

export const getPlatformStats = async () => {
  try {
    const [prosCount, reviewsCount, portfoliosCount] = await Promise.all([
      supabasePublic
        .from('professionals')
        .select('*', { count: 'exact', head: true }),
      supabasePublic
        .from('reviews')
        .select('*', { count: 'exact', head: true }),
      supabasePublic
        .from('portfolios')
        .select('*', { count: 'exact', head: true })
    ]);

    return {
      activePros: prosCount.count || 0,
      verifiedReviews: reviewsCount.count || 0,
      completedProjects: portfoliosCount.count || 0
    };
  } catch (err) {
    console.error('Erro ao buscar estatísticas da plataforma:', err);
    return { activePros: 0, verifiedReviews: 0, completedProjects: 0 };
  }
};

export const getCategories = async () => {
  try {
    const { data, error } = await supabasePublic
      .from('categories')
      .select('*, professionals(count)')
      .order('name');

    if (error) {
      console.error('Erro Supabase (Categories):', error.message, error.details);
      return [];
    }

    // Mapear a contagem para facilitar o uso no frontend
    return (data || []).map(cat => ({
      ...cat,
      count: cat.professionals?.[0]?.count || 0
    }));
  } catch (err) {
    console.error('Erro fatal ao buscar categorias:', err);
    return [];
  }
};

export const getCategoryById = async (id: string) => {
  const { data, error } = await supabasePublic
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
      verification_status: profileData.verification_status || 'ativo'
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
      verification_submitted_at: new Date().toISOString(),
      rejection_reason: null, // Limpa o erro anterior ao reenviar
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
    .select('*, portfolios(*), reviews(*)')
    .in('verification_status', ['pending_review', 'suspenso', 'removido']);

  if (error) {
    console.error('Error fetching flagged verifications:', error);
    return [];
  }
  return (data || []).map(mapProfessional);
};

export const getAllProfessionals = async () => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all professionals:', error);
    return [];
  }
  return (data || []).map(mapProfessional);
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

export const adminRejectVerification = async (userId: string, reason: string) => {
  const { error } = await supabase
    .from('professionals')
    .update({
      verification_status: 'suspenso',
      rejection_reason: reason,
      verification_submitted_at: null // Reset submission time so they have to re-submit
    })
    .eq('id', userId);

  if (error) throw error;
  return true;
};

export const deleteProfessional = async (id: string) => {
  try {
    // 1. Delete associated portfolios
    await supabase
      .from('portfolios')
      .delete()
      .eq('professional_id', id);

    // 2. Delete associated reviews
    await supabase
      .from('reviews')
      .delete()
      .eq('professional_id', id);

    // 3. Delete the professional profile with explicit count check
    const { error, count } = await supabase
      .from('professionals')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw error;

    // Se o contador for 0, significa que o RLS impediu a eliminação ou o ID não existe
    if (count === 0) {
      throw new Error("A base de dados recusou a eliminação. Verifique as permissões de RLS para administradores.");
    }

    return true;
  } catch (error) {
    console.error('Error deleting professional:', error);
    throw error;
  }
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

export const getSiteStats = async () => {
  const { data, error } = await supabase
    .from('site_stats')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    console.error('Error fetching site stats:', error);
    return null;
  }
  return data;
};

export const getTopProfiles = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .order('total_views', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top profiles:', error);
    return [];
  }
  return (data || []).map(mapProfessional);
};

export const updateSiteSetting = async (key: string, value: string) => {
  const { data, error, count } = await supabase
    .from('site_settings')
    .upsert([{ key, value }], { count: 'exact' })
    .select()
    .single();

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }

  if (count === 0) {
    throw new Error("A base de dados recusou a alteração da configuração. Verifique as permissões de RLS.");
  }

  return data;
};

export const createCategory = async (category: Partial<Category>) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }
  return data;
};

export const updateCategory = async (id: string, categoryData: Partial<Category>) => {
  const { data, error, count } = await supabase
    .from('categories')
    .update(categoryData, { count: 'exact' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }

  if (count === 0) {
    throw new Error("A base de dados recusou a alteração da categoria. Verifique as permissões de RLS.");
  }


  return data;
};

export const getPendingSubscriptions = async () => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, professionals(*)')
    .eq('status', 'pending');
  if (error) {
    console.error('Error fetching pending subscriptions:', error);
    return [];
  }
  return data || [];
};

export const getAllSubscriptions = async () => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, professionals(*)');
  if (error) {
    console.error('Error fetching all subscriptions:', error);
    return [];
  }
  return data || [];
};

export const approveSubscription = async (id: string) => {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', id);
  if (error) {
    console.error('Error approving subscription:', error);
    throw error;
  }
  return true;
};

export const rejectSubscription = async (id: string, reason: string) => {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'blocked' })
    .eq('id', id);
  if (error) {
    console.error('Error rejecting subscription:', error);
    throw error;
  }
  return true;
};

export const createSubscriptionRequest = async (subscriptionData: any) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([subscriptionData])
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription request:', error);
    throw error;
  }
  return data;
};

export const getProfessionalSubscription = async (professionalId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error);
    return null;
  }
  return data;
};

