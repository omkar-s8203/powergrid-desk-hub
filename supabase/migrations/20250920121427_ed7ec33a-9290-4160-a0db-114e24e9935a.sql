-- Create RPC function to get ticket messages with sender details
CREATE OR REPLACE FUNCTION public.get_ticket_messages(ticket_id_param uuid)
RETURNS TABLE (
  id uuid,
  ticket_id uuid,
  sender_id uuid,
  message text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  sender_full_name text,
  sender_role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id,
    tm.ticket_id,
    tm.sender_id,
    tm.message,
    tm.created_at,
    tm.updated_at,
    p.full_name as sender_full_name,
    p.role as sender_role
  FROM ticket_messages tm
  LEFT JOIN profiles p ON tm.sender_id = p.id
  WHERE tm.ticket_id = ticket_id_param
  ORDER BY tm.created_at ASC;
END;
$$;

-- Create RPC function to insert ticket message
CREATE OR REPLACE FUNCTION public.insert_ticket_message(
  p_ticket_id uuid,
  p_sender_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_message_id uuid;
BEGIN
  INSERT INTO ticket_messages (ticket_id, sender_id, message)
  VALUES (p_ticket_id, p_sender_id, p_message)
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$;