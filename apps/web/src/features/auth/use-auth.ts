import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, login, logout } from "../../shared/api/auth";

export const authQueryKey = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: getCurrentUser,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (result) => queryClient.setQueryData(authQueryKey, result),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(authQueryKey, null);
      queryClient.removeQueries({ queryKey: ["measurements"] });
    },
  });
}

