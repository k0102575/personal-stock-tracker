import { useMutation } from "@tanstack/react-query";
import { DatabaseZap, Download, Lock, LogOut, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../auth/AuthProvider";
import { api, getErrorMessage } from "../../lib/api";
import { clearOfflineCache } from "../../lib/offlineCache";
import { formatDate } from "../../lib/inventory";

export function SettingsPage() {
  const auth = useAuth();
  const exportMutation = useMutation({
    mutationFn: api.exportItems
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-surface-container-lowest">
        <CardHeader className="flex-row items-start gap-2.5 sm:gap-3">
          <Lock className="mt-1 size-5 text-primary" />
          <div className="space-y-1.5 sm:space-y-2">
            <p className="eyebrow">세션</p>
            <CardTitle>관리자 접근</CardTitle>
            <CardDescription>
              현재 세션은 보안 쿠키 기반으로 유지되며, 만료 예정 시각은{" "}
              {auth.session ? formatDate(auth.session.expiresAt) : "확인 불가"}입니다.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full sm:w-auto" onClick={() => auth.logout()} type="button" variant="secondary">
            <LogOut className="size-4" />
            {auth.logoutPending ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start gap-2.5 sm:gap-3">
            <Wifi className="mt-1 size-5 text-primary" />
            <div className="space-y-1.5 sm:space-y-2">
              <p className="eyebrow">오프라인 및 설치</p>
              <CardTitle>PWA 관리</CardTitle>
              <CardDescription>
                브라우저 메뉴에서 앱으로 설치할 수 있어요. 최근에 열어본 핵심 화면과
                품목 정보는 오프라인에서도 다시 확인할 수 있습니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full sm:w-auto" onClick={() => clearOfflineCache()} type="button" variant="ghost">
              <DatabaseZap className="size-4" />
              저장된 오프라인 데이터 비우기
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest">
          <CardHeader className="flex-row items-start gap-2.5 sm:gap-3">
            <Download className="mt-1 size-5 text-primary" />
            <div className="space-y-1.5 sm:space-y-2">
              <p className="eyebrow">백업</p>
              <CardTitle>보관함 내보내기</CardTitle>
              <CardDescription>
                CSV 파일로 내려받아 백업하거나, 직접 분석하거나, 이후 가져오기에 활용할
                수 있습니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Button
              className="w-full sm:w-auto"
              disabled={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
              type="button"
            >
              <Download className="size-4" />
              {exportMutation.isPending ? "내보내기 준비 중..." : "CSV 다운로드"}
            </Button>
            {exportMutation.isError && (
              <div className="inline-alert" role="alert">
                {getErrorMessage(exportMutation.error)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
