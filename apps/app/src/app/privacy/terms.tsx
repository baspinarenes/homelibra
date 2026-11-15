import { useTranslation } from 'react-i18next';

import { LegalDocument } from '@/features/privacy/legal-document';
import { termsOfUse } from '@/features/privacy/legal';

export default function TermsOfUseScreen() {
  const { t } = useTranslation();
  return <LegalDocument title={t('privacy.terms')} sections={termsOfUse} />;
}
