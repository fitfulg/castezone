const DATA_URL = "zonas.csv?v=2026-05-26-p3";
const MIN_SEARCH_LENGTH = 2;
const REQUIRED_COLUMNS = ["barrio_codigo", "barrio", "zona_codigo", "zona"];

const state = {
  rows: [],
  query: "",
};

const elements = {
  dataStatus: document.querySelector("#dataStatus"),
  input: document.querySelector("#searchInput"),
  message: document.querySelector("#message"),
  results: document.querySelector("#results"),
  resultsCount: document.querySelector("#resultsCount"),
  resultsTitle: document.querySelector("#resultsTitle"),
  template: document.querySelector("#resultTemplate"),
};

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

function rowsFromCsv(text) {
  const csvRows = parseCsv(text).filter((row) => row.some((cell) => String(cell).trim()));
  const headers = csvRows.shift()?.map((header) => header.replace(/^\uFEFF/, "").trim()) ?? [];
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    throw new Error(`Faltan columnas: ${missingColumns.join(", ")}`);
  }

  return csvRows.map((row) => {
    const record = {};
    REQUIRED_COLUMNS.forEach((column) => {
      const columnIndex = headers.indexOf(column);
      record[column] = String(row[columnIndex] ?? "").trim();
    });
    return record;
  });
}

function getMatchScore(row, normalizedQuery) {
  const zone = normalizeText(row.zona);
  const neighborhood = normalizeText(row.barrio);

  if (zone.startsWith(normalizedQuery)) return 0;
  if (neighborhood.startsWith(normalizedQuery)) return 1;
  if (zone.includes(normalizedQuery)) return 2;
  if (neighborhood.includes(normalizedQuery)) return 3;

  return Number.POSITIVE_INFINITY;
}

function searchRows(query) {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
    return [];
  }

  return state.rows
    .map((row) => ({ row, score: getMatchScore(row, normalizedQuery) }))
    .filter((result) => Number.isFinite(result.score))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.row.zona.localeCompare(b.row.zona, "es", { sensitivity: "base" });
    })
    .map((result) => result.row);
}

function setMessage(text, type = "info") {
  elements.message.textContent = text;
  elements.message.classList.toggle("error", type === "error");
  elements.message.hidden = false;
  elements.results.hidden = true;
  elements.resultsCount.textContent = "";
}

function copyText(value, button) {
  const setCopied = () => {
    const previousText = button.textContent;
    button.textContent = "Copiado";
    window.setTimeout(() => {
      button.textContent = previousText;
    }, 1200);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(setCopied).catch(() => fallbackCopy(value, setCopied));
  } else {
    fallbackCopy(value, setCopied);
  }
}

function fallbackCopy(value, onSuccess) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  onSuccess();
}

function createResultCard(row) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector(".result-card");
  const copyButton = fragment.querySelector(".copy-button");

  fragment.querySelector(".zone-name").textContent = row.zona || "Zona sin nombre";
  fragment.querySelector(".zone-code").textContent = row.zona_codigo || "Sin codigo";
  fragment.querySelector(".neighborhood").textContent = row.barrio || "Sin barrio";
  fragment.querySelector(".neighborhood-code").textContent = row.barrio_codigo || "Sin codigo";

  copyButton.disabled = !row.zona_codigo;
  copyButton.addEventListener("click", () => copyText(row.zona_codigo, copyButton));

  return card;
}

function renderResults() {
  const query = elements.input.value;
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
    setMessage("Escribe al menos 2 letras para ver resultados.");
    return;
  }

  const matches = searchRows(query);

  if (matches.length === 0) {
    setMessage("No hay resultados para esa busqueda.");
    return;
  }

  elements.results.replaceChildren(...matches.map(createResultCard));
  elements.message.hidden = true;
  elements.results.hidden = false;
  elements.resultsCount.textContent = `${matches.length} resultado${matches.length === 1 ? "" : "s"}`;
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`No se pudo cargar ${DATA_URL}`);
    }

    const csvText = await response.text();
    state.rows = rowsFromCsv(csvText);
    elements.dataStatus.textContent = `${state.rows.length} zonas cargadas`;
    renderResults();
  } catch (error) {
    elements.dataStatus.textContent = "Datos no disponibles";
    setMessage(error.message || "No se pudieron cargar los datos.", "error");
  }
}

elements.input.addEventListener("input", renderResults);
loadData();
