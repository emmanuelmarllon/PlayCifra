/* ------------------------------------------------------------------
   ╔═╗┬  ┌─┐┬ ┬┬ ┬  PlayCifra – core script
   ╚═╗│  │ ││ │└┬┘  2025 • by Marlon Emanuel
   ╚═╝┴─┘└─┘└─┘ ┴    -------------------------------------------------
------------------------------------------------------------------- */
/*********************** STORAGE *************************/
const STORAGE_KEY = "adols_songs";
const getSongs = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const setSongs = (arr) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
/* ────────────────────────────────────────────────────────────────────────
   2.  DOM  REFERENCES
   ────────────────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

// 2.1 – Área principal
const tabsEl = $("tabs");
const contentsEl = $("contents");
const searchInput = $("searchInput");
const noResults = $("noResults");

// 2.2 – Toolbar
const topBtn = $("topBtn");
const openAddBtn = $("openModal");
const openDelBtn = $("openDeleteModal");
const openEditListBtn = $("openEditModal");
const openViewModal = $("openViewModal");
const exportBtn = $("exportBtn");
const importBtn = $("importBtn");
const importFile = $("importFile");
const importAppendBtn = $("importAppendBtn");
const importAppendFile = $("importAppendFile");
const filterFavoritesBtn = $("filterFavoritesBtn");

// 2.3 – Modais
const addEditModal = $("modal");
const deleteModal = $("deleteModal");
const editListModal = $("editListModal");
const viewModal = $("viewModal");

// 2.4 – Campos Add/Edit
const modalTitle = $("modalTitle");
const titleField = $("titleField");
const keyField = $("keyField");
const capoCheck = $("capoCheck");
const capoCasa = $("capoCasa");
const ritmoField = $("ritmoField");
const cifraField = $("cifraField");
const ytLinkField = $("ytLinkField");
const cancelBtn = $("cancelBtn");
const saveBtn = $("saveBtn");

// 2.5 – Campos Delete / Edit / View
const searchDeleteInput = $("searchDeleteInput");
const deleteListEl = $("deleteSongList");
const showMoreDelete = $("showMoreDelete");
const closeDeleteModal = $("closeDeleteModal");

const searchEditInput = $("searchEditInput");
const editListEl = $("editSongList");
const showMoreEdit = $("showMoreEdit");
const closeEditListModal = $("closeEditListModal");

const searchViewInput = $("searchViewInput");
const viewListEl = $("viewSongList");
const showMoreView = $("showMoreView");
const closeViewModal = $("closeViewModal");

// 2.6 – Scroll
const speedValueEl = $("speedValue");
const decBtn = $("decreaseSpeed");
const incBtn = $("increaseSpeed");
const toggleDownBtn = $("toggleDown");

// 2.7 – Tema
const themeToggle = $("themeToggle");

/* ────────────────────────────────────────────────────────────────────────
   3.  RUNTIME STATE
   ────────────────────────────────────────────────────────────────────── */
let songs = getSongs();
let activeSongId = null;
let editingId = null;
let filterFavorites = false;

// scroll
let speed = 0;
const SPEED_STEP = 0.2;
let scrollTicker = null;
let scrollAcc = 0;

// paginação
let delOffset = 0;
let editOffset = 0;
let viewOffset = 0;
const PAGE_STEP = 5;

