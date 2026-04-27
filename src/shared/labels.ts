import type { ExpiryFilter, ItemCategory, ItemSort } from "./types";

export const APP_NAME = "생활 재고함";

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  skincare: "스킨케어",
  makeup: "메이크업",
  perfume: "향수",
  ointment: "연고",
  bodycare: "바디케어",
  haircare: "헤어케어",
  etc: "기타"
};

const SORT_LABELS: Record<ItemSort, string> = {
  updated_desc: "최근 수정순",
  expiry_asc: "우선 유통기한 순",
  name_asc: "이름순"
};

const EXPIRY_FILTER_LABELS: Record<ExpiryFilter | "all", string> = {
  all: "전체",
  soon: "임박",
  expired: "경과"
};

export function getCategoryLabel(category: ItemCategory): string {
  return CATEGORY_LABELS[category];
}

export function getSortLabel(sort: ItemSort): string {
  return SORT_LABELS[sort];
}

export function getExpiryFilterLabel(filter: ExpiryFilter | "all"): string {
  return EXPIRY_FILTER_LABELS[filter];
}
