import { calendars } from '@homelibra/core/date';
import { sourceFields, sourceTypes } from '@homelibra/core/source';
import { z } from 'zod';

// The Library export's JSON (#40, stories 16-18; GLOSSARY.md "Library
// export"). One definition gives both what the API writes and the schema
// document that goes into the ZIP beside it, so the two cannot drift. The
// descriptions are the documentation: written for the scholar and for
// whoever moves the Library into another tool, in Turkish like the rest of
// what the scholar reads.

/** Increases when a field changes meaning or goes; new fields do not change it. */
export const LIBRARY_EXPORT_VERSION = 1;

const instant = z.iso.datetime({ offset: true }).meta({ description: 'Bir an, ISO 8601 biçiminde (UTC).' });

const calendarDate = z
  .strictObject({
    calendar: z.enum(calendars).meta({
      description: 'Tarihin girildiği takvim: gregorian (Milâdî), hijri (Hicrî) ya da rumi (Rumî).',
    }),
    year: z.int().meta({ description: 'Yıl, o takvimde.' }),
    month: z.int().min(1).max(12).optional().meta({
      description:
        'Ay, bilindiyse. Hicrî aylar Muharrem 1 olmak üzere; Milâdî ve Rumî aylar sivil numarasıyla (Rumî Kânunusani 1, Mart 3).',
    }),
    day: z.int().min(1).max(31).optional().meta({ description: 'Gün, ay da bilindiyse.' }),
  })
  .meta({
    id: 'Tarih',
    description:
      'Kaynağın kendi takviminde, bilinen hassasiyette girilmiş bir tarih: yalnız yıl, ay ve yıl, ya da gün, ay ve yıl. Başka takvime çevrilmez.',
  });

const tagNames = z.array(z.string()).meta({ description: 'Etiket adları, `tags` listesindeki yazımlarıyla.' });

const textField = z.string();
const fields = z
  .strictObject(
    Object.fromEntries(
      sourceFields.map((key) => [
        key,
        (key === 'firstEditionDate' || key === 'accessDate' ? calendarDate : textField).optional(),
      ]),
    ) as Record<(typeof sourceFields)[number], z.ZodOptional<typeof calendarDate | typeof textField>>,
  )
  .meta({
    description:
      'Türe özel alanlar, yalnızca dolu olanlar: publisher (Yayınevi), placeOfPublication (Yayın yeri), edition (Baskı/cilt), container (İçinde), volumeIssue (Cilt/sayı), pageRange (Sayfa aralığı), university (Üniversite), thesisType (Tez türü), library (Kütüphane), shelfmark (Koleksiyon ve numara), url (URL), series (Seri/program adı), duration (Süre), siteName (Site adı), firstEditionDate (İlk baskı tarihi, Tarih), accessDate (Erişim tarihi, Tarih). Kaynağın türünde görünmeyen ama korunan alanlar da buradadır; hangileri olduğu `hiddenFields`ta yazar.',
  });

const exportedSource = z
  .strictObject({
    id: z.uuid(),
    type: z.enum(sourceTypes).meta({
      description:
        'Kaynak türü: book (Kitap), article (Makale), thesis (Tez), archive (Arşiv), manuscript (Yazma), periodical (Süreli yayın), recording (Kayıt), webPage (Web sayfası), other (Diğer).',
    }),
    title: z.string().meta({ description: 'Başlık.' }),
    author: z.string().nullable().meta({ description: 'Yazar, atıfta yazıldığı gibi.' }),
    isbn: z.string().nullable().meta({ description: 'ISBN, girildiği gibi.' }),
    doi: z.string().nullable().meta({ description: 'DOI, girildiği gibi.' }),
    bibliographicNote: z.string().nullable().meta({ description: 'Künye notu.' }),
    date: calendarDate.nullable().meta({ description: 'Tarih (türüne göre basım, belge, telif tarihi…).' }),
    fields,
    hiddenFields: z.array(z.string()).meta({
      description:
        'Dolu olduğu hâlde bu türün formunda görünmeyen alanlar ("Bu türde gizli ama korunuyor"); `isbn` ve `doi` de olabilir.',
    }),
    readingStatus: z
      .enum(['reading', 'finished'])
      .meta({ description: 'Okuma durumu: reading (okunuyor), finished (bitti).' }),
    lastFinishedAt: instant.nullable().meta({ description: 'Bu kaynakta son "Bitir"in anı; hiç bitirilmediyse null.' }),
    tags: tagNames.meta({
      description: 'Kaynağın kendi etiketleri. Notlarına geçmez; her notun etiketleri notta yazar.',
    }),
    cover: z.string().nullable().meta({
      description: 'Kapağın ZIP içindeki yolu (`kapaklar/<id>.jpg`); kapak yoksa ya da dosyası bulunamadıysa null.',
    }),
    markdown: z
      .string()
      .meta({ description: 'Kaynağın notlarını Konum sırasıyla veren Markdown dosyasının ZIP içindeki yolu.' }),
    createdAt: instant,
    updatedAt: instant,
  })
  .meta({ id: 'Kaynak', description: 'Bir Kaynak (Source) ve künyesinin tüm alanları.' });