/* ────────────────────────────────────────────────────────────────────────
   4.  HELPERS
   ────────────────────────────────────────────────────────────────────── */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const CHORD_RE =
  /\b([A-G](?:#|b)?(?:7M|maj7|m7b5|m7|m|7sus4|7sus2|7|sus4|sus2|dim7?|aug|add9?|6|9|11|13|4)?(?:\(\#?\d+\))?(?:\/[A-G](?:#|b)?)?)\b/gi;
const markChords = (t) => t.replace(CHORD_RE, '<span class="acorde">$1</span>');

const ICONS = { cima: "⬆", baixo: "⬇" };
const toArrows = (text) =>
  text
    .split(" ")
    .map((w) => ICONS[w.toLowerCase()] || w)
    .join(" ");

const youtubeId = (url) =>
  url?.match(
    /^(?:.*(?:youtu\.be\/|v\/|embed\/|watch\?v=))([^#&?]{11}).*/
  )?.[1] || null;

const copyToClipboard = (t) =>
  navigator.clipboard.writeText(t).then(() => alert("Cifra copiada!"));

/* ────────────────────────────────────────────────────────────────────────
   5.  SCROLL CONTROL
   ────────────────────────────────────────────────────────────────────── */
function refreshSpeedUI() {
  speedValueEl.textContent = speed.toFixed(1);
  toggleDownBtn.disabled = speed === 0;
}
function startAutoScroll() {
  if (scrollTicker || speed === 0) return;
  toggleDownBtn.textContent = "Parar ↓";
  scrollAcc = 0;
  scrollTicker = setInterval(() => {
    scrollAcc += speed;
    const px = Math.floor(scrollAcc);
    if (px) {
      window.scrollBy(0, px);
      scrollAcc -= px;
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight)
      stopAutoScroll();
  }, 16);
}
function stopAutoScroll() {
  clearInterval(scrollTicker);
  scrollTicker = null;
  toggleDownBtn.textContent = "Auto ↓";
}
toggleDownBtn.onclick = () =>
  scrollTicker ? stopAutoScroll() : startAutoScroll();
incBtn.onclick = () => {
  speed = Math.min(10, speed + SPEED_STEP);
  refreshSpeedUI();
  if (scrollTicker) {
    stopAutoScroll();
    startAutoScroll();
  }
};
decBtn.onclick = () => {
  speed = Math.max(0, speed - SPEED_STEP);
  refreshSpeedUI();
  if (scrollTicker) {
    stopAutoScroll();
    if (speed) startAutoScroll();
  }
};
topBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
window.addEventListener("scroll", () => {
  topBtn.style.display = window.scrollY > 100 ? "block" : "none";
});
topBtn.style.display = "none";
refreshSpeedUI();

/* ────────────────────────────────────────────────────────────────────────
   6.  RENDERING
   ────────────────────────────────────────────────────────────────────── */
function render(list = songs, keepActive = activeSongId) {
  /* ========== 1. Filtro / quais abas mostrar ========== */
  const query = searchInput.value.trim().toLowerCase();
  let visible = query
    ? list // se está pesquisando → todas
    : list.slice(0, 5); // senão → só 5

  console.log("🔍 query:", query || "(vazio)");
  console.table(visible.map((s) => s.title));

  /* ========== 2. “current” = música que deve ficar em 1º ========== */
  const current = keepActive && list.find((s) => s.id === keepActive);
  console.log("🎯 current", current ? current.title : "nenhum");

  if (current) {
    visible = [current, ...visible.filter((s) => s.id !== current.id)];
  }
  console.table(visible.map((s) => s.title));

  /* ========== 3. Limpa DOM ========== */
  tabsEl.innerHTML = "";
  contentsEl.innerHTML = "";

  /* ========== 4. Painéis (de TODAS as músicas) ========== */
  list.forEach((song) => {
    const pane = document.createElement("div");
    pane.className = "tab-content";
    pane.id = song.id;

    const iframe = song.ytId
      ? `<iframe src="https://www.youtube.com/embed/${song.ytId}"
                 width="300" height="169" allowfullscreen
                 style="float:right;margin-left:15px;border-radius:10px;"></iframe>`
      : "";

    const copyBtn = `<button class="copy-btn"
                     onclick="copiarTexto(\`${song.cifra.replace(
                       /`/g,
                       "\\`"
                     )}\`)">Copiar cifra</button>`;

    pane.innerHTML = `${iframe}${copyBtn}
                      <pre><code>${markChords(song.cifra)}</code></pre>`;
    contentsEl.appendChild(pane);
  });

  /* ========== 5. Abas (apenas as “visíveis”) ========== */
  visible.forEach((song) => {
    const tab = document.createElement("button");
    tab.className = "tab-button";
    tab.dataset.id = song.id;
    tab.innerHTML = `
      ${song.title}
      <span class="fav-heart" style="color:${
        song.favorite ? "red" : "#ccc"
      }">❤</span>`;

    /* toggle favorito */
    tab.querySelector(".fav-heart").onclick = (e) => {
      e.stopPropagation();
      song.favorite = !song.favorite;
      setSongs(songs);
      render(
        filterFavorites ? songs.filter((s) => s.favorite) : songs,
        activeSongId
      );
    };

    /* ativar (clique na aba) */
    tab.onclick = (e) => {
      if (!e.target.classList.contains("fav-heart")) activate(song.id);
    };

    tabsEl.appendChild(tab);
  });

  /* ========== 6. Ativa aba / painel ========== */
  if (visible.length) {
    activate(current ? current.id : visible[0].id);
  }

  noResults.style.display = visible.length ? "none" : "block";
}

function activate(id) {
  activeSongId = id;
  document
    .querySelectorAll(".tab-button")
    .forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  document
    .querySelectorAll(".tab-content")
    .forEach((p) => p.classList.toggle("active", p.id === id));
}

/* ────────────────────────────────────────────────────────────────────────
   7.  CRUD – Add / Edit / Delete / View helpers
   ────────────────────────────────────────────────────────────────────── */
/*********************** ADD / EDIT *************************/
openAddBtn.onclick = () => openEditModal(null);
function openEditModal(id) {
  editingId = id;
  modalTitle.textContent = id ? "Editar Música" : "Nova Música";
  if (id) {
    const song = songs.find((s) => s.id === id);
    titleField.value = song.title;
    keyField.value = song.cifra.match(/Tom: (.*)/)?.[1] || "";
    const capoLine = song.cifra.match(/Capotraste: (.*)/)?.[1] || "";
    if (capoLine !== "Não usa") {
      capoCheck.checked = true;
      const num = parseInt(capoLine, 10);
      capoCasa.value = isNaN(num) ? "" : num;
      capoCasa.style.display = "inline-block";
    } else {
      capoCheck.checked = false;
      capoCasa.value = "";
      capoCasa.style.display = "none";
    }
    ritmoField.value = song.cifra.match(/Ritmo: (.*)/)?.[1] || "";
    cifraField.value = song.cifra.split("\n\n").slice(1).join("\n\n");
    ytLinkField.value = song.ytId
      ? `https://www.youtube.com/watch?v=${song.ytId}`
      : "";
  } else {
    [titleField, keyField, ritmoField, cifraField, ytLinkField].forEach(
      (i) => (i.value = "")
    );
    capoCheck.checked = false;
    capoCasa.value = "";
    capoCasa.style.display = "none";
  }
  addEditModal.style.display = "block";
}
cancelBtn.onclick = () => (addEditModal.style.display = "none");
capoCheck.onchange = () =>
  (capoCasa.style.display = capoCheck.checked ? "inline-block" : "none");
saveBtn.onclick = () => {
  const title = titleField.value.trim();
  const cifraTexto = cifraField.value.trim();
  const ritmoTexto = ritmoField.value.trim();
  const ytUrl = ytLinkField.value.trim();
  if (!title || !cifraTexto) return alert("Título e cifra obrigatórios!");
  const ritmoConv = toArrows(ritmoTexto);
  const capoTxt = capoCheck.checked
    ? `${+capoCasa.value || 1}ª Casa`
    : "Não usa";
  const full = `Tom: ${
    keyField.value || "N/D"
  }\nCapotraste: ${capoTxt}\nRitmo: ${ritmoConv || "N/D"}\n\n${cifraTexto}`;
  let id = editingId || slug(title);
  if (!editingId && songs.some((s) => s.id === id))
    return alert("Já existe música com esse título");
  const ytId = youtubeId(ytUrl);
  if (editingId) {
    const song = songs.find((s) => s.id === editingId);
    song.title = title;
    song.cifra = full;
    song.ytId = ytId;
    if (typeof song.favorite === "undefined") song.favorite = false;
  } else {
    songs.push({ id, title, cifra: full, ytId, favorite: false });
  }
  setSongs(songs);
  render(filterFavorites ? songs.filter((s) => s.favorite) : songs, id);
  addEditModal.style.display = "none";
};

/*********************** DELETE MODAL *****************/
openDelBtn.onclick = () => {
  delOffset = 0;
  searchDeleteInput.value = "";
  fillDelete();
  deleteModal.style.display = "block";
};
closeDeleteModal.onclick = () => (deleteModal.style.display = "none");
searchDeleteInput.oninput = () => {
  delOffset = 0;
  fillDelete();
};
showMoreDelete.onclick = () => {
  delOffset += PAGE_STEP;
  fillDelete();
};
function fillDelete() {
  deleteListEl.innerHTML = "";
  const q = searchDeleteInput.value.toLowerCase();
  const filtered = songs.filter((s) => s.title.toLowerCase().includes(q));
  const slice = filtered.slice(0, delOffset + PAGE_STEP);
  slice.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class='song-delete-box'><span>${s.title}</span><button data-id='${s.id}'>🗑️</button></div>`;
    deleteListEl.appendChild(li);
  });
  deleteListEl.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      const s = songs.find((s) => s.id === btn.dataset.id);
      if (confirm(`Tem certeza que deseja deletar a musica ${s.title}?`)) {
        songs = songs.filter((s) => s.id !== btn.dataset.id);
        setSongs(songs);
        fillDelete();
        render(filterFavorites ? songs.filter((s) => s.favorite) : songs);
      }
    };
  });
  showMoreDelete.style.display =
    filtered.length > slice.length ? "block" : "none";
}

/*********************** EDIT LIST MODAL **************/
openEditListBtn.onclick = () => {
  editOffset = 0;
  searchEditInput.value = "";
  fillEditList();
  editListModal.style.display = "block";
};
closeEditListModal.onclick = () => (editListModal.style.display = "none");
searchEditInput.oninput = () => {
  editOffset = 0;
  fillEditList();
};
showMoreEdit.onclick = () => {
  editOffset += PAGE_STEP;
  fillEditList();
};
function fillEditList() {
  editListEl.innerHTML = "";
  const q = searchEditInput.value.toLowerCase();
  const filtered = songs.filter((s) => s.title.toLowerCase().includes(q));
  const slice = filtered.slice(0, editOffset + PAGE_STEP);
  slice.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class='song-edit-box'><span>${s.title}</span><button data-id='${s.id}'>✏️</button></div>`;
    editListEl.appendChild(li);
  });
  editListEl.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      editListModal.style.display = "none";
      openEditModal(id);
    };
  });
  showMoreEdit.style.display =
    filtered.length > slice.length ? "block" : "none";
}
/*********************** VIEW ALL MODAL **************/
openViewModal.onclick = () => {
  viewOffset = 0;
  searchViewInput.value = "";
  fillViewList();
  viewModal.style.display = "block";
};
closeViewModal.onclick = () => (viewModal.style.display = "none");
searchViewInput.oninput = () => {
  viewOffset = 0;
  fillViewList();
};
showMoreView.onclick = () => {
  viewOffset += PAGE_STEP;
  fillViewList();
};

