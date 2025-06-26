import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  BookOpen,
  Brain,
  Target,
  Award,
  Star,
  CheckCircle,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Calculator,
  Atom,
  Dna,
  Zap,
  Trophy,
  Clock,
  TrendingUp,
  Shield
} from 'lucide-react';

const SiddhivinayakHomePage = () => {
  const [demoFormOpen, setDemoFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course: '',
    message: ''
  });

  const subjects = [
    {
      icon: Calculator,
      title: "Mathematics",
      description: "Advanced mathematics for competitive exams and board preparation",
      gradient: "from-blue-500 to-cyan-600",
      topics: ["Algebra", "Calculus", "Geometry", "Statistics"]
    },
    {
      icon: Atom,
      title: "Physics", 
      description: "Comprehensive physics covering mechanics, thermodynamics, and modern physics",
      gradient: "from-purple-500 to-pink-600",
      topics: ["Mechanics", "Waves", "Modern Physics", "Electronics"]
    },
    {
      icon: Zap,
      title: "Chemistry",
      description: "Organic, inorganic, and physical chemistry for entrance exams",
      gradient: "from-green-500 to-emerald-600", 
      topics: ["Organic", "Inorganic", "Physical", "Analytical"]
    },
    {
      icon: Dna,
      title: "Biology",
      description: "Life sciences covering botany, zoology, and human physiology",
      gradient: "from-orange-500 to-red-600",
      topics: ["Botany", "Zoology", "Genetics", "Human Physiology"]
    }
  ];

  const examPreparation = [
    {
      title: "NEET",
      description: "Medical entrance exam preparation with expert faculty",
      subjects: ["Physics", "Chemistry", "Biology"],
      successRate: "95%",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "JEE",
      description: "Engineering entrance exam coaching for IIT/NIT admission",
      subjects: ["Physics", "Chemistry", "Mathematics"],
      successRate: "92%",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      title: "MHT-CET",
      description: "Maharashtra state entrance exam preparation",
      subjects: ["Physics", "Chemistry", "Mathematics/Biology"],
      successRate: "98%",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      title: "Other Exams",
      description: "Guidance for various competitive and board examinations",
      subjects: ["Custom Curriculum"],
      successRate: "90%",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const whyChooseUs = [
    {
      icon: Users,
      title: "Expert Faculty",
      description: "Experienced teachers with proven track records in competitive exam coaching",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Target,
      title: "Focused Approach",
      description: "Targeted preparation strategies for each entrance exam with regular assessments",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Trophy,
      title: "Proven Results",
      description: "Consistent high success rates with students qualifying for top institutions",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Clock,
      title: "Flexible Timings",
      description: "Multiple batch timings to accommodate different student schedules",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: BookOpen,
      title: "Comprehensive Study Material",
      description: "Well-researched study materials and practice tests aligned with exam patterns",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Regular Progress Tracking",
      description: "Continuous monitoring of student progress with detailed performance analysis",
      gradient: "from-cyan-500 to-blue-600"
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "NEET Qualifier",
      content: "The personalized attention and excellent teaching methods helped me crack NEET on my first attempt.",
      rating: 5,
      avatar: "PS"
    },
    {
      name: "Rohit Patil",
      role: "JEE Main Qualifier",
      content: "Amazing faculty and comprehensive study material. The mock tests were very similar to actual exams.",
      rating: 5,
      avatar: "RP"
    },
    {
      name: "Sneha Desai",
      role: "MHT-CET Topper",
      content: "Grateful for the guidance and support. The academy truly cares about each student's success.",
      rating: 5,
      avatar: "SD"
    }
  ];

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFormOpen(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      course: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-blue-950 dark:via-purple-950 dark:to-green-950 opacity-70" />
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 border-0 text-lg px-6 py-2">
              <GraduationCap className="h-4 w-4 mr-2" />
              Excellence in Science Education
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-foreground">Welcome to</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Siddhivinayak Science Academy
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
              Empowering Students for NEET, JEE & Beyond
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your academic journey with expert science coaching and personalized entrance exam preparation at Jalgaon Jamod's premier educational institute.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/register/student">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 rounded-xl">
                  Join Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2 rounded-xl">
                Explore Courses
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
              
              <Dialog open={demoFormOpen} onOpenChange={setDemoFormOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="lg" className="text-lg px-8 py-6 rounded-xl">
                    <Star className="mr-2 h-5 w-5" />
                    Book Demo Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Book a Demo Class</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Interested Course</Label>
                      <Input
                        id="course"
                        value={formData.course}
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                        placeholder="e.g., NEET, JEE, MHT-CET"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Any specific requirements or questions"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      Book Demo Class
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Siddhivinayak Science Academy</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Established with a vision to nurture scientific minds and guide students toward their dream careers in science and technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Our Mission</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At Siddhivinayak Science Academy, we are committed to providing world-class science education that empowers students to excel in competitive examinations and build successful careers in science, technology, engineering, and medicine.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-muted-foreground">Students Enrolled</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">15+</div>
                  <div className="text-sm text-muted-foreground">Expert Faculty</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">95%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">10+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
              </div>
            </div>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Why Choose Us?</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Experienced faculty with proven track records</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Comprehensive study materials and practice tests</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Regular assessments and performance tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Small batch sizes for personalized attention</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Modern infrastructure and technology</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Subjects We Offer Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Subjects We <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Offer</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive coaching across all science subjects for competitive exam preparation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {subjects.map((subject, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r ${subject.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardHeader className="text-center relative z-10">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${subject.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <subject.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{subject.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10">
                  <CardDescription className="text-base mb-4">{subject.description}</CardDescription>
                  <div className="space-y-1">
                    {subject.topics.map((topic, topicIndex) => (
                      <Badge key={topicIndex} variant="secondary" className="mx-1 text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Preparation Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Exam <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Coaching</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Specialized preparation programs for major competitive examinations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {examPreparation.map((exam, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${exam.gradient} flex items-center justify-center mb-4`}>
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{exam.title}</CardTitle>
                  <CardDescription className="text-base">{exam.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Subjects Covered:</p>
                      <div className="flex flex-wrap gap-1">
                        {exam.subjects.map((subject, subjectIndex) => (
                          <Badge key={subjectIndex} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm font-medium">Success Rate</span>
                      <Badge className={`bg-gradient-to-r ${exam.gradient} text-white`}>
                        {exam.successRate}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Choose <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Us?</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover what makes Siddhivinayak Science Academy the preferred choice for students
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((feature, index) => (
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
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Student <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Success Stories</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Hear from our successful students who achieved their dreams
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

      {/* Contact & Location Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Contact <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Us</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Get in touch with us to start your journey toward success
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Get In Touch</CardTitle>
                <CardDescription>Visit us or contact us for more information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-muted-foreground">
                      Siddhivinayak Science Academy<br />
                      Main Road, Jalgaon Jamod<br />
                      Buldhana, Maharashtra, India
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <p className="text-muted-foreground">
                      +91 98765 43210<br />
                      +91 87654 32109
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-muted-foreground">
                      info@siddhivinayakacademy.com<br />
                      admissions@siddhivinayakacademy.com
                    </p>
                  </div>
                </div>
                
                <div className="pt-6 border-t">
                  <h4 className="font-semibold mb-3">Office Hours</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>9:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Quick Inquiry</CardTitle>
                <CardDescription>Send us a message and we'll respond promptly</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inquiry-name">Full Name</Label>
                      <Input id="inquiry-name" placeholder="Your full name" />
                    </div>
                    <div>
                      <Label htmlFor="inquiry-phone">Phone Number</Label>
                      <Input id="inquiry-phone" placeholder="Your phone number" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="inquiry-email">Email</Label>
                    <Input id="inquiry-email" type="email" placeholder="Your email address" />
                  </div>
                  <div>
                    <Label htmlFor="inquiry-course">Course Interest</Label>
                    <Input id="inquiry-course" placeholder="e.g., NEET, JEE, MHT-CET" />
                  </div>
                  <div>
                    <Label htmlFor="inquiry-message">Message</Label>
                    <Textarea 
                      id="inquiry-message" 
                      placeholder="Your message or questions"
                      rows={4}
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Send Message
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-4xl mx-auto border-0 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5" />
            <CardContent className="p-12 relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Start Your Success Journey?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of successful students who achieved their dreams with Siddhivinayak Science Academy. Your bright future starts here!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register/student">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                    Enroll Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 border-2"
                  onClick={() => setDemoFormOpen(true)}
                >
                  Book Free Demo
                  <Star className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center mt-8 space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Expert Faculty
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Proven Results
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Personal Attention
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

export default SiddhivinayakHomePage;
