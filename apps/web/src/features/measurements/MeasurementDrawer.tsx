import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Measurement, PanelState } from "../../types";
import { ApiError } from "../../shared/api/client";
import {
  createMeasurement,
  deleteMeasurementFile,
  downloadMeasurementFile,
  getMeasurement,
  updateMeasurement,
  uploadMeasurementFile,
} from "../../shared/api/measurements";
import {
  emptyMeasurementForm,
  formToMeasurementInput,
  measurementFormSchema,
  measurementToForm,
  type MeasurementFormValues,
} from "./measurement-form";
import styles from "./MeasurementDrawer.module.css";

interface MeasurementDrawerProps {
  state: PanelState;
  onClose: () => void;
  onModeChange: (state: PanelState) => void;
  onDelete: (measurement: Measurement) => void;
  notify: (message: string, severity?: "success" | "warning" | "error") => void;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} Б`;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  return `${(size / 1024).toFixed(1)} КБ`;
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <Typography variant="caption" color="text.secondary" className={styles.detailLabel}>
        {label}
      </Typography>
      <Typography variant="body1">{value || "—"}</Typography>
    </div>
  );
}

export function MeasurementDrawer({ state, onClose, onModeChange, onDelete, notify }: MeasurementDrawerProps) {
  const queryClient = useQueryClient();
  const measurementId = state && state.mode !== "create" ? state.measurementId : null;
  const measurementQuery = useQuery({
    queryKey: ["measurements", "detail", measurementId],
    queryFn: () => getMeasurement(measurementId!),
    enabled: Boolean(measurementId),
  });
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    setDirty(false);
    setConfirmClose(false);
  }, [state]);

  const requestClose = () => {
    if (dirty) setConfirmClose(true);
    else onClose();
  };

  const measurement = measurementQuery.data?.data;
  const title = state?.mode === "create" ? "Новая запись" : state?.mode === "edit" ? "Редактирование" : "Просмотр записи";

  return (
    <>
      <Drawer
        anchor="right"
        open={state !== null}
        onClose={requestClose}
        slotProps={{ paper: { className: styles.drawerPaper } }}
      >
        <div className={styles.drawerLayout}>
          <div className={styles.drawerHeader}>
            <div>
              <Typography variant="h5">{title}</Typography>
              {measurement && <Typography variant="body2" color="text.secondary">{measurement.sampleNumber}</Typography>}
            </div>
            <IconButton aria-label="Закрыть" onClick={requestClose}><CloseIcon /></IconButton>
          </div>
          <Divider />

          {measurementQuery.isLoading && state?.mode !== "create" ? (
            <div className={styles.loading}><CircularProgress /></div>
          ) : measurementQuery.isError && state?.mode !== "create" ? (
            <Alert severity="error" className={styles.loadError}>
              {measurementQuery.error instanceof ApiError ? measurementQuery.error.message : "Не удалось загрузить запись"}
            </Alert>
          ) : state?.mode === "view" && measurement ? (
            <MeasurementView
              measurement={measurement}
              onEdit={() => onModeChange({ mode: "edit", measurementId: measurement.id })}
              onDelete={() => onDelete(measurement)}
              notify={notify}
            />
          ) : state && (state.mode === "create" || (state.mode === "edit" && measurement)) ? (
            <MeasurementForm
              mode={state.mode}
              {...(measurement ? { measurement } : {})}
              onDirtyChange={setDirty}
              onCancel={requestClose}
              onSaved={(savedId, warning) => {
                setDirty(false);
                void queryClient.invalidateQueries({ queryKey: ["measurements"] });
                if (warning) notify(warning, "warning");
                else notify(state.mode === "create" ? "Запись создана" : "Изменения сохранены");
                if (state.mode === "create") onClose();
                else onModeChange({ mode: "view", measurementId: savedId });
              }}
              notify={notify}
            />
          ) : null}
        </div>
      </Drawer>

      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)}>
        <DialogTitle>Закрыть без сохранения?</DialogTitle>
        <DialogContent><DialogContentText>Внесённые изменения будут потеряны.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)}>Продолжить редактирование</Button>
          <Button color="error" onClick={() => { setConfirmClose(false); setDirty(false); onClose(); }}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function MeasurementView({ measurement, onEdit, onDelete, notify }: {
  measurement: Measurement;
  onEdit: () => void;
  onDelete: () => void;
  notify: MeasurementDrawerProps["notify"];
}) {
  const download = async () => {
    if (!measurement.file) return;
    try {
      await downloadMeasurementFile(measurement.id, measurement.file.originalName);
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "Не удалось скачать файл", "error");
    }
  };

  return (
    <div className={styles.view}>
      <div className={styles.content}>
        <div className={styles.detailGrid}>
          <DetailItem label="Название образца" value={measurement.sampleName} />
          <DetailItem label="Номер образца" value={measurement.sampleNumber} />
          <DetailItem label="Организация" value={measurement.organization} />
          <DetailItem label="Заказчик" value={measurement.customer} />
          <DetailItem label="Режим 1" value={measurement.mode1} />
          <DetailItem label="Режим 2" value={measurement.mode2} />
          <DetailItem label="Режим 3" value={measurement.mode3} />
          <DetailItem label="Дата измерения" value={dayjs(measurement.measurementDate).format("DD.MM.YYYY")} />
          <DetailItem label="Время измерения" value={measurement.measurementTime?.slice(0, 5)} />
          <DetailItem label="Эталон" value={<Chip size="small" label={measurement.isReference ? "Да" : "Нет"} color={measurement.isReference ? "primary" : "default"} />} />
          <DetailItem label="Ремонт" value={<Chip size="small" label={measurement.isRepair ? "Да" : "Нет"} color={measurement.isRepair ? "warning" : "default"} />} />
          <DetailItem label="Создано" value={dayjs(measurement.createdAt).format("DD.MM.YYYY HH:mm")} />
          <DetailItem label="Изменено" value={dayjs(measurement.updatedAt).format("DD.MM.YYYY HH:mm")} />
        </div>

        <Typography variant="h6" className={styles.sectionTitle}>Файл</Typography>
        {measurement.file ? (
          <Paper variant="outlined" className={styles.fileCard}>
            <div className={styles.fileRow}>
              <InsertDriveFileOutlinedIcon color="primary" />
              <div className={styles.fileInfo}>
                <Typography className={styles.fileName}>{measurement.file.originalName}</Typography>
                <Typography variant="body2" color="text.secondary">{formatBytes(measurement.file.size)}</Typography>
              </div>
              <Button startIcon={<DownloadOutlinedIcon />} onClick={() => void download()}>Скачать</Button>
            </div>
          </Paper>
        ) : <Alert severity="info">Файл к записи не прикреплён.</Alert>}
      </div>
      <Divider />
      <div className={styles.footer}>
        <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete}>Удалить</Button>
        <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={onEdit}>Изменить</Button>
      </div>
    </div>
  );
}

function MeasurementForm({ mode, measurement, onDirtyChange, onCancel, onSaved, notify }: {
  mode: "create" | "edit";
  measurement?: Measurement;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onSaved: (id: string, warning?: string) => void;
  notify: MeasurementDrawerProps["notify"];
}) {
  const queryClient = useQueryClient();
  const defaults = useMemo(() => measurement ? measurementToForm(measurement) : emptyMeasurementForm, [measurement]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const form = useForm<MeasurementFormValues>({ resolver: zodResolver(measurementFormSchema), defaultValues: defaults });

  useEffect(() => { form.reset(defaults); setFile(null); setFileError(null); setIsDraggingFile(false); }, [defaults, form]);
  useEffect(() => { onDirtyChange(form.formState.isDirty || file !== null); }, [file, form.formState.isDirty, onDirtyChange]);

  const saveMutation = useMutation({
    mutationFn: async (values: MeasurementFormValues) => {
      const result = mode === "create"
        ? await createMeasurement(formToMeasurementInput(values))
        : await updateMeasurement(measurement!.id, formToMeasurementInput(values));
      let warning: string | undefined;
      if (file) {
        try { await uploadMeasurementFile(result.data.id, file); }
        catch (error) { warning = error instanceof ApiError ? `Запись сохранена, но файл не загружен: ${error.message}` : "Запись сохранена, но файл не загружен"; }
      }
      return { id: result.data.id, warning };
    },
    onSuccess: ({ id, warning }) => onSaved(id, warning),
  });

  const removeFileMutation = useMutation({
    mutationFn: () => deleteMeasurementFile(measurement!.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["measurements"] }),
        queryClient.invalidateQueries({ queryKey: ["measurements", "detail", measurement!.id] }),
      ]);
      notify("Файл удалён");
    },
    onError: (error) => notify(error instanceof ApiError ? error.message : "Не удалось удалить файл", "error"),
  });

  const chooseFile = (selected: File | undefined) => {
    if (!selected) { setFile(null); setFileError(null); return; }
    if (selected.size > 10 * 1024 * 1024) { setFileError("Файл превышает максимальный размер 10 МБ"); setFile(null); return; }
    setFile(selected); setFileError(null);
  };

  const saveError = saveMutation.error instanceof ApiError ? saveMutation.error.message : saveMutation.isError ? "Не удалось сохранить запись" : null;

  return (
    <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className={styles.form}>
      {saveMutation.isPending && <LinearProgress />}
      <div className={styles.content}>
        {saveError && <Alert severity="error" className={styles.formError}>{saveError}</Alert>}
        <div className={styles.formGrid}>
          <TextField label="Название образца" required {...form.register("sampleName")} error={Boolean(form.formState.errors.sampleName)} helperText={form.formState.errors.sampleName?.message} />
          <TextField label="Номер образца" required {...form.register("sampleNumber")} error={Boolean(form.formState.errors.sampleNumber)} helperText={form.formState.errors.sampleNumber?.message} />
          <TextField label="Организация" {...form.register("organization")} />
          <TextField label="Заказчик" {...form.register("customer")} />
          <TextField label="Режим 1" {...form.register("mode1")} />
          <TextField label="Режим 2" {...form.register("mode2")} />
          <TextField label="Режим 3" {...form.register("mode3")} />
          <Controller name="measurementDate" control={form.control} render={({ field, fieldState }) => (
            <DatePicker label="Дата измерения *" value={field.value ? dayjs(field.value) : null} onChange={(date) => field.onChange(date?.isValid() ? date.format("YYYY-MM-DD") : "")} slotProps={{ textField: { size: "small", className: styles.dateTimeField, error: Boolean(fieldState.error), helperText: fieldState.error?.message } }} />
          )} />
          <Controller name="measurementTime" control={form.control} render={({ field, fieldState }) => (
            <TimePicker label="Время измерения" ampm={false} value={field.value ? dayjs(`2000-01-01T${field.value}`) : null} onChange={(time) => field.onChange(time?.isValid() ? time.format("HH:mm") : "")} slotProps={{ textField: { size: "small", className: styles.dateTimeField, error: Boolean(fieldState.error), helperText: fieldState.error?.message } }} />
          )} />
          <div className={styles.checkRow}>
            <Controller name="isReference" control={form.control} render={({ field }) => <FormControlLabel control={<Checkbox checked={field.value} onChange={(_, checked) => field.onChange(checked)} />} label="Эталон" />} />
            <Controller name="isRepair" control={form.control} render={({ field }) => <FormControlLabel control={<Checkbox checked={field.value} onChange={(_, checked) => field.onChange(checked)} />} label="Ремонт" />} />
          </div>
        </div>

        <Typography variant="h6" className={styles.sectionTitle}>Файл</Typography>
        {measurement?.file && !file && (
          <Paper variant="outlined" className={styles.existingFileCard}>
            <div className={styles.existingFileRow}>
              <InsertDriveFileOutlinedIcon color="primary" />
              <div className={styles.fileInfo}><Typography className={styles.fileName}>{measurement.file.originalName}</Typography><Typography variant="body2" color="text.secondary">{formatBytes(measurement.file.size)}</Typography></div>
              <Button color="error" size="small" disabled={removeFileMutation.isPending} onClick={() => removeFileMutation.mutate()}>Удалить файл</Button>
            </div>
          </Paper>
        )}
        {file && <Alert severity="success" className={styles.fileFeedback}>Выбран файл: {file.name} ({formatBytes(file.size)})</Alert>}
        {fileError && <Alert severity="error" className={styles.fileFeedback}>{fileError}</Alert>}
        <div
          className={`${styles.dropZone} ${isDraggingFile ? styles.dropZoneActive : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDraggingFile(true); }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setIsDraggingFile(true); }}
          onDragLeave={(event) => {
            if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
            setIsDraggingFile(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingFile(false);
            chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <Typography className={styles.dropPrompt}>
            {isDraggingFile ? "Отпустите файл здесь" : "Перетащите файл сюда или выберите его вручную"}
          </Typography>
          <Button component="label" variant="outlined" startIcon={mode === "create" && !measurement?.file ? <AddIcon /> : <UploadFileOutlinedIcon />}>
            {measurement?.file ? "Заменить файл" : "Выбрать файл"}
            <input hidden type="file" onChange={(event) => { chooseFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          </Button>
          <Typography variant="caption" color="text.secondary" className={styles.fileHint}>Можно загрузить файл любого типа размером до 10 МБ.</Typography>
        </div>
      </div>
      <Divider />
      <div className={`${styles.footer} ${styles.formFooter}`}>
        <Button color="inherit" onClick={onCancel} disabled={saveMutation.isPending}>Отмена</Button>
        <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
