import { LegalDocument } from '@/features/privacy/legal-document';
import { termsOfUse } from '@/features/privacy/legal';

export default function TermsOfUseScreen() {
  return <LegalDocument sections={termsOfUse} />;
}
