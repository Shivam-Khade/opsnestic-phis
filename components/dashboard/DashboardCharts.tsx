'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';

interface CategoryDatum {
  category: string;
  slug: string;
  correct_count: number;
  incorrect_count: number;
}

interface Props {
  categoryData: CategoryDatum[];
}

const COLORS = ['#00d4ff', '#7c3aed', '#2ed573', '#ffa502', '#ff4757', '#a78bfa', '#ff6b9d'];

export default function DashboardCharts({ categoryData }: Props) {
  const chartData = categoryData.map((d) => {
    const total = d.correct_count + d.incorrect_count;
    const accuracy = total > 0 ? Math.round((d.correct_count / total) * 100) : 0;
    return {
      name: d.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 12),
      accuracy,
      total,
    };
  });

  if (chartData.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
        Complete training scenarios to see category breakdown.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            boxShadow: 'var(--shadow-card)',
          }}
          formatter={(value) => [`${Number(value)}%`, 'Accuracy']}
          cursor={{ fill: 'var(--bg-surface)' }}
        />
        <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill="var(--accent-primary)" opacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
