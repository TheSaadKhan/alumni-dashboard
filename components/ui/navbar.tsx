"use client";

import React, { useState, Fragment } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu as MenuH,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { HiOutlineBell } from "react-icons/hi";
import { Search, X, Menu } from "lucide-react";

type NavigationItem = {
  name: string;
  href: string;
  current?: boolean;
};

type NavbarProps = {
  navigation: NavigationItem[];
  profileImageUrl?: string;
  logoSrc?: string;
  logoAlt?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onSignOutClick?: () => void;
  notificationCount?: number;
};

const cn = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");

export default function Navbar({
  navigation,
  profileImageUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  logoSrc = "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500",
  logoAlt = "Your Company",
  onProfileClick,
  onSettingsClick,
  onSignOutClick,
  notificationCount = 0,
}: NavbarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Search submitted:", searchTerm);
  };

  const clearSearch = () => setSearchTerm("");

  return (
    <Disclosure
      as="nav"
      className="sticky top-0 z-50 w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow transition"
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <DisclosureButton
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Toggle menu"
                >
                  {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </DisclosureButton>
              </div>

              {/* Logo */}
              <div className="flex-shrink-0">
                <a href="/" aria-label="Home">
                  <img className="h-8 w-auto" src={logoSrc} alt={logoAlt} />
                </a>
              </div>

              {/* Desktop nav and search */}
              <div className="hidden sm:ml-6 sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div className="flex space-x-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      aria-current={item.current ? "page" : undefined}
                      className={cn(
                        item.current
                          ? "border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400",
                        "inline-flex items-center px-1 pt-1 text-sm font-semibold transition-colors"
                      )}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>

                {/* Search (desktop only) */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="ml-6 flex max-w-md flex-1 items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500"
                  role="search"
                >
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="search"
                    name="search"
                    type="search"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="ml-2 block w-full border-none bg-transparent py-2 px-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </form>
              </div>

              {/* Right side: notifications and profile */}
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <button
                  type="button"
                  className="relative rounded-full p-1 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Notifications"
                >
                  <HiOutlineBell className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {/* Profile */}
                <MenuH as="div" className="relative">
                  <MenuButton className="flex rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full border-2 border-gray-300 dark:border-gray-700"
                      src={profileImageUrl}
                      alt="Profile"
                    />
                  </MenuButton>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={onProfileClick}
                            className={cn(
                              active && "bg-indigo-100 dark:bg-indigo-700/30",
                              "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                            )}
                          >
                            Your Profile
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={onSettingsClick}
                            className={cn(
                              active && "bg-indigo-100 dark:bg-indigo-700/30",
                              "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                            )}
                          >
                            Settings
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={onSignOutClick}
                            className={cn(
                              active && "bg-indigo-100 dark:bg-indigo-700/30",
                              "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                            )}
                          >
                            Sign out
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Transition>
                </MenuH>
              </div>
            </div>
          </div>

          {/* Mobile menu panel */}
          <DisclosurePanel className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  item.current
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300",
                  "block pl-3 pr-4 py-2 text-base font-medium transition"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.name}
              </a>
            ))}

            {/* Optional: Mobile search bar */}
            <form onSubmit={handleSearchSubmit} className="mt-4">
              <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="search"
                  name="mobile-search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="ml-2 flex-1 bg-transparent py-2 px-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
