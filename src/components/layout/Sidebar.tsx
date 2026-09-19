import {
  LayoutDashboard,
  BarChart3,
  Users,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  CheckCircle2,
  FileDown,
  FileText,
} from 'lucide-react';

export type DashboardView = 'dashboard' | 'chart' | 'table' | 'upload' | 'export';

export interface SidebarProps {
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasData: boolean;
  fileName: string | null;
  recordsCount: number;
  salespeopleCount: number;
  filesCount?: number;
  onReset: () => void;
  onDownloadTemplate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  hasData,
  fileName,
  recordsCount,
  salespeopleCount,
  filesCount = 0,
  onReset,
  onDownloadTemplate,
}) => {
  const navItems = [
    {
      id: 'dashboard' as DashboardView,
      label: 'Dashboard',
      subtitle: 'Executive KPIs & overview',
      icon: LayoutDashboard,
      badge: hasData ? `${salespeopleCount} Reps` : undefined,
    },
    {
      id: 'chart' as DashboardView,
      label: 'Sales Analytics',
      subtitle: 'Budget vs. actual chart',
      icon: BarChart3,
      badge: hasData ? 'Grouped' : undefined,
    },
    {
      id: 'table' as DashboardView,
      label: 'Salespeople Table',
      subtitle: 'Performance & targets',
      icon: Users,
      badge: hasData ? `${salespeopleCount}` : undefined,
    },
    {
      id: 'upload' as DashboardView,
      label: 'Data Import',
      subtitle: 'Excel upload & template',
      icon: FileSpreadsheet,
      badge: hasData ? `${filesCount || 1} File${(filesCount || 1) > 1 ? 's' : ''}` : 'Upload',
    },
    {
      id: 'export' as DashboardView,
      label: 'Export Data',
      subtitle: 'PDF & Word report export',
      icon: FileText,
      badge: hasData ? 'PDF / DOC' : undefined,
    },
  ];

  const handleNavClick = (view: DashboardView) => {
    onSelectView(view);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#1E0715] text-slate-100 border-r border-[#330D25] shadow-2xl transition-all duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-3.5 border-b border-[#330D25] bg-[#160410]/90 shrink-0">
          <div
            className="flex-1 flex items-center overflow-hidden cursor-pointer"
            onClick={() => handleNavClick('dashboard')}
          >
            {/* Official Bettergrow Holding BGH Logo */}
            {(!isCollapsed || isOpenMobile) ? (
              <div className="w-full h-11 px-3 py-1 rounded-xl bg-white flex items-center justify-center shadow-xs border border-white/20 transition-all hover:bg-slate-50">
                <img
                  src="/bgh-logo.svg"
                  alt="Bettergrow Holding"
                  className="h-8 w-auto max-w-full object-contain"
                />
              </div>
            ) : (
              /* Collapsed icon mode */
              <div
                className="w-11 h-11 mx-auto rounded-xl bg-white p-1.5 flex items-center justify-center shadow-xs shrink-0 border border-white/20"
                title="Bettergrow Holding Group"
              >
                <img
                  src="/bgh-logo.svg"
                  alt="Bettergrow Holding"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {isOpenMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-4 px-2.5 overflow-y-auto space-y-1.5">
          <div className="px-2 mb-2">
            {(!isCollapsed || isOpenMobile) && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200/50">
                Navigation
              </span>
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed && !isOpenMobile ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                  isActive
                    ? 'bg-[#631244] text-white font-semibold shadow-md shadow-[#631244]/40 border border-[#8C1B61]'
                    : 'text-slate-300 hover:text-white hover:bg-[#2B0C21]'
                } ${isCollapsed && !isOpenMobile ? 'justify-center px-2' : ''}`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#DE5829] bg-[#45092E]'
                      : 'text-slate-400 group-hover:text-white group-hover:bg-[#38112C]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {(!isCollapsed || isOpenMobile) && (
                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium tracking-wide">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                            isActive
                              ? 'bg-[#45092E] text-[#F7E4EE]'
                              : 'bg-[#330D25] text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? 'text-rose-100/80' : 'text-slate-400'
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dataset Status Banner / Actions in Sidebar Footer */}
        <div className="p-3 border-t border-[#330D25] bg-[#160410]/95 shrink-0 space-y-2.5">
          {(!isCollapsed || isOpenMobile) ? (
            <>
              {hasData ? (
                <div className="p-2.5 rounded-xl bg-[#260A1B] border border-[#3E122D] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#DE5829] shrink-0" />
                      <span className="font-semibold text-slate-200 truncate">
                        {fileName || 'Sales Workbook'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#631244]/50 text-[#F7E4EE] shrink-0">
                      {recordsCount} rows
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-[#3E122D]">
                    <button
                      type="button"
                      onClick={onReset}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium text-rose-300 hover:text-white hover:bg-rose-950/60 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Data
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#260A1B] border border-[#3E122D] text-xs text-center space-y-2">
                  <p className="text-[11px] text-slate-300">
                    No workbook loaded yet
                  </p>
                  <button
                    type="button"
                    onClick={onDownloadTemplate}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-white bg-[#631244] hover:bg-[#4E0C34] transition-colors shadow-xs cursor-pointer border border-[#8C1B61]"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#DE5829]" />
                    Download Template
                  </button>
                </div>
              )}

              {/* Desktop Collapse Toggle */}
              <div className="hidden lg:flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  DIP 2, Dubai UAE
                </span>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#2B0C21] transition-colors cursor-pointer"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Icon-only mode footer when collapsed on desktop */
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#2B0C21] transition-colors cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
