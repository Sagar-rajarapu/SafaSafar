-- Create user profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('tourist', 'authority')) DEFAULT 'tourist',
  aadhaar_number TEXT,
  passport_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  language_preference TEXT DEFAULT 'en',
  location_sharing_enabled BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Authorities can view tourist profiles for monitoring
CREATE POLICY "Authorities can view tourist profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles authority_profile
    WHERE authority_profile.user_id = auth.uid()
    AND authority_profile.user_type = 'authority'
  )
  AND user_type = 'tourist'
);

-- Create locations table for tracking tourist locations
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_name TEXT,
  is_emergency BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies for locations
CREATE POLICY "Users can insert their own locations"
ON public.locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own locations"
ON public.locations
FOR SELECT
USING (auth.uid() = user_id);

-- Authorities can view all tourist locations
CREATE POLICY "Authorities can view tourist locations"
ON public.locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles authority_profile
    WHERE authority_profile.user_id = auth.uid()
    AND authority_profile.user_type = 'authority'
  )
);

-- Create emergency alerts table
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('panic', 'medical', 'theft', 'harassment', 'other')),
  status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')) DEFAULT 'active',
  message TEXT,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency alerts
CREATE POLICY "Users can create their own emergency alerts"
ON public.emergency_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own emergency alerts"
ON public.emergency_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Authorities can view and update all emergency alerts
CREATE POLICY "Authorities can view all emergency alerts"
ON public.emergency_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles authority_profile
    WHERE authority_profile.user_id = auth.uid()
    AND authority_profile.user_type = 'authority'
  )
);

CREATE POLICY "Authorities can update emergency alerts"
ON public.emergency_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles authority_profile
    WHERE authority_profile.user_id = auth.uid()
    AND authority_profile.user_type = 'authority'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at
BEFORE UPDATE ON public.emergency_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable realtime for emergency alerts and locations
ALTER TABLE public.emergency_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.locations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;