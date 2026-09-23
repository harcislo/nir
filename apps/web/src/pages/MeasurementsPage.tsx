import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useCurrentUser, useLogout, authQueryKey } from "../features/auth/use-auth";
import { emptyFilters, MeasurementFiltersPanel } from "../features/measurements/MeasurementFilters";
import { MeasurementDrawer } from "../features/measurements/MeasurementDrawer";
import { ApiError } from "../shared/api/client";
import { deleteMeasurement, downloadMeasurementFile, listMeasurements } from "../shared/api/measurements";
import type { Measurement, MeasurementFilters, PanelState } from "../types";
import styles from "./MeasurementsPage.module.css";

type Notice = { message: string; severity: "success" | "warning" | "error" } | null;

export function MeasurementsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const logoutMutation = useLogout();
  const [draftFilters, setDraftFilters] = useState<MeasurementFilters>(emptyFilters);
  const [filters, setFilters] = useState<MeasurementFilters>(emptyFilters);
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [panel, setPanel] = useState<PanelState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Measurement | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const measurementsQuery = useQuery({
    queryKey: ["measurements", "list", pagination.page, pagination.pageSize, filters],
    queryFn: () => listMeasurements({ page: pagination.page + 1, pageSize: pagination.pageSize as 20 | 50 | 100, filters }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (measurementsQuery.error instanceof ApiError && measurementsQuery.error.status === 401) {
      void queryClient.invalidateQueries({ queryKey: authQueryKey });
    }
  }, [measurementsQuery.error, queryClient]);

  const showNotice = (message: string, severity: "success" | "warning" | "error" = "success") => setNotice({ message, severity });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMeasurement(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["measurements"] });
      setDeleteTarget(null);
      setPanel(null);
      showNotice("Запись удалена");
    },
    onError: (error) => showNotice(error instanceof ApiError ? error.message : "Не удалось удалить запись", "error"),
  });

  const download = async (measurement: Measurement) => {
    if (!measurement.file) return;
    try { await downloadMeasurementFile(measurement.id, measurement.file.originalName); }
    catch (error) { showNotice(error instanceof ApiError ? error.message : "Не удалось скачать файл", "error"); }
  };

  const columns = useMemo<GridColDef<Measurement>[]>(() => [
    { field: "measurementDate", headerName: "Дата", width: 115, renderCell: ({ value }) => value ? dayjs(String(value)).format("DD.MM.YYYY") : "—" },
    { field: "measurementTime", headerName: "Время", width: 85, renderCell: ({ value }) => value ? String(value).slice(0, 5) : "—" },
    { field: "sampleName", headerName: "Образец", minWidth: 180, flex: 1 },
    { field: "sampleNumber", headerName: "№", width: 120 },
    { field: "organization", headerName: "Организация", minWidth: 170, flex: 1 },
    { field: "customer", headerName: "Заказчик", minWidth: 150, flex: 1 },
    { field: "mode1", headerName: "Режим 1", width: 120 },
    { field: "mode2", headerName: "Режим 2", width: 120 },
    { field: "mode3", headerName: "Режим 3", width: 120 },
    { field: "isReference", headerName: "Эталон", width: 95, align: "center", headerAlign: "center", renderCell: ({ value }) => <Chip size="small" label={value ? "Да" : "Нет"} color={value ? "primary" : "default"} variant={value ? "filled" : "outlined"} /> },
    { field: "isRepair", headerName: "Ремонт", width: 95, align: "center", headerAlign: "center", renderCell: ({ value }) => <Chip size="small" label={value ? "Да" : "Нет"} color={value ? "warning" : "default"} variant={value ? "filled" : "outlined"} /> },
    { field: "file", headerName: "Файл", width: 100, sortable: false, renderCell: ({ row }) => row.file ? <Chip size="small" label="Есть" color="success" variant="outlined" /> : "—" },
    {
      field: "actions", headerName: "Действия", width: 185, sortable: false, filterable: false,
      renderCell: ({ row }) => (
        <div className={styles.rowActions} onClick={(event) => event.stopPropagation()}>
          <Tooltip title="Просмотр"><IconButton className={styles.actionButton} size="small" onClick={() => setPanel({ mode: "view", measurementId: row.id })}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Изменить"><IconButton className={styles.actionButton} size="small" onClick={() => setPanel({ mode: "edit", measurementId: row.id })}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={row.file ? "Скачать файл" : "Файл не прикреплён"}><span className={styles.actionButtonWrapper}><IconButton className={styles.actionButton} size="small" disabled={!row.file} onClick={() => void download(row)}><DownloadOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title="Удалить"><IconButton className={styles.actionButton} size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
        </div>
      ),
    },
  ], []);

  const handleLogout = () => logoutMutation.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) });

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Avatar sx={{ width: 38, height: 38, bgcolor: "primary.main" }}><ScienceOutlinedIcon fontSize="small" /></Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.15 }}>Результаты измерений</Typography>
            <Typography variant="caption" color="text.secondary">Административный портал</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>{currentUser.data?.data.login}</Typography>
          <Tooltip title="Выйти"><IconButton onClick={handleLogout} disabled={logoutMutation.isPending}><LogoutIcon /></IconButton></Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, gap: 2, mb: 3 }}>
          <Typography variant="h4">Измерения</Typography>
          <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setPanel({ mode: "create" })}>Добавить запись</Button>
        </Stack>

        <MeasurementFiltersPanel
          value={draftFilters}
          onChange={setDraftFilters}
          onApply={() => { setFilters(draftFilters); setPagination((current) => ({ ...current, page: 0 })); }}
          onReset={() => { setDraftFilters(emptyFilters); setFilters(emptyFilters); setPagination({ page: 0, pageSize: 20 }); }}
          disabled={measurementsQuery.isFetching}
        />

        <Paper variant="outlined" sx={{ mt: 2.5, height: 570, overflow: "hidden" }}>
          {measurementsQuery.isError && !(measurementsQuery.error instanceof ApiError && measurementsQuery.error.status === 401) ? (
            <Alert severity="error" sx={{ m: 2 }}>{measurementsQuery.error instanceof ApiError ? measurementsQuery.error.message : "Не удалось загрузить таблицу"}</Alert>
          ) : (
            <DataGrid
              rows={measurementsQuery.data?.data ?? []}
              columns={columns}
              loading={measurementsQuery.isFetching}
              rowCount={measurementsQuery.data?.pagination.total ?? 0}
              paginationMode="server"
              paginationModel={pagination}
              onPaginationModelChange={setPagination}
              pageSizeOptions={[20, 50, 100]}
              disableColumnFilter
              disableColumnMenu
              disableRowSelectionOnClick
              onRowDoubleClick={({ row }) => setPanel({ mode: "view", measurementId: row.id })}
              localeText={{
                noRowsLabel: "Записей пока нет",
                noResultsOverlayLabel: "По фильтрам ничего не найдено",
                paginationRowsPerPage: "Строк на странице:",
                paginationDisplayedRows: ({ from, to, count }) => `${from}–${to} из ${count}`,
                paginationItemAriaLabel: (type) => ({
                  first: "Первая страница",
                  last: "Последняя страница",
                  previous: "Предыдущая страница",
                  next: "Следующая страница",
                })[type],
              }}
              sx={{
                border: 0,
                "& .MuiDataGrid-columnHeaders": { backgroundColor: "#eef4f6" },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
                "& .MuiDataGrid-row": { cursor: "pointer" },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
              }}
            />
          )}
        </Paper>
      </Container>

      <MeasurementDrawer state={panel} onClose={() => setPanel(null)} onModeChange={setPanel} onDelete={setDeleteTarget} notify={showNotice} />

      <Dialog open={deleteTarget !== null} onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}>
        <DialogTitle>Удалить запись?</DialogTitle>
        <DialogContent><DialogContentText>Запись «{deleteTarget?.sampleName}» и прикреплённый файл будут удалены. Это действие нельзя отменить.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Отмена</Button>
          <Button variant="contained" color="error" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>{deleteMutation.isPending ? "Удаляем…" : "Удалить"}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notice !== null} autoHideDuration={4500} onClose={() => setNotice(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={notice?.severity ?? "success"} variant="filled" onClose={() => setNotice(null)}>{notice?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
