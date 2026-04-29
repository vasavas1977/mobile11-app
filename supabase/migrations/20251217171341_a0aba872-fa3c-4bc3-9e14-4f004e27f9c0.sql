-- Update existing LINE contact with profile data from metadata
UPDATE contacts 
SET line_display_name = metadata->>'line_display_name',
    line_picture_url = metadata->>'line_picture_url'
WHERE line_id IS NOT NULL 
  AND line_display_name IS NULL 
  AND metadata->>'line_display_name' IS NOT NULL;