import { createContext } from "react";

/** @typedef {"default" | "admin"} DashboardVariant */

export const DashboardNavContext = createContext({
  navItems: /** @type {import('@/config/nav/nav.trial.js').NavItem[]} */ ([]),
  variant: /** @type {DashboardVariant} */ ("default"),
});