function fillViewList() {
  viewListEl.innerHTML = "";
  const norm = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = norm(searchViewInput.value.trim());

  let base = filterFavorites ? songs.filter((s) => s.favorite) : songs;
  const filtered = base.filter((s) => norm(s.title).includes(q));
  const slice = filtered.slice(0, viewOffset + PAGE_STEP);

  slice.forEach((s) => {
    const li = document.createElement("li");
    li.className = "song-view-box";
    li.textContent = s.title;
    li.onclick = () => {
      render(songs, s.id);
      viewModal.style.display = "none";
    };

    viewListEl.appendChild(li);
  });
  showMoreView.style.display =
    filtered.length > slice.length ? "block" : "none";
}
/* ────────────────────────────────────────────────────────────────────────
   8.  IMPORT / EXPORT
   ────────────────────────────────────────────────────────────────────── */
/*********************** EXPORTAÇÃO/IMPORTAÇÃO **************/
// Exporta músicas para arquivo JSON
exportBtn.onclick = () => {
  const data = JSON.stringify(songs, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "minhas-cifras.json";
  a.click();
  URL.revokeObjectURL(url);
};
// Importa músicas de arquivo JSON (substitui tudo)
importBtn.onclick = () => importFile.click();
importFile.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const imported = JSON.parse(evt.target.result);
      if (!Array.isArray(imported)) throw new Error();
      if (
        !confirm("Importar irá substituir todas as músicas atuais. Continuar?")
      )
        return;
      songs = imported;
      setSongs(songs);
      render(filterFavorites ? songs.filter((s) => s.favorite) : songs);
      alert("Importação concluída!");
    } catch {
      alert("Arquivo inválido!");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
};

