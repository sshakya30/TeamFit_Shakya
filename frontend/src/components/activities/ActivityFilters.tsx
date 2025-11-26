/**
 * Activity filters component with dropdowns for category, duration, complexity
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  CATEGORY_OPTIONS,
  DURATION_OPTIONS,
  COMPLEXITY_OPTIONS,
  type FilterState,
} from '@/types';

interface ActivityFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  resultCount: number;
}

export function ActivityFilters({
  filters,
  onFilterChange,
  onClearFilters,
  resultCount,
}: ActivityFiltersProps) {
  const hasActiveFilters = filters.category || filters.duration || filters.complexity;

  const handleCategoryChange = (value: string) => {
    onFilterChange({
      ...filters,
      category: value === 'all' ? null : value,
    });
  };

  const handleDurationChange = (value: string) => {
    onFilterChange({
      ...filters,
      duration: value === 'all' ? null : parseInt(value, 10),
    });
  };

  const handleComplexityChange = (value: string) => {
    onFilterChange({
      ...filters,
      complexity: value === 'all' ? null : value,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-3">
        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Duration Filter */}
        <Select
          value={filters.duration?.toString() || 'all'}
          onValueChange={handleDurationChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Durations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Durations</SelectItem>
            {DURATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Complexity Filter */}
        <Select
          value={filters.complexity || 'all'}
          onValueChange={handleComplexityChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {COMPLEXITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground whitespace-nowrap">
        {resultCount} {resultCount === 1 ? 'activity' : 'activities'} found
      </p>
    </div>
  );
}
