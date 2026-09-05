import React, { useState, useEffect } from 'react';
import { WorkItem } from '../../types';
import { 
  Search, 
  Calendar, 
  User, 
  ArrowUpDown, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { StatusBadge, ConfidenceBadge, PriorityBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { DensityMode } from '../../runtime/runtimeTypes';

interface WorkViewProps {
  workItems: WorkItem[];
  selectedItem: WorkItem | null;
  onSelectItem: (item: WorkItem) => void;
  density?: DensityMode;
  onToggleDensity?: () => void;
}

export const WorkView: React.FC<WorkViewProps> = ({
  workItems,
  selectedItem,
  onSelectItem,
  density = 'comfortable',
  onToggleDensity
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due' | 'confidence' | 'title'>('due');

  const filteredItems = workItems.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.owner.name.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'confidence') return b.confidence - a.confidence;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    // default: due date
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = filteredItems.findIndex(i => i.id === selectedItem?.id);
        if (currentIndex < filteredItems.length - 1) {
          onSelectItem(filteredItems[currentIndex + 1]);
        } else if (filteredItems.length > 0 && currentIndex === -1) {
          onSelectItem(filteredItems[0]);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredItems.findIndex(i => i.id === selectedItem?.id);
        if (currentIndex > 0) {
          onSelectItem(filteredItems[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedItem, onSelectItem]);

  const isComfortable = density === 'comfortable';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#090d16] text-slate-100 p-6 sm:p-8 space-y-5 max-w-6xl mx-auto w-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Work
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active deliverables synthesized from emails, documents, and system telemetry.
          </p>
        </div>

        {/* Right tools: Search, Sort, Density */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-56 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search work (J/K to move)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            onClick={onToggleDensity}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
            title="Toggle between comfortable and compact density"
          >
            {isComfortable ? 'Comfortable' : 'Compact'}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Sorter */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Work' },
            { id: 'needs_review', label: 'Needs Review' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'published', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none text-xs"
          >
            <option value="due">Due Date</option>
            <option value="confidence">Confidence</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Work Item List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No work items found"
          description="There are no items matching the selected filters. Try clearing your search query or selecting a different status tab."
          actionLabel="Clear filters"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className={isComfortable ? 'space-y-3' : 'space-y-1.5'}>
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg text-white'
                    : 'bg-slate-900/60 hover:bg-slate-850/80 border-slate-800/80 text-slate-300'
                } ${
                  isComfortable ? 'p-4' : 'p-3'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-medium">
                        {item.id}
                      </span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      <ConfidenceBadge confidence={item.confidence} />
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">
                      {item.title}
                    </h3>

                    {isComfortable && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-300">{item.owner.name.split(' ')[0]}</span>
                    </div>

                    {item.dueDate && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
