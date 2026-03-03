import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import JobFilters, { type JobFilterValues } from "@/components/candidate/JobFilters";
import JobCard from "@/components/candidate/JobCard";
import Pagination from "@/components/shared/Pagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { jobsApi } from "@/api/jobs.api";
import { aiApi } from "@/api/ai.api";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Briefcase,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Job } from "@/types";

export default function BrowseJobs() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<JobFilterValues>({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    job_type: searchParams.get("job_type") || "",
    experience_level: searchParams.get("experience_level") || "",
    workplace_type: searchParams.get("workplace_type") || "",
    salary_min: Number(searchParams.get("salary_min")) || 0,
    salary_max: Number(searchParams.get("salary_max")) || 100,
  });

  const debouncedFilters = useDebounce(filters, 500);

  // Load jobs when filters or page change
  useEffect(() => {
    loadJobs();
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    params.set("page", String(page));
    setSearchParams(params);
  }, [debouncedFilters, page]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 10,
        sort_by: "created_at",
        sort_order: "desc",
        ...filters,
        salary_min: filters.salary_min || undefined,
        salary_max: filters.salary_max === 100 ? undefined : filters.salary_max,
      };

      const res = await jobsApi.search(params);
      if (res.data) setJobs(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotal(res.meta.total || 0);
      }

      // If user is logged in as candidate, fetch match scores
      if (user?.role === "candidate") {
        loadMatchScores(res.data || []);
      }
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const loadMatchScores = async (jobsList: Job[]) => {
    const scores: Record<string, number> = {};
    await Promise.all(
      jobsList.map(async (job) => {
        try {
          const res = await aiApi.getMatchScore(job.id);
          if (res.data) scores[job.id] = res.data.overallScore;
        } catch {
          // ignore - no skills or not candidate
        }
      })
    );
    setMatchScores(scores);
  };

  const handleFilterChange = useCallback((newFilters: JobFilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  const handleSearch = useCallback(() => {
    loadJobs();
  }, []);

  return (
    <DashboardLayout
      title="Browse Jobs"
      subtitle={`${total} opportunities waiting for you`}
      actions={
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground lg:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
          {showMobileFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      }
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters Sidebar */}
        <div className={cn(
          "lg:w-80 lg:flex-shrink-0",
          showMobileFilters ? "block" : "hidden lg:block"
        )}>
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            <JobFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              totalJobs={total}
            />
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="flex-1">
          {loading ? (
            <LoadingSpinner fullScreen text="Finding best jobs for you..." />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try adjusting your filters or search criteria"
              actionLabel="Clear filters"
              onAction={() => handleFilterChange({
                search: "",
                location: "",
                job_type: "",
                experience_level: "",
                workplace_type: "",
                salary_min: 0,
                salary_max: 100,
              })}
            />
          ) : (
            <>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchScore={matchScores[job.id]}
                  />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="mt-6"
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}