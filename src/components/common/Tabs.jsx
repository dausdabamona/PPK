import { useState } from 'react'
import { Tab } from '@headlessui/react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function Tabs({ tabs, defaultIndex = 0, onChange }) {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List className="flex space-x-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <Tab
            key={tab.key || tab.label}
            disabled={tab.disabled}
            className={({ selected }) =>
              classNames(
                'px-4 py-2.5 text-sm font-medium leading-5 transition-colors',
                'focus:outline-none',
                selected
                  ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )
            }
          >
            <div className="flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                  {tab.count}
                </span>
              )}
            </div>
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {tabs.map((tab) => (
          <Tab.Panel key={tab.key || tab.label}>{tab.content}</Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  )
}

// Simple tabs without Headless UI
export function SimpleTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <nav className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.key || tab.label}
            onClick={() => onChange?.(tab.key || tab.label)}
            disabled={tab.disabled}
            className={classNames(
              'px-4 py-2.5 text-sm font-medium leading-5 transition-colors',
              'focus:outline-none',
              activeTab === (tab.key || tab.label)
                ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default Tabs
