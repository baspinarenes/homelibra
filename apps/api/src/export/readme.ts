/** The ZIP's first page for the scholar: what each file is. */
export function readme(now: Date) {
  return `# Homelibra kütüphanen

${now.toISOString().slice(0, 10)} tarihinde alınmış, kütüphanenin tamamı.

- \`kutuphane.json\`: kaynakların ve künyelerinin tüm alanları (türünde gizli ama korunan alanlar dahil), takvimli tarihler, notlar, etiketler ve dosya tanımları. Başka bir araca taşımak için.
- \`kutuphane.schema.json\`: \`kutuphane.json\`un şeması (JSON Schema); her alanın ne olduğu orada yazar.
- \`kaynaklar/\`: her kaynak için bir Markdown dosyası, notlar Konum sırasıyla. Hiçbir araç olmadan okumak için.
- \`kapaklar/\`: kapakların, \`<kaynak kimliği>.jpg\` adıyla. Hangi kaynağın olduğu \`kutuphane.json\`da kaynağın \`cover\` alanında yazar.
`;
}
