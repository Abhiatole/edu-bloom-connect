// OpenAI service for the edu-bloom-connect application
import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable client-side usage (use with caution)
});

export interface AICompletionParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIAssistantResponse {
  content: string;
  isError: boolean;
  errorMessage?: string;
}

/**
 * Get a completion from OpenAI API
 * @param params Parameters for the completion
 * @returns The AI response or error
 */
export async function getAICompletion({
  prompt,
  maxTokens = 500,
  temperature = 0.7,
  model = 'gpt-3.5-turbo'
}: AICompletionParams): Promise<AIAssistantResponse> {
  try {
    // Validate the API key is set
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set in environment variables');
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    });

    return {
      content: response.choices[0]?.message?.content || 'No response generated',
      isError: false
    };
  } catch (error: any) {
    console.error('Error getting AI completion:', error);
    return {
      content: '',
      isError: true,
      errorMessage: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Get educational content suggestions from AI
 * @param subject The subject to get content for
 * @param gradeLevel The grade level (e.g., "11", "12")
 * @returns AI-generated educational content suggestions
 */
export async function getEducationalContent(
  subject: string,
  gradeLevel: string
): Promise<AIAssistantResponse> {
  const prompt = `
    You are an expert educational content creator for ${subject} for grade ${gradeLevel}.
    Please provide a structured learning plan with:
    1. Key concepts that should be covered
    2. 3-5 practice questions with answers
    3. Recommended learning resources
    4. Common misconceptions students have about this subject
    Format your response with clear headings and bullet points.
  `;

  return getAICompletion({
    prompt,
    maxTokens: 800,
    temperature: 0.6
  });
}

/**
 * Generate personalized feedback for a student
 * @param studentName The student's name
 * @param subject The subject
 * @param performance Brief description of student's performance
 * @param areasForImprovement Areas where the student can improve
 * @returns AI-generated personalized feedback
 */
export async function generateStudentFeedback(
  studentName: string,
  subject: string,
  performance: string,
  areasForImprovement: string
): Promise<AIAssistantResponse> {
  const prompt = `
    Generate encouraging and constructive feedback for a student named ${studentName} 
    in their ${subject} class. 
    
    Current performance: ${performance}
    Areas for improvement: ${areasForImprovement}
    
    The feedback should be positive, specific, and provide actionable suggestions.
    Keep it under 250 words and appropriate for a student.
  `;

  return getAICompletion({
    prompt,
    maxTokens: 500,
    temperature: 0.7
  });
}

export default {
  getAICompletion,
  getEducationalContent,
  generateStudentFeedback,
  generateAndSaveStudentInsights
};

/**
 * Generate and save AI insights for a student
 * @param studentId The UUID of the student profile
 * @param performanceData Data about student's performance to analyze
 * @returns Generated insights and save status
 */
export async function generateAndSaveStudentInsights(
  studentId: string,
  performanceData: {
    examScores: number[];
    subjects: string[];
    attendanceRate: number;
    recentPerformance: string;
  }
): Promise<AIAssistantResponse & { savedToDatabase: boolean }> {
  try {
    // Helper function to determine performance level based on scores
    function determinePerformanceLevel(scores: number[]): 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Poor' {
      if (!scores || scores.length === 0) return 'Average';
      
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      if (average >= 90) return 'Excellent';
      if (average >= 80) return 'Good';
      if (average >= 70) return 'Average';
      if (average >= 60) return 'Below Average';
      return 'Poor';
    }
    
    // Helper function to map any subject to valid enum values
    function mapToValidSubject(subject: string): 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'English' | 'Computer Science' | 'Other' {
      const validSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'];
      const normalized = subject.trim().charAt(0).toUpperCase() + subject.trim().slice(1).toLowerCase();
      
      return validSubjects.includes(normalized) 
        ? normalized as any
        : 'Other';
    }
    // Validate input
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    // Create prompt for analysis
    const prompt = `
      You are an expert educational analyst. Based on the following student data, 
      provide insights on strengths, weaknesses, and recommendations:

      Exam Scores: ${performanceData.examScores.join(', ')}
      Subjects: ${performanceData.subjects.join(', ')}
      Attendance Rate: ${performanceData.attendanceRate}%
      Recent Performance: ${performanceData.recentPerformance}

      Format your response as a JSON object with these fields:
      1. strengths (array of strings): List 3 key strengths
      2. weaknesses (array of strings): List 3 areas for improvement
      3. recommendations (array of strings): List 3 specific, actionable recommendations
      4. performance_trend (string): A brief description of the overall trend
    `;

    // Get AI completion
    const aiResponse = await getAICompletion({
      prompt,
      maxTokens: 800,
      temperature: 0.4,
      model: 'gpt-3.5-turbo'
    });

    if (aiResponse.isError) {
      return {
        ...aiResponse,
        savedToDatabase: false
      };
    }

    // Parse the JSON response
    let parsedInsights;
    try {
      // Find JSON content within the response (it might have markdown or other text)
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : aiResponse.content;
      parsedInsights = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // If parsing fails, create a structured format from the raw text
      parsedInsights = {
        strengths: ['Good overall performance'],
        weaknesses: ['Needs more structured analysis'],
        recommendations: ['Consult with a teacher for detailed feedback'],
        performance_trend: 'Unable to determine from available data'
      };
    }

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;    // Save to database with proper error handling for RLS
    const { data: insightData, error: insertError } = await supabase
      .from('student_insights')
      .insert({
        student_id: studentId,
        subject: mapToValidSubject(performanceData.subjects[0] || 'Other'),
        strengths: parsedInsights.strengths,
        weaknesses: parsedInsights.weaknesses,
        recommendations: parsedInsights.recommendations,
        ai_comment: parsedInsights.performance_trend,
        performance_level: determinePerformanceLevel(performanceData.examScores),
        last_analyzed: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('Error saving insights to database:', insertError);
      return {
        content: aiResponse.content,
        isError: false,
        savedToDatabase: false,
        errorMessage: `Generated insights but failed to save to database: ${insertError.message}`
      };
    }

    return {
      content: aiResponse.content,
      isError: false,
      savedToDatabase: true
    };
  } catch (error: any) {
    console.error('Error generating and saving student insights:', error);
    return {
      content: '',
      isError: true,
      savedToDatabase: false,
      errorMessage: error.message || 'Unknown error occurred'
    };
  }
}
