-- Fix Thailand 2Days package_id to correct USIMSA optionId
UPDATE esim_packages 
SET package_id = 'e835d929-8cf0-ed11-800f-28187860ef36'
WHERE id = 'ec490cf0-aa74-418f-a051-7d4be0039bb1' 
  AND name = 'Thailand 2Days / 1GB';