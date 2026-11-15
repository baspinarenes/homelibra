import { LegalDocument } from '@/features/privacy/legal-document';
import { privacyNotice } from '@/features/privacy/legal';

export default function PrivacyNoticeScreen() {
  return <LegalDocument sections={privacyNotice} />;
}