const exportedNote = z
  .strictObject({
    id: z.uuid().meta({ description: 'Notun kimliği (UUIDv7; yakalandığı anı taşır).' }),
    sourceId: z.uuid().meta({ description: 'Notun bağlı olduğu kaynağın kimliği.' }),
    locator: z
      .string()
      .nullable()
      .meta({ description: 'Konum (Locator), atıfta yazıldığı gibi; "Konumsuz" not için null.' }),
    locatorSort: z.array(z.number()).nullable().meta({
      description:
        'Konum sırasının dayandığı değer: Konum’daki sayılar (varak b yüzü +0,5; zaman saniye olarak) ya da elle düzeltilmiş değer. Sayı yoksa null.',
    }),
    excerpt: z.string().nullable().meta({ description: 'Alıntı (Excerpt).' }),
    comment: z.string().nullable().meta({ description: 'Yorum (Comment).' }),
    tags: tagNames.meta({ description: 'Notun kendi etiketleri; kaynağın etiketleri burada değil, kaynakta yazar.' }),
    capturedAt: instant.meta({ description: 'Notun yakalandığı an.' }),
    enteredSourceAt: instant.meta({
      description: 'Notun bu kaynağa girdiği an: yakalandığı ya da başka kaynaktan taşındığı an.',
    }),
    updatedAt: instant,
  })
  .meta({ id: 'Not', description: 'Bir Not: bir kaynağın bir Konum’unda Alıntı, Yorum ya da ikisi.' });

const exportedTag = z
  .strictObject({
    id: z.uuid(),
    name: z.string().meta({ description: 'Etiketin ilk girildiği yazımı.' }),
  })
  .meta({ id: 'Etiket', description: 'Bir Etiket (Tag).' });

const exportedCollection = z
  .strictObject({
    id: z.uuid(),
    name: z.string().meta({ description: 'Dosyanın adı.' }),
    tags: tagNames.meta({
      description: 'Dosyanın tanımındaki etiketler: bunlardan herhangi birini taşıyan notlar dosyadadır.',
    }),
    includeSourceNotes: z.boolean().meta({
      description:
        '"Etiketli kaynakların tüm notları": açıksa bu etiketlerden birini taşıyan kaynağın her notu da dosyadadır.',
    }),
    createdAt: instant,
    updatedAt: instant,
  })
  .meta({
    id: 'Dosya',
    description: 'Bir Dosya (Collection) tanımı. Notları saklanmaz; her açılışta etiketlerden yeniden bulunur.',
  });

export const libraryExportSchema = z
  .strictObject({
    format: z.literal('homelibra-library-export'),
    version: z.literal(LIBRARY_EXPORT_VERSION).meta({ description: 'Bu biçimin sürümü.' }),
    exportedAt: instant.meta({ description: 'Dışa aktarmanın alındığı an.' }),
    sources: z.array(exportedSource).meta({ description: 'Kaynaklar, Başlık sırasıyla.' }),
    notes: z.array(exportedNote).meta({ description: 'Notlar, kaynak kaynak ve her kaynakta Konum sırasıyla.' }),
    tags: z.array(exportedTag).meta({ description: 'Etiketler, ad sırasıyla.' }),
    collections: z.array(exportedCollection).meta({ description: 'Dosyalar, ad sırasıyla.' }),
  })
  .meta({
    title: 'Homelibra kütüphane dışa aktarması',
    description:
      'Bir Homelibra kütüphanesinin tamamı. Kaynaklar, notlar, etiketler ve dosya tanımları; kapaklar ve Markdown dosyaları ZIP içinde ayrı dosyalardır.',
  });

export type LibraryExport = z.infer<typeof libraryExportSchema>;

/** The schema document that goes into the ZIP: JSON Schema (draft 2020-12) made from the definition above. */
export function libraryExportJsonSchema() {
  return z.toJSONSchema(libraryExportSchema, { target: 'draft-2020-12' });
}
