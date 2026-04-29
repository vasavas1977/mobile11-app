
-- Insert EN KB article about carrier star ratings
INSERT INTO public.kb_articles (
  title, content, category, language, slug, description,
  table_of_contents, display_order, source, is_published, is_internal, tags
) VALUES (
  'Understanding Carrier Star Ratings',
  '## What Do the Star Ratings Mean? {#what-ratings-mean}

When browsing eSIM packages on Mobile11, you''ll notice star ratings next to each carrier name. These ratings reflect the carrier''s network coverage ranking within that specific country, helping you choose the best connectivity option for your trip.

### Rating Scale {#rating-scale}

- **★★★★★ (5 Stars)** — **Top-tier carrier** with the widest network coverage in the country. This is the #1 ranked carrier by coverage area, offering the most reliable signal even in rural and remote areas.

- **★★★★☆ (4 Stars)** — **Major carrier** with strong nationwide coverage. This is typically the #2 ranked carrier, offering excellent coverage in cities and most suburban areas.

- **★★★☆☆ (3 Stars)** — **Regional or newer carrier** with growing coverage. This may be a #3 ranked carrier or a newer operator that is still expanding its network. Coverage is generally good in major cities but may be limited in rural areas.

## How Are Carriers Ranked? {#how-ranked}

Our carrier rankings are based on real-world **network coverage area** and **market position** in each country. We consider:

1. **Coverage footprint** — How much of the country''s land area the carrier covers
2. **Market share** — The carrier''s position among competitors
3. **Network reliability** — Based on customer feedback and industry reports

### Important Notes {#important-notes}

- Ratings are **country-specific**. A carrier rated 5 stars in one country may have a different rating elsewhere.
- All carriers we offer provide reliable data service. Even a 3-star carrier delivers good coverage in major cities and tourist areas.
- **Price is not a factor** in the star rating. A lower-rated carrier may offer better value for your specific needs.

## Carrier Rankings by Popular Destinations {#popular-destinations}

### Japan {#japan}
| Carrier | Rating | Notes |
|---------|--------|-------|
| NTT DOCOMO | ★★★★★ | #1 carrier, widest coverage including rural areas |
| Softbank / KDDI | ★★★★☆ | Strong nationwide coverage, excellent in cities |

### Thailand {#thailand}
| Carrier | Rating | Notes |
|---------|--------|-------|
| AIS | ★★★★★ | #1 carrier, best coverage nationwide |
| TrueMove | ★★★★☆ | #2 carrier, excellent urban coverage |

### South Korea {#south-korea}
| Carrier | Rating | Notes |
|---------|--------|-------|
| SKT / KT | ★★★★★ | Top-tier carriers with complete coverage |
| LG U+ | ★★★★☆ | Strong coverage, especially in cities |

### Turkey {#turkey}
| Carrier | Rating | Notes |
|---------|--------|-------|
| Turkcell | ★★★★★ | #1 carrier, widest coverage |
| Turk Telekom | ★★★★☆ | #2 carrier, strong nationwide |

### USA {#usa}
| Carrier | Rating | Notes |
|---------|--------|-------|
| T-Mobile / AT&T | ★★★★★ | Top-tier carriers with extensive coverage |

## Which Rating Should I Choose? {#which-to-choose}

- **Traveling to rural/remote areas?** Choose a 5-star carrier for the best signal coverage.
- **Staying in major cities?** Any carrier rated 3 stars or above will work well.
- **On a budget?** A 4-star carrier often provides the best balance of coverage and price.
- **Need maximum reliability?** Go with a 5-star carrier for peace of mind.',
  'using-esim',
  'en',
  'carrier-star-ratings',
  'Learn what carrier star ratings mean and how they help you choose the best eSIM package for your destination.',
  '[{"id":"what-ratings-mean","title":"What Do the Star Ratings Mean?"},{"id":"rating-scale","title":"Rating Scale"},{"id":"how-ranked","title":"How Are Carriers Ranked?"},{"id":"important-notes","title":"Important Notes"},{"id":"popular-destinations","title":"Carrier Rankings by Popular Destinations"},{"id":"which-to-choose","title":"Which Rating Should I Choose?"}]'::jsonb,
  50,
  'both',
  true,
  false,
  ARRAY['carrier', 'rating', 'network', 'coverage', 'stars']
);

