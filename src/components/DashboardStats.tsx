import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatsProps {
  stats: {
    daily_views: number;
    monthly_views: number;
    yearly_views: number;
    total_views: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const data = [
    { name: 'Hoje', value: stats.daily_views || 0, color: '#3b82f6' },
    { name: 'Mês', value: stats.monthly_views || 0, color: '#10b981' },
    { name: 'Ano', value: stats.yearly_views || 0, color: '#f59e0b' },
    { name: 'Total', value: stats.total_views || 0, color: '#8b5cf6' },
  ];

  const statItems = [
    { 
      label: 'Visitas Hoje', 
      value: stats.daily_views || 0, 
      icon: Eye, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Este Mês', 
      value: stats.monthly_views || 0, 
      icon: TrendingUp, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Este Ano', 
      value: stats.yearly_views || 0, 
      icon: Calendar, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10' 
    },
    { 
      label: 'Total Histórico', 
      value: stats.total_views || 0, 
      icon: BarChart3, 
      color: 'text-violet-500', 
      bg: 'bg-violet-500/10' 
    },
  ];

  return (
    <div className="space-y-6 mb-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-default">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg ${item.bg} ${item.color} mb-3`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <h3 className="text-2xl font-bold text-foreground">
                  {item.value.toLocaleString()}
                </h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Comparativo de Alcance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(0,0,0,0.1)', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    padding: '8px 12px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]} 
                  barSize={45} 
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardStats;
