
-- Create country_carriers table
CREATE TABLE public.country_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name text NOT NULL,
  country_code text NOT NULL,
  carrier_name text NOT NULL,
  network_type text NOT NULL,
  region_preset text,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint to prevent duplicates
ALTER TABLE public.country_carriers 
  ADD CONSTRAINT country_carriers_unique 
  UNIQUE (country_name, carrier_name, network_type, region_preset);

-- Indexes
CREATE INDEX idx_country_carriers_country ON public.country_carriers (country_name);
CREATE INDEX idx_country_carriers_region ON public.country_carriers (region_preset);
CREATE INDEX idx_country_carriers_code ON public.country_carriers (country_code);

-- Enable RLS
ALTER TABLE public.country_carriers ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can view carriers"
  ON public.country_carriers FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage carriers"
  ON public.country_carriers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_country_carriers_updated_at
  BEFORE UPDATE ON public.country_carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Europe 42 data
INSERT INTO public.country_carriers (country_name, country_code, carrier_name, network_type, region_preset) VALUES
('Albania', 'AL', 'Vodafone', 'LTE', 'europe_42'),
('Andorra', 'AD', 'Mobiland STA', '5G', 'europe_42'),
('Austria', 'AT', 'A1', '5G', 'europe_42'),
('Austria', 'AT', 'H3G', '5G', 'europe_42'),
('Belgium', 'BE', 'Orange', '5G', 'europe_42'),
('Belgium', 'BE', 'Proximus', 'LTE', 'europe_42'),
('Bosnia and Herzegovina', 'BA', 'BH Telecom', 'LTE', 'europe_42'),
('Bosnia and Herzegovina', 'BA', 'Eronet', 'LTE', 'europe_42'),
('Bulgaria', 'BG', 'Vivacom', '5G', 'europe_42'),
('Bulgaria', 'BG', 'Mobitel A1', '5G', 'europe_42'),
('Bulgaria', 'BG', 'Telenor', 'LTE', 'europe_42'),
('Croatia', 'HR', 'Telemach/TM', '5G', 'europe_42'),
('Croatia', 'HR', 'A1 Hrvatska', 'LTE', 'europe_42'),
('Cyprus', 'CY', 'MTN', '5G', 'europe_42'),
('Cyprus', 'CY', 'Primetel', '3G', 'europe_42'),
('Czech Republic', 'CZ', 'Vodafone', 'LTE', 'europe_42'),
('Czech Republic', 'CZ', 'O2', '5G', 'europe_42'),
('Denmark', 'DK', 'TDC', '5G', 'europe_42'),
('Denmark', 'DK', 'Sonofon Denmark', 'LTE', 'europe_42'),
('Denmark', 'DK', 'Hi3G Danemark', 'LTE', 'europe_42'),
('Denmark', 'DK', 'Telia', '5G', 'europe_42'),
('Estonia', 'EE', 'Telia', '5G', 'europe_42'),
('Estonia', 'EE', 'Tele2', '5G', 'europe_42'),
('Finland', 'FI', 'DNA', '5G', 'europe_42'),
('Finland', 'FI', 'Elisa', '5G', 'europe_42'),
('France', 'FR', 'BOUYGUES TELECOM', '5G', 'europe_42'),
('France', 'FR', 'Orange', '5G', 'europe_42'),
('France', 'FR', 'SFR', '5G', 'europe_42'),
('Georgia', 'GE', 'Geocell', 'LTE', 'europe_42'),
('Germany', 'DE', 'Vodafone', 'LTE', 'europe_42'),
('Germany', 'DE', 'O2', '5G', 'europe_42'),
('Gibraltar', 'GI', 'Gibtelecom', '5G', 'europe_42'),
('Greece', 'GR', 'Cosmote', '5G', 'europe_42'),
('Greece', 'GR', 'Vodafone', '5G', 'europe_42'),
('Greece', 'GR', 'Wind', '5G', 'europe_42'),
('Hungary', 'HU', 'Telenor', '5G', 'europe_42'),
('Hungary', 'HU', 'T-Mobile', '5G', 'europe_42'),
('Iceland', 'IS', 'Syn hf.', '5G', 'europe_42'),
('Iceland', 'IS', 'Nova ehf.', '5G', 'europe_42'),
('Ireland', 'IE', 'Three Ireland', '5G', 'europe_42'),
('Ireland', 'IE', 'Meteor', '5G', 'europe_42'),
('Ireland', 'IE', 'Vodafone', 'LTE', 'europe_42'),
('Italy', 'IT', 'TIM', '5G', 'europe_42'),
('Italy', 'IT', 'Vodafone', 'LTE', 'europe_42'),
('Italy', 'IT', 'Wind', '5G', 'europe_42'),
('Latvia', 'LV', 'Tele2', '5G', 'europe_42'),
('Latvia', 'LV', 'SIA Bite Mobile', 'LTE', 'europe_42'),
('Latvia', 'LV', 'LMT', '5G', 'europe_42'),
('Liechtenstein', 'LI', 'Telecom Liechtenstein', 'LTE', 'europe_42'),
('Lithuania', 'LT', 'Bite', '5G', 'europe_42'),
('Lithuania', 'LT', 'Telia', '5G', 'europe_42'),
('Luxembourg', 'LU', 'Tango SA', 'LTE', 'europe_42'),
('Luxembourg', 'LU', 'Orange', '5G', 'europe_42'),
('Malta', 'MT', 'Vodafone', '5G', 'europe_42'),
('Montenegro', 'ME', 'MTEL', 'LTE', 'europe_42'),
('Netherlands', 'NL', 'KPN', '5G', 'europe_42'),
('North Macedonia', 'MK', 'A1 mk', 'LTE', 'europe_42'),
('Norway', 'NO', 'TELENOR', '5G', 'europe_42'),
('Norway', 'NO', 'Telia', '5G', 'europe_42'),
('Poland', 'PL', 'Play(P4)', 'LTE', 'europe_42'),
('Portugal', 'PT', 'NOS', '5G', 'europe_42'),
('Portugal', 'PT', 'Vodafone', 'LTE', 'europe_42'),
('Romania', 'RO', 'Vodafone', 'LTE', 'europe_42'),
('Romania', 'RO', 'Orange', '5G', 'europe_42'),
('Slovakia', 'SK', 'Orange', '5G', 'europe_42'),
('Slovakia', 'SK', 'O2', 'LTE', 'europe_42'),
('Slovenia', 'SI', 'Telemach', '5G', 'europe_42'),
('Slovenia', 'SI', 'A1', 'LTE', 'europe_42'),
('Slovenia', 'SI', 'Mobitel', '5G', 'europe_42'),
('Spain', 'ES', 'YOIGO', 'LTE', 'europe_42'),
('Spain', 'ES', 'Vodafone', 'LTE', 'europe_42'),
('Sweden', 'SE', 'Telenor', '5G', 'europe_42'),
('Sweden', 'SE', '3', '5G', 'europe_42'),
('Switzerland', 'CH', 'Salt', '5G', 'europe_42'),
('Turkey', 'TR', 'AVEA', '5G', 'europe_42'),
('Ukraine', 'UA', 'KyivStar', 'LTE', 'europe_42'),
('Ukraine', 'UA', 'MTS', 'LTE', 'europe_42'),
('United Kingdom', 'GB', 'Telefonica UK', '5G', 'europe_42'),
('United Kingdom', 'GB', 'Vodafone', 'LTE', 'europe_42'),
('United Kingdom', 'GB', 'H3G', 'LTE', 'europe_42'),
('United Kingdom', 'GB', 'EE', '5G', 'europe_42'),

