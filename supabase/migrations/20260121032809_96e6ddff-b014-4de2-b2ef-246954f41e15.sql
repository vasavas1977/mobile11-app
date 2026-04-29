
-- Delete all existing USIMSA provider APN config entries
DELETE FROM provider_apn_config 
WHERE provider_id = 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692';

-- Re-insert all 151 countries with correct APN data from Excel Page 6
INSERT INTO provider_apn_config 
(country_code, primary_apn, alternative_apns, notes, is_active, priority, provider_id)
VALUES
  -- Albania
  ('AL', 'cmlink', ARRAY['global', 'orange'], 'Albania - Vodafone / One', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Angola
  ('AO', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Angola - Unitel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Antigua
  ('AG', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Antigua - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Argentina
  ('AR', 'cmlink', ARRAY['global', 'orange'], 'Argentina - Telefonica (Movistar) / Claro (AMX)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Armenia
  ('AM', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Armenia - ArmenTel (Beeline) / Ucom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Aruba
  ('AW', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Aruba - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Australia
  ('AU', 'cmlink', ARRAY['global', 'cmhk'], 'Australia - Optus / Telstra / Vodafone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Austria
  ('AT', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Austria - T-mobile / Orange (H3G) / A1', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Azerbaijan
  ('AZ', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Azerbaijan - Azercell / Bakcell', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Bahamas
  ('BS', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Bahamas - BTC', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Bahrain
  ('BH', 'cmlink', ARRAY['global', 'cmhk'], 'Bahrain - Batelco', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Bangladesh
  ('BD', 'cmlink', ARRAY['global', 'cmhk'], 'Bangladesh - GrameenPhone / Banglalink / Robi', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Barbados
  ('BB', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Barbados - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Belgium
  ('BE', 'cmlink', ARRAY['orange'], 'Belgium - Belgacom (Proximus) / Mobistar (Orange) / Base', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Benin
  ('BJ', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Benin - MTN', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Bermuda
  ('BM', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Bermuda - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Bolivia
  ('BO', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Bolivia - Nuevatel (Viva) / Entel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Bosnia Herzegovina
  ('BA', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Bosnia Herzegovina - HT (Eronet) / BH Telecom / M:Tel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Botswana
  ('BW', 'cmlink', ARRAY['global', 'cmhk'], 'Botswana - Mascom Wireless / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Brazil
  ('BR', 'cmlink', ARRAY['global', 'cmhk'], 'Brazil - Telefonica (Vivo) / TIM / Claro', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- British Virgin Islands
  ('VG', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'British Virgin Islands - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Brunei
  ('BN', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Brunei - UNN', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Bulgaria
  ('BG', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Bulgaria - Yettel (Telenor) / MOBILTEL (A1) / Vivacom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Cambodia
  ('KH', 'cmlink', ARRAY['orange'], 'Cambodia - CamGSM / Smart / Metfone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Cameroon
  ('CM', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Cameroon - Orange Cameroun S.A. / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Canada
  ('CA', 'cmlink', ARRAY['global', 'cmhk'], 'Canada - Bell / Telus / Sasktel / Rogers', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Cayman Islands
  ('KY', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Cayman Islands - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Central African Republic
  ('CF', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Central African Republic - Orange Centrafrique', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Chile
  ('CL', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Chile - Claro / Telefonica / Entel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- China
  ('CN', 'cmlink', ARRAY['global', 'cmhk'], 'China - CMCC', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Colombia
  ('CO', 'cmlink', ARRAY['global', 'orange'], 'Colombia - Telefonica (Movistar) / Comcel (Claro) / Tigo', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Costa Rica
  ('CR', 'cmlink', ARRAY['global', 'orange'], 'Costa Rica - Telefonica (Movistar) / Claro', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Croatia
  ('HR', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Croatia - T-mobile / A1 Hrvatska (Vipnet) / Telemach', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Curacao
  ('CW', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Curacao - Digicel / UTS', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Cyprus
  ('CY', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Cyprus - CYTA / MTN Cyprus / Primetel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Czech Republic
  ('CZ', 'cmlink', ARRAY['orange'], 'Czech Republic - Vodafone / T-mobile / O2', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Democratic Republic of Congo
  ('CD', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Democratic Republic of Congo - Airtel / Vodacom / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Denmark
  ('DK', 'cmlink', ARRAY['orange'], 'Denmark - TDC / Telia / Telenor / Hi3G', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Dominica
  ('DM', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Dominica - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Dominican Republic
  ('DO', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Dominican Republic - Claro / Altice (Orange)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Ecuador
  ('EC', 'cmlink', ARRAY['global', 'orange'], 'Ecuador - Conecel (Claro) / Telefonica (Otecel)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Egypt
  ('EG', 'cmlink', ARRAY['global', 'cmhk'], 'Egypt - Vodafone / Etisalat / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- El Salvador
  ('SV', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'El Salvador - Claro / OTA Claro', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Estonia
  ('EE', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Estonia - Tele2 / Elisa EMT / Telia', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Faroe Islands
  ('FO', 'cmlink', ARRAY['global', 'orange'], 'Faroe Islands - Faroese Telecom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Fiji
  ('FJ', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Fiji - Digicel / Vodafone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Finland
  ('FI', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Finland - Elisa / Alcom / DNA / Telia Finland', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- France
  ('FR', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'France - SFR / Orange / Bouygues / Free Mobile', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- French Guiana
  ('GF', 'cmlink', ARRAY['global', 'orange'], 'French Guiana - Digicel / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Georgia
  ('GE', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Georgia - Geocell / Mobitel / Silknet / Magticom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Germany
  ('DE', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Germany - Vodafone / Telefonica O2 / T-mobile', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Ghana
  ('GH', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Ghana - Scancom (MTN) / Vodafone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Gibraltar
  ('GI', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Gibraltar - Gibtel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Greece
  ('GR', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Greece - Vodafone / Cosmote (T-mobile) / Wind Hellas', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Grenada
  ('GD', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Grenada - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Guadeloupe
  ('GP', 'cmlink', ARRAY['global', 'orange'], 'Guadeloupe - Digicel / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Guam
  ('GU', 'cmlink', ARRAY['global', 'cmhk'], 'Guam - Docomo Pacific', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Guatemala
  ('GT', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Guatemala - Claro / Telefonica / Tigo (Comcel)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Guyana
  ('GY', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Guyana - Digicel / GTT', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Haiti
  ('HT', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Haiti - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Honduras
  ('HN', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Honduras - Claro (Megatel) / Telefonica', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Hong Kong
  ('HK', 'cmlink', ARRAY['global', 'cmhk'], 'Hong Kong - CMHK', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Hungary
  ('HU', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Hungary - Telenor / Vodafone / T-mobile', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Iceland
  ('IS', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Iceland - Siminn / Vodafone / Nova', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- India
  ('IN', 'cmlink', ARRAY['global', 'bicsapn'], 'India - Airtel (Bharti) / Reliance JIO', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Indonesia
  ('ID', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Indonesia - XL (Excelcom) / Telkomsel / Indosat', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Iran
  ('IR', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Iran - MTN Irancell', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Ireland
  ('IE', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Ireland - Meteor / 3 Ireland (Hutchison)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Israel
  ('IL', 'cmlink', ARRAY['global', 'wbdata'], 'Israel - Partner / Cellcom / Pelephone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Italy
  ('IT', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Italy - Vodafone / TIM / WIND / H3G / Iliad Italia', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Ivory Coast
  ('CI', 'cmlink', ARRAY['global', 'orange'], 'Ivory Coast (Cote d''Ivoire) - MTN / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Jamaica
  ('JM', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Jamaica - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Japan
  ('JP', 'cmlink', ARRAY['global', 'cmhk'], 'Japan - KDDI / Softbank', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Jordan
  ('JO', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Jordan - Zain / Umniah / MOBILECOM', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Kazakhstan
  ('KZ', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Kazakhstan - Tele2 / K''Cell / Beeline (Kar-Tel)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Kenya
  ('KE', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Kenya - Airtel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Kuwait
  ('KW', 'cmlink', ARRAY['global', 'cmhk'], 'Kuwait - Ooredoo (Wataniya)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Kyrgyzstan
  ('KG', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Kyrgyzstan - Beeline / Alfa Telecom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Laos
  ('LA', 'cmlink', ARRAY['global', 'cmhk'], 'Laos - LTC', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Latvia
  ('LV', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Latvia - Tele2 / BITE / LMT Latvia', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Liberia
  ('LR', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Liberia - Cellcom Liberia / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Lithuania
  ('LT', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Lithuania - BITE / UAB Tele2 / Omnitel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Luxembourg
  ('LU', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Luxembourg - TANGO / P&T(POST) / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Macau
  ('MO', 'cmlink', ARRAY['global', 'cmhk'], 'Macau - CTM', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Madagascar
  ('MG', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Madagascar - Airtel / Zain / Orange Madagascar', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Malaysia
  ('MY', 'cmlink', ARRAY['global', 'cmhk'], 'Malaysia - Maxis / Celcom / Digi / U-mobile', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Malta
  ('MT', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Malta - Epic (Vodafone) / GO', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Malawi
  ('MW', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Malawi - Airtel (Celtel)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Martinique
  ('MQ', 'cmlink', ARRAY['global', 'orange'], 'Martinique - Digicel / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Mauritius
  ('MU', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Mauritius - Emtel / Orange (Cellplus)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Mexico
  ('MX', 'cmlink', ARRAY['global', 'orange'], 'Mexico - Telefonica (Movistar) / Telcel (Claro) / AT&T', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Moldova
  ('MD', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Moldova - Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Mongolia
  ('MN', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Mongolia - Unitel / Mobicom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Montenegro
  ('ME', 'cmlink', ARRAY['global', 'orange'], 'Montenegro - Telenor / T-mobile / Mtel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Morocco
  ('MA', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Morocco - Meditel (Orange Morocco) / IAM (Maroc Telecom) / Wana Maroc', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Mozambique
  ('MZ', 'cmlink', ARRAY['global', 'cmhk'], 'Mozambique - Vodacom / Mcel / Movitel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Nepal
  ('NP', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Nepal - Nepal Telecom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Netherlands
  ('NL', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Netherlands - Vodafone / KPN / T-mobile', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- New Zealand
  ('NZ', 'cmlink', ARRAY['global', 'orange'], 'New Zealand - Spark / Vodafone / 2 Degrees', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Nicaragua
  ('NI', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Nicaragua - Enitel (Claro)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Norway
  ('NO', 'cmlink', ARRAY['orange'], 'Norway - Telia (Netcom) / Telenor', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Oman
  ('OM', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Oman - Omantel (Oman Mobile) / Ooredoo (Nawras)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Pakistan
  ('PK', 'cmlink', ARRAY['global', 'cmhk'], 'Pakistan - CMPak', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Panama
  ('PA', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Panama - Tigo (Telefonica) / C&W / Claro', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Papua New Guinea
  ('PG', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Papua New Guinea - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Paraguay
  ('PY', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Paraguay - Claro', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Peru
  ('PE', 'cmlink', ARRAY['global', 'orange'], 'Peru - Claro (TIM) / Telefonica', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Philippines
  ('PH', 'cmlink', ARRAY['global', 'cmhk'], 'Philippines - Smart / Globe', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Poland
  ('PL', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Poland - Orange / T-mobile / Polkomtel (Plus) / P4', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Portugal
  ('PT', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Portugal - TMN (MEO) / NOS / Vodafone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Qatar
  ('QA', 'cmlink', ARRAY['global', 'cmhk'], 'Qatar - Ooredoo (Qtel) / Vodafone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Romania
  ('RO', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Romania - Vodafone / Digi / SC COSMOTE / Orange / RCS & RDS', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Russia
  ('RU', 'cmlink', ARRAY['global', 'cmhk'], 'Russia - MTS / T2 Mobile / MegaFon / VimpelCom (Beeline)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Rwanda
  ('RW', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Rwanda - MTN Rwanda Cell / Tigo / Airtel / MTN', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Saudi Arabia
  ('SA', 'cmlink', ARRAY['global', 'cmhk'], 'Saudi Arabia - Mobily (Etihad Etisalat)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Serbia
  ('RS', 'cmlink', ARRAY['global', 'orange'], 'Serbia - Telenor / Telekom / A1 (VIP)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Seychelles
  ('SC', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Seychelles - Telecom Seychelles (Airtel) / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Sierra Leone
  ('SL', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Sierra Leone - Celtel (Orange) / Africell', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Singapore
  ('SG', 'cmlink', ARRAY['global', 'cmhk'], 'Singapore - Singtel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Slovakia
  ('SK', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Slovakia - Telefonica O2 / Orange Slovensko / Slovak Telecom', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Slovenia
  ('SI', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Slovenia - A1 (Si Mobile) / Telekom (Mobitel) / Tusmobil (Telemach)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- South Africa
  ('ZA', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'South Africa - Vodacom (Vodafone) / MTN / Telkom / CellC', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- South Korea
  ('KR', 'cmlink', ARRAY['global', 'cmhk'], 'South Korea - LGU / SK / KT', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Spain
  ('ES', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Spain - Orange / Telefonica / Vodafone / Xfera', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Sri Lanka
  ('LK', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Sri Lanka - Dialog', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- St. Kitts/Nevis
  ('KN', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'St. Kitts/Nevis - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- St. Lucia
  ('LC', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'St. Lucia - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- St. Vincent
  ('VC', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'St. Vincent - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Sudan
  ('SD', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Sudan - MTN Sudan (Bashair Telecom) / Zain (Mobitel)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Swaziland (Eswatini)
  ('SZ', 'cmlink', ARRAY['global', 'cmhk'], 'Swaziland - MTN', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Sweden
  ('SE', 'cmlink', ARRAY['orange'], 'Sweden - Telenor / TeliaSonera / Hi3G / Tele2', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Switzerland
  ('CH', 'cmlink', ARRAY['orange'], 'Switzerland - Sunrise / SALT (Orange) / Swisscom Mobile', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Taiwan
  ('TW', 'cmlink', ARRAY['global', 'cmhk'], 'Taiwan - Chunghwa', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Tajikistan
  ('TJ', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Tajikistan - Beeline (Tacom) / Tcell', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Tanzania
  ('TZ', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Tanzania - Vodacom / Airtel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Thailand
  ('TH', 'cmlink', ARRAY['global', 'cmhk'], 'Thailand - Real Future (Truemove) / DTAC', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Tonga
  ('TO', 'cmlink', ARRAY['global', 'cmhk'], 'Tonga - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Trinidad and Tobago
  ('TT', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Trinidad and Tobago - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Tunisia
  ('TN', 'cmlink', ARRAY['orange'], 'Tunisia - Tunisie Telecom / Ooredoo / Orange', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Turkey
  ('TR', 'cmlink', ARRAY['global', 'cmhk'], 'Turkey - Turkcell / AVEA / Vodafone', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Turks and Caicos
  ('TC', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Turks and Caicos - Digicel / C&W', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- UAE
  ('AE', 'cmlink', ARRAY['global', 'cmhk'], 'UAE - Etisalat / DU', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Uganda
  ('UG', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Uganda - Airtel (Celtel) / MTN Uganda', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Ukraine
  ('UA', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Ukraine - Vodafone / Kyivstar / Lifecell (Astelit)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- United Kingdom
  ('GB', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'United Kingdom - Vodafone / EE / Telefonica O2 / Hutchison 3UK', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Uruguay
  ('UY', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Uruguay - Antel / Telefonica / CTI (Claro)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- USA
  ('US', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'USA - AT&T / T-Mobile / Verizon', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Uzbekistan
  ('UZ', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Uzbekistan - Unitel (VimpelCom)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Vanuatu
  ('VU', 'cmlink', ARRAY['global', 'cmhk'], 'Vanuatu - Digicel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Vietnam
  ('VN', 'cmlink', ARRAY['global', 'cmhk'], 'Vietnam - Vinaphone / Mobifone / Viettel / Vietnamobile', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Yemen
  ('YE', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Yemen - MTN Yemen (Spacetel)', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Zambia
  ('ZM', 'cmlink', ARRAY['ibox.tim.it', 'wap.tim.it'], 'Zambia - Airtel', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- San Marino (same as Italy)
  ('SM', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'San Marino - Vodafone / TIM / WIND / Iliad', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'),
  -- Vatican City (same as Italy)
  ('VA', 'cmlink', ARRAY['global', 'internet.proximus.be'], 'Vatican City - Vodafone / TIM / WIND / Iliad', true, 1, 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692');
