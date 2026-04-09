const state = {
  page: 1,
  totalPages: 1,
  editingId: null
};

const userForm = document.getElementById("user-form");
const filterForm = document.getElementById("filter-form");
const tableBody = document.getElementById("user-table-body");
const messageBox = document.getElementById("message");
const statusChip = document.getElementById("status-chip");

function setStatus(text) {
  statusChip.textContent = text;
}

function showMessage(text, type = "") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`.trim();
}

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(raw);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return {
      message: raw.length > 180 ? `${raw.slice(0, 180)}...` : raw
    };
  }
}

function parseHobbies(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFormPayload() {
  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    bio: document.getElementById("bio").value.trim(),
    hobbies: parseHobbies(document.getElementById("hobbies").value.trim())
  };

  const age = document.getElementById("age").value.trim();
  const userId = document.getElementById("custom-user-id").value.trim();

  if (age) {
    payload.age = Number(age);
  }

  if (userId) {
    payload.userId = userId;
  }

  return payload;
}

function fillForm(user) {
  state.editingId = user._id;
  document.getElementById("user-id").value = user._id;
  document.getElementById("name").value = user.name || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("age").value = user.age ?? "";
  document.getElementById("custom-user-id").value = user.userId || "";
  document.getElementById("hobbies").value = (user.hobbies || []).join(", ");
  document.getElementById("bio").value = user.bio || "";
  document.getElementById("submit-button").textContent = "Update User";
  showMessage(`Editing ${user.name}`, "success");
}

function resetForm(options = {}) {
  const { preserveMessage = false } = options;
  state.editingId = null;
  userForm.reset();
  document.getElementById("user-id").value = "";
  document.getElementById("submit-button").textContent = "Create User";
  if (!preserveMessage) {
    showMessage("Form reset.");
  }
}

function buildQueryString() {
  const params = new URLSearchParams();
  const values = {
    page: state.page,
    limit: document.getElementById("limit").value,
    name: document.getElementById("filter-name").value.trim(),
    email: document.getElementById("filter-email").value.trim(),
    age: document.getElementById("filter-age").value.trim(),
    hobby: document.getElementById("filter-hobby").value.trim(),
    search: document.getElementById("filter-search").value.trim(),
    sortBy: document.getElementById("sort-by").value,
    order: document.getElementById("sort-order").value
  };

  Object.entries(values).forEach(([key, value]) => {
    if (value !== "") {
      params.set(key, value);
    }
  });

  return params.toString();
}

async function fetchUsers() {
  try {
    setStatus("Loading");
    const response = await fetch(`/api/users?${buildQueryString()}`);
    const data = await readApiResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch users");
    }

    renderUsers(data.users);
    state.totalPages = data.totalPages || 1;
    document.getElementById("stat-total").textContent = data.total;
    document.getElementById("stat-page").textContent = data.page;
    document.getElementById("pagination-text").textContent = `Page ${data.page} of ${state.totalPages}`;
    document.getElementById("stat-mode").textContent = "SYNC";
    setStatus("Synced");
  } catch (error) {
    renderUsers([]);
    showMessage(error.message, "error");
    document.getElementById("stat-mode").textContent = "ERROR";
    setStatus("Fault");
  }
}

function renderUsers(users) {
  if (!users.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No users match the current query.</td></tr>';
    return;
  }

  tableBody.innerHTML = users.map((user) => `
    <tr>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${user.age ?? "-"}</td>
      <td>
        <div class="tag-list">
          ${(user.hobbies || []).map((hobby) => `<span class="tag">${escapeHtml(hobby)}</span>`).join("") || '<span class="tag">None</span>'}
        </div>
      </td>
      <td>${escapeHtml(user.bio || "-")}</td>
      <td>
        <div class="table-actions">
          <button class="button-secondary" type="button" data-edit="${user._id}">Edit</button>
          <button class="button-secondary" type="button" data-delete="${user._id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function submitUser(event) {
  event.preventDefault();

  try {
    setStatus("Transmitting");
    const payload = getFormPayload();
    const isEditing = Boolean(state.editingId);
    const url = isEditing ? `/api/users/${state.editingId}` : "/api/users";
    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await readApiResponse(response);

    if (!response.ok) {
      throw new Error(data.errors?.join(", ") || data.message || "Request failed");
    }

    showMessage(data.message, "success");
    resetForm({ preserveMessage: true });

    try {
      await fetchUsers();
    } catch (error) {
      showMessage(`${data.message}. User saved, but table refresh failed.`, "success");
    }
  } catch (error) {
    showMessage(error.message, "error");
    setStatus("Fault");
  }
}

async function deleteUser(id) {
  const confirmed = window.confirm("Delete this user?");
  if (!confirmed) {
    return;
  }

  try {
    setStatus("Deleting");
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await readApiResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Delete failed");
    }

    showMessage(data.message, "success");
    await fetchUsers();
  } catch (error) {
    showMessage(error.message, "error");
    setStatus("Fault");
  }
}

async function editUser(id) {
  try {
    setStatus("Fetching");
    const response = await fetch(`/api/users/${id}`);
    const user = await readApiResponse(response);

    if (!response.ok) {
      throw new Error(user.message || "Failed to load user");
    }

    fillForm(user);
    setStatus("Ready");
  } catch (error) {
    showMessage(error.message, "error");
    setStatus("Fault");
  }
}

userForm.addEventListener("submit", submitUser);
filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.page = 1;
  fetchUsers();
});

document.getElementById("reset-button").addEventListener("click", resetForm);
document.getElementById("clear-filters").addEventListener("click", () => {
  filterForm.reset();
  state.page = 1;
  fetchUsers();
});

document.getElementById("prev-page").addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    fetchUsers();
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    fetchUsers();
  }
});

tableBody.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    editUser(editId);
  }

  if (deleteId) {
    deleteUser(deleteId);
  }
});

fetchUsers();