// Importar sem apagar (acrescenta as músicas novas)
importAppendBtn.onclick = () => importAppendFile.click();
importAppendFile.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const imported = JSON.parse(evt.target.result);
      if (!Array.isArray(imported)) throw new Error();

      let addedCount = 0;
      imported.forEach((newSong) => {
        if (!songs.some((s) => s.id === newSong.id)) {
          songs.push(newSong);
          addedCount++;
        }
      });

      setSongs(songs);
      render(filterFavorites ? songs.filter((s) => s.favorite) : songs);
      alert(`Importação concluída! ${addedCount} música(s) adicionada(s).`);
    } catch {
      alert("Arquivo inválido!");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
};
/* ────────────────────────────────────────────────────────────────────────
   9.  THEME TOGGLE
   ────────────────────────────────────────────────────────────────────── */
/*********************** TEMA ESCURO/CLARO **************/
themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "☀️"
    : "🌙";
  localStorage.setItem(
    "cifras_theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};
if (localStorage.getItem("cifras_theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}
// 🔸  Pesquisa
searchInput.oninput = () => {
  const q = searchInput.value.toLowerCase();
  let filtered = songs.filter((s) => s.title.toLowerCase().includes(q));
  if (filterFavorites) filtered = filtered.filter((s) => s.favorite);
  render(filtered);
};
// 🔸  Filtro favoritos
filterFavoritesBtn.onclick = () => {
  filterFavorites = !filterFavorites;
  filterFavoritesBtn.textContent = filterFavorites
    ? "❤️ Mostrando favoritos"
    : "❤️ Favoritos";
  filterFavoritesBtn.style.backgroundColor = filterFavorites ? "#ffdddd" : "";
  render(filterFavorites ? songs.filter((s) => s.favorite) : songs);
};
/*********************** GLOBAL: COPIAR CIFRA **************/
window.copiarTexto = copyToClipboard;
/*********************** INIT *************************/
render();
