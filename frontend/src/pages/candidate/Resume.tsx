import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { resumeApi } from "@/api/resume.api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Code2,
} from "lucide-react";
import type { ParsedResume } from "@/types";

export default function CandidateResume() {
  const { updateUser } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resumesRes, parsedRes] = await Promise.allSettled([
        resumeApi.getMyResumes(),
        resumeApi.getParsed(),
      ]);
      if (resumesRes.status === "fulfilled" && resumesRes.value.data)
        setResumes(Array.isArray(resumesRes.value.data) ? resumesRes.value.data : []);
      if (parsedRes.status === "fulfilled" && parsedRes.value.data)
        setParsedData(parsedRes.value.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const res = await resumeApi.uploadAndParse(file);
      if (res.success && res.data) {
        toast.success("Resume uploaded and analyzed!");
        setParsedData(res.data.parsedData);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading resume data..." />;

  return (
    <DashboardLayout title="Resume" subtitle="Upload and analyze your resume with AI">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" />
              Upload Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Uploading & analyzing...</p>
                  <p className="text-xs text-muted-foreground">This may take 10-15 seconds</p>
                </div>
              ) : (
                <>
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    Drag & drop your resume here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF only • Max 5MB
                  </p>
                  <label>
                    <Button variant="outline" size="sm" className="mt-4 cursor-pointer" asChild>
                      <span>Browse Files</span>
                    </Button>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={onFileSelect}
                    />
                  </label>
                </>
              )}
            </div>

            {/* Uploaded resumes list */}
            {resumes.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Uploaded Files</p>
                {resumes.map((r: any) => (
                  <div key={r._id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate text-sm">{r.originalName}</span>
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!parsedData ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Upload your resume to see AI analysis
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Confidence Score */}
                {parsedData.confidence && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">AI Confidence</p>
                    <div className="flex items-center gap-3">
                      <Progress value={parsedData.confidence.overall} className="h-2 flex-1" />
                      <span className="text-sm font-bold text-primary">{parsedData.confidence.overall}%</span>
                    </div>
                  </div>
                )}

                {/* Personal Info */}
                {parsedData.personalInfo && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase mb-2">
                      <User className="h-3 w-3" /> Personal
                    </p>
                    <div className="text-sm space-y-1">
                      {parsedData.personalInfo.name && <p><strong>Name:</strong> {parsedData.personalInfo.name}</p>}
                      {parsedData.personalInfo.email && <p><strong>Email:</strong> {parsedData.personalInfo.email}</p>}
                      {parsedData.personalInfo.phone && <p><strong>Phone:</strong> {parsedData.personalInfo.phone}</p>}
                      {parsedData.personalInfo.location && <p><strong>Location:</strong> {parsedData.personalInfo.location}</p>}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {parsedData.skills && parsedData.skills.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase mb-2">
                      <Code2 className="h-3 w-3" /> Skills ({parsedData.skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedData.skills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1">
                          {s.name}
                          <span className="opacity-60">{s.years}y</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {parsedData.experience && parsedData.experience.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase mb-2">
                      <Briefcase className="h-3 w-3" /> Experience ({parsedData.totalExperienceYears} years)
                    </p>
                    <div className="space-y-2">
                      {parsedData.experience.slice(0, 3).map((e, i) => (
                        <div key={i} className="rounded border border-border p-2 text-xs">
                          <p className="font-semibold">{e.title}</p>
                          <p className="text-muted-foreground">{e.company} • {e.startDate} — {e.endDate || "Present"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsedData.education && parsedData.education.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase mb-2">
                      <GraduationCap className="h-3 w-3" /> Education
                    </p>
                    <div className="space-y-2">
                      {parsedData.education.map((e, i) => (
                        <div key={i} className="rounded border border-border p-2 text-xs">
                          <p className="font-semibold">{e.degree}{e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ""}</p>
                          <p className="text-muted-foreground">{e.institution}{e.endYear ? ` • ${e.endYear}` : ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedData.summary && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{parsedData.summary}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}