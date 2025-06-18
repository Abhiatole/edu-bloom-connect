
-- Phase 3 Database Schema Updates for EduGrowHub

-- Performance predictions table
CREATE TABLE performance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  predicted_grade DECIMAL(5,2),
  confidence_score DECIMAL(3,2),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  prediction_date DATE DEFAULT CURRENT_DATE,
  actual_grade DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fees management
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name VARCHAR(100) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  transaction_id VARCHAR(100),
  payment_date TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-student relationships
CREATE TABLE parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Push notifications
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSONB,
  read_status BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics cache
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_data JSONB NOT NULL,
  date_range VARCHAR(50),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(metric_name, date_range)
);

-- Security logs (enhanced)
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE performance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Performance Predictions
CREATE POLICY "Students can view own predictions" ON performance_predictions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage predictions" ON performance_predictions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('teacher', 'superadmin')
    )
  );

-- RLS Policies for Fee Structures
CREATE POLICY "Everyone can view fee structures" ON fee_structures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage fee structures" ON fee_structures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('teacher', 'superadmin')
    )
  );

-- RLS Policies for Fee Payments
CREATE POLICY "Students can view own payments" ON fee_payments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Parents can view child payments" ON fee_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = fee_payments.student_id
    )
  );

CREATE POLICY "Admins can manage payments" ON fee_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('teacher', 'superadmin')
    )
  );

-- RLS Policies for Parent-Student relationships
CREATE POLICY "Parents can view own relationships" ON parent_students
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Students can view parent relationships" ON parent_students
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage relationships" ON parent_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('teacher', 'superadmin')
    )
  );

-- RLS Policies for Push Notifications
CREATE POLICY "Users can view own notifications" ON push_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications" ON push_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('teacher', 'superadmin')
    )
  );

-- RLS Policies for Analytics Cache
CREATE POLICY "Admins can view analytics" ON analytics_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('teacher', 'superadmin')
    )
  );

-- RLS Policies for Security Logs
CREATE POLICY "Superadmins can view security logs" ON security_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'superadmin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_performance_predictions_student_id ON performance_predictions(student_id);
CREATE INDEX idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX idx_parent_students_parent_id ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student_id ON parent_students(student_id);
CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);
