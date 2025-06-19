import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  BookOpen,
  Brain,
  TrendingUp,
  Award,
  Shield,
  Zap,
  Star,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

const ModernHomePage = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get personalized learning recommendations and performance analysis",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Track progress with comprehensive charts and performance metrics",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Users,
      title: "Multi-Role Support",
      description: "Seamless experience for students, teachers, and administrators",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const stats = [
    { icon: Users, label: "Active Students", value: "10,000+", gradient: "from-blue-500 to-cyan-600" },
    { icon: GraduationCap, label: "Expert Teachers", value: "500+", gradient: "from-green-500 to-emerald-600" },
    { icon: BookOpen, label: "Assessments", value: "50,000+", gradient: "from-purple-500 to-pink-600" },
    { icon: Award, label: "Success Rate", value: "98%", gradient: "from-orange-500 to-red-600" }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Mathematics Teacher",
      avatar: "SJ",
      content: "EduGrowHub has transformed how I track student progress. The AI insights are incredibly helpful!",
      rating: 5
    },
    {
      name: "Alex Chen",
      role: "Class 12 Student",
      avatar: "AC",
      content: "The performance analytics help me understand my strengths and areas for improvement.",
      rating: 5
    },
    {
      name: "Principal Robert Smith",
      role: "School Administrator",
      avatar: "RS",
      content: "Managing our entire school's assessment system has never been easier. Highly recommended!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 opacity-70" />
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 border-0">
              <Zap className="h-3 w-3 mr-1" />
              Powered by Advanced AI
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                EduGrowHub
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform education with intelligent assessment management, AI-powered insights, and comprehensive analytics for students, teachers, and administrators.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register/student">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                  Start Learning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/register/teacher">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2">
                  Join as Teacher
                  <GraduationCap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Button variant="ghost" size="lg" className="text-lg px-8 py-6">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powerful Features for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Modern Education</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to manage assessments, track progress, and enhance learning outcomes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardHeader className="text-center relative z-10">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10">
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Loved by <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Educators</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what teachers, students, and administrators are saying
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }, (_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-4xl mx-auto border-0 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5" />
            <CardContent className="p-12 relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Transform Your Educational Experience?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of educators and students already using EduGrowHub to achieve better learning outcomes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register/student">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-center mt-8 space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Free to start
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Setup in minutes
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Admin Access Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              System Administration
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register/admin">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Registration
                </Button>
              </Link>
              <Link to="/debug">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-950"
                >
                  System Debug
                </Button>
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Administrative access for authorized personnel only
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ModernHomePage;
