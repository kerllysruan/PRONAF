import { LoadingExperience } from "./loading/LoadingExperience";

export function SplashScreen({ onFinished }: { onFinished: () => void }) {
  return <LoadingExperience onComplete={onFinished} duration={16} />;
}
