"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { NAV_ITEMS } from "@/lib/permissions/config";
import { canSeeNavItem } from "@/lib/permissions/utils";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  GroupIcon,
  FolderIcon,
  UserIcon,
  TaskIcon,
  LockIcon,
} from "../icons/index";

const iconMap = {
  grid: <GridIcon />,
  group: <GroupIcon />,
  user: <UserIcon />,
  folder: <FolderIcon />,
  task: <TaskIcon />,
  lock: <LockIcon />,
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { session } = useAuth();

  const accountType = session?.accountType ?? null;
  const permissions = session?.permissions ?? [];

  const mainNav = NAV_ITEMS.filter(
    (item) =>
      item.section !== "security" &&
      canSeeNavItem(item, accountType, permissions)
  );

  const securityNav = NAV_ITEMS.filter(
    (item) =>
      item.section === "security" &&
      canSeeNavItem(item, accountType, permissions)
  );

  const homeHref =
    accountType === "student" ? "/dashboard/my-grades" : "/dashboard";

  const renderMenuItems = (items: typeof NAV_ITEMS) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => (
        <li key={nav.path}>
          {nav.path && (
            <Link
              href={nav.path}
              className={`menu-item group ${
                isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
              }`}
            >
              <span
                className={`${
                  isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {iconMap[nav.iconKey]}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    setOpenSubmenu(null);
  }, [pathname]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 h-screen transition-all duration-300 ease-in-out z-50 border-r
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      style={{
        backgroundColor: "var(--theme-background)",
        borderColor: "var(--theme-border)",
        color: "var(--theme-text-primary)",
      }}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href={homeHref}>
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {mainNav.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
                </h2>
                {renderMenuItems(mainNav)}
              </div>
            )}

            {securityNav.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Security"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(securityNav)}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
