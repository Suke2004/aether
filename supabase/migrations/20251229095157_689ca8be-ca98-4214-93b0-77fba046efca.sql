-- Enable realtime for pending_verifications table
ALTER TABLE public.pending_verifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_verifications;