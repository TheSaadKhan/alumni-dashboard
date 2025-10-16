"use client"
import React, { useState } from 'react'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import { HiOutlineMenu, HiOutlineBell, HiOutlineX } from 'react-icons/hi'

type NavigationItem = {
  name: string
  href: string
  current?: boolean
}

type NavbarProps = {
  navigation: NavigationItem[]
  profileImageUrl?: string
  logoSrc?: string
  logoAlt?: string
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onSignOutClick?: () => void
  notificationCount?: number
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar({
  navigation,
  profileImageUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  logoSrc = 'https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500',
  logoAlt = 'Your Company',
  onProfileClick,
  onSettingsClick,
  onSignOutClick,
  notificationCount = 0,
}: NavbarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Replace this with your real search handler
    console.log('Search submitted:', searchTerm)
  }

  return (
    <Disclosure as="nav" className="relative w-full bg-white shadow-md">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <span className="sr-only">Open main menu</span>
              <HiOutlineMenu className="block h-6 w-6 group-data-open:hidden" />
              <HiOutlineX className="hidden h-6 w-6 group-data-open:block" />
            </DisclosureButton>
          </div>

          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <img alt={logoAlt} src={logoSrc} className="h-8 w-auto" />
          </div>

          {/* Navigation links and search */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start sm:ml-8">
            <div className="hidden sm:flex space-x-6">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current
                      ? 'border-b-2 border-indigo-600 text-indigo-700'
                      : 'text-gray-700 hover:border-b-2 hover:border-gray-300 hover:text-indigo-600',
                    'inline-flex items-center px-1 pt-1 text-sm font-semibold transition-colors duration-200',
                  )}
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* Search bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="ml-8 flex flex-1 max-w-md rounded-md border border-gray-300 bg-gray-50 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
            >
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <input
                id="search"
                name="search"
                type="search"
                placeholder="Search anything..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full rounded-md bg-transparent border-none py-2 px-4 text-gray-900 placeholder-gray-400 focus:outline-none sm:text-sm"
              />
            </form>
          </div>

          {/* Right side: notifications and profile */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-8 sm:pr-0">
            <button
              type="button"
              className="relative rounded-full p-1 text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="View notifications"
            >
              <HiOutlineBell className="h-6 w-6" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-4">
              <MenuButton className="relative flex rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                <img
                  alt="User profile"
                  src={profileImageUrl}
                  className="h-8 w-8 rounded-full border-2 border-gray-300"
                />
              </MenuButton>

              <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={onProfileClick}
                      className={classNames(
                        active ? 'bg-indigo-100' : '',
                        'block w-full px-4 py-2 text-left text-sm text-gray-700',
                      )}
                    >
                      Your profile
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={onSettingsClick}
                      className={classNames(
                        active ? 'bg-indigo-100' : '',
                        'block w-full px-4 py-2 text-left text-sm text-gray-700',
                      )}
                    >
                      Settings
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={onSignOutClick}
                      className={classNames(
                        active ? 'bg-indigo-100' : '',
                        'block w-full px-4 py-2 text-left text-sm text-gray-700',
                      )}
                    >
                      Sign out
                    </button>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <DisclosurePanel className="sm:hidden bg-white border-t border-gray-200">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={classNames(
                item.current
                  ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700'
                  : 'text-gray-700 hover:bg-indigo-50 hover:border-l-4 hover:border-indigo-600 hover:text-indigo-700',
                'block rounded-none border-l-4 border-transparent px-3 py-2 text-base font-semibold',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
