import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trialApi } from "@/api/trial.api";
import toast from "react-hot-toast";

export function useTrialSchedule() {
  return useQuery({
    queryKey: ["trial", "schedule"],
    queryFn: async () => {
      const { data } = await trialApi.getSchedule();
      return data;
    },
  });
}

export function useTrialProgress() {
  return useQuery({
    queryKey: ["trial", "progress"],
    queryFn: async () => {
      const { data } = await trialApi.getProgress();
      return data;
    },
  });
}

export function useTrialSubmissions() {
  return useQuery({
    queryKey: ["trial", "submissions"],
    queryFn: async () => {
      const { data } = await trialApi.getSubmissions();
      return data;
    },
  });
}

export function useSubmitTrialPhoto() {
  return useMutation({
    mutationFn: (formData) => trialApi.uploadPhoto(formData),
    onSuccess: () => {
      toast.success("Photo uploaded successfully");
    },
  });
}

export function useCreateTrialSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageUrl) => trialApi.createSubmission(imageUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trial", "submissions"] });
      qc.invalidateQueries({ queryKey: ["trial", "progress"] });
      toast.success("Proof submitted for supervisor verification!");
    },
  });
}
