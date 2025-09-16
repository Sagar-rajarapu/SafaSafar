-- Create safety zones table
CREATE TABLE public.safety_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('safe', 'caution', 'danger')),
  coordinates JSONB NOT NULL, -- GeoJSON polygon coordinates
  radius NUMERIC, -- For circular zones
  center_lat NUMERIC, -- For circular zones  
  center_lng NUMERIC, -- For circular zones
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safety_zones ENABLE ROW LEVEL SECURITY;

-- Policies for safety zones
CREATE POLICY "Everyone can view active safety zones" 
ON public.safety_zones 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authorities can create safety zones" 
ON public.safety_zones 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('authority', 'police')
  )
  AND auth.uid() = created_by
);

CREATE POLICY "Authorities can update safety zones" 
ON public.safety_zones 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('authority', 'police')
  )
);

-- Create function to update timestamps
CREATE TRIGGER update_safety_zones_updated_at
BEFORE UPDATE ON public.safety_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();