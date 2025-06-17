
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart3, Bell, Shield, Cloud, Smartphone, BookOpen, Calendar, MessageSquare, Award } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "User Management",
      description: "Comprehensive role-based access control for administrators, teachers, and students",
      benefits: ["Role-based permissions", "Bulk user operations", "Profile management"]
    },
    {
      icon: BookOpen,
      title: "Grade Management",
      description: "Streamlined grade recording, calculation, and reporting system",
      benefits: ["Real-time grade entry", "Automated calculations", "Progress tracking"]
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Detailed insights into student performance and institutional metrics",
      benefits: ["Performance dashboards", "Custom reports", "Data visualization"]
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Automated WhatsApp and email notifications for important updates",
      benefits: ["Grade notifications", "Assignment reminders", "Event alerts"]
    },
    {
      icon: Calendar,
      title: "Schedule Management",
      description: "Organize classes, exams, and events with an integrated calendar system",
      benefits: ["Class scheduling", "Exam planning", "Event management"]
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Enterprise-grade security with data encryption and privacy controls",
      benefits: ["Data encryption", "Secure authentication", "Privacy compliance"]
    },
    {
      icon: Cloud,
      title: "Cloud-Based",
      description: "Access your data anywhere, anytime with our reliable cloud infrastructure",
      benefits: ["99.9% uptime", "Automatic backups", "Scalable infrastructure"]
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Responsive design that works perfectly on all devices and screen sizes",
      benefits: ["Mobile optimized", "Cross-platform", "Offline capabilities"]
    },
    {
      icon: MessageSquare,
      title: "Communication Hub",
      description: "Facilitate communication between teachers, students, and parents",
      benefits: ["Messaging system", "Announcements", "Parent portal"]
    },
    {
      icon: Award,
      title: "Achievement Tracking",
      description: "Monitor student progress and celebrate achievements and milestones",
      benefits: ["Progress monitoring", "Achievement badges", "Performance analytics"]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Platform Features</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover the comprehensive suite of tools designed to transform your educational institution's management experience.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow group">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Institution?</h2>
        <p className="text-blue-100 mb-6">
          Join hundreds of educational institutions already using EduGrowHub to streamline their operations.
        </p>
        <div className="space-x-4">
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Start Free Trial
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Schedule Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Features;
