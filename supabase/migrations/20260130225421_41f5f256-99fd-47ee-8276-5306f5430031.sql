
-- Unpublish duplicate and stub articles in the "account" category
-- This preserves data while removing duplicates from the public Help Center

UPDATE kb_articles 
SET is_published = false, updated_at = now()
WHERE id IN (
  -- English duplicates and stubs
  '94300a03-bc9e-49c1-91bd-25221ed291c8',  -- accepted-payment-methods (EN)
  'eec54559-77ae-4b64-b2b0-b6882cce762f',  -- account-security (EN)
  '974a822e-89bf-4d93-9424-7cdd785f9b25',  -- currency-and-pricing (EN)
  '6a4b0553-490b-44a3-b16d-63c3bb2dd709',  -- forgot-password (EN)
  '52bec7e1-4271-4ef9-9124-c5025a1efba5',  -- how-to-create-account (EN)
  '9d3f962e-bce6-4acc-b5ab-eb2108ae1f45',  -- how-to-get-invoice (EN)
  'e252a0e9-c2e9-4bbd-8ec1-529c8fdd6c05',  -- how-to-use-mobile11-money (EN)
  '54d31c3e-4503-4f71-80ff-ffe115dd32a1',  -- is-my-payment-information-secure (EN)
  '8f2c1390-fabe-499b-8b36-9a0fd866cdc2',  -- payment-failed (EN)
  'c5f61a39-71c6-4d01-8101-310967090aee',  -- payment-methods-accepted (EN)
  'aa9b078c-f695-4dd8-99d4-e45a575e65e9',  -- promo-codes-and-discounts (EN)
  '17970f80-1487-4b64-b90b-a2252c121fa1',  -- update-account-information (EN)
  '5f45d13d-3128-40ed-80a3-d57ca150a5dc',  -- use-promo-code (EN)
  '72959692-b241-448b-a2c1-fdc140f35762',  -- view-order-history (EN)
  '26a85488-b4d8-4dd0-80bb-6bb051fb12c8',  -- what-is-loyalty-program (EN)
  '3153ef99-8062-43ba-8257-b4c595cd0af4',  -- what-is-the-refund-policy (EN)
  'b8337048-5b3e-4bd7-a927-043f4cdf88d1',  -- what-payment-methods-does-mobile11-accept (EN)
  
  -- Thai duplicates and stubs
  'c150d8ec-3a41-470a-9d05-ba0e90221b6a',  -- -1-acc-c150d8ec (TH) ลืมรหัสผ่าน
  '44df1f6a-0102-4245-8e8c-c4eefa277956',  -- -1-pb-44df1f6a (TH) นโยบายการคืนเงิน
  '87f03cba-6d56-4327-b6dd-dd8284d18b46',  -- -2-acc-87f03cba (TH) โปรแกรมแนะนำเพื่อน
  '72c99778-7f7a-40f6-a447-0ebe273cd387',  -- -2-pb-72c99778 (TH) วิธีรับใบแจ้งหนี้
  'ff966afa-bce7-4460-9a3a-ff3aba6fe476',  -- -3-acc-ff966afa (TH) ดูประวัติคำสั่งซื้อ
  '176858dd-be18-419c-ad38-6b515de04198',  -- -3-pb-176858dd (TH) สกุลเงินและราคา
  '3c3ffe4a-4357-4178-a635-9b7eb002798b',  -- -3c3ffe4a (TH) วิธีสร้างบัญชี
  '9b608478-b0dc-4189-9281-1d5f16c10cf6',  -- -9b608478 (TH) วิธีการชำระเงินที่รับ
  '6a7bd95b-992b-4ffc-991d-158d77d663ce',  -- acc-6a7bd95b (TH) โปรแกรมสะสมคะแนน Mobile11
  '197da8bd-e042-4d25-8d85-ae1a9d56ba8b',  -- accepted-payment-methods (TH)
  '0996e78d-acdf-4808-ac8e-4b28a24c511d',  -- mobile11-money (TH)
  'c3ffe49f-a4d8-49fb-9e20-5a9cdc461112',  -- mobile11-money-1 (TH)
  '0311ecc3-ad01-4df7-8fa8-7469470728bf',  -- pay-0311ecc3 (TH) จ่ายเงินได้ช่องทางไหนบ้าง?
  '6f6bd060-2b13-4e10-9369-f09c4ea4680c',  -- pay-6f6bd060 (TH) โปรโมโค้ดและส่วนลด
  '9b6f3f28-da0d-4653-aaaa-904bd1f65f8d',  -- pay-9b6f3f28 (TH) การชำระเงินล้มเหลว
  '7803ffc7-0be5-4da0-ab6f-477770d03334',  -- promptpay (TH)
  '1282625a-2bb2-4e13-8749-b359e3fcd07b'   -- use-promo-code (TH)
);
