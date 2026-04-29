
-- Unpublish duplicate and stub articles in "using-esim" category
-- Preserves data while removing duplicates from public Help Center

UPDATE kb_articles 
SET is_published = false, updated_at = now()
WHERE id IN (
  -- English duplicates and stubs to unpublish
  '45b7c894-5116-4b22-be21-40f2a494cb9f',  -- can-i-use-hotspot-tethering (duplicate of can-i-use-esim-as-hotspot)
  '4edb4560-0e93-4d00-986f-a45660f89002',  -- understanding-mobile11-plan-types (319 chars stub)
  'ced08a15-ac37-451a-b641-b8659d7af474',  -- what-are-the-three-types-of-mobile11-esim-plans (382 chars stub)
  'e11f94c2-c1b0-4914-9017-07f15f2daf5d',  -- can-i-check-the-data-usage (129 chars stub)
  '57a1eaae-7f1f-465c-ad63-ec96bfcced88',  -- how-to-check-data-usage (161 chars stub)
  '6ce3bc5e-3c3f-4497-903d-4d80e5d76e59',  -- how-to-top-up-your-esim (204 chars stub)
  'da7a22fd-e290-4050-9729-907668b33980',  -- when-does-my-esim-validity-start (duplicate of when-does-my-data-plan-begin)
  'e33e61ab-2663-4b75-9452-a6fa74e8887e',  -- esim-coverage-and-networks (153 chars stub)
  'bd58d7bd-d7d2-45ee-a49b-bccd590f8acb',  -- extending-your-esim-plan (169 chars stub)
  '8d4e0c38-bdd5-4725-bfed-d8e49fb9b9e5',  -- regional-vs-local-esim (187 chars stub)
  '64b390d8-4ee6-4943-92b5-f5a6f203994f',  -- what-speed-can-i-expect (198 chars stub)
  'b36ff9d3-fc63-4490-a929-b0971afc562a',  -- when-will-the-unlimited-data-plan-reset (121 chars stub)
  '970ea138-c85d-498b-bf81-8867f41b6c1a',  -- can-i-delete-my-esim (137 chars stub)
  
  -- Thai duplicates and stubs to unpublish
  '5e9c4149-16f8-4f09-895f-91e30b33f072',  -- can-i-use-hotspot-tethering TH (duplicate)
  '18b5eec5-9826-4c1f-847b-39c1596109de',  -- can-i-use-esim-as-hotspot TH (duplicate - keep the comprehensive one)
  'df303cd7-dfbd-4191-8f72-cb154c0d7c7d',  -- hotspot TH (83 chars stub)
  '506552d2-e676-4914-ad02-2fa8f8651d5a',  -- hotspot-1 TH (662 chars duplicate)
  'c448938e-474e-4030-95a9-137555aa8e23',  -- edp-c448938e TH (279 chars stub - plan types)
  '91c6818f-152d-4e4c-8147-677495266347',  -- edp-91c6818f TH (191 chars stub - plan types)
  '46666b07-4f33-426e-9745-d81f5c2727b0',  -- -3 TH (678 chars - duplicate check data)
  '747d2bbe-397b-4169-a8aa-7d89fc9c25fa',  -- -747d2bbe TH (149 chars stub - check data)
  '511f4aae-effa-40ab-94b4-fed30b7501e8',  -- edp-511f4aae TH (187 chars stub - top up)
  '4f44100a-2463-4723-a9ef-203de40e5dbd',  -- edp-4f44100a TH (99 chars stub - when starts)
  '78efcdbe-6a5a-49eb-aa8b-94274b40120c',  -- edp-78efcdbe TH (772 chars duplicate - when starts)
  '739682b6-b71b-49e7-bb5a-bbb2014c4f4b',  -- edp-739682b6 TH (575 chars duplicate - expires)
  '229b1910-3091-4cdd-876b-eff9764dccd5',  -- -2 TH (177 chars stub - unlimited)
  '6f1713b1-04b3-41ac-8fda-715ee1a68285',  -- edp-6f1713b1 TH (697 chars duplicate - unlimited)
  '89abd0c3-b38a-4489-9066-e6e264166d8f',  -- edp-89abd0c3 TH (725 chars duplicate - unlimited reset)
  '2f2bb571-7fee-438f-8c2f-50b3eecdc44c',  -- edp-2f2bb571 TH (481 chars duplicate - multiple devices)
  '6e8e20a3-25e0-4ff4-8a1f-b5ff925a8721',  -- edp-6e8e20a3 TH (494 chars duplicate - reinstall)
  '25b100c0-28e6-4934-b508-7e9bd2ebe458',  -- edp-25b100c0 TH (606 chars duplicate - delete esim)
  'ae8c0736-76f7-4330-9d67-8a5b4ff1bfd5'   -- esim-vs TH (172 chars stub - regional vs local)
);
