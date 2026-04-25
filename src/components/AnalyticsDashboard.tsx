import React, { useState, useEffect } from 'react';
import { supabase } from '../data/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, Star, MessageSquare, TrendingUp, DollarSign, Users, Eye, CheckCircle } from 'lucide-react';

interface KPIMetric {
  id: string;
  kpi_name: string;
  value: number;
  date: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Busca os últimos 30 dias de métricas
      const { data, error } = await supabase
        .from('kpi_metrics')
        .select('*')
        .order('date', { ascending: true })
        .limit(210); // 7 KPIs * 30 dias

      if (error) throw error;
      if (data) setMetrics(data);
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper para obter o último valor de um KPI
  const getLatestValue = (kpiName: string): number => {
    const kpiData = metrics.filter(m => m.kpi_name === kpiName);
    if (kpiData.length === 0) return 0;
    return kpiData[kpiData.length - 1].value;
  };

  // Processamento de dados para gráficos (LineChart e BarChart)
  const getChartData = () => {
    const dates = [...new Set(metrics.map(m => m.date))];
    
    return dates.map(date => {
      const dayMetrics = metrics.filter(m => m.date === date);
      const dataPoint: any = { date: new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) };
      
      dayMetrics.forEach(m => {
        dataPoint[m.kpi_name] = Number(m.value).toFixed(2);
      });
      return dataPoint;
    });
  };

  const chartData = getChartData();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando métricas...</div>;
  }

  const taxaResposta = getLatestValue('taxa_de_resposta');
  const nps = getLatestValue('nps');
  const tempoMedio = getLatestValue('tempo_medio_resposta');
  
  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Desempenho</h2>
          <p className="text-muted-foreground">Monitorização executiva de KPIs da plataforma.</p>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Nº de Pedidos */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="tracking-tight text-sm font-medium">Novos Pedidos (Ontem)</h3>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{getLatestValue('numero_de_pedidos')}</div>
          <p className="text-xs text-muted-foreground">pedidos iniciados na plataforma</p>
        </div>

        {/* Taxa de Resposta */}
        <div className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2 ${taxaResposta < 50 ? 'border-red-500 bg-red-500/5' : 'border-green-500 bg-green-500/5'}`}>
          <div className="flex justify-between items-center">
            <h3 className="tracking-tight text-sm font-medium">Taxa de Resposta</h3>
            {taxaResposta < 50 ? <ArrowDownRight className="h-4 w-4 text-red-500" /> : <ArrowUpRight className="h-4 w-4 text-green-500" />}
          </div>
          <div className={`text-2xl font-bold ${taxaResposta < 50 ? 'text-red-600' : 'text-green-600'}`}>{taxaResposta.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">pedidos com resposta do profissional</p>
        </div>

        {/* NPS */}
        <div className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2 ${nps < 0 ? 'border-red-500 bg-red-500/5' : ''}`}>
          <div className="flex justify-between items-center">
            <h3 className="tracking-tight text-sm font-medium">NPS Global</h3>
            <Star className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{nps.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground">Score de satisfação (Promotores vs Detratores)</p>
        </div>

        {/* Receita Mensal */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="tracking-tight text-sm font-medium">Receita Corrente</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{getLatestValue('receita_mensal').toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</div>
          <p className="text-xs text-muted-foreground">total de subscrições ativas</p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Performance Line Chart */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 col-span-2 lg:col-span-1">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="font-semibold leading-none tracking-tight">Tempo Médio de Resposta</h3>
            <p className="text-sm text-muted-foreground">Evolução do tempo de resposta (em horas)</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                <YAxis fontSize={12} tickFormatter={(value) => `${value}h`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="tempo_medio_resposta" 
                  name="Tempo (Horas)" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Bar Chart */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 col-span-2 lg:col-span-1">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="font-semibold leading-none tracking-tight">Crescimento da Oferta</h3>
            <p className="text-sm text-muted-foreground">Novos profissionais ativados por dia</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                />
                <Legend />
                <Bar 
                  dataKey="crescimento_oferta" 
                  name="Novos Profissionais" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOP PROFESSIONALS SECTION */}
      <TopProfessionalsSection />

    </div>
  );
};

// Sub-component for Top Professionals
const TopProfessionalsSection = () => {
  const [topVisited, setTopVisited] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [topHired, setTopHired] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPros();
  }, []);

  const fetchTopPros = async () => {
    try {
      setLoading(true);
      // Fetch all professionals
      const { data: pros, error: prosError } = await supabase
        .from('professionals')
        .select('id, name, title, category, avatar, total_views, reviews(*)');
      
      if (prosError) throw prosError;
      if (!pros) return;

      // Top Visited
      const sortedByViews = [...pros].sort((a, b) => (b.total_views || 0) - (a.total_views || 0)).slice(0, 5);
      setTopVisited(sortedByViews);

      // Top Rated
      const prosWithRating = pros.map(p => {
        const reviews = p.reviews || [];
        const avg = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0;
        return { ...p, avgRating: avg, reviewsCount: reviews.length };
      });
      const sortedByRating = prosWithRating
        .filter(p => p.reviewsCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5);
      setTopRated(sortedByRating);

      // Top Hired (Count occurrences in service_hires)
      const { data: hires, error: hiresError } = await supabase.from('service_hires').select('professional_id');
      if (!hiresError && hires) {
        const hireCounts: Record<string, number> = {};
        hires.forEach(h => {
          if (h.professional_id) {
            hireCounts[h.professional_id] = (hireCounts[h.professional_id] || 0) + 1;
          }
        });
        const prosWithHires = pros.map(p => ({ ...p, hireCount: hireCounts[p.id] || 0 }));
        const sortedByHires = prosWithHires.sort((a, b) => b.hireCount - a.hireCount).slice(0, 5);
        setTopHired(sortedByHires);
      }

    } catch (error) {
      console.error("Error fetching top professionals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-40 bg-muted/20 rounded-xl border"></div>;

  const ProfileRow = ({ pro, metric, icon: Icon, metricLabel }: any) => (
    <div className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full overflow-hidden border">
          <img src={pro.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"} alt={pro.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-medium text-sm leading-tight">{pro.name}</p>
          <p className="text-xs text-muted-foreground">{pro.title || pro.category}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1 font-bold">
          {metric} <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="text-[10px] uppercase text-muted-foreground">{metricLabel}</p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-3 mt-8">
      {/* Mais Visitados */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold tracking-tight flex items-center gap-2"><Eye className="h-4 w-4 text-blue-500" /> Mais Visitados</h3>
        </div>
        <div className="p-2 flex-1">
          {topVisited.length === 0 ? <p className="text-sm text-center text-muted-foreground p-4">Sem dados</p> : 
            topVisited.map(p => <ProfileRow key={p.id} pro={p} metric={p.total_views || 0} icon={Eye} metricLabel="Views" />)
          }
        </div>
      </div>

      {/* Mais Bem Avaliados */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold tracking-tight flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Mais Bem Avaliados</h3>
        </div>
        <div className="p-2 flex-1">
          {topRated.length === 0 ? <p className="text-sm text-center text-muted-foreground p-4">Sem avaliações</p> : 
            topRated.map(p => <ProfileRow key={p.id} pro={p} metric={p.avgRating.toFixed(1)} icon={Star} metricLabel="Estrelas" />)
          }
        </div>
      </div>

      {/* Mais Contratados */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold tracking-tight flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Mais Contratados</h3>
        </div>
        <div className="p-2 flex-1">
          {topHired.length === 0 ? <p className="text-sm text-center text-muted-foreground p-4">Sem contratações</p> : 
            topHired.map(p => <ProfileRow key={p.id} pro={p} metric={p.hireCount || 0} icon={CheckCircle} metricLabel="Pedidos" />)
          }
        </div>
      </div>
    </div>
  );
};
