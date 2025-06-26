import React from 'react';
import AIAssistant from '@/components/AIAssistant';
const AIAssistantPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Educational Assistant</h1>
      <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
        Get AI-powered assistance for educational content, student feedback, and more.
        Leverage the power of OpenAI to enhance your teaching and learning experience.
      </p>
      <AIAssistant />
    </div>
  );
};
export default AIAssistantPage;
