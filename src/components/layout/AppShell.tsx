import { useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar'
import { Map, LineChart, Database, Plus, PanelLeftClose, PanelLeft, Target, ListTree } from 'lucide-react'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import ThemeToggle from '#/components/ThemeToggle'
import { useDashboardStore } from '#/stores/dashboardStore'
import { useMappingStore } from '#/stores/mappingStore'
import { Button } from '#/components/ui/button'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const dashboards = useDashboardStore((s) => s.dashboards)
  const mappings = useMappingStore((s) => s.mappings)

  const isMappingRoot = pathname === '/mappings' || pathname === '/mappings/'
  const isMappingAdd = pathname === '/mappings/add'
  const isMappingView = /^\/mappings\/[^/]+$/.test(pathname) && !isMappingAdd
  const isBaselinePage = pathname === '/baseline-mapping'

  const isDashRoot = pathname === '/dashboards' || pathname === '/dashboards/'
  const isDashAdd = pathname === '/dashboards/add'
  const isDashView = /^\/dashboards\/[^/]+$/.test(pathname) && !isDashAdd
  const isDashManageOrEdit =
    /\/dashboards\/[^/]+\/(manage|edit)$/.test(pathname)
  const isDataRoot = pathname === '/data-management'
  const isDataImport = pathname === '/data-management/import'
  const isOutputsRoot = pathname.startsWith('/outputs-and-indicators')
  const isOutputsPage = pathname === '/outputs-and-indicators/outputs'
  const isIndicatorsPage = pathname === '/outputs-and-indicators/indicators'
  const isLanding = pathname === '/' || pathname === ''

  if (isLanding) {
    return <div className="min-h-screen w-full">{children}</div>
  }

  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full bg-[var(--bg-base)] text-[var(--sea-ink)]">
      <Sidebar
        collapsed={collapsed}
        width="260px"
        collapsedWidth="72px"
        backgroundColor="var(--surface-strong)"
        breakPoint="md"
        className="border-r border-[var(--line)] !static"
        rootStyles={{
          borderRight: '1px solid var(--line)',
        }}
      >
        <div className="flex h-14 items-center justify-center border-b border-[var(--line)] px-2">
          <DimesBiLogo
            size={collapsed ? 'xs' : 'sm'}
            variant={collapsed ? 'icon' : 'lockup'}
          />
        </div>
        <Menu
          menuItemStyles={{
            subMenuContent: {
              backgroundColor: 'var(--sidebar-submenu-bg)',
              color: 'var(--sea-ink)',
            },
            button: ({ active, level }) => ({
              backgroundColor: active ? 'rgba(79, 184, 178, 0.22)' : 'transparent',
              color: active ? 'var(--lagoon-deep)' : 'var(--sea-ink)',
              fontWeight: active ? 600 : 500,
              borderRadius: '8px',
              margin: level === 0 ? '2px 8px' : '2px 8px 2px 12px',
              '&:hover': {
                backgroundColor: 'rgba(79, 184, 178, 0.14)',
                color: 'var(--sea-ink)',
              },
            }),
            label: {
              color: 'inherit',
            },
            icon: {
              color: 'var(--sea-ink-soft)',
            },
            SubMenuExpandIcon: {
              color: 'var(--sea-ink-soft)',
            },
          }}
        >
          <SubMenu
            label="Mapping"
            icon={<Map size={18} />}
            defaultOpen={
              isMappingRoot || isMappingAdd || isMappingView || isBaselinePage
            }
          >
            <MenuItem
              active={isBaselinePage}
              onClick={() => navigate({ to: '/baseline-mapping' })}
            >
              Baseline map
            </MenuItem>
            <MenuItem
              active={isMappingRoot}
              onClick={() => navigate({ to: '/mappings' })}
            >
              All mappings
            </MenuItem>
            <MenuItem
              icon={<Plus size={16} />}
              active={isMappingAdd}
              onClick={() => navigate({ to: '/mappings/add' })}
            >
              Add mapping
            </MenuItem>
            {mappings.map((m) => (
              <MenuItem
                key={m.id}
                active={pathname === `/mappings/${m.id}`}
                onClick={() =>
                  navigate({ to: '/mappings/$mappingId', params: { mappingId: m.id } })
                }
              >
                {m.name}
              </MenuItem>
            ))}
            {mappings.length === 0 && !collapsed && (
              <div className="px-4 py-2 text-xs text-[var(--sea-ink-soft)]">
                No saved mappings yet — use Add mapping
              </div>
            )}
          </SubMenu>
          <SubMenu
            label="Indicator visualization"
            icon={<LineChart size={18} />}
            defaultOpen={isDashRoot || isDashAdd || isDashView || isDashManageOrEdit}
          >
            <MenuItem
              active={isDashRoot}
              onClick={() => navigate({ to: '/dashboards' })}
            >
              All dashboards
            </MenuItem>
            <MenuItem
              icon={<Plus size={16} />}
              active={isDashAdd}
              onClick={() => navigate({ to: '/dashboards/add' })}
            >
              Add dashboard
            </MenuItem>
            {dashboards.map((d) => (
              <MenuItem
                key={d.id}
                active={pathname === `/dashboards/${d.id}`}
                onClick={() => navigate({ to: '/dashboards/$dashboardId', params: { dashboardId: d.id } })}
              >
                {d.name}
              </MenuItem>
            ))}
            {dashboards.length === 0 && !collapsed && (
              <div className="px-4 py-2 text-xs text-[var(--sea-ink-soft)]">
                No dashboards yet — use Add dashboard
              </div>
            )}
          </SubMenu>
        
          <SubMenu
            label="Outputs and indicators"
            icon={<ListTree size={18} />}
            defaultOpen={isOutputsRoot}
          >
            <MenuItem
              icon={<Target size={16} />}
              active={isOutputsPage}
              onClick={() => navigate({ to: '/outputs-and-indicators/outputs' })}
            >
              Outputs
            </MenuItem>
            <MenuItem
              icon={<LineChart size={16} />}
              active={isIndicatorsPage}
              onClick={() => navigate({ to: '/outputs-and-indicators/indicators' })}
            >
              Indicators
            </MenuItem>
          </SubMenu>

          <SubMenu
            label="Data management"
            icon={<Database size={18} />}
            defaultOpen={isDataRoot || isDataImport}
          >
            <MenuItem
              active={isDataRoot}
              onClick={() => navigate({ to: '/data-management' })}
            >
              Query builder
            </MenuItem>
            <MenuItem
              active={isDataImport}
              onClick={() => navigate({ to: '/data-management/import' })}
            >
              Data import
            </MenuItem>
          </SubMenu>
        </Menu>
      </Sidebar>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </Button>
          <DimesBiLogo size="xs" className="shrink-0 md:hidden" />
          <div className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--sea-ink)]">
            DIMES-BI analytics workspace
          </div>
          <ThemeToggle />
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
