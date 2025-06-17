
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceChartProps {
  data: Array<{
    month: string;
    students: number;
    teachers: number;
    performance: number;
  }>;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="students" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Students"
        />
        <Line 
          type="monotone" 
          dataKey="teachers" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Teachers"
        />
        <Line 
          type="monotone" 
          dataKey="performance" 
          stroke="#f59e0b" 
          strokeWidth={2}
          name="Performance %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;
