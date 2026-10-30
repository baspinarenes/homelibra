import { LegalDocument } from '@/components/legal-document';
import { privacyNotice } from '@/lib/legal';

export default function PrivacyNoticeScreen() {
  return <LegalDocument sections={privacyNotice} />;
}
