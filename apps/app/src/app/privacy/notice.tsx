import { useTranslation } from 'react-i18next';

import { LegalDocument } from '@/features/privacy/legal-document';
import { privacyNotice } from '@/features/privacy/legal';

export default function PrivacyNoticeScreen() {
  const { t } = useTranslation();
  return <LegalDocument title={t('privacy.notice')} sections={privacyNotice} />;
}
