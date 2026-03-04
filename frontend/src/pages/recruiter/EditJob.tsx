import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { jobsApi } from "@/api/jobs.api";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

const editJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  company: z.string().min(2, "Company name is required"),
  department: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  job_type: z.enum(["full-time", "part-time", "contract", "internship"]),
  workplace_type: z.enum(["on-site", "remote", "hybrid"]),
  experience_level: z.enum(["entry", "mid", "senior", "lead", "executive"]),
  min_experience_years: z.number().min(0).max(50),
  max_experience_years: z.number().min(0).max(50),
  salary_min: z.number().optional().nullable(),
  salary_max: z.number().optional().nullable(),
  salary_currency: z.string().default("PKR"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  benefits: z.array(z.string()),
});

type EditJobForm = z.infer<typeof editJobSchema>;

export default function EditJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [skills, setSkills] = useState<Array<{ name: string; years: number; required: boolean }>>([]);
  const [newSkill, setNewSkill] = useState({ name: "", years: 2, required: true });
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editJobSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      company: "",
      department: "",
      location: "",
      description: "",
      job_type: "full-time",
      workplace_type: "on-site",
      experience_level: "mid",
      min_experience_years: 2,
      max_experience_years: 5,
      salary_min: null,
      salary_max: null,
      salary_currency: "PKR",
      benefits: [],
    },
  });

  const watchFields = watch();

  useEffect(() => {
    const loadJob = async () => {
      if (!jobId) {
        toast.error("Invalid job id");
        navigate("/recruiter/my-jobs");
        return;
      }

      try {
        setInitialLoading(true);
        const res = await jobsApi.getById(jobId);
        const job = res.data?.job;
        const jobSkills = res.data?.skills || [];

        if (!job) {
          toast.error("Job not found");
          navigate("/recruiter/my-jobs");
          return;
        }

        const loadedBenefits = Array.isArray(job.benefits) ? job.benefits : [];
        setBenefits(loadedBenefits);

        setSkills(
          Array.isArray(jobSkills)
            ? jobSkills.map((item) => ({
                name: item.skill_name,
                years: Number(item.min_years || 0),
                required: Boolean(item.is_required),
              }))
            : []
        );

        reset({
          title: job.title || "",
          company: job.company || "",
          department: job.department || "",
          location: job.location || "",
          description: job.description || "",
          job_type: job.job_type || "full-time",
          workplace_type: job.workplace_type || "on-site",
          experience_level: job.experience_level || "mid",
          min_experience_years: Number(job.min_experience_years ?? 0),
          max_experience_years: Number(job.max_experience_years ?? 0),
          salary_min: job.salary_min ?? null,
          salary_max: job.salary_max ?? null,
          salary_currency: job.salary_currency || "PKR",
          benefits: loadedBenefits,
        });
      } catch {
        toast.error("Failed to load job details");
        navigate("/recruiter/my-jobs");
      } finally {
        setInitialLoading(false);
      }
    };

    loadJob();
  }, [jobId, navigate, reset]);

  const addSkill = () => {
    if (!newSkill.name.trim()) {
      toast.error("Skill name is required");
      return;
    }
    setSkills((prev) => [...prev, { ...newSkill, name: newSkill.name.trim() }]);
    setNewSkill({ name: "", years: 2, required: true });
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    const updated = [...benefits, newBenefit.trim()];
    setBenefits(updated);
    setValue("benefits", updated);
    setNewBenefit("");
  };

  const removeBenefit = (index: number) => {
    const updated = benefits.filter((_, i) => i !== index);
    setBenefits(updated);
    setValue("benefits", updated);
  };

  const onSubmit = async (data: any) => {
    if (!jobId) return;
    if (skills.length === 0) {
      toast.error("Add at least one skill");
      return;
    }
    if (data.salary_min && data.salary_max && data.salary_min > data.salary_max) {
      toast.error("Min salary cannot be greater than max");
      return;
    }

    setLoading(true);
    try {
      const res = await jobsApi.update(jobId, {
        ...data,
        skills: skills.map((s) => ({
          skill_name: s.name,
          min_years: s.years,
          is_required: s.required,
        })),
      });
      if (res.success) {
        toast.success("Job updated successfully!");
        navigate("/recruiter/my-jobs");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <LoadingSpinner fullScreen text="Loading job details..." />;

  return (
    <DashboardLayout title="Edit Job" subtitle="Update your job posting details">
      <div className="mx-auto max-w-4xl space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div>
              <Label>Job Title *</Label>
              <Input className="mt-1.5" {...register("title")} />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Company *</Label>
                <Input className="mt-1.5" {...register("company")} />
              </div>
              <div>
                <Label>Department</Label>
                <Input className="mt-1.5" {...register("department")} />
              </div>
            </div>
            <div>
              <Label>Location *</Label>
              <Input className="mt-1.5" {...register("location")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Job Type</Label>
                <Select value={watchFields.job_type} onValueChange={(v) => setValue("job_type", v as any)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Workplace</Label>
                <Select value={watchFields.workplace_type} onValueChange={(v) => setValue("workplace_type", v as any)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-site">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select value={watchFields.experience_level} onValueChange={(v) => setValue("experience_level", v as any)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Min Experience (years)</Label>
                <Input type="number" min={0} className="mt-1.5" {...register("min_experience_years", { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Max Experience (years)</Label>
                <Input type="number" min={0} className="mt-1.5" {...register("max_experience_years", { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Compensation</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Minimum Salary</Label>
                <Input type="number" className="mt-1.5" {...register("salary_min", { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Maximum Salary</Label>
                <Input type="number" className="mt-1.5" {...register("salary_max", { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Currency</Label>
                <Input className="mt-1.5" {...register("salary_currency")} />
              </div>
            </div>

            <div>
              <Label>Benefits</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  placeholder="e.g. Health Insurance"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                />
                <Button type="button" onClick={addBenefit}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {benefits.map((benefit, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {benefit}
                    <X className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeBenefit(i)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Description</h2>
            <Textarea rows={10} className="mt-1.5" {...register("description")} />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Skills</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Skill name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Years"
                  value={newSkill.years}
                  onChange={(e) => setNewSkill({ ...newSkill, years: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={newSkill.required} onCheckedChange={(v) => setNewSkill({ ...newSkill, required: v })} />
                <Label>Required</Label>
              </div>
              <Button type="button" onClick={addSkill} size="sm">Add Skill</Button>
            </div>
            <div className="space-y-2">
              {skills.map((skill, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline" className="text-xs">{skill.years}+ years</Badge>
                    {skill.required && <Badge className="text-xs">Required</Badge>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSkill(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/recruiter/my-jobs")}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Job"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
