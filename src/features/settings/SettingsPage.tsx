import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardPaste, DatabaseZap, Download, Lock, LogOut, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../auth/AuthProvider";
import { api, getErrorMessage } from "../../lib/api";
import { clearOfflineCache } from "../../lib/offlineCache";
import { formatDate } from "../../lib/inventory";
import type { ImportItemsResult } from "../../shared/types";

export function SettingsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [sheetText, setSheetText] = useState("");
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportItemsResult | null>(null);

  const exportMutation = useMutation({
    mutationFn: api.exportItems,
    onSuccess: (mode) => {
      setExportFeedback(
        mode === "copied"
          ? "스프레드시트용 데이터가 클립보드에 복사되었습니다."
          : "클립보드 권한이 없어 TSV 파일로 저장했습니다. Google 스프레드시트에서 가져오기로 열어주세요."
      );
    }
  });
  const importMutation = useMutation({
    mutationFn: api.importItems,
    onSuccess: async (result) => {
      setImportResult(result);
      setSheetText("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ]);
    }
  });

  function handleImport() {
    if (!sheetText.trim()) {
      return;
    }

    importMutation.mutate(sheetText);
  }

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

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
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
              <CardTitle>Google 스프레드시트로 보내기</CardTitle>
              <CardDescription>
                현재 보관함 데이터를 Google 스프레드시트에 바로 붙여넣을 수 있는 탭 구분
                텍스트로 복사합니다.
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
              {exportMutation.isPending ? "복사 준비 중..." : "스프레드시트용 복사"}
            </Button>
            {exportFeedback && !exportMutation.isError && (
              <div className="inline-alert" role="status">
                {exportFeedback}
              </div>
            )}
            {exportMutation.isError && (
              <div className="inline-alert" role="alert">
                {getErrorMessage(exportMutation.error)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start gap-2.5 sm:gap-3">
            <ClipboardPaste className="mt-1 size-5 text-primary" />
            <div className="space-y-1.5 sm:space-y-2">
              <p className="eyebrow">복구</p>
              <CardTitle>Google 스프레드시트에서 가져오기</CardTitle>
              <CardDescription>
                앱에서 복사한 헤더를 기준으로 Google 스프레드시트에 붙여넣고, 다시 전체
                범위를 복사해서 여기에 넣으면 복구할 수 있어요. 같은 항목 ID가 있으면 새로
                추가하지 않고 내용을 갱신합니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Textarea
              rows={8}
              value={sheetText}
              onChange={(event) => {
                setImportResult(null);
                setSheetText(event.target.value);
              }}
              placeholder={"id\tcategory\tbrand\tname\tvolume_or_unit\tcurrent_quantity\tminimum_quantity\tpurchase_source\tpurchase_date\texpiry_date\tstatus\tmemo\tcreated_at\tupdated_at"}
            />
            <p className="text-sm text-muted-foreground">
              Google 스프레드시트에서 헤더 포함 전체 범위를 복사해 그대로 붙여넣어주세요.
            </p>
            <Button
              className="w-full sm:w-auto"
              disabled={!sheetText.trim() || importMutation.isPending}
              onClick={handleImport}
              type="button"
            >
              {importMutation.isPending ? "가져오는 중..." : "가져오기 실행"}
            </Button>

            {importResult && (
              <div className="inline-alert" role="status">
                총 {importResult.totalRows}개 행을 읽어 {importResult.createdCount}개 추가,
                {importResult.updatedCount}개 업데이트, {importResult.skippedCount}개 건너뜀
                처리했습니다.
              </div>
            )}

            {importMutation.isError && (
              <div className="inline-alert" role="alert">
                {getErrorMessage(importMutation.error)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
