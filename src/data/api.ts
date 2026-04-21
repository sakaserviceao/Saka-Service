import { supabase, supabasePublic } from '../lib/supabase';
export { supabase, supabasePublic };

// Helper typings para reusar as que já existiam
import type { Professional, Category, SiteSetting, Imovel } from './mockData';
import { mockImoveis } from './mockData';

export const getProfessionalsByCategory = async (categoryId: string): Promise<Professional[]> => {
  const { data, error } = await supabasePublic
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .or(`category.eq.${categoryId},secondary_category_1.eq.${categoryId},secondary_category_2.eq.${categoryId}`);

  if (error) {
    return [];
  }

  // Se não houver nada, tentamos procurar pelo nome da categoria (caso o ID na DB esteja como nome)
  if (!data || data.length === 0) {
    const { data: categories } = await supabasePublic.from('categories').select('name').eq('id', categoryId).single();
    if (categories?.name) {
      const { data: retryData } = await supabasePublic
        .from('professionals')
        .select('*, portfolios(*), reviews(*)')
        .or(`category.eq.${categories.name},secondary_category_1.eq.${categories.name},secondary_category_2.eq.${categories.name}`);

      if (retryData && retryData.length > 0) {
        return retryData.map(mapProfessional);
      }
    }
  }

  return (data || []).map(mapProfessional);
};
// Helper to map DB record to Professional interface
const mapProfessional = (pro: any): Professional => {
  const reviews = pro.reviews || [];
  
  // Calculate average rating dynamically
  let calculatedRating = pro.rating;
  let recommendCount = 0;
  let cat_punctuality = 0;
  let cat_presentation = 0;
  let cat_technical = 0;
  let structuredCount = 0;

  if (reviews.length > 0) {
     const sum = reviews.reduce((acc: number, curr: any) => {
        // If it's a structured review, use the average of the 3 metrics
        if (curr.punctuality_rating && curr.presentation_rating && curr.technical_rating) {
           structuredCount++;
           cat_punctuality += curr.punctuality_rating;
           cat_presentation += curr.presentation_rating;
           cat_technical += curr.technical_rating;
           const avg = (curr.punctuality_rating + curr.presentation_rating + curr.technical_rating) / 3;
           if (curr.would_recommend) recommendCount++;
           return acc + avg;
        }
        // Fallback for legacy reviews
        if (curr.would_recommend !== false) recommendCount++; // Assume recommended if not explicitly false
        return acc + (curr.rating || 5);
     }, 0);
     
     calculatedRating = Number((sum / reviews.length).toFixed(1));
  }

  const recPercentage = reviews.length > 0 
    ? Math.round((recommendCount / reviews.length) * 100) 
    : 100;

  return {
    ...pro,
    rating: calculatedRating || 5.0,
    reviewCount: pro.review_count || reviews.length || 0,
    recommendation_percentage: recPercentage,
    category_ratings: structuredCount > 0 ? {
      punctuality: Number((cat_punctuality / structuredCount).toFixed(1)),
      presentation: Number((cat_presentation / structuredCount).toFixed(1)),
      technical: Number((cat_technical / structuredCount).toFixed(1)),
    } : undefined,
    avatar: pro.avatar || "",
    category: pro.category || "other",
    secondary_category_1: pro.secondary_category_1 || "",
    secondary_category_2: pro.secondary_category_2 || "",
    portfolio: pro.portfolios || [],
    reviews: reviews,
    subscription_status: pro.subscription_status || pro.status || 'pending',
    subscription_plan: pro.subscription_plan || pro.approved_plan || pro.selected_plan || 'MENSAL',
    subscription_end_date: pro.subscription_end_date || pro.end_date || '2026-05-07T23:59:59.000Z'
  };
};

export const getFeaturedProfessionals = async (): Promise<Professional[]> => {
  try {
    const { data, error } = await supabasePublic
      .from('professionals')
      .select('*, portfolios(*), reviews(*)')
      .eq('featured', true)
      .limit(10);

    if (error) {
      return [];
    }

    return (data || []).map(mapProfessional);
  } catch (err) {
    return [];
  }
};

