import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { jobsApi } from "@/api/jobs.api";
import { aiApi } from "@/api/ai.api";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Calendar,
} from "lucide-react";

const steps = [
  { title: "Basic Info", icon: Briefcase },
  { title: "Compensation", icon: DollarSign },
  { title: "Description", icon: Sparkles },
  { title: "Skills", icon: Users },
];

const postJobSchema = z.object({
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
  salary_currency: z.string().default("INR"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  benefits: z.array(z.string()),
});

type PostJobForm = z.infer<typeof postJobSchema>;

export default function PostJob() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Array<{ name: string; years: number; required: boolean }>>([]);
  const [newSkill, setNewSkill] = useState({ name: "", years: 2, required: true });
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(postJobSchema),
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
      salary_currency: "INR",
      benefits: [],
    },
  });;

  const watchFields = watch();

  const generateDescription = async () => {
    if (!watchFields.title || !watchFields.company) {
      toast.error("Please fill title and company first");
      return;
    }

    setLoading(true);
    try {
      const res = await aiApi.generateDescription({
        title: watchFields.title,
        company: watchFields.company,
        department: watchFields.department,
        skills: skills.map(s => s.name),
        experienceLevel: watchFields.experience_level,
        location: watchFields.location || "Remote",
      });
      if (res.data?.description) {
        setValue("description", res.data.description);
        toast.success("Description generated!");
      }
    } catch {
      toast.error("Failed to generate description");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) {
      toast.error("Skill name is required");
      return;
    }
    setSkills([...skills, { ...newSkill, name: newSkill.name.trim() }]);
    setNewSkill({ name: "", years: 2, required: true });
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setBenefits([...benefits, newBenefit.trim()]);
    setValue("benefits", [...benefits, newBenefit.trim()]);
    setNewBenefit("");
  };

  const removeBenefit = (index: number) => {
    const updated = benefits.filter((_, i) => i !== index);
    setBenefits(updated);
    setValue("benefits", updated);
  };

  const onSubmit = async (data: any) => {
    if (skills.length === 0) {
      toast.error("Add at least one skill");
      return;
    }

    setLoading(true);
    try {
      const res = await jobsApi.create({
        ...data,
        skills: skills.map(s => ({
          skill_name: s.name,
          min_years: s.years,
          is_required: s.required,
        })),
      });
      if (res.success) {
        toast.success("Job posted successfully!");
        navigate("/recruiter/my-jobs");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!watchFields.title || !watchFields.company || !watchFields.location) {
        toast.error("Please fill all required fields");
        return;
      }
    }
    if (currentStep === 2) {
      if (watchFields.salary_min && watchFields.salary_max && watchFields.salary_min > watchFields.salary_max) {
        toast.error("Min salary cannot be greater than max");
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <DashboardLayout
      title="Post a New Job"
      subtitle="Create a job posting and let AI find the best candidates"
    >
      <div className="mx-auto max-w-3xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-1 items-center">
                <div className="relative">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      currentStep > i + 1
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep === i + 1
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > i + 1 ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap">
                    {step.title}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 ${
                      currentStep > i + 1 ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>Job Title *</Label>
                      <Input
                        placeholder="e.g. Senior Frontend Developer"
                        className="mt-1.5"
                        {...register("title")}
                      />
                      {errors.title && (
                        <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Company *</Label>
                        <Input
                          placeholder="Company name"
                          className="mt-1.5"
                          {...register("company")}
                        />
                      </div>
                      <div>
                        <Label>Department (Optional)</Label>
                        <Input
                          placeholder="e.g. Engineering"
                          className="mt-1.5"
                          {...register("department")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Location *</Label>
                      <Input
                        placeholder="e.g. Bangalore, India"
                        className="mt-1.5"
                        {...register("location")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Job Type</Label>
                        <Select
                          value={watchFields.job_type}
                          onValueChange={(v) => setValue("job_type", v as any)}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
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
                        <Select
                          value={watchFields.workplace_type}
                          onValueChange={(v) => setValue("workplace_type", v as any)}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-site">On-site</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Experience Level</Label>
                      <Select
                        value={watchFields.experience_level}
                        onValueChange={(v) => setValue("experience_level", v as any)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry (0-2 yrs)</SelectItem>
                          <SelectItem value="mid">Mid (3-5 yrs)</SelectItem>
                          <SelectItem value="senior">Senior (5-8 yrs)</SelectItem>
                          <SelectItem value="lead">Lead (8-12 yrs)</SelectItem>
                          <SelectItem value="executive">Executive (12+ yrs)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min Experience (years)</Label>
                        <Input
                          type="number"
                          min={0}
                          className="mt-1.5"
                          {...register("min_experience_years", { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label>Max Experience (years)</Label>
                        <Input
                          type="number"
                          min={0}
                          className="mt-1.5"
                          {...register("max_experience_years", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Compensation */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Compensation & Benefits</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Minimum Salary (₹ Lakhs)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 15"
                          className="mt-1.5"
                          {...register("salary_min", { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label>Maximum Salary (₹ Lakhs)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 25"
                          className="mt-1.5"
                          {...register("salary_max", { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Benefits</Label>
                      <div className="mt-1.5 flex gap-2">
                        <Input
                          placeholder="e.g. Health Insurance"
                          value={newBenefit}
                          onChange={(e) => setNewBenefit(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addBenefit()}
                        />
                        <Button type="button" onClick={addBenefit}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {benefits.map((benefit, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 pr-1">
                            {benefit}
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => removeBenefit(i)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Description with AI */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Job Description</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={loading}
                      className="gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                  <div>
                    <Textarea
                      rows={10}
                      placeholder="Describe the role, responsibilities, and requirements..."
                      className="mt-1.5"
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Skills */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Required Skills</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input
                          placeholder="Skill name (e.g. React)"
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
                        <Switch
                          checked={newSkill.required}
                          onCheckedChange={(v) => setNewSkill({ ...newSkill, required: v })}
                        />
                        <Label>Required</Label>
                      </div>
                      <Button type="button" onClick={addSkill} size="sm">
                        Add Skill
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {skills.map((skill, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-border p-2"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium">{skill.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {skill.years}+ years
                            </Badge>
                            {skill.required && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                Required
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeSkill(i)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Job"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}