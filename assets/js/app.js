const STORAGE_KEY = "contact_practice_v1";
const form = document.getElementById("contactForm");
const statusBox = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const listEl = document.getElementById("contactList");
const counterEl = document.getElementById("counter");
const loadingEl = document.getElementById("loading");

const fields = {
	name: document.getElementById("name"),
	lastname: document.getElementById("lastname"),
	phone: document.getElementById("phone"),
	city: document.getElementById("city"),
	address: document.getElementById("address")
};

const state = {
	contacts: [],
	editingId: null
};

function showLoading(show) {
	loadingEl.classList.toggle("show", show);
}

function readStorage() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function writeStorage(data) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function fakeDb(action) {
	showLoading(true);
	return new Promise((resolve) => {
		setTimeout(() => {
			const result = action();
			showLoading(false);
			resolve(result);
		}, 650);
	});
}

function getSelectedGender() {
	const selected = form.querySelector("input[name='gender']:checked");
	return selected ? selected.value : "";
}

function clearStatus() {
	statusBox.textContent = "";
	statusBox.className = "status";
}

function setStatus(message, kind) {
	statusBox.textContent = message;
	statusBox.className = `status ${kind}`;
}

function normalizeValue(value) {
	return value.trim();
}

function validateInputs(values) {
	const emptyField = Object.entries(values).find(([, value]) => !normalizeValue(value));

	if (emptyField) {
		return {
			valid: false,
			message: "Todos los campos de texto son obligatorios."
		};
	}

	if (!getSelectedGender()) {
		return {
			valid: false,
			message: "Debes seleccionar un genero."
		};
	}

	return { valid: true };
}

function getFormData() {
	return {
		name: normalizeValue(fields.name.value),
		lastname: normalizeValue(fields.lastname.value),
		phone: normalizeValue(fields.phone.value),
		city: normalizeValue(fields.city.value),
		address: normalizeValue(fields.address.value),
		gender: getSelectedGender()
	};
}

function updateCounter() {
	const total = state.contacts.length;
	counterEl.textContent = `${total} ${total === 1 ? "registro" : "registros"}`;
}

function resetForm() {
	form.reset();
	state.editingId = null;
	saveBtn.textContent = "Agregar contacto";
	clearStatus();
}

function renderContacts() {
	listEl.innerHTML = "";

	if (!state.contacts.length) {
		listEl.innerHTML = '<li class="empty">No hay contactos guardados aun.</li>';
		updateCounter();
		return;
	}

	const html = state.contacts.map((contact) => {
		const genderClass = contact.gender === "female" ? "female" : "male";
		const genderIcon = contact.gender === "female" ? "fa-venus" : "fa-mars";

		return `
			<li class="contact-item" data-id="${contact.id}">
				<div class="contact-main">
					<span class="avatar ${genderClass}" aria-hidden="true">
						<i class="fa-solid ${genderIcon}"></i>
					</span>
					<div>
						<div class="person">${contact.name} ${contact.lastname}</div>
						<div class="meta">${contact.city} | ${contact.phone} | ${contact.address}</div>
					</div>
				</div>

				<div class="item-actions">
					<button type="button" class="icon-btn edit" data-action="edit" title="Editar contacto">
						<i class="fa-regular fa-pen-to-square"></i>
					</button>
					<button type="button" class="icon-btn delete" data-action="delete" title="Eliminar contacto">
						<i class="fa-solid fa-trash"></i>
					</button>
				</div>
			</li>
		`;
	}).join("");

	listEl.innerHTML = html;
	updateCounter();
}

async function createContact(contactData) {
	await fakeDb(() => {
		const newContact = { id: crypto.randomUUID(), ...contactData };
		state.contacts.unshift(newContact);
		writeStorage(state.contacts);
	});

	setStatus("Contacto creado correctamente.", "success");
	resetForm();
	renderContacts();
}

async function updateContact(contactData) {
	await fakeDb(() => {
		state.contacts = state.contacts.map((item) => {
			if (item.id === state.editingId) {
				return { ...item, ...contactData };
			}
			return item;
		});

		writeStorage(state.contacts);
	});

	setStatus("Contacto actualizado correctamente.", "success");
	resetForm();
	renderContacts();
}

async function deleteContact(id) {
	await fakeDb(() => {
		state.contacts = state.contacts.filter((item) => item.id !== id);
		writeStorage(state.contacts);
	});

	setStatus("Contacto eliminado.", "success");
	if (state.editingId === id) {
		resetForm();
	}
	renderContacts();
}

function loadContactIntoForm(id) {
	const target = state.contacts.find((item) => item.id === id);
	if (!target) return;

	fields.name.value = target.name;
	fields.lastname.value = target.lastname;
	fields.phone.value = target.phone;
	fields.city.value = target.city;
	fields.address.value = target.address;

	const radio = form.querySelector(`input[name='gender'][value='${target.gender}']`);
	if (radio) {
		radio.checked = true;
	}

	state.editingId = target.id;
	saveBtn.textContent = "Actualizar contacto";
	setStatus("Editando contacto seleccionado.", "success");
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const valuesToValidate = {
		name: fields.name.value,
		lastname: fields.lastname.value,
		phone: fields.phone.value,
		city: fields.city.value,
		address: fields.address.value
	};

	const validation = validateInputs(valuesToValidate);
	if (!validation.valid) {
		setStatus(validation.message, "error");
		return;
	}

	const contactData = getFormData();

	if (state.editingId) {
		await updateContact(contactData);
	} else {
		await createContact(contactData);
	}
});

clearBtn.addEventListener("click", () => {
	resetForm();
	setStatus("Formulario limpio.", "success");
});

listEl.addEventListener("click", async (event) => {
	const actionButton = event.target.closest("button[data-action]");
	if (!actionButton) return;

	const card = actionButton.closest(".contact-item");
	if (!card) return;

	const id = card.dataset.id;
	const action = actionButton.dataset.action;

	if (action === "edit") {
		loadContactIntoForm(id);
		return;
	}

	if (action === "delete") {
		await deleteContact(id);
	}
});

function init() {
	state.contacts = readStorage();
	renderContacts();
}

init();
