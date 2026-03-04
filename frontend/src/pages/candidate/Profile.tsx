import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SkillsManager from "@/components/candidate/SkillsManager";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { candidateApi } from "@/api/candidate.api";
import { useAuth } from "@/context/AuthContext";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  Code2,
  MapPin,
  Phone,
  Globe,
  Linkedin,
  Github,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import type { FullCandidateProfile, CandidateExperience, CandidateEducation } from "@/types";

const profileSchema = z.object({
  full_name: z.string().min(2).max(255),
  phone: z.string().max(20).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  github_url: z.string().optional().nullable(),
  portfolio_url: z.string().optional().nullable(),
});

export default function CandidateProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<FullCandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experienceSaving, setExperienceSaving] = useState(false);
  const [educationSaving, setEducationSaving] = useState(false);
  const [experienceDeletingId, setExperienceDeletingId] = useState<string | null>(null);
  const [educationDeletingId, setEducationDeletingId] = useState<string | null>(null);

  // Experience form state
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({
    title: "", company: "", location: "", start_date: "",
    end_date: "", is_current: false, description: "",
  });

  // Education form state
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState({
    degree: "", institution: "", location: "", field_of_study: "",
    start_year: "", end_year: "", grade: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      location: "",
      bio: "",
      linkedin_url: "",
      github_url: "",
      portfolio_url: "",
    },
    mode: "onChange",
  });

  // Watch form values for debugging
  const formValues = watch();
  
  useEffect(() => {
    console.log("Current form values:", formValues);
  }, [formValues]);

  useEffect(() => {
    // Only load profile if user is authenticated
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []); // Run only once on mount

  const loadProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await candidateApi.getProfile();
      console.log("Profile response:", res);
      if (res.success && res.data) {
        // Handle both nested (res.data.user) and flat structure (res.data directly has user props)
        const userData = res.data.user || res.data;
        
        const profileData = {
          user: userData,
          candidateProfile: res.data.candidateProfile || null,
          skills: res.data.skills || [],
          experience: res.data.experience || [],
          education: res.data.education || [],
        };
        
        setProfile(profileData);
        
        // Reset form with loaded data - ensure proper string conversion for form values
        const formValues = {
          full_name: userData.full_name || "",
          phone: userData.phone || "",
          location: userData.location || "",
          bio: userData.bio || "",
          linkedin_url: userData.linkedin_url || "",
          github_url: userData.github_url || "",
          portfolio_url: userData.portfolio_url || "",
        };
        
        console.log("Resetting form with values:", formValues);
        reset(formValues, { keepDefaultValues: false });
      } else {
        console.warn("Profile response missing data:", res);
        toast.error("Failed to load profile");
      }
    } catch (error: any) {
      console.error("Profile load error:", error);
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const onSaveProfile = async (data: any) => {
    setSaving(true);
    try {
      await candidateApi.updateProfile(data);
      updateUser({ full_name: data.full_name, phone: data.phone, location: data.location });
      toast.success("Profile saved!");
      // Reload profile to ensure data is fresh and persisted
      await loadProfile(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addExperience = async () => {
    if (experienceSaving) return;
    if (!expForm.title || !expForm.company || !expForm.start_date) {
      toast.error("Title, company, and start date are required");
      return;
    }
    setExperienceSaving(true);
    try {
      await candidateApi.addExperience(expForm);
      toast.success("Experience added!");
      setExpForm({ title: "", company: "", location: "", start_date: "", end_date: "", is_current: false, description: "" });
      setShowExpForm(false);
      loadProfile(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add experience");
    } finally {
      setExperienceSaving(false);
    }
  };

  const deleteExperience = async (id: string) => {
    if (experienceDeletingId) return;
    setExperienceDeletingId(id);
    try {
      await candidateApi.deleteExperience(id);
      toast.success("Experience removed");
      loadProfile(true);
    } catch {
      toast.error("Failed to remove");
    } finally {
      setExperienceDeletingId(null);
    }
  };

  const addEducation = async () => {
    if (educationSaving) return;
    if (!eduForm.degree || !eduForm.institution) {
      toast.error("Degree and institution are required");
      return;
    }
    setEducationSaving(true);
    try {
      await candidateApi.addEducation({
        ...eduForm,
        start_year: eduForm.start_year ? parseInt(eduForm.start_year) : null,
        end_year: eduForm.end_year ? parseInt(eduForm.end_year) : null,
      });
      toast.success("Education added!");
      setEduForm({ degree: "", institution: "", location: "", field_of_study: "", start_year: "", end_year: "", grade: "" });
      setShowEduForm(false);
      loadProfile(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add education");
    } finally {
      setEducationSaving(false);
    }
  };

  const deleteEducation = async (id: string) => {
    if (educationDeletingId) return;
    setEducationDeletingId(id);
    try {
      await candidateApi.deleteEducation(id);
      toast.success("Education removed");
      loadProfile(true);
    } catch {
      toast.error("Failed to remove");
    } finally {
      setEducationDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading profile..." />;
  if (!profile) {
    return (
      <DashboardLayout
        title="My Profile"
        subtitle="Manage your professional information"
      >
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-destructive font-medium">Unable to load profile</p>
            <p className="text-sm text-muted-foreground mt-1">Please check your connection and try refreshing the page</p>
            <Button className="mt-4" onClick={() => loadProfile()}>Retry</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="Manage your professional information"
      actions={
        <Button onClick={handleSubmit(onSaveProfile)} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      }
    >
      {/* Profile Completion */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {getInitials(user?.full_name || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{user?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={user?.profile_completion || 0} className="h-2 flex-1 max-w-xs" />
              <span className="text-xs font-medium text-primary">{user?.profile_completion}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1" {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message as string}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="flex items-center gap-1"><Phone className="h-3 w-3" />Phone</Label>
                <Input className="mt-1" placeholder="+92 3122144331" {...register("phone")} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" />Location</Label>
                <Input className="mt-1" placeholder="Karachi, Pakistan" {...register("location")} />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea className="mt-1" rows={3} placeholder="Tell us about yourself..." {...register("bio")} />
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-1"><Linkedin className="h-3 w-3" />LinkedIn</Label>
              <Input className="mt-1" placeholder="https://linkedin.com/in/..." {...register("linkedin_url")} />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Github className="h-3 w-3" />GitHub</Label>
              <Input className="mt-1" placeholder="https://github.com/..." {...register("github_url")} />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Globe className="h-3 w-3" />Portfolio</Label>
              <Input className="mt-1" placeholder="https://yoursite.dev" {...register("portfolio_url")} />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Code2 className="h-4 w-4 text-primary" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
    <SkillsManager 
     skills={profile?.skills || []}  
            onUpdate={() => loadProfile(true)} 
    />
          </CardContent>
        </Card>

        {/* Experience */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" />
              Work Experience
            </CardTitle>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setShowExpForm(!showExpForm)}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </CardHeader>
          <CardContent>
            {/* Add Form */}
            {showExpForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-4 overflow-hidden">
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Job Title *</Label>
                      <Input className="mt-1 h-9" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Company *</Label>
                      <Input className="mt-1 h-9" value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Start Date *</Label>
                      <Input type="date" className="mt-1 h-9" value={expForm.start_date} onChange={(e) => setExpForm({ ...expForm, start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input type="date" className="mt-1 h-9" disabled={expForm.is_current} value={expForm.end_date} onChange={(e) => setExpForm({ ...expForm, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={expForm.is_current} onCheckedChange={(v) => setExpForm({ ...expForm, is_current: v, end_date: "" })} />
                    <Label className="text-xs">Currently working here</Label>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea className="mt-1" rows={2} value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={addExperience} disabled={experienceSaving}>
                      {experienceSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowExpForm(false)} disabled={experienceSaving}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Experience List */}
            {(profile?.experience?.length ?? 0) === 0 && !showExpForm ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No experience added yet</p>
            ) : (
              <div className="space-y-3">
                {profile?.experience?.map((exp) => (
                  <div key={exp.id} className="group flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/30">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">{exp.company}{exp.location ? ` • ${exp.location}` : ""}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteExperience(exp.id)} disabled={experienceDeletingId === exp.id}>
                          {experienceDeletingId === exp.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(exp.start_date)} — {exp.is_current ? "Present" : exp.end_date ? formatDate(exp.end_date) : "N/A"}
                      </p>
                      {exp.description && <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-primary" />
              Education
            </CardTitle>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setShowEduForm(!showEduForm)}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </CardHeader>
          <CardContent>
            {/* Add Form */}
            {showEduForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-4 overflow-hidden">
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Degree *</Label>
                      <Input className="mt-1 h-9" placeholder="BSCS" value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Institution *</Label>
                      <Input className="mt-1 h-9" placeholder="University name" value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Field of Study</Label>
                      <Input className="mt-1 h-9" placeholder="Computer Science" value={eduForm.field_of_study} onChange={(e) => setEduForm({ ...eduForm, field_of_study: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Grade</Label>
                      <Input className="mt-1 h-9" placeholder="3.5 CGPA" value={eduForm.grade} onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Start Year</Label>
                      <Input type="number" className="mt-1 h-9" placeholder="2015" value={eduForm.start_year} onChange={(e) => setEduForm({ ...eduForm, start_year: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">End Year</Label>
                      <Input type="number" className="mt-1 h-9" placeholder="2019" value={eduForm.end_year} onChange={(e) => setEduForm({ ...eduForm, end_year: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={addEducation} disabled={educationSaving}>
                      {educationSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowEduForm(false)} disabled={educationSaving}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Education List */}
            {(profile?.education?.length ?? 0) === 0 && !showEduForm ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No education added yet</p>
            ) : (
              <div className="space-y-3">
                {profile?.education?.map((edu) => (
                  <div key={edu.id} className="group flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/30">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ""}</p>
                          <p className="text-xs text-muted-foreground">{edu.institution}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteEducation(edu.id)} disabled={educationDeletingId === edu.id}>
                          {educationDeletingId === edu.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {edu.start_year && edu.end_year ? `${edu.start_year} — ${edu.end_year}` : ""}{edu.grade ? ` • ${edu.grade}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}