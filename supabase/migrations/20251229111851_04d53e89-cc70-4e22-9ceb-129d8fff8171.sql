-- Add spending_limit column to family_links table
ALTER TABLE public.family_links 
ADD COLUMN spending_limit integer DEFAULT NULL;

-- Add parent_email column to family_links for notifications
ALTER TABLE public.family_links 
ADD COLUMN parent_email text DEFAULT NULL;

-- Add email_notifications_enabled column
ALTER TABLE public.family_links 
ADD COLUMN email_notifications_enabled boolean DEFAULT true;