import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { candidateApi } from "@/api/candidate.api";
import { toast } from "sonner";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import type { CandidateSkill } from "@/types";

interface SkillsManagerProps {
  skills: CandidateSkill[];
  onUpdate: () => void;
}

export default function SkillsManager({ skills, onUpdate }: SkillsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState({
    skill_name: "",
    years_of_experience: 0,
    proficiency_level: "intermediate",
  });

  const handleAdd = async () => {
    if (loading) return;
    if (!newSkill.skill_name.trim()) {
      toast.error("Skill name is required");
      return;
    }
    setLoading(true);
    try {
      await candidateApi.addSkill(newSkill);
      setNewSkill({ skill_name: "", years_of_experience: 0, proficiency_level: "intermediate" });
      setShowForm(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add skill");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (skillId: string) => {
    setDeleting(skillId);
    try {
      await candidateApi.deleteSkill(skillId);
      toast.success("Skill removed");
      onUpdate();
    } catch {
      toast.error("Failed to remove skill");
    } finally {
      setDeleting(null);
    }
  };

  const profColors: Record<string, string> = {
    beginner: "bg-blue-100/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50",
    intermediate: "bg-purple-100/80 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50",
    advanced: "bg-pink-100/80 text-pink-900 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800/50",
    expert: "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
  };

  return (
    <div>
      {/* Skill chips */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {skills.map((skill) => (
            <motion.div
              key={skill.id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="group flex items-center gap-1.5 rounded-lg border border-border bg-card dark:bg-input/30 px-3 py-1.5 text-sm shadow-sm hover:shadow-md dark:shadow-md transition-all dark:border-border/60"
            >
              {skill.is_ai_extracted && (
                <Sparkles className="h-3 w-3 text-primary" />
              )}
              <span className="font-medium text-foreground dark:text-foreground/95">
                {skill.skill_name}
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 border ${profColors[skill.proficiency_level]}`}>
                {skill.years_of_experience}y
              </Badge>
              <button
                type="button"
                onClick={() => handleDelete(skill.id)}
                disabled={deleting === skill.id}
                className="ml-0.5 rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
              >
                {deleting === skill.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add button */}
        {!showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-dashed border-primary/50 hover:border-primary dark:hover:bg-input/50 dark:border-input/60 dark:text-foreground/80"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Skill
          </Button>
        )}
      </div>

      {/* Add Skill Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card dark:bg-input/20 dark:border-border/60 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-medium text-foreground dark:text-foreground/90">Skill Name</Label>
                  <Input
                    placeholder="e.g. React"
                    className="mt-1 h-9"
                    value={newSkill.skill_name}
                    onChange={(e) =>
                      setNewSkill({ ...newSkill, skill_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-foreground dark:text-foreground/90">Years</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    className="mt-1 h-9"
                    value={newSkill.years_of_experience}
                    onChange={(e) =>
                      setNewSkill({
                        ...newSkill,
                        years_of_experience: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-foreground dark:text-foreground/90">Level</Label>
                  <Select
                    value={newSkill.proficiency_level}
                    onValueChange={(v) =>
                      setNewSkill({ ...newSkill, proficiency_level: v })
                    }
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" size="sm" onClick={handleAdd} disabled={loading} className="gap-1">
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Add Skill
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}