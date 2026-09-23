import { CircularProgress, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { useCurrentUser } from "./use-auth";
import styles from "./AuthGate.module.css";

export function AuthGate({ children }: PropsWithChildren) {
  const currentUser = useCurrentUser();

  if (currentUser.isPending) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <CircularProgress size={34} />
          <Typography color="text.secondary" className={styles.message}>
            Проверяем сессию…
          </Typography>
        </div>
      </div>
    );
  }

  if (currentUser.isError || !currentUser.data?.data) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
