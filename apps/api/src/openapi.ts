import { config } from "./config.js";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Measurement Portal API",
    version: "0.1.0",
    description: "API MVP портала результатов измерений",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Health", description: "Состояние сервиса" },
    { name: "Auth", description: "Сессия администратора" },
    { name: "Measurements", description: "Результаты измерений" },
    { name: "Files", description: "Файлы измерений" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: config.SESSION_COOKIE_NAME,
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Переданы некорректные данные" },
              details: {},
            },
          },
        },
      },
      User: {
        type: "object",
        required: ["id", "login"],
        properties: {
          id: { type: "string", format: "uuid" },
          login: { type: "string", example: "admin" },
        },
      },
      FileMetadata: {
        type: "object",
        required: ["id", "originalName", "size"],
        properties: {
          id: { type: "string", format: "uuid" },
          originalName: { type: "string", example: "measurement.pdf" },
          size: { type: "integer", maximum: 10485760, example: 524288 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      MeasurementInput: {
        type: "object",
        required: ["sampleName", "sampleNumber", "measurementDate"],
        properties: {
          sampleName: { type: "string", maxLength: 255, example: "Образец А" },
          sampleNumber: { type: "string", maxLength: 100, example: "A-125" },
          organization: { type: ["string", "null"], maxLength: 255, example: "ООО Тест" },
          customer: { type: ["string", "null"], maxLength: 255, example: "НИИ" },
          mode1: { type: ["string", "null"], maxLength: 255, example: "R1" },
          mode2: { type: ["string", "null"], maxLength: 255, example: "R2" },
          mode3: { type: ["string", "null"], maxLength: 255, example: "R3" },
          measurementDate: { type: "string", format: "date", example: "2026-09-21" },
          measurementTime: { type: ["string", "null"], format: "time", example: "13:20" },
          isReference: { type: "boolean", default: false },
          isRepair: { type: "boolean", default: false },
        },
      },
      MeasurementPatch: {
        type: "object",
        minProperties: 1,
        properties: {
          sampleName: { $ref: "#/components/schemas/MeasurementInput/properties/sampleName" },
          sampleNumber: { $ref: "#/components/schemas/MeasurementInput/properties/sampleNumber" },
          organization: { $ref: "#/components/schemas/MeasurementInput/properties/organization" },
          customer: { $ref: "#/components/schemas/MeasurementInput/properties/customer" },
          mode1: { $ref: "#/components/schemas/MeasurementInput/properties/mode1" },
          mode2: { $ref: "#/components/schemas/MeasurementInput/properties/mode2" },
          mode3: { $ref: "#/components/schemas/MeasurementInput/properties/mode3" },
          measurementDate: { $ref: "#/components/schemas/MeasurementInput/properties/measurementDate" },
          measurementTime: { $ref: "#/components/schemas/MeasurementInput/properties/measurementTime" },
          isReference: { $ref: "#/components/schemas/MeasurementInput/properties/isReference" },
          isRepair: { $ref: "#/components/schemas/MeasurementInput/properties/isRepair" },
        },
      },
      Measurement: {
        allOf: [
          { $ref: "#/components/schemas/MeasurementInput" },
          {
            type: "object",
            required: ["id", "file", "createdAt", "updatedAt"],
            properties: {
              id: { type: "string", format: "uuid" },
              file: {
                oneOf: [{ $ref: "#/components/schemas/FileMetadata" }, { type: "null" }],
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
    },
    responses: {
      Unauthorized: {
        description: "Требуется авторизация",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Ресурс не найден",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ValidationError: {
        description: "Ошибка валидации",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  paths: {
    "/health/live": {
      get: {
        tags: ["Health"],
        summary: "Проверить, что процесс работает",
        responses: { "200": { description: "Процесс работает" } },
      },
    },
    "/health/ready": {
      get: {
        tags: ["Health"],
        summary: "Проверить PostgreSQL и Object Storage",
        responses: {
          "200": { description: "Сервис готов" },
          "503": { description: "Одна из зависимостей недоступна" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Войти",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["login", "password"],
                properties: {
                  login: { type: "string", example: "admin" },
                  password: { type: "string", format: "password", example: "admin" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Вход выполнен, HttpOnly cookie установлена",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { description: "Слишком много попыток входа" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Выйти",
        responses: { "204": { description: "Сессия завершена" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Получить текущего администратора",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Текущий администратор",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/measurements": {
      get: {
        tags: ["Measurements"],
        summary: "Получить таблицу измерений",
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", enum: [20, 50, 100], default: 20 } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
          { name: "sampleName", in: "query", schema: { type: "string" } },
          { name: "sampleNumber", in: "query", schema: { type: "string" } },
          { name: "organization", in: "query", schema: { type: "string" } },
          { name: "customer", in: "query", schema: { type: "string" } },
          { name: "mode1", in: "query", schema: { type: "string" } },
          { name: "mode2", in: "query", schema: { type: "string" } },
          { name: "mode3", in: "query", schema: { type: "string" } },
          { name: "isReference", in: "query", schema: { type: "boolean" } },
          { name: "isRepair", in: "query", schema: { type: "boolean" } },
          { name: "hasFile", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          "200": { description: "Страница измерений" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Measurements"],
        summary: "Создать измерение без файла",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MeasurementInput" } } },
        },
        responses: {
          "201": { description: "Измерение создано" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/measurements/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      get: {
        tags: ["Measurements"],
        summary: "Получить измерение",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "Измерение" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Measurements"],
        summary: "Изменить измерение",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MeasurementPatch" } } },
        },
        responses: {
          "200": { description: "Измерение обновлено" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Measurements"],
        summary: "Удалить измерение и связанный файл",
        security: [{ sessionCookie: [] }],
        responses: {
          "204": { description: "Измерение удалено" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/measurements/{id}/file": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      post: {
        tags: ["Files"],
        summary: "Добавить или заменить файл",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Файл заменён" },
          "201": { description: "Файл добавлен" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      get: {
        tags: ["Files"],
        summary: "Скачать файл",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "Файл", content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } } },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Files"],
        summary: "Удалить файл",
        security: [{ sessionCookie: [] }],
        responses: {
          "204": { description: "Файл удалён" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
} as const;
