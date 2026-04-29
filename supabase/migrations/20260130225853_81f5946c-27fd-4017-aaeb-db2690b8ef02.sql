-- Unpublish duplicate/stub articles in "Getting Started" category
UPDATE kb_articles 
SET is_published = false, updated_at = now()
WHERE id IN (
  'd5c2d3fe-a2fb-44fa-bd90-24f556180154',  -- is-my-phone-esim-compatible (EN stub)
  'b82a2445-eaf4-4d06-9925-0952bcc35f04',  -- how-do-i-activate-my-esim (EN stub)
  'd8ce4565-9a8c-4273-ad14-7f61ae95c300'   -- payment-methods-accepted (EN duplicate)
);