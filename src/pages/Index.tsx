import { FooterAiralo } from '@/components/landing/FooterAiralo';

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center flex-1 flex items-center justify-center">
        <div>
          <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
          <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        </div>
      </div>
      <FooterAiralo />
    </div>
  );
};

export default Index;
