import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { getAICompletion, getEducationalContent, generateStudentFeedback } from '@/services/openaiService';

const AIAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a question or prompt.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const result = await getAICompletion({ prompt });
      
      if (result.isError) {
        toast({
          title: "Error",
          description: result.errorMessage || "Failed to get response from AI",
          variant: "destructive",
        });
      } else {
        setResponse(result.content);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateEducationalContent = async (subject: string, grade: string) => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const result = await getEducationalContent(subject, grade);
      
      if (result.isError) {
        toast({
          title: "Error",
          description: result.errorMessage || "Failed to generate educational content",
          variant: "destructive",
        });
      } else {
        setResponse(result.content);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFeedback = async () => {
    // This would typically come from a form
    const studentName = "John";
    const subject = "Mathematics";
    const performance = "Good understanding of basic concepts, but struggles with complex problems";
    const areasForImprovement = "Problem-solving approach and time management during exams";
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const result = await generateStudentFeedback(
        studentName,
        subject,
        performance,
        areasForImprovement
      );
      
      if (result.isError) {
        toast({
          title: "Error",
          description: result.errorMessage || "Failed to generate feedback",
          variant: "destructive",
        });
      } else {
        setResponse(result.content);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
            AI Educational Assistant
          </CardTitle>
          <CardDescription>
            Get AI-powered assistance for education
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General Assistant</TabsTrigger>
              <TabsTrigger value="content">Educational Content</TabsTrigger>
              <TabsTrigger value="feedback">Student Feedback</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="p-6">
            <TabsContent value="general">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="Ask any educational question..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting response...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get AI Response
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="content">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => generateEducationalContent("Physics", "11")} disabled={isLoading}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Physics - Grade 11
                  </Button>
                  <Button onClick={() => generateEducationalContent("Chemistry", "11")} disabled={isLoading}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Chemistry - Grade 11
                  </Button>
                  <Button onClick={() => generateEducationalContent("Mathematics", "12")} disabled={isLoading}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Mathematics - Grade 12
                  </Button>
                  <Button onClick={() => generateEducationalContent("Biology", "12")} disabled={isLoading}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Biology - Grade 12
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="feedback">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Generate personalized feedback for students based on their performance.
                </p>
                <Button onClick={generateFeedback} disabled={isLoading} className="w-full">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Generate Student Feedback Sample
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        {response && (
          <CardFooter className="flex flex-col items-start border-t p-6">
            <h3 className="font-semibold mb-2">AI Response:</h3>
            <div className="bg-gray-50 p-4 rounded-md w-full whitespace-pre-wrap">
              {response}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AIAssistant;
