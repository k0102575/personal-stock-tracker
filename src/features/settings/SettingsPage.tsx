import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, useRef, useState } from "react";
import { DatabaseZap, Download, Lock, LogOut, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../auth/AuthProvider";
import { api, getErrorMessage } from "../../lib/api";
import { clearOfflineCache } from "../../lib/offlineCache";
import { formatDate } from "../../lib/inventory";
import type { ImportItemsResult } from "../../shared/types";

export function SettingsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportItemsResult | null>(null);

  const exportMutation = useMutation({
    mutationFn: api.exportItems
  });
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const csv = await file.text();
      return api.importItems(csv);
    },
    onSuccess: async (result) => {
      setImportResult(result);
      setSelectedImportFile(null);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ]);
    }
  });

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImportResult(null);
    setSelectedImportFile(file);
  }

  function handleImport() {
    if (!selectedImportFile) {
      return;
    }

    importMutation.mutate(selectedImportFile);
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

        <Card>
          <CardHeader className="flex-row items-start gap-2.5 sm:gap-3">
            <Download className="mt-1 size-5 text-primary" />
            <div className="space-y-1.5 sm:space-y-2">
              <p className="eyebrow">복구</p>
              <CardTitle>CSV 가져오기</CardTitle>
              <CardDescription>
                앱에서 내보낸 CSV 파일을 다시 불러와 복구할 수 있어요. 같은 항목 ID가
                있으면 새로 추가하지 않고 내용을 갱신합니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <input
              ref={importInputRef}
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFileChange}
              type="file"
            />
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Button
                className="w-full sm:w-auto"
                onClick={() => importInputRef.current?.click()}
                type="button"
                variant="secondary"
              >
                CSV 파일 선택
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={!selectedImportFile || importMutation.isPending}
                onClick={handleImport}
                type="button"
              >
                {importMutation.isPending ? "가져오는 중..." : "가져오기 실행"}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedImportFile
                ? `선택된 파일: ${selectedImportFile.name}`
                : "선택된 파일이 없습니다."}
            </p>

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
