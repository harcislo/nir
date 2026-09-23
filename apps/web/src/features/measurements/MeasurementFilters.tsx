import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Button, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { MeasurementFilters } from "../../types";
import styles from "./MeasurementFilters.module.css";

export const emptyFilters: MeasurementFilters = {
  dateFrom: "",
  dateTo: "",
  sampleName: "",
  sampleNumber: "",
  organization: "",
  customer: "",
  mode1: "",
  mode2: "",
  mode3: "",
  isReference: "",
  isRepair: "",
  hasFile: "",
};

interface MeasurementFiltersProps {
  value: MeasurementFilters;
  onChange: (value: MeasurementFilters) => void;
  onApply: () => void;
  onReset: () => void;
  disabled?: boolean;
}

const booleanOptions = [
  { value: "", label: "Все" },
  { value: "true", label: "Да" },
  { value: "false", label: "Нет" },
] as const;

export function MeasurementFiltersPanel({
  value,
  onChange,
  onApply,
  onReset,
  disabled,
}: MeasurementFiltersProps) {
  const setField = <K extends keyof MeasurementFilters>(field: K, fieldValue: MeasurementFilters[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <Paper variant="outlined" className={styles.panel}>
      <div className={styles.header}>
        <div>
          <Typography variant="h6">Фильтры</Typography>
          <Typography variant="body2" color="text.secondary">
            Применяются на сервере ко всем записям
          </Typography>
        </div>
        <div className={styles.actions}>
          <Button startIcon={<RestartAltIcon />} color="inherit" onClick={onReset} disabled={disabled}>
            Сбросить
          </Button>
          <Button startIcon={<FilterAltOutlinedIcon />} variant="contained" onClick={onApply} disabled={disabled}>
            Применить
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        <DatePicker
          label="Дата от"
          value={value.dateFrom ? dayjs(value.dateFrom) : null}
          onChange={(date) => setField("dateFrom", date?.isValid() ? date.format("YYYY-MM-DD") : "")}
          slotProps={{ textField: { fullWidth: true, size: "small", className: styles.dateField } }}
        />
        <DatePicker
          label="Дата до"
          value={value.dateTo ? dayjs(value.dateTo) : null}
          onChange={(date) => setField("dateTo", date?.isValid() ? date.format("YYYY-MM-DD") : "")}
          slotProps={{ textField: { fullWidth: true, size: "small", className: styles.dateField } }}
        />
        <TextField label="Название образца" value={value.sampleName} onChange={(event) => setField("sampleName", event.target.value)} />
        <TextField label="Номер образца" value={value.sampleNumber} onChange={(event) => setField("sampleNumber", event.target.value)} />
        <TextField label="Организация" value={value.organization} onChange={(event) => setField("organization", event.target.value)} />
        <TextField label="Заказчик" value={value.customer} onChange={(event) => setField("customer", event.target.value)} />
        <TextField label="Режим 1" value={value.mode1} onChange={(event) => setField("mode1", event.target.value)} />
        <TextField label="Режим 2" value={value.mode2} onChange={(event) => setField("mode2", event.target.value)} />
        <TextField label="Режим 3" value={value.mode3} onChange={(event) => setField("mode3", event.target.value)} />
        <TextField select label="Эталон" value={value.isReference} onChange={(event) => setField("isReference", event.target.value as MeasurementFilters["isReference"])}>
          {booleanOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
        <TextField select label="Ремонт" value={value.isRepair} onChange={(event) => setField("isRepair", event.target.value as MeasurementFilters["isRepair"])}>
          {booleanOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
        <TextField select label="Наличие файла" value={value.hasFile} onChange={(event) => setField("hasFile", event.target.value as MeasurementFilters["hasFile"])}>
          {booleanOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
      </div>
    </Paper>
  );
}
