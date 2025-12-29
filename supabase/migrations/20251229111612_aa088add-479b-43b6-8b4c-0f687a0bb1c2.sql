-- Create app_settings table for storing configuration like parent PIN
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for registration)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Only parents can update settings
CREATE POLICY "Parents can update app settings"
ON public.app_settings
FOR UPDATE
USING (is_parent(auth.uid()));

-- Insert default parent PIN
INSERT INTO public.app_settings (key, value)
VALUES ('parent_registration_pin', '1234');