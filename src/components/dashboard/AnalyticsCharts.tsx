
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const categoryData = [
  { name: 'Food', value: 450, color: '#4f46e5' },
  { name: 'Rent', value: 1200, color: '#4338ca' },
  { name: 'Transp', value: 300, color: '#6366f1' },
  { name: 'Ent', value: 150, color: '#818cf8' },
  { name: 'Utils', value: 200, color: '#a5b4fc' },
];

const growthData = [
  { month: 'Jan', balance: 42000 },
  { month: 'Feb', balance: 43500 },
  { month: 'Mar', balance: 44200 },
  { month: 'Apr', balance: 45000 },
  { month: 'May', balance: 45200 },
];

export const SpendingChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={categoryData}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis 
        dataKey="name" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
      />
      <YAxis 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
      />
      <Tooltip 
        cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
      />
      <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40}>
        {categoryData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const NetWorthChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={growthData}>
      <defs>
        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis 
        dataKey="month" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
      />
      <YAxis 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
        domain={['dataMin - 500', 'dataMax + 500']}
      />
      <Tooltip 
        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
      />
      <Area 
        type="monotone" 
        dataKey="balance" 
        stroke="#4f46e5" 
        strokeWidth={3}
        fillOpacity={1} 
        fill="url(#colorBalance)" 
      />
    </AreaChart>
  </ResponsiveContainer>
);
