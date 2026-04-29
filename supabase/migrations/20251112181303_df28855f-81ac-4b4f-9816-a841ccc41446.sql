-- Fix security warning by using the existing secure function
-- Drop triggers first
DROP TRIGGER IF EXISTS set_ticket_categories_updated_at ON public.ticket_categories;
DROP TRIGGER IF EXISTS set_support_tickets_updated_at ON public.support_tickets;
DROP TRIGGER IF EXISTS set_ticket_messages_updated_at ON public.ticket_messages;

-- Now drop the function
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Recreate triggers using the existing secure function
CREATE TRIGGER set_ticket_categories_updated_at
  BEFORE UPDATE ON public.ticket_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_ticket_messages_updated_at
  BEFORE UPDATE ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();