-- Seed Global 109 data (from screenshots)
('Albania', 'AL', 'One Albania', '5G', 'global_109'),
('Algeria', 'DZ', 'Algerie Telecom Mobile (ATM)', '4G', 'global_109'),
('Andorra', 'AD', 'STA', '5G', 'global_109'),
('Antilles', 'AN', 'Digicel Curacao', '4G', 'global_109'),
('Argentina', 'AR', 'AMX Argentina S.A.', '4G', 'global_109'),
('Argentina', 'AR', 'Telefonica Moviles Argentina S.A (Movistar)', '4G', 'global_109'),
('Armenia', 'AM', 'K-Telecom CJSC', '4G', 'global_109'),
('Aruba', 'AW', 'Digicel Aruba', '4G', 'global_109'),
('Australia', 'AU', 'Singtel Optus Ltd', '5G', 'global_109'),
('Austria', 'AT', 'Hutchison Drei Austria GmbH', '5G', 'global_109'),
('Austria', 'AT', 'A1 Telekom Austria AG', '5G', 'global_109'),
('Azerbaijan', 'AZ', 'Bakcell Ltd', '5G', 'global_109'),
('Bahamas', 'BS', 'Be Aliv Limited', '4G', 'global_109'),
('Bahrain', 'BH', 'Viva (STC) Bahrain', '4G', 'global_109'),
('Bangladesh', 'BD', 'GrameenPhone Ltd.', '4G', 'global_109'),
('Belarus', 'BY', 'FE Velcom', '4G', 'global_109'),
('Belgium', 'BE', 'Telenet Group BVBA/SPRL (Base)', '4G', 'global_109'),
('Belgium', 'BE', 'ORANGE Belgium nv/SA', '5G', 'global_109'),
('Belgium', 'BE', 'Proximus PLC', '5G', 'global_109'),
('Belize', 'BZ', 'Belize Telemedia', '4G', 'global_109'),
('Belize', 'BZ', 'SMART', '4G', 'global_109'),
('Bolivia', 'BO', 'Telecel S.A.', '4G', 'global_109'),
('Botswana', 'BW', 'Mascom', 'LTE', 'global_109'),
('Brazil', 'BR', 'TIM Celular S.A.', '4G', 'global_109'),
('British Virgin Islands', 'VG', 'Digicel (BVI) Limited', '4G', 'global_109'),
('Brunei', 'BN', 'DST Communications Sdn Bhd', '5G', 'global_109'),
('Bulgaria', 'BG', 'M-Tel Mobiltel EAD (VIP)', '5G', 'global_109'),
('Bulgaria', 'BG', 'Vivacom', '5G', 'global_109'),
('Cambodia', 'KH', 'CamGSM (Cellcard)', '4G', 'global_109'),
('Cameroon', 'CM', 'Orange Cameroun S.A.', '4G', 'global_109'),
('Canada', 'CA', 'Bell Mobility Inc.', '5G', 'global_109'),
('Canada', 'CA', 'Rogers', '5G', 'global_109'),
('Canada', 'CA', 'Telus', '5G', 'global_109'),
('Chile', 'CL', 'Entel PCS Telecommunicaciones S.A.', '4G', 'global_109'),
('China', 'CN', 'China Unicom', '5G', 'global_109'),
('China', 'CN', 'China Telecom', '4G', 'global_109'),
('Colombia', 'CO', 'Colombia Movil S.A. (Tigo)', '4G', 'global_109'),
('Costa Rica', 'CR', 'Claro CR', '4G', 'global_109'),
('Côte d''Ivoire', 'CI', 'Orange Côte d''Ivoire S.A', '4G', 'global_109'),
('Croatia', 'HR', 'A1 HR', '5G', 'global_109'),
('Cyprus', 'CY', 'MTN Ltd', '5G', 'global_109'),
('Czech Republic', 'CZ', 'Vodafone Czech Republic a.s.', '4G', 'global_109'),
('Czech Republic', 'CZ', 'O2 Czech Republic', '5G', 'global_109'),
('Democratic Republic Of The Congo', 'CD', 'Orange RDC Sarl', '4G', 'global_109'),
('Denmark', 'DK', 'Hi3G Denmark Aps', '5G', 'global_109'),
('Dominica', 'DM', 'Flow', '4G', 'global_109'),
('Dominica', 'DM', 'Digicel', '4G', 'global_109'),
('Dominican Republic', 'DO', 'Altice Dominicana S.A.', '4G', 'global_109'),
('Dominican Republic', 'DO', 'Claro', '4G', 'global_109'),
('Egypt', 'EG', 'Orange Egypt for Telecommunications', '5G', 'global_109'),
('El Salvador', 'SV', 'Digicel S.A. de C.V.', '4G', 'global_109'),
('El Salvador', 'SV', 'Telemovil El Salvador', '4G', 'global_109'),
('Estonia', 'EE', 'Telia Eesti AS', '5G', 'global_109'),
('Estonia', 'EE', 'Tele2 Eesti AS', '4G', 'global_109'),
('Faroe Islands', 'FO', 'Faroese Telecom', '5G', 'global_109'),
('Fiji', 'FJ', 'Digicel (Fiji) Ltd', '4G', 'global_109'),
('Finland', 'FI', 'Telia Finland', '5G', 'global_109'),
('Finland', 'FI', 'Alands Mobiltelefon', '4G', 'global_109'),
('France', 'FR', 'Orange France', '5G', 'global_109'),
('France', 'FR', 'SFR', '5G', 'global_109'),
('France', 'FR', 'Bouygues Telecom', '5G', 'global_109');
