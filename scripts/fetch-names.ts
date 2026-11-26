import { writeFileSync } from 'fs';

const ids = [
  "1ip4HbU-EN8Qfy-mxeOigOTG2Ts8g1IX5",
  "18OckH28Kc3UNjjX-28SMHJuTK405Q74T",
  "1Xfx97xQY-AR6M8QY_9pmqdE7bnUkHlc6",
  "1e2mlECi8-6Br0eYwS6IjONvXUGOpmlu5",
  "1k7qF49LxS28EbgsKLCa9e0WsW0nUTMTc",
  "1b59zu9DhFHsRJjZ0taA9qD1r1zIBdnfX",
  "1M_0gZk35vK-g5DMma83iLU0EIPCAHIzG",
  "1AHdNR7PpNWqE8JYb46kYKtgxhgh5ZYiO",
  "1C5yRyFfaDZ62Lbeq58rmt4e-iWptMeRN",
  "1YCWdNLA3kxs24NCDJNGxYk0tzbj9rG9H",
  "1hIQZgqT63wKUx-T2Z6Sr2nb21T57dtzO",
  "1y4iE0BQSFj0PLLp5IwCrbht0l_j_G0LH",
  "1-G_jMVl6Pdy_mxw2mIWBaED9F0dtoQOn",
  "1mS48N-GR_rP2RoJkMgF6C4-huQYViumO",
  "1z2Gx0XZ9-HjTNgSkH6WjK6i2P2c5UX9V",
  "14JnzM2WhhJltJlAGTiaRTxL6njKeavWS",
  "1Lhamp7dVRt1UV43UJ2vR7BGXl3KUQPEY",
  "1UJ6u_MRVVEUakuke3kLXzw-fWxiHSvmt",
  "1HQ5aemLnAmNF-vXbJrtC1CSVAwcJ67uV",
  "1XajgPntdaNOG0_EcLhKILXGqS8X2oYpP",
  "132s1aSsltNoV_qT2NAQmtg9ruHHAdpgu",
  "1LhcKaE4s9lLDFTKGkJi5KQWywjuk4k7r",
  "1qzIH_CnlzzSTnyBmrXcMNmGyVHj0SXJz",
  "17eAbWVgXqbiAGUs5wd6GzSqlI6rXv1ji",
  "1US-A9abbS5rv8MaTSHQJI1PT1LigAzvd",
  "1V8ftc7YfIvyrP6NzRTElpOihfdk1sQ96",
  "16hWb8-BS8G7wBSxI6cKbcFQDqPRqQw_C",
  "1MhzOECzb5S_M39uQgXHAyVNuIHYn1sUC",
  "10gKUQ100ETemZFmA8eP26JNDhh_V-dby",
  "14FZMEHO_JOxIQZQrZUmYnY8Uh2XNM2Yi",
  "1-YwGEZ0DFlI1Ff4DbV9u5byL3uPVts7R",
  "1v5TfCTzw-cVPeR_Dx5hsSFowtUtnrtxM",
  "1vnMu4uztpoZYXSo7BwB2XcPN0_3lveKS",
  "15cA4RXFRxqpWYw3Zq0QjF-K6-dfVu1e9",
  "1XWvAp64dwpABQcUAqrXIUcRQ3JMS9_7H",
  "11LkT7kJdI7HNE4EFT8PXh93NW99jjOVA",
  "1dvCNRygPt-8e4UOjvaob1-A-662x9-ov",
  "1-SRoTqJQwpjAQcbj2PG91S4v6axHm44L",
  "1_viXD_b0K1aEjGyLhUXHeoMfU0ucWKTu",
  "1RW32mRrm5RoOsOMYkUQtFQSyneOLIIFR",
  "1ForM5MNuCeaJUD2_NcZ97Z31ABdhM9GY",
  "1lgrK-kfcR2D5lYXgGgKSb9-O_tlNRoJg",
  "1Kjd-YrD4AyEnNshh9TLqxlRPQHu_Ion5",
  "1ME4UpJnRLHsWVLNHNCJDVuZmP9LxW_pC",
  "1yuKtZi9g3J1P49EMIUeHPckeOhGdxHvN",
  "1Wne27Xxu9QdlZUpl115piKppTO4ZN6ft",
  "1jVS-Pvjdh1A8UsRBJN9Us1f-j7R7n6bu",
  "1sr_wBcn7v4ZxgwdQyosGbTFITwgXyl2R",
  "1dNrIIWqjE39hyCGGq7XXix-TYI2WoxvJ",
  "11fXH6TCkXIdksjr7-TIt79ih6RlptSpU",
  "15U5Y050RvhJTOCe1fb8M0A0Q0B4WDCH2",
  "1sT_tkWAkKPRo3ZB3fjr5kpweZn1PXx4-",
  "1IWZnLkE4NU_nJ8VVlDk3sLVj2DLZRp7G",
  "16hzFKR6veBE8HXrgeRRjjwgY4T857hn_",
  "1S5wHzDL6ooUsosDNOKLJaok9_LzKG1l4",
  "1d1pikN0-ED-nmw0r-GTu1H76O4NIlGnl",
  "1FahufgpUwdBJWGCHNyRQW7_3iME1Y7p0",
  "1dmzJMz79SfamMVbDONQJtKvqAqGWtNT-",
  "1-wnsrKT5dc7tTz24NWzA70UqfyHcZGUC",
  "1uaMjjeeEzUOvfK5fDw8eiJkE63UrjCaA",
  "12L1yL9X__jBYCsUu2hqfRJD4jRRCvG3Y",
  "1rdFcPguOCm3t4E3kISwEOshcik9QXK4-",
  "1Iy30DHxozvO5Bx-FnTZ15Dl2ntwQpzFf",
  "1kWVTcwZcbZ8YUKIjLYyKK4L5Y_DILQMi",
  "1cBW8ozoCZkcjQWVTia1eMfiaNgdeJwC9",
  "1X0bPstar0ca5ALKH2LYyCp7j0ZDACa_8",
  "15pJPmsoQ1sWPHM1rqpEWYbMmZIubCD5J",
  // plus the remaining ones from loop previously added just in case
  "1fbUKCQnPsgGYo0Y3d4zVhdIEAK7DvhYm",
  "1Homl9Co_CQFWKK_AQigikaKcK8OZ6UzB",
  "1-QKytIkUFmuZ0wM64yut_tDz33pZsO1g",
  "12aUfthA3VWvT4MF3LsR15Fcp21CRARgm",
  "1Ka2tjwf7RkSoAilVS6PvlfyHkU8-a0lb",
  "1SZV0HIuKxi3-CY7rg-cRZ-ITsm7ealHE",
  "1VTRvtFZ08wqrySJEa4WK9eqbsKefWKh0",
  "1kLKkI7kiVXYfFMUHvB1n8Mzg_VN3KicX",
  "1W2wDAIb2ufacP_2Hcwy_K70vYPsEwegh",
  "1sDgsDEitLHDnfbz-JQzxV1m6CjXGsSG1",
  "1lrj6srJX21QU0_TP_8z7hR-W4EDv-HXZ"
];

