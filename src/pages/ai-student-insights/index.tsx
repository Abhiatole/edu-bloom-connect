import React from 'react';
import AIStudentInsights from '@/components/AIStudentInsights';
const AIStudentInsightsPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Student Insights</h1>
      <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
        Generate AI-powered performance insights for students and save them to the database.
        This demonstrates the integration with OpenAI and the RLS policies for the student_insights table.
      </p>
      <AIStudentInsights />
    </div>
  );
};
export default AIStudentInsightsPage;