export const searchProfessionals = async (query: string): Promise<Professional[]> => {
  const { data, error } = await supabasePublic
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .or(`name.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
  
  if (error) {
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

export const uploadVerificationDocument = async (file: File, userId: string, type: 'id_front' | 'id_back' | 'certificate' | 'activity_video'): Promise<string | null> => {
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
      verification_status: 'pending_review',
      verification_submitted_at: new Date().toISOString(),
      rejection_reason: null, 
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

export const updateProfessionalStatus = async (id: string, status: string) => {
  const updateData: any = { verification_status: status };
  
  if (status === 'ativo') {
    updateData.verified_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('professionals')
    .update(updateData)
    .eq('id', id);

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

export const updatePortfolioItem = async (id: string, updateData: any) => {
  const { data, error } = await supabase
    .from('portfolios')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating portfolio:', error);
    throw error;
  }
  return data;
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

export const addReview = async (reviewData: { 
  professional_id: string, 
  user_id: string,
  author: string, 
  rating: number, 
  comment: string,
  punctuality_rating?: number,
  presentation_rating?: number,
  technical_rating?: number,
  would_recommend?: boolean,
  hire_id?: string
}) => {
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

export const updateReview = async (reviewId: string, updateData: any) => {
  const { data, error } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw error;
  }
  return data;
};

export const deleteReview = async (reviewId: string) => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const addServiceHire = async (professional_id: string, user_id: string) => {
  const { data, error } = await supabase
    .from('service_hires')
    .insert([{ professional_id, user_id, status: 'pending' }])
    .select()
    .single();

  if (error) {
    console.error('Error adding hire:', error);
    throw error;
  }
  return data;
};

export const updateServiceHireStatus = async (hire_id: string, status: 'pending' | 'completed' | 'cancelled') => {
  // Tentamos primeiro pelo ID. Se falhar (e.g. RLS), a função já está robusta.
  const { data, error } = await supabase
    .from('service_hires')
    .update({ status })
    .eq('id', hire_id)
    .select();

  if (error) {
    console.error('Error updating hire status:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Nenhuma contratação encontrada ou permissão negada na base de dados. Verifique as Políticas RLS no Supabase.");
  }

  return data[0];
};

export const deleteServiceHire = async (hire_id: string) => {
  const { error } = await supabase
    .from('service_hires')
    .delete()
    .eq('id', hire_id);

  if (error) {
    console.error('Error deleting hire:', error);
    throw error;
  }
};

export const getUserHires = async (professional_id: string, user_id: string) => {
  const { data, error } = await supabase
    .from('service_hires')
    .select('*')
    .eq('professional_id', professional_id)
    .eq('user_id', user_id);

  if (error) {
    console.error('Error fetching hires:', error);
    return [];
  }
  return data || [];
};

export const getUserReviewForHire = async (hire_id: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('hire_id', hire_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching review for hire:', error);
    return null;
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
  try {
    const { error } = await supabase.rpc('record_profile_visit', {
      visited_user_id: visitedId,
      visitor_user_id: visitorId || null
    });

    if (error) {
      console.warn('Saka Service Analytics: Error recording visit:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Saka Service Analytics: Critical error in recordProfileVisit:', err);
    return false;
  }
};

export const getSiteStats = async () => {
  try {
    const { data, error } = await supabase
      .from('site_stats')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('Saka Service Analytics: site_stats "global" not found. Returning defaults.');
        return { daily_visits: 0, monthly_visits: 0, yearly_visits: 0 };
      }
      console.error('Saka Service Analytics: Error fetching site stats:', error.message);
      return { daily_visits: 0, monthly_visits: 0, yearly_visits: 0 };
    }
    return data;
  } catch (err) {
    console.error('Saka Service Analytics: Fatal error fetching stats:', err);
    return { daily_visits: 0, monthly_visits: 0, yearly_visits: 0 };
  }
};

export const getTopProfiles = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*, portfolios(*), reviews(*)')
    .order('total_views', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Saka Service Analytics: Error fetching top profiles:', error.message);
    return [];
  }
  return (data || []).map(mapProfessional);
};

export const logExportAction = async (adminEmail: string, format: string, rowCount: number, filters: any) => {
  try {
    const { error } = await supabase
      .from('export_logs')
      .insert([{
        admin_email: adminEmail,
        format: format,
        row_count: rowCount,
        filters_used: filters
      }]);
    
    if (error) console.error('Error logging export action:', error.message);
    return !error;
  } catch (err) {
    console.error('Fatal error in logExportAction:', err);
    return false;
  }
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

export const approveSubscription = async (id: string, approvedPlan: 'trimestral' | 'semestral' | 'anual') => {
  const startDate = new Date();
  const endDate = new Date();
  
  if (approvedPlan === 'trimestral') {
    endDate.setMonth(startDate.getMonth() + 3);
  } else if (approvedPlan === 'semestral') {
    endDate.setMonth(startDate.getMonth() + 6);
  } else if (approvedPlan === 'anual') {
    endDate.setFullYear(startDate.getFullYear() + 1);
  }

  console.log(`Saka Service: Tentando aprovar subscrição ${id} com plano ${approvedPlan}`);

  const { error: subError } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'active',
      approved_plan: approvedPlan,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
    .eq('id', id);

  if (subError) {
    console.error('Erro na tabela subscriptions:', subError);
    throw new Error(`Falha ao atualizar subscrição: ${subError.message}. Certifique-se que executou o SQL de migração.`);
  }

  const { data: sub, error: fetchError } = await supabase.from('subscriptions').select('professional_id').eq('id', id).single();
  
  if (fetchError || !sub) {
    console.error('Erro ao buscar professional_id:', fetchError);
    return true; // Subscrição foi paga, mas falhou ao vincular ao pro
  }

  const { error: proError } = await supabase.from('professionals').update({
    subscription_status: 'active',
    subscription_plan: approvedPlan,
    subscription_end_date: endDate.toISOString()
  }).eq('id', sub.professional_id);

  if (proError) {
    console.error('Erro na tabela professionals:', proError);
    // Não lançamos erro aqui para não travar a UI, mas avisamos no log
  }

  return true;
};

export const rejectSubscription = async (id: string, reason: string) => {
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'rejected',
      rejection_reason: reason 
    })
    .eq('id', id);

  if (error) {
    console.error('Error rejecting subscription:', error);
    throw error;
  }
  return true;
};

// Property Data Mapper
const mapProperty = (raw: any): Imovel => ({
  id: raw.id,
  tipologia: raw.tipologia as ImovelTipologia,
  numero_quartos: raw.numero_quartos,
  preco_mensal: Number(raw.preco_mensal),
  localizacao: raw.localizacao,
  imagens: raw.imagens || [],
  descricao: raw.descricao || "",
  contacto_nome: raw.contacto_nome || "Proprietário",
  contacto_telefone: raw.contacto_telefone || "",
  status: (raw.status as ImovelStatus) || "disponivel",
  created_at: raw.created_at,
});

export const getImoveis = async (): Promise<Imovel[]> => {
  try {
    const { data, error } = await supabasePublic
      .from('properties')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Properties table might not exist, using mock data');
      return mockImoveis;
    }
    return (data || []).map(mapProperty);
  } catch (err) {
    return mockImoveis;
  }
};

export const getImovelById = async (id: string): Promise<Imovel | null> => {
  try {
    const { data, error } = await supabasePublic
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return mockImoveis.find(i => i.id === id) || null;
    }
    return data ? mapProperty(data) : null;
  } catch (err) {
    return mockImoveis.find(i => i.id === id) || null;
  }
};

export const uploadPropertyFiles = async (files: File[], bucket: string = 'property-images'): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    urls.push(publicUrl);
  }
  return urls;
};

export const submitPropertyListing = async (propertyData: any, photos: File[], receipt: File | null) => {
  // 1. Upload Photos
  const imageUrls = await uploadPropertyFiles(photos);
  
  // 2. Upload Receipt
  let receiptUrl = "";
  if (receipt) {
    const receiptUrls = await uploadPropertyFiles([receipt]); // Using same bucket for now
    if (receiptUrls.length > 0) receiptUrl = receiptUrls[0];
  }

  // 3. Insert Data
  const { data, error } = await supabase
    .from('properties')
    .insert([{
      ...propertyData,
      imagens: imageUrls,
      comprovativo_url: receiptUrl,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error submitting property:', error);
    throw error;
  }
  return data;
};

export const getPendingProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'pending');
  
  if (error) return [];
  return (data || []).map(mapProperty);
};

export const updatePropertyStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
  const { error } = await supabase
    .from('properties')
    .update({ 
      status: status === 'approved' ? 'approved' : 'rejected', 
      rejection_reason: reason 
    })
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const createSubscriptionRequest = async (subscriptionData: any) => {
  // Map user_id to professional_id if needed, and set selected_plan
  const dataToInsert = {
    ...subscriptionData,
    professional_id: subscriptionData.user_id || subscriptionData.professional_id,
    selected_plan: subscriptionData.plan || subscriptionData.selected_plan,
    plan: subscriptionData.plan || subscriptionData.selected_plan // Set explicitly to prevent NOT NULL errors
  };
  delete dataToInsert.user_id;

  const { data, error } = await supabase
    .from('subscriptions')
    .insert([dataToInsert])
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

export const getNotifications = async (userId: string | null) => {
  let query = supabase.from('notifications').select('*');
  
  if (userId && userId !== 'undefined') {
    // Busca notificações específicas do utilizador OU globais (onde user_id é nulo)
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    // Se não houver utilizador, busca apenas as globais
    query = query.is('user_id', null);
  }

  const { data, error } = await query
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data;
};

export const markNotificationAsRead = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
  return true;
};

export const createNotification = async (notificationData: any) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationData])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification in API:', error);
    throw error;
  }
  return data;
};

export const deleteNotification = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
  return true;
};

export const getEmailTemplates = async () => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching email templates:', error);
    return [];
  }
  return data;
};

export const updateEmailTemplate = async (id: string, templateData: any) => {
  const { data, error } = await supabase
    .from('email_templates')
    .update({ ...templateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
  return data;
};

export const uploadServiceAttachment = async (file: File): Promise<string | null> => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('service-attachments')
    .upload(fileName, file);

  if (uploadError) {
    console.error("Error uploading service attachment:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('service-attachments')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const sendServiceMessage = async (messageData: { 
  sender_id: string, 
  receiver_id: string, 
  professional_id: string, 
  content: string, 
  sender_name?: string,
  attachment_url?: string | null 
}) => {
  // Como a coluna sender_name não existe na base de dados, 
  // anexamos o nome ao início do conteúdo da mensagem para preservá-lo.
  const finalContent = messageData.sender_name 
    ? `[Cliente: ${messageData.sender_name}] ${messageData.content}`
    : messageData.content;

  const { data, error } = await supabase
    .from('service_messages')
    .insert([{
      sender_id: messageData.sender_id,
      receiver_id: messageData.receiver_id,
      professional_id: messageData.professional_id,
      content: finalContent,
      attachment_url: messageData.attachment_url
    }])
    .select()
    .single();

  if (error) {
    console.error("Error sending service message:", error);
    throw error;
  }

  // Criar notificação para o profissional
  try {
    await createNotification({
      user_id: messageData.receiver_id,
      title: "Novo Pedido de Serviço",
      message: `Recebeu uma mensagem de um cliente: "${messageData.content.substring(0, 50)}${messageData.content.length > 50 ? '...' : ''}"`,
      level: 'success',
      type: 'message',
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
      link: '/perfil-editar?tab=messages'
    });
  } catch (notifErr) {
    console.warn("Failed to create notification for message:", notifErr);
  }

  return data;
};

export const getProfessionalMessages = async (receiverId: string) => {
  const { data, error } = await supabase
    .from('service_messages')
    .select('*')
    .or(`receiver_id.eq.${receiverId},sender_id.eq.${receiverId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching professional messages:", error);
    throw error;
  }
  return data;
};

export const getUnreadMessagesCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('service_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('status', 'unread');

  if (error) {
    console.error("Error counting unread messages:", error);
    return 0;
  }
  return count || 0;
};

export const replyToServiceMessage = async (parentId: string, replyData: { 
  sender_id: string, 
  receiver_id: string, 
  professional_id: string, 
  content: string,
  sender_name?: string
}) => {
  const { data, error } = await supabase
    .from('service_messages')
    .insert([{
      ...replyData,
      parent_id: parentId,
      status: 'replied'
    }])
    .select()
    .single();

  if (error) {
    console.error("Error replying to service message:", error);
    throw error;
  }

  // Marcar a original como respondida
  await supabase
    .from('service_messages')
    .update({ status: 'replied' })
    .eq('id', parentId);

  // Notificar o cliente
  try {
    await createNotification({
      user_id: replyData.receiver_id,
      title: "Resposta do Profissional",
      message: `O profissional respondeu ao seu pedido: "${replyData.content.substring(0, 50)}..."`,
      level: 'success',
      type: 'ui',
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (notifErr) {
    console.warn("Failed to notify client:", notifErr);
  }

  return data;
};
