
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentProgressChartProps {
  data: Array<{
    assignment: string;
    score: number;
    average: number;
  }>;
}

const StudentProgressChart: React.FC<StudentProgressChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="assignment" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => [`${value}%`, '']} />
        <Area 
          type="monotone" 
          dataKey="average" 
          stackId="1"
          stroke="#94a3b8" 
          fill="#e2e8f0" 
          name="Class Average"
        />
        <Area 
          type="monotone" 
          dataKey="score" 
          stackId="2"
          stroke="#3b82f6" 
          fill="#3b82f6" 
          name="Your Score"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default StudentProgressChart;
