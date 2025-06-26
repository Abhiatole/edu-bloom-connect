import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Award, Target, Heart } from 'lucide-react';
const About = () => {
  const values = [
    {
      icon: Target,
      title: "Excellence",
      description: "We strive for educational excellence in everything we do"
    },
    {
      icon: Heart,
      title: "Care",
      description: "Every student matters and deserves personalized attention"
    },
    {
      icon: Users,
      title: "Community",
      description: "Building strong relationships between students, teachers, and families"
    },
    {
      icon: Award,
      title: "Achievement",
      description: "Celebrating success and fostering continuous improvement"
    }
  ];
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <GraduationCap className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">About EduGrowHub</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering educational institutions with modern technology to enhance learning outcomes and streamline administrative processes.
        </p>
      </div>
      {/* Mission Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-700 text-center leading-relaxed">
            To revolutionize education management by providing intuitive, comprehensive tools that enable educators to focus on what matters most - teaching and nurturing student growth. We believe that technology should simplify, not complicate, the educational experience.
          </p>
        </CardContent>
      </Card>
      {/* Values Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <value.icon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* Stats Section */}
      <div className="bg-blue-50 rounded-lg p-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-700">Schools Served</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
            <div className="text-gray-700">Students Managed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-gray-700">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default About;
