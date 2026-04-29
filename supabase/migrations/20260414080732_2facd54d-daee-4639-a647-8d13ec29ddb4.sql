UPDATE public.orders
SET 
  status = 'completed',
  iccid = '89852342022443522445',
  qr_code = 'LPA:1$rsp1.cmlink.com$EDCF3E6D388C419497DD181329E4896A',
  smdp_address = 'rsp1.cmlink.com',
  activation_code = 'EDCF3E6D388C419497DD181329E4896A',
  download_link = 'LPA:1$rsp1.cmlink.com$EDCF3E6D388C419497DD181329E4896A',
  updated_at = now()
WHERE id = 'e7f8b6fa-6dc8-4a46-8193-5e9695d5ac0e';