function getCategory(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('kick')) return 'Kicks';
  if (lowerName.includes('snare')) return 'Snares';
  if (lowerName.includes('hihat') || lowerName.includes('hat')) return 'HiHats';
  if (lowerName.includes('perc')) return 'Percussion';
  if (lowerName.includes('drum loop') || lowerName.includes('drumbreak') || lowerName.includes('drums')) return 'Drums';
  if (lowerName.includes('bass')) return 'Bass';
  if (lowerName.includes('melodic') || lowerName.includes('synth') || lowerName.includes('pad')) return 'Melodic';
  if (lowerName.includes('foley') || lowerName.includes('atmos')) return 'Atmosphere';
  if (lowerName.includes('fx')) return 'FX';
  if (lowerName.includes('vox') || lowerName.includes('vocal')) return 'Vocals';
  return 'Uncategorized';
}

async function fetchNames() {
  const SAMPLES: any[] = [];
  const uniqueIds = Array.from(new Set(ids));
  let i = 1;
  for (const id of uniqueIds) {
    try {
      const res = await fetch(`https://drive.google.com/file/d/${id}/view`);
      const text = await res.text();
      let name = id;
      const match = text.match(/<title>(.+) - Google Drive<\/title>/);
      if (match) {
        name = match[1];
      } else {
        const fallbackMatch = text.match(/<title>(.+)<\/title>/);
        if (fallbackMatch) name = fallbackMatch[1].replace(' - Google Drive', '');
      }
      
      const category = getCategory(name);

      SAMPLES.push({
        id: i++,
        name,
        category,
        duration: "--:--",
        driveId: id
      });
      console.log(`Fetched: ${name}`);
    } catch(e: any) {
      console.error(id, e.message);
    }
  }
  
  // Custom sort to group by category
  const order = ['Kicks', 'Snares', 'HiHats', 'Percussion', 'Drums', 'Bass', 'Melodic', 'FX', 'Vocals', 'Atmosphere', 'Uncategorized'];
  SAMPLES.sort((a, b) => {
    return order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name);
  });
  
  // remap IDs linearly
  SAMPLES.forEach((s, idx) => s.id = idx + 1);

  let outputStr = "export const SAMPLES = [\n";
  SAMPLES.forEach(s => {
    outputStr += `  { id: ${s.id}, name: "${s.name}", category: "${s.category}", duration: "${s.duration}", driveId: "${s.driveId}" },\n`;
  });
  outputStr += "];\n";
  writeFileSync('samplesData.ts', outputStr);
  console.log("Done. Written to samplesData.ts");
}

fetchNames();
