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
    <div className="relative min-h-screen overflow-hidden bg-white px-4 py-0 sm:px-6">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center">
        <div className="grid w-full items-stretch gap-0 border border-outline-variant lg:grid-cols-[1.2fr_0.8fr]">
          <section className="flex flex-col justify-between gap-8 bg-[#111111] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="inline-flex items-center gap-3">
              <Sparkles className="size-4 text-white" />
              <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-white/72">{APP_NAME}</span>
            </div>
            <div className="space-y-4 sm:space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">Stock first. Buy later.</p>
              <h1 className="max-w-2xl font-serif text-[3.1rem] font-medium uppercase leading-[0.9] tracking-[-0.05em] sm:text-[4.8rem]">
                Check
                <br />
                what you
                <br />
                already own.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-[15px]">
                생활용품과 소모품 재고를 한곳에 모아두고, 재구매가 필요한 순간과 우선
                유통기한 흐름까지 빠르게 확인하세요.
              </p>
            </div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-white/52">Private admin access only</p>
          </section>

          <Card className="overflow-hidden rounded-none border-0 bg-white p-0">
            <CardContent className="space-y-6 p-5 sm:space-y-8 sm:p-10">
              <div className="space-y-3 text-center sm:space-y-4 sm:text-left">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-white sm:mx-0">
                  <LockKeyhole className="size-6" />
                </div>
                <div className="space-y-2">
                  <p className="eyebrow">관리자 전용 입장</p>
                  <h2 className="font-serif text-[2.2rem] font-medium uppercase tracking-[-0.05em] sm:text-[2.8rem]">로그인</h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    흑백 중심의 빠른 재고 관리 흐름으로 정리된 보관함에 들어갑니다.
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
