import { useSearchParams } from 'react-router-dom';
import { ProfileLayout, ProfileSection } from '@/components/profile/ProfileLayout';

const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') as ProfileSection | null;
  
  return <ProfileLayout initialSection={section || 'account'} />;
};

export default ProfilePage;
