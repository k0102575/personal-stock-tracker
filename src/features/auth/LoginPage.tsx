import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "../../lib/api";
import { APP_NAME } from "../../shared/labels";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) {
      setFormError("관리자 비밀번호를 입력해주세요.");
      return;
    }

    setFormError(null);

    try {
      await auth.login(password);
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname;
      navigate(destination || "/", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full items-center gap-6 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-low px-4 py-2 shadow-[var(--shadow-ambient)]">
              <Sparkles className="size-4 text-primary" />
              <span className="text-[13px] font-medium text-muted-foreground">{APP_NAME}</span>
            </div>
            <div className="space-y-4 sm:space-y-5">
              <p className="eyebrow">사기 전에 먼저 확인하는 조용한 루틴</p>
              <h1 className="max-w-2xl text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.06em] text-foreground sm:text-[3.45rem]">
                사기 전에,
                <br />
                지금 있는 재고부터 확인하세요.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                생활용품과 소모품 재고를 한곳에 차분하게 모아두고, 재구매가 필요한
                순간과 우선 유통기한 흐름까지 모바일에서 자연스럽게 이어서 확인할 수
                있습니다.
              </p>
            </div>
          </section>

          <Card className="overflow-hidden rounded-[2rem] bg-surface-container-lowest p-0">
            <CardContent className="space-y-6 p-5 sm:space-y-8 sm:p-10">
              <div className="space-y-3 text-center sm:space-y-4 sm:text-left">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-container text-primary sm:mx-0">
                  <LockKeyhole className="size-6" />
                </div>
                <div className="space-y-2">
                  <p className="eyebrow">관리자 전용 입장</p>
                  <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] sm:text-[2.15rem]">보관함 열기</h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    기존 문구와 흐름은 유지하면서, 더 편안한 편집 흐름으로 정리했습니다.
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="field-stack block">
                  <span className="field-label">관리자 비밀번호</span>
                  <Input
                    autoComplete="current-password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="비밀번호를 입력하세요"
                  />
                </label>

                {(formError || auth.loginError) && (
                  <div className="inline-alert" role="alert">
                    {formError || auth.loginError}
                  </div>
                )}

                <Button className="w-full" disabled={auth.loginPending}>
                  {auth.loginPending ? "잠금 해제 중..." : "보관함 열기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
