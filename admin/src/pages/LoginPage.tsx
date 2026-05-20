import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const { loginWithGithub, completeGithubLogin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string>("");
  const processedCodeRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const callbackState = params.get("state") || "";

    if (!code || isMounted.current) return;

    isMounted.current = true;
    setIsProcessing(true);

    window.history.replaceState({}, document.title, "/login");

    const handleOAuth = async () => {
      try {
        await completeGithubLogin(code, callbackState);
      } catch (err: any) {
        setError(err.message || "Đăng nhập GitHub thất bại");
        isMounted.current = false; 
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuth();
  }, [completeGithubLogin]);

  const handleLogin = () => {
    setError("");
    loginWithGithub();
  };

  if (authLoading && !isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showButtonLoading = authLoading || isProcessing;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
              <img src="/logo.png" alt="" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">DaNang Recycle Hub Panel</h1>
            <p className="text-muted-foreground text-sm">Hệ thống quản trị tái chế rác thông minh tại Đà Nẵng</p>
          </div>

          <Button
            disabled={showButtonLoading}
            onClick={handleLogin}
            className="w-full h-12 text-base gap-3 bg-gray-900 hover:bg-gray-800 text-white"
          >
            {showButtonLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Đăng nhập bằng GitHub
              </>
            )}
          </Button>

          {error && <p className="text-center text-sm text-red-600 animate-pulse">{error}</p>}

          <p className="text-center text-xs text-muted-foreground">
            Chỉ dành cho quản trị viên hệ thống
          </p>
        </div>
      </div>
    </div>
  );
}
