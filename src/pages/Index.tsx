import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Target, TrendingUp, Award, Brain, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">EduGrowHub</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Advanced AI-powered educational platform for comprehensive student performance tracking, 
            exam management, and personalized learning insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/register/student">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <UserPlus className="h-5 w-5 mr-2" />
                Register as Student
              </Button>
            </Link>
            <Link to="/register/teacher">
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3">
                <GraduationCap className="h-5 w-5 mr-2" />
                Register as Teacher
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Login to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Powerful Features for Modern Education
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced AI analysis provides personalized learning recommendations, 
                identifies strengths and weaknesses, and suggests focus areas for improvement.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Comprehensive Exam Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage exams across different subjects and exam types (JEE, NEET, CET, Boards) 
                with bulk CSV upload and Excel export capabilities.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-green-600" />
                Performance Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time performance analytics with subject-wise progress tracking, 
                trend analysis, and comparative performance metrics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-orange-600" />
                Role-Based Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure role-based system with approval workflows for students and teachers, 
                ensuring proper access control and user management.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-cyan-600" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive analytics dashboard with registration trends, performance metrics, 
                and detailed reporting for administrators and teachers.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-600" />
                Personalized Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Customized learning paths based on individual performance patterns, 
                with AI-generated recommendations for optimal academic growth.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">200+</div>
              <div className="text-gray-600">Expert Teachers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50,000+</div>
              <div className="text-gray-600">Exams Conducted</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students and teachers who are already benefiting from our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register/student">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                Get Started as Student
              </Button>
            </Link>
            <Link to="/register/teacher">
              <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-blue-600">
                Join as Teacher
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
