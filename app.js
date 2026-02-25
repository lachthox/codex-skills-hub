const DECISION_STORAGE_KEY = "sorting-vault-limbo-decisions-v1";

const state = {
  approvedSkills: [],
  limboSkills: [],
  filteredSkills: [],
  selectedCategory: "",
  query: "",
  generatedAt: "",
  activeTab: "approved",
  limboDecisions: loadDecisions(),
};

const elements = {
  totalApproved: document.getElementById("totalApproved"),
  totalLimbo: document.getElementById("totalLimbo"),
  generatedAt: document.getElementById("generatedAt"),
  feedback: document.getElementById("feedback"),
  grid: document.getElementById("grid"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  tabApproved: document.getElementById("tabApproved"),
  tabLimbo: document.getElementById("tabLimbo"),
  reviewNote: document.getElementById("reviewNote"),
};

function loadDecisions() {
  try {
    const raw = localStorage.getItem(DECISION_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveDecisions() {
  localStorage.setItem(DECISION_STORAGE_KEY, JSON.stringify(state.limboDecisions));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatGeneratedAt(value) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "-";
  }
  return parsed.toLocaleString();
}

function activeSkills() {
  return state.activeTab === "limbo" ? state.limboSkills : state.approvedSkills;
}

function updateTabs() {
  const isLimbo = state.activeTab === "limbo";
  elements.tabApproved.classList.toggle("is-active", !isLimbo);
  elements.tabLimbo.classList.toggle("is-active", isLimbo);
  elements.reviewNote.hidden = !isLimbo;
}

function updateCategoryOptions() {
  if (state.activeTab === "limbo") {
    elements.categorySelect.innerHTML = '<option value="">Not used in limbo view</option>';
    elements.categorySelect.value = "";
    state.selectedCategory = "";
    elements.categorySelect.disabled = true;
    return;
  }

  const categories = Array.from(new Set(state.approvedSkills.map((skill) => skill.category))).sort((a, b) =>
    a.localeCompare(b)
  );

  const existingValue = elements.categorySelect.value;
  elements.categorySelect.innerHTML = '<option value="">All categories</option>';

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categorySelect.append(option);
  }

  elements.categorySelect.value = categories.includes(existingValue) ? existingValue : "";
  state.selectedCategory = elements.categorySelect.value;
  elements.categorySelect.disabled = false;
}

function applyFilters() {
  const normalizedQuery = state.query.trim().toLowerCase();
  state.filteredSkills = activeSkills().filter((skill) => {
    if (state.activeTab === "approved" && state.selectedCategory && skill.category !== state.selectedCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${skill.name} ${skill.description} ${skill.folderPath || skill.limboPath || ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function renderStats() {
  elements.totalApproved.textContent = String(state.approvedSkills.length);
  elements.totalLimbo.textContent = String(state.limboSkills.length);
  elements.generatedAt.textContent = formatGeneratedAt(state.generatedAt);
}

function resourcePills(skill) {
  const pills = [];
  if (skill.hasAssets) {
    pills.push("assets");
  }
  if (skill.hasScripts) {
    pills.push("scripts");
  }
  if (skill.hasReferences) {
    pills.push("references");
  }
  if (pills.length === 0) {
    pills.push("single-file");
  }
  return pills.map((pill) => `<span class="resource-pill">${escapeHtml(pill)}</span>`).join("");
}

function renderDecisionPill(skillId) {
  const decision = state.limboDecisions[skillId];
  if (!decision) {
    return '<span class="decision-pill decision-pending">Pending</span>';
  }
  if (decision === "approve") {
    return '<span class="decision-pill decision-approve">Approved</span>';
  }
  return '<span class="decision-pill decision-disapprove">Disapproved</span>';
}

function renderLimboCard(skill, index) {
  const riskText = skill.scanScore === null ? escapeHtml(skill.riskLevel || "unknown") : `${escapeHtml(skill.riskLevel)} (${skill.scanScore})`;
  const pathText = escapeHtml(skill.limboPath || "");
  const id = escapeHtml(skill.id || skill.limboPath || skill.name);
  const decision = state.limboDecisions[skill.id];

  return `
    <article class="skill-card" style="animation-delay: ${Math.min(index * 30, 240)}ms">
      <div class="skill-head">
        <h2 class="skill-title">${escapeHtml(skill.name)}</h2>
        <span class="category-chip chip-risk">Risk: ${riskText}</span>
      </div>
      <p class="skill-description">${escapeHtml(skill.description)}</p>
      <p class="skill-path">${pathText}</p>
      <div class="review-actions">
        ${renderDecisionPill(skill.id)}
        <button class="decision-button ${decision === "approve" ? "is-selected" : ""}" data-id="${id}" data-action="approve" type="button">Approve</button>
        <button class="decision-button danger ${decision === "disapprove" ? "is-selected" : ""}" data-id="${id}" data-action="disapprove" type="button">Disapprove</button>
      </div>
    </article>
  `;
}

function renderApprovedCard(skill, index) {
  return `
    <article class="skill-card" style="animation-delay: ${Math.min(index * 30, 240)}ms">
      <div class="skill-head">
        <h2 class="skill-title">${escapeHtml(skill.name)}</h2>
        <span class="category-chip">${escapeHtml(skill.category)}</span>
      </div>
      <p class="skill-description">${escapeHtml(skill.description)}</p>
      <p class="skill-path">${escapeHtml(skill.folderPath)}</p>
      <div class="resource-row">${resourcePills(skill)}</div>
    </article>
  `;
}

function renderGrid() {
  if (state.filteredSkills.length === 0) {
    if (state.activeTab === "limbo") {
      elements.feedback.textContent = "No limbo skills match the current search.";
    } else {
      elements.feedback.textContent = "No routed skills match the current filters.";
    }
    elements.grid.innerHTML = "";
    return;
  }

  const tabLabel = state.activeTab === "limbo" ? "limbo" : "approved";
  elements.feedback.textContent = `${state.filteredSkills.length} ${tabLabel} skill(s) visible`;

  if (state.activeTab === "limbo") {
    elements.grid.innerHTML = state.filteredSkills.map(renderLimboCard).join("");
    return;
  }

  elements.grid.innerHTML = state.filteredSkills.map(renderApprovedCard).join("");
}

function refreshView() {
  updateTabs();
  applyFilters();
  renderStats();
  renderGrid();
}

function setActiveTab(tabName) {
  state.activeTab = tabName === "limbo" ? "limbo" : "approved";
  updateCategoryOptions();
  refreshView();
}

function applyLimboDecision(skillId, action) {
  const key = String(skillId || "");
  if (!key) {
    return;
  }

  const existing = state.limboDecisions[key];
  if (existing === action) {
    delete state.limboDecisions[key];
  } else {
    state.limboDecisions[key] = action;
  }
  saveDecisions();
  refreshView();
}

async function loadSkills() {
  elements.feedback.textContent = "Loading skills...";
  const response = await fetch("/api/skills");
  if (!response.ok) {
    throw new Error("Request failed");
  }

  const payload = await response.json();
  state.approvedSkills = Array.isArray(payload.approvedSkills)
    ? payload.approvedSkills
    : Array.isArray(payload.skills)
      ? payload.skills
      : [];
  state.limboSkills = Array.isArray(payload.limboSkills) ? payload.limboSkills : [];
  state.generatedAt = payload.generatedAt || "";
  updateCategoryOptions();
  refreshView();
}

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value || "";
  refreshView();
});

elements.categorySelect.addEventListener("change", (event) => {
  state.selectedCategory = event.target.value || "";
  refreshView();
});

elements.tabApproved.addEventListener("click", () => {
  setActiveTab("approved");
});

elements.tabLimbo.addEventListener("click", () => {
  setActiveTab("limbo");
});

elements.grid.addEventListener("click", (event) => {
  const button = event.target.closest(".decision-button");
  if (!button) {
    return;
  }
  const skillId = button.getAttribute("data-id");
  const action = button.getAttribute("data-action");
  if (!skillId || (action !== "approve" && action !== "disapprove")) {
    return;
  }
  applyLimboDecision(skillId, action);
});

loadSkills().catch(() => {
  elements.feedback.textContent = "Could not load skills from /api/skills.";
  elements.totalApproved.textContent = "0";
  elements.totalLimbo.textContent = "0";
});
