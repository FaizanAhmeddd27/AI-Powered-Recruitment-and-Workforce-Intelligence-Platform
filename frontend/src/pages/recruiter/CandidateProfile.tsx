import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { recruiterApi } from "@/api/recruiter.api";
import { resumeApi } from "@/api/resume.api";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  GraduationCap,
  Code2,
  Sparkles,
  Calendar,
  Download,
  FileText,
} from "lucide-react";

export default function CandidateProfileView() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [candidateId]);

  const loadProfile = async () => {
    if (!candidateId) {
      toast.error("Invalid candidate profile URL");
      navigate("/recruiter/dashboard");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [profileRes, resumeRes] = await Promise.allSettled([
        recruiterApi.viewCandidate(candidateId!),
        resumeApi.getCandidateResume(candidateId!),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value.data) {
        setProfile(profileRes.value.data);
      } else {
        const message =
          profileRes.status === "rejected"
            ? ((profileRes.reason as any)?.response?.data?.message ||
              "Unable to load candidate profile")
            : "Unable to load candidate profile";
        toast.error(message);
        navigate("/recruiter/dashboard");
        return;
      }

      if (resumeRes.status === "fulfilled" && resumeRes.value.data) {
        setParsedResume(resumeRes.value.data);
      }
    } catch {
      toast.error("Failed to load candidate profile");
      navigate("/recruiter/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!profile?.user?.resume_mongo_id) {
      toast.error("No resume found");
      return;
    }
    try {
      const blob = await resumeApi.download(profile.user.resume_mongo_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download resume");
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading candidate profile..." />;
  if (!profile) {
    return <LoadingSpinner fullScreen text="Loading candidate profile..." />;
  }

  const {
    user,
    candidateProfile,
    skills = [],
    experience = [],
    education = [],
  } = profile || {};

  if (!user) {
    return (
      <DashboardLayout title="Candidate Profile" subtitle="Missing profile data">
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Profile data is incomplete.</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Candidate Profile"
      subtitle={`${user.full_name} • ${user.email}`}
      actions={
        <div className="flex gap-2">
          {user.resume_mongo_id && (
            <Button variant="outline" size="sm" onClick={handleDownloadResume} className="gap-2">
              <Download className="h-4 w-4" />
              Resume
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Basic Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="mx-auto h-24 w-24">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-3 text-xl font-bold">{user.full_name}</h2>
              {candidateProfile?.headline && (
                <p className="text-sm text-muted-foreground">{candidateProfile.headline}</p>
              )}

              <Separator className="my-4" />

              <div className="space-y-2 text-left">
                {user.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex flex-wrap justify-center gap-2">
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="gap-1">
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </Badge>
                  </a>
                )}
                {user.github_url && (
                  <a href={user.github_url} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="gap-1">
                      <Github className="h-3 w-3" />
                      GitHub
                    </Badge>
                  </a>
                )}
                {user.portfolio_url && (
                  <a href={user.portfolio_url} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="gap-1">
                      <Globe className="h-3 w-3" />
                      Portfolio
                    </Badge>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {candidateProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Experience</span>
                  <span className="text-sm font-medium">{candidateProfile.total_experience_years} years</span>
                </div>
                {candidateProfile.current_company && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Company</span>
                    <span className="text-sm font-medium">{candidateProfile.current_company}</span>
                  </div>
                )}
                {candidateProfile.current_title && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Title</span>
                    <span className="text-sm font-medium">{candidateProfile.current_title}</span>
                  </div>
                )}
                {candidateProfile.expected_salary_min && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected Salary</span>
                    <span className="text-sm font-medium">
                      ₹{candidateProfile.expected_salary_min / 100000}L - ₹{candidateProfile.expected_salary_max / 100000}L
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Notice Period</span>
                  <span className="text-sm font-medium">{candidateProfile.notice_period_days || 0} days</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Skills, Experience, Education */}
        <div className="space-y-6 lg:col-span-2">
          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="h-4 w-4 text-primary" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: any) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="gap-1 text-sm py-1.5"
                  >
                    {skill.skill_name}
                    {skill.is_ai_extracted && (
                      <Sparkles className="ml-1 h-3 w-3 text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground ml-1">
                      {skill.years_of_experience}y
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parsed Resume Summary */}
          {parsedResume && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Resume Summary
                  {parsedResume.confidence && (
                    <Badge variant="outline" className="ml-2">
                      AI Confidence: {parsedResume.confidence.overall}%
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parsedResume.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {parsedResume.summary}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-primary" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              {experience.length === 0 ? (
                <p className="text-sm text-muted-foreground">No experience listed</p>
              ) : (
                <div className="space-y-4">
                  {experience.map((exp: any) => (
                    <div key={exp.id} className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {exp.company} • {exp.location || "Not specified"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(exp.start_date)} —{" "}
                          {exp.is_current ? "Present" : exp.end_date ? formatDate(exp.end_date) : "N/A"}
                        </p>
                        {exp.description && (
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4 text-primary" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              {education.length === 0 ? (
                <p className="text-sm text-muted-foreground">No education listed</p>
              ) : (
                <div className="space-y-4">
                  {education.map((edu: any) => (
                    <div key={edu.id} className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {edu.degree}
                          {edu.field_of_study && ` in ${edu.field_of_study}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        {(edu.start_year || edu.end_year) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {edu.start_year} — {edu.end_year || "Present"}
                          </p>
                        )}
                        {edu.grade && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Grade: {edu.grade}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}