-- Insert TH KB article about carrier star ratings
INSERT INTO public.kb_articles (
  title, content, category, language, slug, description,
  table_of_contents, display_order, source, is_published, is_internal, tags
) VALUES (
  'ทำความเข้าใจระบบดาวจัดอันดับเครือข่าย',
  '## ดาวจัดอันดับหมายความว่าอย่างไร? {#what-ratings-mean}

เมื่อเลือกแพ็กเกจ eSIM บน Mobile11 คุณจะเห็นดาวจัดอันดับข้างชื่อเครือข่ายแต่ละเจ้า ดาวเหล่านี้แสดงถึงอันดับความครอบคลุมของเครือข่ายในประเทศนั้นๆ ช่วยให้คุณเลือกตัวเลือกที่ดีที่สุดสำหรับการเดินทาง

### มาตราส่วนการจัดอันดับ {#rating-scale}

- **★★★★★ (5 ดาว)** — **เครือข่ายชั้นนำ** ที่มีพื้นที่ครอบคลุมกว้างที่สุดในประเทศ เป็นเครือข่ายอันดับ 1 ด้านความครอบคลุม สัญญาณดีแม้ในพื้นที่ชนบทและห่างไกล

- **★★★★☆ (4 ดาว)** — **เครือข่ายหลัก** ที่มีความครอบคลุมทั่วประเทศ โดยทั่วไปเป็นเครือข่ายอันดับ 2 สัญญาณดีเยี่ยมในเมืองและชานเมือง

- **★★★☆☆ (3 ดาว)** — **เครือข่ายระดับภูมิภาคหรือเครือข่ายใหม่** ที่กำลังขยายพื้นที่ อาจเป็นเครือข่ายอันดับ 3 สัญญาณดีในเมืองใหญ่แต่อาจจำกัดในพื้นที่ชนบท

## เครือข่ายถูกจัดอันดับอย่างไร? {#how-ranked}

การจัดอันดับเครือข่ายของเราอ้างอิงจาก **พื้นที่ครอบคลุมเครือข่ายจริง** และ **ตำแหน่งทางการตลาด** ในแต่ละประเทศ โดยพิจารณาจาก:

1. **พื้นที่ครอบคลุม** — เครือข่ายครอบคลุมพื้นที่ของประเทศมากเพียงใด
2. **ส่วนแบ่งตลาด** — ตำแหน่งของเครือข่ายเทียบกับคู่แข่ง
3. **ความน่าเชื่อถือ** — จากความคิดเห็นของลูกค้าและรายงานอุตสาหกรรม

### หมายเหตุสำคัญ {#important-notes}

- การจัดอันดับเป็น **เฉพาะประเทศ** เครือข่ายที่ได้ 5 ดาวในประเทศหนึ่งอาจมีอันดับต่างกันในประเทศอื่น
- เครือข่ายทุกเจ้าที่เรานำเสนอให้บริการข้อมูลที่เชื่อถือได้ แม้เครือข่าย 3 ดาวก็ยังครอบคลุมเมืองใหญ่และแหล่งท่องเที่ยว
- **ราคาไม่ใช่ปัจจัย** ในการจัดดาว เครือข่ายที่อันดับต่ำกว่าอาจคุ้มค่ากว่าสำหรับความต้องการของคุณ

## อันดับเครือข่ายตามจุดหมายยอดนิยม {#popular-destinations}

### ญี่ปุ่น {#japan}
| เครือข่าย | อันดับ | หมายเหตุ |
|---------|--------|-------|
| NTT DOCOMO | ★★★★★ | อันดับ 1 ครอบคลุมกว้างที่สุดรวมพื้นที่ชนบท |
| Softbank / KDDI | ★★★★☆ | ครอบคลุมทั่วประเทศ ดีเยี่ยมในเมือง |

### ไทย {#thailand}
| เครือข่าย | อันดับ | หมายเหตุ |
|---------|--------|-------|
| AIS | ★★★★★ | อันดับ 1 ครอบคลุมดีที่สุดทั่วประเทศ |
| TrueMove | ★★★★☆ | อันดับ 2 ครอบคลุมดีเยี่ยมในเมือง |

### เกาหลีใต้ {#south-korea}
| เครือข่าย | อันดับ | หมายเหตุ |
|---------|--------|-------|
| SKT / KT | ★★★★★ | เครือข่ายชั้นนำครอบคลุมทั้งประเทศ |
| LG U+ | ★★★★☆ | ครอบคลุมดี โดยเฉพาะในเมือง |

### ตุรกี {#turkey}
| เครือข่าย | อันดับ | หมายเหตุ |
|---------|--------|-------|
| Turkcell | ★★★★★ | อันดับ 1 ครอบคลุมกว้างที่สุด |
| Turk Telekom | ★★★★☆ | อันดับ 2 ครอบคลุมทั่วประเทศ |

### สหรัฐอเมริกา {#usa}
| เครือข่าย | อันดับ | หมายเหตุ |
|---------|--------|-------|
| T-Mobile / AT&T | ★★★★★ | เครือข่ายชั้นนำครอบคลุมทั่วประเทศ |

## ควรเลือกอันดับไหนดี? {#which-to-choose}

- **เดินทางไปพื้นที่ชนบท/ห่างไกล?** เลือกเครือข่าย 5 ดาวเพื่อสัญญาณที่ดีที่สุด
- **อยู่ในเมืองใหญ่?** เครือข่าย 3 ดาวขึ้นไปใช้ได้ดี
- **ประหยัดงบ?** เครือข่าย 4 ดาวมักให้ความสมดุลที่ดีที่สุดระหว่างความครอบคลุมและราคา
- **ต้องการความเสถียรสูงสุด?** เลือกเครือข่าย 5 ดาวเพื่อความอุ่นใจ',
  'using-esim',
  'th',
  'carrier-star-ratings',
  'เรียนรู้ความหมายของดาวจัดอันดับเครือข่ายและวิธีเลือกแพ็กเกจ eSIM ที่ดีที่สุดสำหรับจุดหมายของคุณ',
  '[{"id":"what-ratings-mean","title":"ดาวจัดอันดับหมายความว่าอย่างไร?"},{"id":"rating-scale","title":"มาตราส่วนการจัดอันดับ"},{"id":"how-ranked","title":"เครือข่ายถูกจัดอันดับอย่างไร?"},{"id":"important-notes","title":"หมายเหตุสำคัญ"},{"id":"popular-destinations","title":"อันดับเครือข่ายตามจุดหมายยอดนิยม"},{"id":"which-to-choose","title":"ควรเลือกอันดับไหนดี?"}]'::jsonb,
  50,
  'both',
  true,
  false,
  ARRAY['carrier', 'rating', 'network', 'coverage', 'stars', 'เครือข่าย', 'ดาว']
);
