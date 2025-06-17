
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "User Management",
      description: "Comprehensive role-based access for administrators, teachers, and students"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Detailed insights into student performance and institutional metrics"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee"
    }
  ];

  const benefits = [
    "Streamlined grade management and reporting",
    "Automated WhatsApp and email notifications",
    "Real-time performance analytics and insights",
    "Mobile-friendly responsive design",
    "Secure cloud-based infrastructure",
    "24/7 customer support"
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <div className="flex justify-center">
          <GraduationCap className="h-20 w-20 text-blue-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Welcome to <span className="text-blue-600">EduGrowHub</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your educational institution with our comprehensive school management system. 
            Streamline operations, enhance communication, and boost student success.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/login')} className="text-lg px-8 py-3">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/features')} className="text-lg px-8 py-3">
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your educational institution efficiently and effectively.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-blue-50 rounded-lg p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose EduGrowHub?</h3>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600 mb-4">Schools Trust Us</div>
              <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
              <div className="text-gray-600 mb-4">Students Managed</div>
              <div className="text-4xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-white">
        <h3 className="text-3xl font-bold">Ready to Transform Your Institution?</h3>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
          Join hundreds of educational institutions already using EduGrowHub to streamline their operations and improve student outcomes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" onClick={() => navigate('/login')} className="text-lg px-8 py-3">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/contact')} className="text-lg px-8 py-3 bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
            Contact Sales
          </Button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="text-center space-y-4">
        <p className="text-gray-600">Explore more about our platform</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="link" onClick={() => navigate('/about')}>About Us</Button>
          <Button variant="link" onClick={() => navigate('/features')}>Features</Button>
          <Button variant="link" onClick={() => navigate('/contact')}>Contact</Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
