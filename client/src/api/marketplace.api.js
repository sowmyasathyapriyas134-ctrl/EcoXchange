import { marketplaceApi } from "@/api/member.api";

export const getMarketplaceCategories = () => marketplaceApi.getCategories?.() ?? Promise.resolve({ data: [] });
export { marketplaceApi };
