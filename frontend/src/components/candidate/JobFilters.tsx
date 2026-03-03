import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  X,
  Filter,
  Sparkles,
  Building2,
  Clock,
} from "lucide-react";

export interface JobFilterValues {
  search: string;
  location: string;
  job_type: string;
  experience_level: string;
  workplace_type: string;
  salary_min: number;
  salary_max: number;
}

interface JobFiltersProps {
  filters: JobFilterValues;
  onFilterChange: (filters: JobFilterValues) => void;
  onSearch: () => void;
  totalJobs: number;
  className?: string;
}

const jobTypes = [
  { value: "full-time", label: "Full Time", icon: Clock },
  { value: "part-time", label: "Part Time", icon: Clock },
  { value: "contract", label: "Contract", icon: Briefcase },
  { value: "internship", label: "Internship", icon: Briefcase },
];

const experienceLevels = [
  { value: "entry", label: "Entry (0-2 yrs)" },
  { value: "mid", label: "Mid (3-5 yrs)" },
  { value: "senior", label: "Senior (5-8 yrs)" },
  { value: "lead", label: "Lead (8-12 yrs)" },
  { value: "executive", label: "Executive (12+ yrs)" },
];

const workplaceTypes = [
  { value: "on-site", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export default function JobFilters({
  filters,
  onFilterChange,
  onSearch,
  totalJobs,
  className,
}: JobFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    // Count active filters
    const active: string[] = [];
    if (filters.search) active.push("search");
    if (filters.location) active.push("location");
    if (filters.job_type) active.push("job_type");
    if (filters.experience_level) active.push("experience");
    if (filters.workplace_type) active.push("workplace");
    if (filters.salary_min > 0 || filters.salary_max < 100) active.push("salary");
    setActiveFilters(active);
  }, [filters]);

  const clearFilter = (key: keyof JobFilterValues) => {
    const newFilters = { ...filters };
    if (key === "search") newFilters.search = "";
    if (key === "location") newFilters.location = "";
    if (key === "job_type") newFilters.job_type = "";
    if (key === "experience_level") newFilters.experience_level = "";
    if (key === "workplace_type") newFilters.workplace_type = "";
    if (key === "salary_min") newFilters.salary_min = 0;
    if (key === "salary_max") newFilters.salary_max = 100;
    onFilterChange(newFilters);
  };

  const clearAll = () => {
    onFilterChange({
      search: "",
      location: "",
      job_type: "",
      experience_level: "",
      workplace_type: "",
      salary_min: 0,
      salary_max: 100,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with expand toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {activeFilters.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              Clear all
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <X className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Active filter badges */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            {filters.search && (
              <Badge variant="outline" className="gap-1 pr-1 text-xs">
                Search: {filters.search}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => clearFilter("search")}
                />
              </Badge>
            )}
            {filters.location && (
              <Badge variant="outline" className="gap-1 pr-1 text-xs">
                <MapPin className="h-3 w-3" />
                {filters.location}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => clearFilter("location")}
                />
              </Badge>
            )}
            {filters.job_type && (
              <Badge variant="outline" className="gap-1 pr-1 text-xs">
                <Briefcase className="h-3 w-3" />
                {jobTypes.find(t => t.value === filters.job_type)?.label}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => clearFilter("job_type")}
                />
              </Badge>
            )}
            {filters.experience_level && (
              <Badge variant="outline" className="gap-1 pr-1 text-xs">
                <Sparkles className="h-3 w-3" />
                {experienceLevels.find(e => e.value === filters.experience_level)?.label}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => clearFilter("experience_level")}
                />
              </Badge>
            )}
            {filters.workplace_type && (
              <Badge variant="outline" className="gap-1 pr-1 text-xs">
                <Building2 className="h-3 w-3" />
                {workplaceTypes.find(w => w.value === filters.workplace_type)?.label}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => clearFilter("workplace_type")}
                />
              </Badge>
            )}
            {(filters.salary_min > 0 || filters.salary_max < 100) && (
              <Badge variant="outline" className="gap-1 pr-1 text-xs">
                <DollarSign className="h-3 w-3" />
                ₹{filters.salary_min}L - ₹{filters.salary_max}L
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => clearFilter("salary_min")}
                />
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters content - collapsible on mobile */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Search */}
            <div>
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Job title, company, skills..."
                  className="h-10 pl-9"
                  value={filters.search}
                  onChange={(e) =>
                    onFilterChange({ ...filters, search: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="City, country..."
                  className="h-10 pl-9"
                  value={filters.location}
                  onChange={(e) =>
                    onFilterChange({ ...filters, location: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Job Type */}
            <div>
              <Label className="text-xs text-muted-foreground">Job Type</Label>
              <Select
                value={filters.job_type}
                onValueChange={(v) => onFilterChange({ ...filters, job_type: v })}
              >
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience Level */}
            <div>
              <Label className="text-xs text-muted-foreground">Experience</Label>
              <Select
                value={filters.experience_level}
                onValueChange={(v) =>
                  onFilterChange({ ...filters, experience_level: v })
                }
              >
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Workplace Type */}
            <div>
              <Label className="text-xs text-muted-foreground">Workplace</Label>
              <Select
                value={filters.workplace_type}
                onValueChange={(v) =>
                  onFilterChange({ ...filters, workplace_type: v })
                }
              >
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {workplaceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Salary Range (₹ Lakhs)
              </Label>
              <div className="mt-3 px-2">
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[filters.salary_min, filters.salary_max]}
                  onValueChange={([min, max]) =>
                    onFilterChange({ ...filters, salary_min: min, salary_max: max })
                  }
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>₹{filters.salary_min}L</span>
                  <span>₹{filters.salary_max}L+</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Results count & search button */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {totalJobs} job{totalJobs !== 1 ? "s" : ""} found
              </p>
              <Button size="sm" onClick={onSearch} className="gap-1">
                <Search className="h-3.5 w-3.5" />
                Search
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}