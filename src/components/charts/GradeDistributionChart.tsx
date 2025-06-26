import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
interface GradeDistributionChartProps {
  data: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
}
const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="grade" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            `${value}${name === 'percentage' ? '%' : ''}`, 
            name === 'count' ? 'Students' : 'Percentage'
          ]}
        />
        <Legend />
        <Bar dataKey="count" fill="#3b82f6" name="count" />
        <Bar dataKey="percentage" fill="#10b981" name="percentage" />
      </BarChart>
    </ResponsiveContainer>
  );
};
export default GradeDistributionChart;
