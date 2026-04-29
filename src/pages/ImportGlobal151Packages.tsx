import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface IncludedCountry {
  name: string;
  code: string;
  carriers: Array<{
    name: string;
    networks: string[];
  }>;
}

const GLOBAL_151_COUNTRIES: IncludedCountry[] = [
  { name: "Albania", code: "AL", carriers: [{ name: "Vodafone / One", networks: ["3G", "4G"] }] },
  { name: "Algeria", code: "DZ", carriers: [{ name: "Mobilis / Orascom Telecom", networks: ["3G", "4G"] }] },
  { name: "Anguilla", code: "AI", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "Antigua and Barbuda", code: "AG", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "Argentina", code: "AR", carriers: [{ name: "Claro / Telefonica", networks: ["3G", "4G"] }] },
  { name: "Armenia", code: "AM", carriers: [{ name: "ArmenTel / VIVA", networks: ["3G", "4G"] }] },
  { name: "Aruba", code: "AW", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Australia", code: "AU", carriers: [{ name: "Optus / Telstra", networks: ["3G", "4G"] }] },
  { name: "Austria", code: "AT", carriers: [{ name: "T-mobile / Orange / A1", networks: ["3G", "4G", "5G"] }] },
  { name: "Azerbaijan", code: "AZ", carriers: [{ name: "Azercell / Bakcell", networks: ["3G", "4G"] }] },
  { name: "Bangladesh", code: "BD", carriers: [{ name: "GrameenPhone", networks: ["3G", "4G"] }] },
  { name: "Barbados", code: "BB", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "Belarus", code: "BY", carriers: [{ name: "FE VELCOM / life", networks: ["3G", "4G"] }] },
  { name: "Belgium", code: "BE", carriers: [{ name: "Proximus / Orange / Base", networks: ["3G", "4G", "5G"] }] },
  { name: "Bermuda", code: "BM", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Bosnia and Herzegovina", code: "BA", carriers: [{ name: "HT Eronet / BH Telecom", networks: ["3G", "4G"] }] },
  { name: "Brazil", code: "BR", carriers: [{ name: "VIVO / TIM / Claro", networks: ["3G", "4G"] }] },
  { name: "British Virgin Islands", code: "VG", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "Brunei", code: "BN", carriers: [{ name: "UNN", networks: ["3G", "4G"] }] },
  { name: "Bulgaria", code: "BG", carriers: [{ name: "Yettel / A1 / Vivacom", networks: ["3G", "4G"] }] },
  { name: "Cambodia", code: "KH", carriers: [{ name: "CamGSM / Smart / Metfone", networks: ["3G", "4G"] }] },
  { name: "Cameroon", code: "CM", carriers: [{ name: "Orange", networks: ["3G", "4G"] }] },
  { name: "Canada", code: "CA", carriers: [{ name: "Bell / Telus / Rogers", networks: ["3G", "4G"] }] },
  { name: "Cayman Islands", code: "KY", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Centrafrique", code: "CF", carriers: [{ name: "Orange", networks: ["3G", "4G"] }] },
  { name: "Chile", code: "CL", carriers: [{ name: "Claro / Telefonica / Entel", networks: ["3G", "4G"] }] },
  { name: "China", code: "CN", carriers: [{ name: "CMCC", networks: ["3G", "4G"] }] },
  { name: "Colombia", code: "CO", carriers: [{ name: "Movistar / Claro / Tigo", networks: ["3G", "4G"] }] },
  { name: "Costa Rica", code: "CR", carriers: [{ name: "Movistar / Claro", networks: ["3G", "4G"] }] },
  { name: "Croatia", code: "HR", carriers: [{ name: "T-mobile / A1 Hrvatska", networks: ["3G", "4G", "5G"] }] },
  { name: "Curacao", code: "CW", carriers: [{ name: "Digicel / UTS", networks: ["3G", "4G"] }] },
  { name: "Cyprus", code: "CY", carriers: [{ name: "CYTA / MTN Cyprus", networks: ["3G", "4G"] }] },
  { name: "Czech Republic", code: "CZ", carriers: [{ name: "Vodafone / T-mobile / O2", networks: ["3G", "4G", "5G"] }] },
  { name: "Democratic Republic of Congo", code: "CD", carriers: [{ name: "Airtel / Vodacom / Orange", networks: ["3G", "4G"] }] },
  { name: "Denmark", code: "DK", carriers: [{ name: "TDC / Telia / Telenor", networks: ["3G", "4G", "5G"] }] },
  { name: "Dominica", code: "DM", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "Dominican Republic", code: "DO", carriers: [{ name: "Claro / Altice", networks: ["3G", "4G"] }] },
  { name: "Ecuador", code: "EC", carriers: [{ name: "Claro / Telefonica", networks: ["3G", "4G"] }] },
  { name: "Egypt", code: "EG", carriers: [{ name: "Vodafone / Orange / Etisalat", networks: ["3G", "4G"] }] },
  { name: "El Salvador", code: "SV", carriers: [{ name: "Claro", networks: ["3G", "4G"] }] },
  { name: "Estonia", code: "EE", carriers: [{ name: "Tele2 / Elisa / Telia", networks: ["3G", "4G"] }] },
  { name: "Faroe Islands", code: "FO", carriers: [{ name: "Faroese Telecom", networks: ["3G", "4G"] }] },
  { name: "Fiji", code: "FJ", carriers: [{ name: "Digicel / Vodafone", networks: ["3G", "4G"] }] },
  { name: "Finland", code: "FI", carriers: [{ name: "Elisa / DNA / Telia", networks: ["3G", "4G", "5G"] }] },
  { name: "France", code: "FR", carriers: [{ name: "SFR / Orange / Bouygues", networks: ["3G", "4G", "5G"] }] },
  { name: "French Guiana", code: "GF", carriers: [{ name: "Digicel / Orange", networks: ["3G", "4G"] }] },
  { name: "Georgia", code: "GE", carriers: [{ name: "Geocell / Mobitel", networks: ["3G", "4G"] }] },
  { name: "Germany", code: "DE", carriers: [{ name: "Vodafone / O2 / T-mobile", networks: ["3G", "4G"] }] },
  { name: "Ghana", code: "GH", carriers: [{ name: "MTN / Vodafone", networks: ["3G", "4G"] }] },
  { name: "Gibraltar", code: "GI", carriers: [{ name: "Gibtel", networks: ["3G", "4G"] }] },
  { name: "Greece", code: "GR", carriers: [{ name: "Vodafone / Cosmote / Wind", networks: ["3G", "4G", "5G"] }] },
  { name: "Grenada", code: "GD", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "Guadeloupe", code: "GP", carriers: [{ name: "Digicel / Orange", networks: ["3G", "4G"] }] },
  { name: "Guam", code: "GU", carriers: [{ name: "Docomo Pacific", networks: ["3G", "4G"] }] },
  { name: "Guatemala", code: "GT", carriers: [{ name: "Claro / Telefonica / Tigo", networks: ["3G", "4G"] }] },
  { name: "Guyana", code: "GY", carriers: [{ name: "Digicel / GTT", networks: ["3G", "4G"] }] },
  { name: "Haiti", code: "HT", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Honduras", code: "HN", carriers: [{ name: "Claro / Telefonica", networks: ["3G", "4G"] }] },
  { name: "Hong Kong", code: "HK", carriers: [{ name: "CMHK", networks: ["3G", "4G"] }] },
  { name: "Hungary", code: "HU", carriers: [{ name: "Telenor / Vodafone / T-mobile", networks: ["3G", "4G", "5G"] }] },
  { name: "Iceland", code: "IS", carriers: [{ name: "Siminn / Vodafone / Nova", networks: ["3G", "4G"] }] },
  { name: "India", code: "IN", carriers: [{ name: "Reliance Jio/Bharti Airtel", networks: ["4G", "5G"] }] },
  { name: "Indonesia", code: "ID", carriers: [{ name: "XL / Telkomsel / Indosat", networks: ["3G", "4G"] }] },
  { name: "Iran", code: "IR", carriers: [{ name: "MTN Irancell", networks: ["3G", "4G"] }] },
  { name: "Ireland", code: "IE", carriers: [{ name: "Meteor / 3 Ireland", networks: ["3G", "4G"] }] },
  { name: "Israel", code: "IL", carriers: [{ name: "Partner / Cellcom / Pelephone", networks: ["3G", "4G"] }] },
  { name: "Italy", code: "IT", carriers: [{ name: "Vodafone / TIM / WIND / Iliad", networks: ["3G", "4G", "5G"] }] },
  { name: "Ivory Coast", code: "CI", carriers: [{ name: "MTN / Orange", networks: ["3G", "4G"] }] },
  { name: "Jamaica", code: "JM", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "Japan", code: "JP", carriers: [{ name: "KDDI / Softbank", networks: ["3G", "4G"] }] },
  { name: "Jordan", code: "JO", carriers: [{ name: "Zain / Umniah", networks: ["3G", "4G"] }] },
  { name: "Kazakhstan", code: "KZ", carriers: [{ name: "Tele2 / K'Cell", networks: ["3G", "4G"] }] },
  { name: "Kenya", code: "KE", carriers: [{ name: "Airtel", networks: ["3G", "4G"] }] },
  { name: "Kuwait", code: "KW", carriers: [{ name: "Ooredoo", networks: ["3G", "4G"] }] },
  { name: "Kyrgyzstan", code: "KG", carriers: [{ name: "Beeline / Alfa Telecom", networks: ["3G", "4G"] }] },
  { name: "Laos", code: "LA", carriers: [{ name: "LTC", networks: ["3G", "4G"] }] },
  { name: "Latvia", code: "LV", carriers: [{ name: "Tele2 / BITE / LMT", networks: ["3G", "4G"] }] },
  { name: "Liberia", code: "LR", carriers: [{ name: "Cellcom / Orange", networks: ["3G", "4G"] }] },
  { name: "Lithuania", code: "LT", carriers: [{ name: "BITE / Tele2 / Omnitel", networks: ["3G", "4G"] }] },
  { name: "Luxembourg", code: "LU", carriers: [{ name: "TANGO / POST / Orange", networks: ["3G", "4G"] }] },
  { name: "Macau", code: "MO", carriers: [{ name: "CTM", networks: ["3G", "4G"] }] },
  { name: "Madagascar", code: "MG", carriers: [{ name: "Airtel / Orange", networks: ["3G", "4G"] }] },
  { name: "Malaysia", code: "MY", carriers: [{ name: "Maxis / Celcom / Digi", networks: ["3G", "4G"] }] },
  { name: "Malta", code: "MT", carriers: [{ name: "Vodafone / GO", networks: ["3G", "4G"] }] },
  { name: "Malawi", code: "MW", carriers: [{ name: "Airtel", networks: ["3G", "4G"] }] },
  { name: "Martinique", code: "MQ", carriers: [{ name: "Digicel / Orange", networks: ["3G", "4G"] }] },
  { name: "Mauritius", code: "MU", carriers: [{ name: "Emtel / Orange", networks: ["3G", "4G"] }] },
  { name: "Mexico", code: "MX", carriers: [{ name: "Movistar / Telcel / AT&T", networks: ["3G", "4G"] }] },
  { name: "Moldova", code: "MD", carriers: [{ name: "Orange", networks: ["3G", "4G"] }] },
  { name: "Mongolia", code: "MN", carriers: [{ name: "Unitel / Mobicom", networks: ["3G", "4G"] }] },
  { name: "Montenegro", code: "ME", carriers: [{ name: "Telenor / T-mobile / Mtel", networks: ["3G", "4G"] }] },
  { name: "Morocco", code: "MA", carriers: [{ name: "Orange / Maroc Telecom", networks: ["3G", "4G"] }] },
  { name: "Mozambique", code: "MZ", carriers: [{ name: "Vodacom / Mcel / Movitel", networks: ["3G", "4G"] }] },
  { name: "Nepal", code: "NP", carriers: [{ name: "Nepal Telecom", networks: ["3G", "4G"] }] },
  { name: "Netherlands", code: "NL", carriers: [{ name: "Vodafone / KPN / T-mobile", networks: ["3G", "4G", "5G"] }] },
  { name: "New Zealand", code: "NZ", carriers: [{ name: "Spark / Vodafone / 2 Degrees", networks: ["3G", "4G"] }] },
  { name: "Nicaragua", code: "NI", carriers: [{ name: "Claro", networks: ["3G", "4G"] }] },
  { name: "Norway", code: "NO", carriers: [{ name: "Telia / Telenor", networks: ["3G", "4G", "5G"] }] },
  { name: "Oman", code: "OM", carriers: [{ name: "Omantel / Ooredoo", networks: ["3G", "4G"] }] },
  { name: "Pakistan", code: "PK", carriers: [{ name: "CMPak", networks: ["3G", "4G"] }] },
  { name: "Panama", code: "PA", carriers: [{ name: "Tigo / C&W / Claro", networks: ["3G", "4G"] }] },
  { name: "Papua New Guinea", code: "PG", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Paraguay", code: "PY", carriers: [{ name: "Claro", networks: ["3G", "4G"] }] },
  { name: "Peru", code: "PE", carriers: [{ name: "Claro / Telefonica", networks: ["3G", "4G"] }] },
  { name: "Philippines", code: "PH", carriers: [{ name: "Smart / Globe", networks: ["3G", "4G"] }] },
  { name: "Poland", code: "PL", carriers: [{ name: "Orange / T-mobile / Plus / P4", networks: ["3G", "4G"] }] },
  { name: "Portugal", code: "PT", carriers: [{ name: "MEO / NOS / Vodafone", networks: ["3G", "4G"] }] },
  { name: "Qatar", code: "QA", carriers: [{ name: "Ooredoo / Vodafone", networks: ["3G", "4G"] }] },
  { name: "Romania", code: "RO", carriers: [{ name: "Vodafone / Orange / Digi", networks: ["3G", "4G"] }] },
  { name: "Russia", code: "RU", carriers: [{ name: "MTS / MegaFon / Beeline", networks: ["3G", "4G"] }] },
  { name: "Rwanda", code: "RW", carriers: [{ name: "MTN / Tigo / Airtel", networks: ["3G", "4G"] }] },
  { name: "Saudi Arabia", code: "SA", carriers: [{ name: "Mobily", networks: ["3G", "4G"] }] },
  { name: "Serbia", code: "RS", carriers: [{ name: "Telenor / Telekom / A1", networks: ["3G", "4G"] }] },
  { name: "Seychelles", code: "SC", carriers: [{ name: "Airtel / C&W", networks: ["3G", "4G"] }] },
  { name: "Sierra Leone", code: "SL", carriers: [{ name: "Orange / Africell", networks: ["3G", "4G"] }] },
  { name: "Singapore", code: "SG", carriers: [{ name: "Singtel", networks: ["3G", "4G"] }] },
  { name: "Slovakia", code: "SK", carriers: [{ name: "O2 / Orange", networks: ["3G", "4G", "5G"] }] },
  { name: "Slovenia", code: "SI", carriers: [{ name: "A1 / Telekom", networks: ["3G", "4G"] }] },
  { name: "South Africa", code: "ZA", carriers: [{ name: "Vodacom / MTN / Telkom", networks: ["3G", "4G"] }] },
  { name: "South Korea", code: "KR", carriers: [{ name: "LGU / SK / KT", networks: ["3G", "4G"] }] },
  { name: "Spain", code: "ES", carriers: [{ name: "Orange / Telefonica / Vodafone", networks: ["3G", "4G", "5G"] }] },
  { name: "Sri Lanka", code: "LK", carriers: [{ name: "Dialog", networks: ["3G", "4G"] }] },
  { name: "St. Kitts/Nevis", code: "KN", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "St. Lucia", code: "LC", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "St. Vincent", code: "VC", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Sudan", code: "SD", carriers: [{ name: "MTN / Zain", networks: ["3G", "4G"] }] },
  { name: "Swaziland", code: "SZ", carriers: [{ name: "MTN", networks: ["3G", "4G"] }] },
  { name: "Sweden", code: "SE", carriers: [{ name: "Telenor / Telia / Tele2", networks: ["3G", "4G", "5G"] }] },
  { name: "Switzerland", code: "CH", carriers: [{ name: "Sunrise / SALT / Swisscom", networks: ["3G", "4G", "5G"] }] },
  { name: "Taiwan", code: "TW", carriers: [{ name: "Chunghwa", networks: ["3G", "4G"] }] },
  { name: "Tajikistan", code: "TJ", carriers: [{ name: "Beeline / Tcell", networks: ["3G", "4G"] }] },
  { name: "Tanzania", code: "TZ", carriers: [{ name: "Vodacom / Airtel", networks: ["3G", "4G"] }] },
  { name: "Thailand", code: "TH", carriers: [{ name: "Truemove / DTAC", networks: ["3G", "4G"] }] },
  { name: "Tonga", code: "TO", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Trinidad and Tobago", code: "TT", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Tunisia", code: "TN", carriers: [{ name: "Tunisie Telecom / Ooredoo / Orange", networks: ["3G", "4G"] }] },
  { name: "Turkey", code: "TR", carriers: [{ name: "Turkcell / Vodafone / AVEA", networks: ["3G", "4G"] }] },
  { name: "Turks and Caicos", code: "TC", carriers: [{ name: "Digicel / C&W", networks: ["3G", "4G"] }] },
  { name: "UAE", code: "AE", carriers: [{ name: "Etisalat / DU", networks: ["3G", "4G"] }] },
  { name: "Uganda", code: "UG", carriers: [{ name: "Airtel / MTN", networks: ["3G", "4G"] }] },
  { name: "Ukraine", code: "UA", carriers: [{ name: "Vodafone / Kyivstar / Lifecell", networks: ["3G", "4G"] }] },
  { name: "United Kingdom", code: "GB", carriers: [{ name: "Vodafone / EE / O2 / 3UK", networks: ["3G", "4G", "5G"] }] },
  { name: "Uruguay", code: "UY", carriers: [{ name: "Antel / Telefonica / Claro", networks: ["3G", "4G"] }] },
  { name: "USA", code: "US", carriers: [{ name: "AT&T / T-Mobile", networks: ["3G", "4G"] }] },
  { name: "Uzbekistan", code: "UZ", carriers: [{ name: "Unitel", networks: ["3G", "4G"] }] },
  { name: "Vanuatu", code: "VU", carriers: [{ name: "Digicel", networks: ["3G", "4G"] }] },
  { name: "Vatican City", code: "VA", carriers: [{ name: "Vodafone / TIM / WIND", networks: ["3G", "4G"] }] },
  { name: "Vietnam", code: "VN", carriers: [{ name: "Vinaphone / Mobifone / Viettel", networks: ["3G", "4G"] }] },
  { name: "Yemen", code: "YE", carriers: [{ name: "MTN Yemen", networks: ["3G", "4G"] }] },
  { name: "Zambia", code: "ZM", carriers: [{ name: "Airtel", networks: ["3G", "4G"] }] },
  { name: "San Marino", code: "SM", carriers: [{ name: "Vodafone / TIM / WIND", networks: ["3G", "4G"] }] }
];

const PACKAGES_DATA = [
  // 500MB packages
  { days: 1, data: "500MB", packageId: "F3A57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 1.57, minSell: 1.18, b2bPrice: 0.79, initHours: "25 hours" },
  { days: 2, data: "500MB", packageId: "F4A57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 3.00, minSell: 2.25, b2bPrice: 1.50, initHours: "26 hours" },
  { days: 3, data: "500MB", packageId: "F5A57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 4.57, minSell: 3.43, b2bPrice: 2.29, initHours: "27 hours" },
  { days: 4, data: "500MB", packageId: "F6A57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 6.00, minSell: 4.50, b2bPrice: 3.00, initHours: "28 hours" },
  { days: 5, data: "500MB", packageId: "F7A57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 7.43, minSell: 5.57, b2bPrice: 3.71, initHours: "29 hours" },
  { days: 6, data: "500MB", packageId: "F8A57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 8.86, minSell: 6.64, b2bPrice: 4.43, initHours: "30 hours" },
  { days: 7, data: "500MB", packageId: "F9A57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 10.29, minSell: 7.71, b2bPrice: 5.14, initHours: "31 hours" },
  { days: 10, data: "500MB", packageId: "FAA57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 14.57, minSell: 10.93, b2bPrice: 7.29, initHours: "32 hours" },
  { days: 12, data: "500MB", packageId: "FBA57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 17.29, minSell: 12.96, b2bPrice: 8.64, initHours: "33 hours" },
  { days: 15, data: "500MB", packageId: "FCA57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 21.43, minSell: 16.07, b2bPrice: 10.71, initHours: "34 hours" },
  { days: 20, data: "500MB", packageId: "FDA57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 28.00, minSell: 21.00, b2bPrice: 14.00, initHours: "35 hours" },
  { days: 30, data: "500MB", packageId: "FEA57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 40.57, minSell: 30.43, b2bPrice: 20.29, initHours: "36 hours" },
  // 1GB packages
  { days: 1, data: "1GB", packageId: "FFA57B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 2.86, minSell: 2.14, b2bPrice: 1.43, initHours: "37 hours" },
  { days: 2, data: "1GB", packageId: "00A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 5.57, minSell: 4.18, b2bPrice: 2.79, initHours: "38 hours" },
  { days: 3, data: "1GB", packageId: "01A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 8.29, minSell: 6.21, b2bPrice: 4.14, initHours: "39 hours" },
  { days: 4, data: "1GB", packageId: "02A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 11.00, minSell: 8.25, b2bPrice: 5.50, initHours: "40 hours" },
  { days: 5, data: "1GB", packageId: "03A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 13.71, minSell: 10.29, b2bPrice: 6.86, initHours: "41 hours" },
  { days: 6, data: "1GB", packageId: "04A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 16.29, minSell: 12.21, b2bPrice: 8.14, initHours: "42 hours" },
  { days: 7, data: "1GB", packageId: "05A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 19.00, minSell: 14.25, b2bPrice: 9.50, initHours: "43 hours" },
  { days: 10, data: "1GB", packageId: "06A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 26.71, minSell: 20.04, b2bPrice: 13.36, initHours: "44 hours" },
  { days: 12, data: "1GB", packageId: "07A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 31.86, minSell: 23.89, b2bPrice: 15.93, initHours: "45 hours" },
  { days: 15, data: "1GB", packageId: "08A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 39.29, minSell: 29.46, b2bPrice: 19.64, initHours: "46 hours" },
  { days: 20, data: "1GB", packageId: "09A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 51.43, minSell: 38.57, b2bPrice: 25.71, initHours: "47 hours" },
  { days: 30, data: "1GB", packageId: "0AA67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 74.29, minSell: 55.71, b2bPrice: 37.14, initHours: "48 hours" },
  // 2GB packages
  { days: 1, data: "2GB", packageId: "0BA67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 5.14, minSell: 3.86, b2bPrice: 2.57, initHours: "49 hours" },
  { days: 2, data: "2GB", packageId: "0CA67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 10.29, minSell: 7.71, b2bPrice: 5.14, initHours: "50 hours" },
  { days: 3, data: "2GB", packageId: "0DA67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 15.29, minSell: 11.46, b2bPrice: 7.64, initHours: "51 hours" },
  { days: 4, data: "2GB", packageId: "0EA67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 20.29, minSell: 15.21, b2bPrice: 10.14, initHours: "52 hours" },
  { days: 5, data: "2GB", packageId: "0FA67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 25.29, minSell: 18.96, b2bPrice: 12.64, initHours: "53 hours" },
  { days: 6, data: "2GB", packageId: "10A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 30.14, minSell: 22.61, b2bPrice: 15.07, initHours: "54 hours" },
  { days: 7, data: "2GB", packageId: "11A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 35.14, minSell: 26.36, b2bPrice: 17.57, initHours: "55 hours" },
  { days: 10, data: "2GB", packageId: "12A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 49.57, minSell: 37.18, b2bPrice: 24.79, initHours: "56 hours" },
  { days: 12, data: "2GB", packageId: "13A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 59.00, minSell: 44.25, b2bPrice: 29.50, initHours: "57 hours" },
  { days: 15, data: "2GB", packageId: "14A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 72.71, minSell: 54.54, b2bPrice: 36.36, initHours: "58 hours" },
  { days: 20, data: "2GB", packageId: "15A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 95.00, minSell: 71.25, b2bPrice: 47.50, initHours: "59 hours" },
  { days: 30, data: "2GB", packageId: "16A67B21-B899-F011-B3CD-002248F7DF6B", normalPrice: 136.71, minSell: 102.54, b2bPrice: 68.36, initHours: "60 hours" },
];

export default function ImportGlobal151Packages() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImport = async () => {
    try {
      setImporting(true);
      setProgress(0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to import packages");
        return;
      }

      console.log("Starting Global 151 Countries package import...");
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < PACKAGES_DATA.length; i++) {
        const pkg = PACKAGES_DATA[i];
        
        try {
          // Check if package already exists by package_id
          const { data: existingPackage, error: fetchError } = await supabase
            .from('esim_packages')
            .select('id')
            .eq('package_id', pkg.packageId)
            .maybeSingle();
          
          if (fetchError) {
            throw fetchError;
          }

          // Use existing id if found, otherwise generate new one
          const packageUuid = existingPackage?.id || crypto.randomUUID();

          const packageData = {
            id: packageUuid,
            package_id: pkg.packageId,
            name: `Global 151 Countries ${pkg.days} days, ${pkg.data}/day`,
            short_name: `${pkg.data}/day`,
            description: `Stay connected across 151 countries with ${pkg.data} of high-speed data per day. Daily data reset means you get fresh ${pkg.data} every 24 hours. Speeds reduce to 384kbps after daily limit. Perfect for travelers visiting multiple destinations.`,
            country_code: "GLOBAL",
            country_name: "Global 151 Countries",
            category: "Global",
            data_amount: pkg.data,
            daily_reset_amount: pkg.data,
            validity_days: pkg.days,
            daily_data_reset: true,
            package_type: "day_pass",
            speed_after_limit: "384kbps",
            price: pkg.b2bPrice,
            normal_price: pkg.normalPrice,
            min_sell_price: pkg.minSell,
            cost_price: pkg.b2bPrice,
            currency: "USD",
            network_type: "3G / 4G",
            carrier: "Global 151 Countries",
            apn: "Global 151 Countries",
            sim_type: "eSIM",
            validity_period: "180Days",
            access_type: "Roaming",
            qos_speed: "384kbps",
            support_data: true,
            support_voice: false,
            support_sms: false,
            hot_spot: true,
            top_up: true,
            kyc: false,
            pre_installation: true,
            is_active: true,
            activation_note: `It will be initialized ${pkg.initHours} after activation.`,
            included_countries: { countries: GLOBAL_151_COUNTRIES }
          };

          const { error } = await supabase.functions.invoke('upsert-esim-package', {
            body: { package: packageData }
          });

          if (error) throw error;

          successCount++;
          console.log(`✓ Imported: ${packageData.name}`);
        } catch (error) {
          errorCount++;
          console.error(`✗ Failed to import ${pkg.days} days ${pkg.data}:`, error);
        }

        setProgress(Math.round(((i + 1) / PACKAGES_DATA.length) * 100));
      }

      toast.success(
        `Import completed! ${successCount} packages imported successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      );

      console.log(`Import summary: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import packages. Check console for details.");
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Global 151 Countries Packages</CardTitle>
          <CardDescription>
            Import 36 Day Pass packages for Global 151 Countries coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Package Details:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>36 packages total (12 each: 500MB, 1GB, 2GB)</li>
              <li>Coverage: 151 countries worldwide</li>
              <li>Plan Type: Day Pass with daily data reset</li>
              <li>Speed: 384kbps after daily limit</li>
              <li>Validity: 1-30 days</li>
              <li>Category: Global</li>
              <li>Carrier & APN info included for all 151 countries</li>
            </ul>
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Importing packages... {progress}%
              </p>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Start Import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
