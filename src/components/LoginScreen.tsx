import { signInWithGoogle } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onLoginSuccess();
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-blue-600">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Sports-Finder</h1>
        <p className="text-xl text-blue-100 mb-8">
          Find local pick-up sports games in your area
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="bg-white hover:bg-gray-100 text-blue-600 font-semibold py-3 px-8 rounded-lg shadow-lg transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};
