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
  getItemMock,
  getItemsMock
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createItemMock: vi.fn(),
  updateItemMock: vi.fn(),
  getItemMock: vi.fn(),
  getItemsMock: vi.fn()
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
    getItem: getItemMock,
    getItems: getItemsMock
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
    expiryDate: null,
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

function renderEditPage() {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/items/existing/edit"]}>
        <Routes>
          <Route path="/items/:id/edit" element={<ItemFormPage mode="edit" />} />
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
    getItemsMock.mockReset();
    navigateMock.mockReset();
    createItemMock.mockResolvedValue(createCreatedItem());
    getItemsMock.mockResolvedValue([]);
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

  it("shows the saved category in edit mode", async () => {
    getItemMock.mockResolvedValue({
      ...createCreatedItem(),
      id: "existing",
      category: "makeup",
      name: "쿠션"
    });

    renderEditPage();

    expect(await screen.findByDisplayValue("쿠션")).toBeTruthy();
    expect(screen.getByRole("combobox").textContent).toContain("메이크업");
  });

  it("fills brand and category from a name autocomplete suggestion", async () => {
    const user = userEvent.setup();
    getItemsMock.mockResolvedValue([
      {
        ...createCreatedItem(),
        id: "suggestion",
        category: "bodycare",
        brand: "논픽션",
        name: "핸드크림"
      }
    ]);

    renderPage();

    await user.type(
      screen.getByPlaceholderText("시카 크림, 핸드크림, 향수처럼 입력해보세요"),
      "핸드"
    );
    await user.click(await screen.findByRole("button", { name: /핸드크림/ }));

    expect(screen.getByDisplayValue("핸드크림")).toBeTruthy();
    expect(screen.getByDisplayValue("논픽션")).toBeTruthy();
    expect(screen.getByRole("combobox").textContent).toContain("바디케어");
  });

  it("submits zero quantity intentionally", async () => {
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
          currentQuantity: 0
        })
      )
    );
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/items/created-item", { replace: true })
    );
  });
});
