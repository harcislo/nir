import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ApiError } from "../shared/api/client";
import { useCurrentUser, useLogin } from "../features/auth/use-auth";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const loginMutation = useLogin();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (loginMutation.isSuccess) navigate("/measurements", { replace: true });
  }, [loginMutation.isSuccess, navigate]);

  if (currentUser.data?.data) return <Navigate to="/measurements" replace />;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    loginMutation.mutate({ login, password });
  };

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? "Не удалось связаться с сервером"
        : null;

  return (
    <main className={styles.page}>
      <div className={styles.loginShell}>
        <div className={styles.headingRow}>
          <Avatar className={styles.avatar}>
            <ScienceOutlinedIcon />
          </Avatar>
          <Typography component="h1" className={styles.title}>
            ЛабЛог
          </Typography>
        </div>

        <Paper elevation={0} className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Typography component="h2" className={styles.subtitle}>
              Войдите в аккаунт
            </Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <TextField
              label="Логин"
              autoComplete="username"
              autoFocus
              required
              fullWidth
              value={login}
              onChange={(event) => setLogin(event.target.value)}
            />
            <TextField
              label="Пароль"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              type="submit"
              size="large"
              variant="contained"
              disabled={!login || !password || loginMutation.isPending}
              startIcon={loginMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}
            >
              {loginMutation.isPending ? "Входим…" : "Войти"}
            </Button>
          </form>
        </Paper>
      </div>
    </main>
  );
}
