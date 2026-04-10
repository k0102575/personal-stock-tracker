// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ItemFormPage } from "./ItemFormPage";
import type { InventoryItem } from "../../shared/types";

const {
  navigateMock,
  createItemMock,
  updateItemMock,
  getItemMock
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createItemMock: vi.fn(),
  updateItemMock: vi.fn(),
  getItemMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock("../../lib/api", () => ({
  api: {
    createItem: createItemMock,
    updateItem: updateItemMock,
    getItem: getItemMock
  },
  getErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : "문제가 발생했습니다."
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      },
      mutations: {
        retry: false
      }
    }
  });
}

function createCreatedItem(): InventoryItem {
  return {
    id: "created-item",
    category: "skincare",
    brand: "브랜드",
    name: "테스트 품목",
    volumeOrUnit: "",
    currentQuantity: 1,
    minimumQuantity: 1,
    purchaseSource: "",
    purchaseDate: null,
    openedDate: null,
    expiryDate: null,
    status: "active",
    memo: "",
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-10T00:00:00.000Z"
  };
}

function renderPage() {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/items/new"]}>
        <Routes>
          <Route path="/items/new" element={<ItemFormPage mode="create" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function getCurrentQuantityInput() {
  const input = screen.getAllByRole("spinbutton")[0];
  if (!input) {
    throw new Error("현재 수량 입력 필드를 찾을 수 없습니다.");
  }
  return input;
}

describe("ItemFormPage", () => {
  beforeEach(() => {
    createItemMock.mockReset();
    updateItemMock.mockReset();
    getItemMock.mockReset();
    navigateMock.mockReset();
    createItemMock.mockResolvedValue(createCreatedItem());
  });

  it("prevents submitting when a quantity field is cleared", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText("시카 크림, 핸드크림, 향수처럼 입력해보세요"),
      "핸드크림"
    );

    const currentQuantityInput = getCurrentQuantityInput();
    await user.clear(currentQuantityInput);
    fireEvent.submit(screen.getByRole("button", { name: "항목 저장" }).closest("form")!);

    expect(await screen.findByText("현재 수량과 기준 수량을 모두 입력해주세요.")).toBeTruthy();
    expect(createItemMock).not.toHaveBeenCalled();
  });

  it("submits zero quantity intentionally as used_up", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText("시카 크림, 핸드크림, 향수처럼 입력해보세요"),
      "핸드크림"
    );
    const currentQuantityInput = getCurrentQuantityInput();
    await user.clear(currentQuantityInput);
    await user.type(currentQuantityInput, "0");

    fireEvent.submit(screen.getByRole("button", { name: "항목 저장" }).closest("form")!);

    await waitFor(() =>
      expect(createItemMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "핸드크림",
          currentQuantity: 0,
          status: "used_up"
        })
      )
    );
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/items/created-item", { replace: true })
    );
  });
});
