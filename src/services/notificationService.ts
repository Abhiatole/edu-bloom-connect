import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class NotificationService {
  // Email templates for different scenarios
  private static templates: Record<string, EmailTemplate> = {
    'student-registration-pending': {
      name: 'Student Registration Pending',
      subject: 'Registration Received - EduBloom Connect',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduBloom Connect</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Registration Received!</h2>
            <p>Dear Parent/Guardian,</p>
            <p>Thank you for registering your child with EduBloom Connect.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Registration Details:</h3>
              <p><strong>Student:</strong> {{studentName}}</p>
              <p><strong>Class Level:</strong> {{classLevel}}</p>
              <p><strong>Enrollment No:</strong> {{enrollmentNo}}</p>
              <p><strong>Registration Date:</strong> {{registrationDate}}</p>
            </div>
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your registration is currently pending teacher approval</li>
              <li>You will receive an email notification once approved</li>
              <li>This process typically takes 24-48 hours</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>EduBloom Connect Team</p>
          </div>
        </div>
      `
    },

    'teacher-registration-pending': {
      name: 'Teacher Registration Pending',
      subject: 'Registration Received - EduBloom Connect',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
            <h1>🎓 EduBloom Connect</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Welcome to EduBloom Connect!</h2>
            <p>Dear {{teacherName}},</p>
            <p>Thank you for your interest in joining EduBloom Connect as an educator.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Registration Details:</h3>
              <p><strong>Employee ID:</strong> {{employeeId}}</p>
              <p><strong>Department:</strong> {{department}}</p>
              <p><strong>Subject Expertise:</strong> {{subjectExpertise}}</p>
              <p><strong>Experience:</strong> {{experienceYears}} years</p>
              <p><strong>Registration Date:</strong> {{registrationDate}}</p>
            </div>
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your registration is currently pending admin approval</li>
              <li>Our team will review your application</li>
              <li>You will receive an email notification once approved</li>
              <li>This process typically takes 48-72 hours</li>
            </ul>
            <p>We appreciate your patience and look forward to having you on our team!</p>
            <p>Best regards,<br>EduBloom Connect Team</p>
          </div>
        </div>
      `
    },

    'student-approved': {
      name: 'Student Approved',
      subject: 'Account Approved - Welcome to EduBloom Connect! 🎉',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Account Approved!</h2>
            <p>Dear Parent/Guardian,</p>
            <p>Great news! Your child's EduBloom Connect account has been approved by our teachers.</p>
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Account Details:</h3>
              <p><strong>Student:</strong> {{studentName}}</p>
              <p><strong>Class Level:</strong> {{classLevel}}</p>
              <p><strong>Enrollment No:</strong> {{enrollmentNo}}</p>
              <p><strong>Approved on:</strong> {{approvalDate}}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access Dashboard
              </a>
            </div>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Your child can now log in and access all features</li>
              <li>Explore the dashboard and available courses</li>
              <li>Start participating in online classes and exams</li>
              <li>Track progress and performance insights</li>
            </ul>
            <p>Welcome to the EduBloom Connect community!</p>
            <p>Best regards,<br>EduBloom Connect Team</p>
          </div>
        </div>
      `
    },

    'teacher-approved': {
      name: 'Teacher Approved',
      subject: 'Welcome Aboard - EduBloom Connect! 🎉',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
            <h1>🎉 Welcome to the Team!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Account Approved!</h2>
            <p>Dear {{teacherName}},</p>
            <p>Congratulations! Your EduBloom Connect teacher account has been approved by our administration team.</p>
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Account Details:</h3>
              <p><strong>Employee ID:</strong> {{employeeId}}</p>
              <p><strong>Department:</strong> {{department}}</p>
              <p><strong>Subject Expertise:</strong> {{subjectExpertise}}</p>
              <p><strong>Approved on:</strong> {{approvalDate}}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access Teacher Dashboard
              </a>
            </div>
            <p><strong>As an approved teacher, you can now:</strong></p>
            <ul>
              <li>Access the comprehensive teacher dashboard</li>
              <li>Create and manage online exams</li>
              <li>Review and approve student registrations</li>
              <li>Monitor student performance and insights</li>
              <li>Manage class schedules and timetables</li>
            </ul>
            <p>We're excited to have you join our mission of transforming education!</p>
            <p>Best regards,<br>EduBloom Connect Team</p>
          </div>
        </div>
      `
    },

    'registration-rejected': {
      name: 'Registration Update',
      subject: 'Registration Update - EduBloom Connect',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
            <h1>📋 Registration Update</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Registration Status Update</h2>
            <p>Dear {{userName}},</p>
            <p>Thank you for your interest in EduBloom Connect. After careful review, we regret to inform you that your registration could not be approved at this time.</p>
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Reason:</h3>
              <p>{{rejectionReason}}</p>
            </div>
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Review the reason provided above</li>
              <li>Contact our support team for clarification</li>
              <li>Reapply after addressing the mentioned concerns</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{supportUrl}}" style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Contact Support
              </a>
            </div>
            <p>We appreciate your understanding and encourage you to reach out if you have any questions.</p>
            <p>Best regards,<br>EduBloom Connect Team</p>
          </div>
        </div>
      `
    },

    'admin-new-registration': {
      name: 'New Registration Alert',
      subject: 'New User Registration - Action Required',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9C27B0; color: white; padding: 20px; text-align: center;">
            <h1>🔔 New Registration Alert</h1>
          </div>
          <div style="padding: 20px;">
            <h2>New {{userType}} Registration</h2>
            <p>Dear {{adminName}},</p>
            <p>A new {{userType}} has registered and is awaiting your approval.</p>
            <div style="background-color: #f3e5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Registration Details:</h3>
              <p><strong>Name:</strong> {{userName}}</p>
              <p><strong>Email:</strong> {{userEmail}}</p>
              <p><strong>{{userType === 'student' ? 'Class Level' : 'Department'}}:</strong> {{additionalInfo}}</p>
              <p><strong>Registration Date:</strong> {{registrationDate}}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{approvalUrl}}" style="background-color: #9C27B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review & Approve
              </a>
            </div>
            <p>Please review the registration and take appropriate action.</p>
            <p>Best regards,<br>EduBloom Connect System</p>
          </div>
        </div>
      `
    }
  };

  /**
   * Send registration confirmation email
   */
  static async sendRegistrationConfirmation(userType: 'student' | 'teacher', templateData: Record<string, any>) {
    try {
      const templateName = `${userType}-registration-pending`;
      const template = this.templates[templateName];
      
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      const notification: NotificationData = {
        to: templateData.email,
        subject: template.subject,
        templateName,
        templateData,
        priority: 'medium'
      };

      // In a real implementation, you would integrate with an email service like:
      // - SendGrid
      // - Mailgun  
      // - AWS SES
      // - Supabase Edge Functions for email
      
      console.log('📧 Sending registration confirmation:', notification);
      
      // Placeholder for actual email sending
      // await this.sendEmail(notification);
      
      return { success: true, message: 'Registration confirmation sent' };
    } catch (error: any) {
      console.error('Error sending registration confirmation:', error);
      throw error;
    }
  }

  /**
   * Send approval notification email
   */
  static async sendApprovalNotification(userType: 'student' | 'teacher', templateData: Record<string, any>) {
    try {
      const templateName = `${userType}-approved`;
      const template = this.templates[templateName];
      
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      const notification: NotificationData = {
        to: templateData.email,
        subject: template.subject,
        templateName,
        templateData: {
          ...templateData,
          loginUrl: `${window.location.origin}/login`,
          approvalDate: new Date().toLocaleDateString()
        },
        priority: 'high'
      };

      console.log('📧 Sending approval notification:', notification);
      
      // Placeholder for actual email sending
      // await this.sendEmail(notification);
      
      return { success: true, message: 'Approval notification sent' };
    } catch (error: any) {
      console.error('Error sending approval notification:', error);
      throw error;
    }
  }

  /**
   * Send rejection notification email
   */
  static async sendRejectionNotification(templateData: Record<string, any>) {
    try {
      const template = this.templates['registration-rejected'];
      
      const notification: NotificationData = {
        to: templateData.email,
        subject: template.subject,
        templateName: 'registration-rejected',
        templateData: {
          ...templateData,
          supportUrl: `${window.location.origin}/support`
        },
        priority: 'high'
      };

      console.log('📧 Sending rejection notification:', notification);
      
      // Placeholder for actual email sending
      // await this.sendEmail(notification);
      
      return { success: true, message: 'Rejection notification sent' };
    } catch (error: any) {
      console.error('Error sending rejection notification:', error);
      throw error;
    }
  }

  /**
   * Notify administrators of new registration
   */
  static async notifyAdmins(userType: 'student' | 'teacher', userData: Record<string, any>) {
    try {
      // Get list of admins/teachers who should be notified
      let approvers: any[] = [];
      
      if (userType === 'student') {
        // Notify teachers for student approvals
        const { data: teachers } = await supabase
          .from('teacher_profiles')
          .select('*')
          .not('approval_date', 'is', null);
        
        approvers = teachers || [];
      } else if (userType === 'teacher') {
        // Notify admins for teacher approvals
        const { data: admins } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'ADMIN')
          .eq('status', 'APPROVED');
        
        approvers = admins || [];
      }

      const template = this.templates['admin-new-registration'];
      
      for (const approver of approvers) {
        const notification: NotificationData = {
          to: approver.email || 'admin@edubleconnect.com',
          subject: template.subject,
          templateName: 'admin-new-registration',
          templateData: {
            adminName: approver.full_name || 'Admin',
            userType,
            userName: userData.userName,
            userEmail: userData.email,
            additionalInfo: userData.additionalInfo,
            registrationDate: new Date().toLocaleDateString(),
            approvalUrl: `${window.location.origin}/admin/approvals`
          },
          priority: 'medium'
        };

        console.log('📧 Notifying admin/teacher:', notification);
        
        // Placeholder for actual email sending
        // await this.sendEmail(notification);
      }
      
      return { success: true, message: 'Admin notifications sent' };
    } catch (error: any) {
      console.error('Error notifying admins:', error);
      throw error;
    }
  }

  /**
   * Get template by name
   */
  static getTemplate(templateName: string): EmailTemplate | null {
    return this.templates[templateName] || null;
  }

  /**
   * Render template with data
   */
  static renderTemplate(templateName: string, data: Record<string, any>): string {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    let rendered = template.htmlContent;
    
    // Simple template variable replacement
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key] || '');
    });

    return rendered;
  }

  /**
   * Private method to actually send email (to be implemented with email service)
   */
  private static async sendEmail(notification: NotificationData) {
    // This would integrate with your chosen email service
    // For example, using Supabase Edge Functions:
    
    /*
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: notification.to,
        subject: notification.subject,
        html: this.renderTemplate(notification.templateName, notification.templateData),
        priority: notification.priority
      }
    });
    
    if (error) throw error;
    return data;
    */
    
    // For now, just log the email
    console.log('📧 Email would be sent:', {
      to: notification.to,
      subject: notification.subject,
      template: notification.templateName,
      priority: notification.priority
    });
  }
}
