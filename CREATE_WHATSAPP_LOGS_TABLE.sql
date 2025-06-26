-- Create WhatsApp logs table for tracking sent messages
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'delivered', 'read')),
    twilio_message_id TEXT,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sender_id ON public.whatsapp_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_receiver_id ON public.whatsapp_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_timestamp ON public.whatsapp_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON public.whatsapp_logs(status);

-- Enable RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sent messages" ON public.whatsapp_logs
    FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can view messages sent to them" ON public.whatsapp_logs
    FOR SELECT USING (auth.uid() = receiver_id);

CREATE POLICY "Admins can view all messages" ON public.whatsapp_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Teachers and admins can insert messages" ON public.whatsapp_logs
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND (
            EXISTS (
                SELECT 1 FROM public.teacher_profiles 
                WHERE user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_id = auth.uid() AND role = 'ADMIN'
            )
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_logs_updated_at_trigger
    BEFORE UPDATE ON public.whatsapp_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_logs_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.whatsapp_logs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
