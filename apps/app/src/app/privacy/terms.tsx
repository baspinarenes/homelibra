import { LegalDocument } from '@/components/legal-document';
import { termsOfUse } from '@/lib/legal';

export default function TermsOfUseScreen() {
  return <LegalDocument sections={termsOfUse} />;
}
